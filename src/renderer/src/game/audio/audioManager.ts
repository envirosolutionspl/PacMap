import type { AudioManager, SoundEffectId } from './audioTypes'
import menuMusicUrl from '../assets/sounds/PacMap_sound.mp3'

export const AUDIO_MUTED_STORAGE_KEY = 'pac-map-audio-muted'
export const AUDIO_MENU_VOLUME_STORAGE_KEY = 'pac-map-menu-volume'
export const AUDIO_GAME_VOLUME_STORAGE_KEY = 'pac-map-game-volume'

interface CreateAudioManagerOptions {
  readonly muted?: boolean
  readonly menuMusicVolume?: number
  readonly gameMusicVolume?: number
}

interface Tone {
  readonly frequency: number
  readonly duration: number
  readonly offset?: number
  readonly type?: OscillatorType
  readonly volume?: number
  readonly endFrequency?: number
}

type AudioContextConstructor = new () => AudioContext
type BackgroundMusicMode = 'menu' | 'game'
export type MusicVolumeMode = BackgroundMusicMode

const MASTER_VOLUME = 0.3
export const DEFAULT_MUSIC_VOLUME = 0.5
const BACKGROUND_MUSIC_MEDIA_VOLUME_AT_DEFAULT = 0.22
const BACKGROUND_MUSIC_MAX_MEDIA_VOLUME =
  BACKGROUND_MUSIC_MEDIA_VOLUME_AT_DEFAULT / DEFAULT_MUSIC_VOLUME
const MENU_MUSIC_FADE_OUT_MS = 3000
const MENU_MUSIC_FADE_STEP_MS = 50
const MENU_MUSIC_RESTART_DELAY_MS = 3000

const EFFECTS: Record<SoundEffectId, readonly Tone[]> = {
  startGame: [
    { frequency: 523.25, duration: 0.045, type: 'square', volume: 0.13 },
    { frequency: 783.99, duration: 0.045, offset: 0.045, type: 'square', volume: 0.13 },
    { frequency: 1046.5, duration: 0.075, offset: 0.09, type: 'square', volume: 0.12 }
  ],
  pellet: [
    {
      frequency: 880,
      endFrequency: 1320,
      duration: 0.035,
      type: 'square',
      volume: 0.12
    }
  ],
  bonusPellet: [
    { frequency: 659.25, duration: 0.04, type: 'square', volume: 0.12 },
    { frequency: 987.77, duration: 0.04, offset: 0.04, type: 'square', volume: 0.13 },
    { frequency: 1318.51, duration: 0.07, offset: 0.08, type: 'square', volume: 0.12 }
  ],
  powerPellet: [
    { frequency: 196, duration: 0.055, type: 'square', volume: 0.11 },
    { frequency: 392, duration: 0.055, offset: 0.055, type: 'square', volume: 0.12 },
    { frequency: 783.99, duration: 0.055, offset: 0.11, type: 'square', volume: 0.13 },
    { frequency: 1174.66, duration: 0.11, offset: 0.165, type: 'square', volume: 0.12 }
  ],
  eatGhost: [
    { frequency: 440, duration: 0.04, type: 'square', volume: 0.12 },
    { frequency: 660, duration: 0.04, offset: 0.04, type: 'square', volume: 0.12 },
    { frequency: 880, duration: 0.04, offset: 0.08, type: 'square', volume: 0.13 },
    { frequency: 1320, duration: 0.08, offset: 0.12, type: 'square', volume: 0.12 }
  ],
  lifeLost: [
    { frequency: 392, duration: 0.09, type: 'square', volume: 0.12 },
    { frequency: 293.66, duration: 0.09, offset: 0.085, type: 'square', volume: 0.11 },
    { frequency: 196, duration: 0.11, offset: 0.17, type: 'square', volume: 0.11 },
    { frequency: 130.81, duration: 0.15, offset: 0.28, type: 'square', volume: 0.1 }
  ],
  levelComplete: [
    { frequency: 523.25, duration: 0.055, type: 'square', volume: 0.12 },
    { frequency: 659.25, duration: 0.055, offset: 0.055, type: 'square', volume: 0.12 },
    { frequency: 783.99, duration: 0.055, offset: 0.11, type: 'square', volume: 0.13 },
    { frequency: 1046.5, duration: 0.075, offset: 0.165, type: 'square', volume: 0.13 },
    { frequency: 1318.51, duration: 0.16, offset: 0.25, type: 'square', volume: 0.11 }
  ],
  gameOver: [
    { frequency: 392, duration: 0.11, type: 'square', volume: 0.12 },
    { frequency: 311.13, duration: 0.11, offset: 0.105, type: 'square', volume: 0.11 },
    { frequency: 246.94, duration: 0.13, offset: 0.21, type: 'square', volume: 0.11 },
    { frequency: 196, duration: 0.13, offset: 0.34, type: 'square', volume: 0.1 },
    { frequency: 130.81, duration: 0.2, offset: 0.49, type: 'square', volume: 0.09 }
  ],
  toggleAudio: [
    { frequency: 880, duration: 0.04, type: 'square', volume: 0.1 },
    { frequency: 660, duration: 0.055, offset: 0.04, type: 'square', volume: 0.09 }
  ]
}

