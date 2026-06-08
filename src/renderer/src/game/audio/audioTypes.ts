export type SoundEffectId =
  | 'startGame'
  | 'pellet'
  | 'bonusPellet'
  | 'powerPellet'
  | 'eatGhost'
  | 'lifeLost'
  | 'levelComplete'
  | 'gameOver'
  | 'toggleAudio'

export interface AudioManager {
  readonly play: (effectId: SoundEffectId) => void
  readonly playMenuMusic: () => void
  readonly stopMenuMusic: () => void
  readonly playGameMusic: () => void
  readonly stopGameMusic: () => void
  readonly setMenuMusicVolume: (volume: number) => void
  readonly setGameMusicVolume: (volume: number) => void
  readonly resume: () => Promise<void>
  readonly setMuted: (muted: boolean) => void
  readonly toggleMuted: () => boolean
  readonly isMuted: () => boolean
}