export function createAudioManager(options: CreateAudioManagerOptions = {}): AudioManager {
  let context: AudioContext | null = null
  let masterGain: GainNode | null = null
  let menuMusic: HTMLAudioElement | null = null
  let menuMusicFadeTimeout: ReturnType<typeof setTimeout> | null = null
  let menuMusicRestartTimeout: ReturnType<typeof setTimeout> | null = null
  let activeMusicMode: BackgroundMusicMode | null = null
  const musicVolumes: Record<BackgroundMusicMode, number> = {
    menu: normalizeMusicVolume(options.menuMusicVolume ?? DEFAULT_MUSIC_VOLUME),
    game: normalizeMusicVolume(options.gameMusicVolume ?? DEFAULT_MUSIC_VOLUME)
  }
  let muted = options.muted ?? false

  const getBackgroundMusicMediaVolume = (mode: BackgroundMusicMode): number =>
    musicVolumes[mode] * BACKGROUND_MUSIC_MAX_MEDIA_VOLUME

  const ensureContext = (): AudioContext | null => {
    if (context) {
      return context
    }

    const ContextConstructor = getAudioContextConstructor()

    if (!ContextConstructor) {
      return null
    }

    context = new ContextConstructor()
    masterGain = context.createGain()
    masterGain.gain.value = muted ? 0 : MASTER_VOLUME
    masterGain.connect(context.destination)

    return context
  }

  const ensureMenuMusic = (): HTMLAudioElement | null => {
    if (menuMusic) {
      return menuMusic
    }

    if (typeof Audio === 'undefined') {
      return null
    }

    menuMusic = new Audio(menuMusicUrl)
    menuMusic.loop = false
    menuMusic.preload = 'auto'
    menuMusic.volume = getBackgroundMusicMediaVolume('menu')
    menuMusic.muted = muted
    menuMusic.addEventListener('ended', scheduleMenuMusicRestart)

    return menuMusic
  }

  const clearMenuMusicRestart = (): void => {
    if (menuMusicRestartTimeout === null) {
      return
    }

    clearTimeout(menuMusicRestartTimeout)
    menuMusicRestartTimeout = null
  }

  const clearMenuMusicFade = (): void => {
    if (menuMusicFadeTimeout === null) {
      return
    }

    clearTimeout(menuMusicFadeTimeout)
    menuMusicFadeTimeout = null
  }

  function resetMenuMusicPosition(music: HTMLAudioElement): void {
    try {
      music.currentTime = 0
    } catch {
      // Some media implementations disallow seeking before metadata is loaded.
    }
  }

  function startBackgroundMusic(music: HTMLAudioElement, mode: BackgroundMusicMode): void {
    activeMusicMode = mode
    clearMenuMusicFade()
    clearMenuMusicRestart()
    resetMenuMusicPosition(music)
    music.muted = false
    music.volume = getBackgroundMusicMediaVolume(mode)
    void music.play().catch(() => undefined)
  }

  function scheduleMenuMusicRestart(): void {
    clearMenuMusicRestart()

    if (!activeMusicMode || muted) {
      return
    }

    const mode = activeMusicMode

    menuMusicRestartTimeout = setTimeout(() => {
      menuMusicRestartTimeout = null

      if (!menuMusic || activeMusicMode !== mode || muted) {
        return
      }

      startBackgroundMusic(menuMusic, mode)
    }, MENU_MUSIC_RESTART_DELAY_MS)
  }

  const playBackgroundMusic = (mode: BackgroundMusicMode): void => {
    if (muted) {
      return
    }

    const music = ensureMenuMusic()

    if (!music) {
      return
    }

    if (activeMusicMode === mode && !music.paused) {
      clearMenuMusicFade()
      music.volume = getBackgroundMusicMediaVolume(mode)
      return
    }

    startBackgroundMusic(music, mode)
  }

  const stopBackgroundMusic = (mode?: BackgroundMusicMode): void => {
    if (mode && activeMusicMode !== mode) {
      return
    }

    const stoppingMode = activeMusicMode
    activeMusicMode = null
    clearMenuMusicRestart()

    if (!menuMusic) {
      return
    }

    clearMenuMusicFade()

    if (menuMusic.paused) {
      menuMusic.volume = stoppingMode ? getBackgroundMusicMediaVolume(stoppingMode) : 0
      resetMenuMusicPosition(menuMusic)
      return
    }

    const fadeStartedAt = performance.now()
    const initialVolume = menuMusic.volume

    const fadeStep = (): void => {
      if (!menuMusic) {
        return
      }

      const progress = Math.min(1, (performance.now() - fadeStartedAt) / MENU_MUSIC_FADE_OUT_MS)
      menuMusic.volume = initialVolume * (1 - progress)

      if (progress < 1) {
        menuMusicFadeTimeout = setTimeout(fadeStep, MENU_MUSIC_FADE_STEP_MS)
        return
      }

      menuMusicFadeTimeout = null
      menuMusic.pause()
      menuMusic.volume = stoppingMode ? getBackgroundMusicMediaVolume(stoppingMode) : 0
      resetMenuMusicPosition(menuMusic)
    }

    fadeStep()
  }

  const playMenuMusic = (): void => {
    playBackgroundMusic('menu')
  }

  const stopMenuMusic = (): void => {
    stopBackgroundMusic('menu')
  }

  const playGameMusic = (): void => {
    playBackgroundMusic('game')
  }

  const stopGameMusic = (): void => {
    stopBackgroundMusic('game')
  }

  const setBackgroundMusicVolume = (mode: BackgroundMusicMode, volume: number): void => {
    musicVolumes[mode] = normalizeMusicVolume(volume)

    if (menuMusic && activeMusicMode === mode && menuMusicFadeTimeout === null) {
      menuMusic.volume = getBackgroundMusicMediaVolume(mode)
    }
  }

  const setMuted = (nextMuted: boolean): void => {
    muted = nextMuted

    if (masterGain && context) {
      masterGain.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, context.currentTime, 0.015)
    }

    if (menuMusic) {
      menuMusic.muted = muted
    }

    if (muted) {
      stopBackgroundMusic()
    }
  }

  const resume = async (): Promise<void> => {
    const audioContext = ensureContext()

    if (audioContext?.state === 'suspended') {
      await audioContext.resume()
    }
  }

  const play = (effectId: SoundEffectId): void => {
    if (muted) {
      return
    }

    const audioContext = ensureContext()

    if (!audioContext || !masterGain) {
      return
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }

    const startTime = audioContext.currentTime

    for (const tone of EFFECTS[effectId]) {
      playTone(audioContext, masterGain, startTime, tone)
    }
  }

  return {
    play,
    playMenuMusic,
    stopMenuMusic,
    playGameMusic,
    stopGameMusic,
    setMenuMusicVolume: (volume) => setBackgroundMusicVolume('menu', volume),
    setGameMusicVolume: (volume) => setBackgroundMusicVolume('game', volume),
    resume,
    setMuted,
    toggleMuted: () => {
      setMuted(!muted)
      return muted
    },
    isMuted: () => muted
  }
}

export function readAudioMutedPreference(storage = getLocalStorage()): boolean {
  if (!storage) {
    return false
  }

  return storage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true'
}

export function writeAudioMutedPreference(muted: boolean, storage = getLocalStorage()): void {
  storage?.setItem(AUDIO_MUTED_STORAGE_KEY, muted ? 'true' : 'false')
}

export function readMusicVolumePreferences(storage = getLocalStorage()): {
  readonly menu: number
  readonly game: number
} {
  return {
    menu: readMusicVolumePreference(AUDIO_MENU_VOLUME_STORAGE_KEY, storage),
    game: readMusicVolumePreference(AUDIO_GAME_VOLUME_STORAGE_KEY, storage)
  }
}

export function writeMusicVolumePreference(
  mode: MusicVolumeMode,
  volume: number,
  storage = getLocalStorage()
): void {
  const key = mode === 'menu' ? AUDIO_MENU_VOLUME_STORAGE_KEY : AUDIO_GAME_VOLUME_STORAGE_KEY

  storage?.setItem(key, String(normalizeMusicVolume(volume)))
}

export function normalizeMusicVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return DEFAULT_MUSIC_VOLUME
  }

  return Math.min(1, Math.max(0, volume))
}

function readMusicVolumePreference(key: string, storage?: Storage): number {
  if (!storage) {
    return DEFAULT_MUSIC_VOLUME
  }

  const storedValue = storage.getItem(key)

  if (storedValue === null) {
    return DEFAULT_MUSIC_VOLUME
  }

  const value = Number(storedValue)

  return Number.isFinite(value) ? normalizeMusicVolume(value) : DEFAULT_MUSIC_VOLUME
}

function playTone(
  context: AudioContext,
  masterGain: GainNode,
  startTime: number,
  tone: Tone
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const toneStart = startTime + (tone.offset ?? 0)
  const toneEnd = toneStart + tone.duration
  const volume = tone.volume ?? 0.07

  oscillator.type = tone.type ?? 'square'
  oscillator.frequency.setValueAtTime(tone.frequency, toneStart)

  if (tone.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, toneEnd)
  }

  gain.gain.setValueAtTime(0.0001, toneStart)
  gain.gain.exponentialRampToValueAtTime(volume, toneStart + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd)

  oscillator.connect(gain)
  gain.connect(masterGain)
  oscillator.start(toneStart)
  oscillator.stop(toneEnd + 0.02)
}

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.AudioContext ?? getWebkitAudioContext()
}

function getWebkitAudioContext(): AudioContextConstructor | null {
  return (
    (window as typeof window & { readonly webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext ?? null
  )
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}
