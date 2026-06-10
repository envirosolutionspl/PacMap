import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { Ghost } from '../entities/Ghost'
import { Player } from '../entities/Player'
import {
  createCityBiomeLayout,
  createRandomCityBiomeLayout,
  type CityBiomeLayoutKind
} from '../entities/cityBiomeLayout'
import {
  createAudioManager,
  normalizeMusicVolume,
  readAudioMutedPreference,
  readMusicVolumePreferences,
  writeMusicVolumePreference,
  writeAudioMutedPreference
} from '../audio/audioManager'
import type { SoundEffectId } from '../audio/audioTypes'
import { getSoundEffectsForTransition } from '../audio/soundTransitions'
import { getGhostSkinLabel, getNextGhostSkinId } from '../assets/svg/skinRegistry'
import { READY_DURATION_MS, TILE_SIZE } from '../engine/constants'
import { getCollidingGhost, getFrightenedCollidingGhost } from '../engine/collisions'
import { startGameLoop } from '../engine/gameLoop'
import { moveGhost } from '../engine/ghostAi'
import { loseLife } from '../engine/lives'
import { moveEntity } from '../engine/movement'
import {
  activatePowerMode,
  eatGhost,
  expirePowerMode,
  updateGhostRespawns
} from '../engine/powerMode'
import { collectPlayerTileWithResult } from '../engine/scoring'
import { advanceToNextLevel, createIdleGameState, restartGame } from '../engine/session'
import type { GameState, PlayerStatus } from '../engine/types'
import {
  createDirectionBuffer,
  getBufferedDirection,
  isDirectionBufferExpired,
  type DirectionBuffer
} from '../input/directionBuffer'
import { getKeyboardAction } from '../input/keyboard'
import { levels } from '../levels'
import { getLevelAt, isFinalLevel } from '../engine/levelProgression'
import { createLocalRankingStorage } from '../ranking/localRanking'
import {
  getRankingFileApi,
  readRankingFilePath,
  writeRankingFilePath
} from '../ranking/rankingFile'
import type { RankingEntry } from '../ranking/rankingTypes'
import { BiomeControlPanel } from './BiomeControlPanel'
import { CompanyLogo } from './CompanyLogo'
import { FullscreenButton } from './FullscreenButton'
import { GameBoard } from './GameBoard'
import { GameOverOverlay } from './GameOverOverlay'
import { Hud } from './Hud'
import { IntroOverlay } from './IntroOverlay'
import { LevelCompleteOverlay } from './LevelCompleteOverlay'
import { MainMenuBackdrop, StartOverlay } from './StartOverlay'
import { SvgStage } from './SvgStage'

const firstLevel = getLevelAt(levels, 0)
const rankingStorage = createLocalRankingStorage()
const GOD_MODE_PASSWORD = 'PacMapGod12890!'
const DEFAULT_TIME_LIMIT_SECONDS = [60, 90, 120, 180, 300] as const
const MIN_TIME_LIMIT_SECONDS = 15
const MAX_TIME_LIMIT_SECONDS = 30 * 60
const TIME_BONUS_POINTS_PER_SECOND = 10
const GAME_OVER_RESULT_DURATION_MS = 5000
const LEVEL_COMPLETE_DURATION_MS = 5000
const MENU_MUSIC_DELAY_MS = 3000
const GAME_BOARD_SCALE_STORAGE_KEY = 'pac-map-game-board-scale-v1'
const INTRO_OVERLAY_SCALE_STORAGE_KEY = 'pac-map-intro-overlay-scale-v1'
const DEFAULT_GAME_BOARD_SCALE = 1
const MIN_GAME_BOARD_SCALE = 0.5
const MAX_GAME_BOARD_SCALE = 1
const DEFAULT_INTRO_OVERLAY_SCALE = 1
const MIN_INTRO_OVERLAY_SCALE = 0.8
const MAX_INTRO_OVERLAY_SCALE = 2.5

export function GameScreen(): React.JSX.Element {
  const initialMusicVolumes = useMemo(() => readMusicVolumePreferences(), [])
  const audioManager = useMemo(
    () =>
      createAudioManager({
        muted: readAudioMutedPreference(),
        menuMusicVolume: initialMusicVolumes.menu,
        gameMusicVolume: initialMusicVolumes.game
      }),
    [initialMusicVolumes]
  )
  const rankingFileApi = useMemo(() => getRankingFileApi(), [])
  const initialGameState = useMemo(() => createIdleGameState(firstLevel), [])
  const [gameState, setGameState] = useState(initialGameState)
  const [isIntroActive, setIsIntroActive] = useState(true)
  const [isAudioMuted, setIsAudioMuted] = useState(() => audioManager.isMuted())
  const [menuMusicVolume, setMenuMusicVolume] = useState(initialMusicVolumes.menu)
  const [gameMusicVolume, setGameMusicVolume] = useState(initialMusicVolumes.game)
  const [gameBoardScale, setGameBoardScale] = useState(() => readGameBoardScalePreference())
  const [introOverlayScale, setIntroOverlayScale] = useState(() =>
    readIntroOverlayScalePreference()
  )
  const [rankingEntries, setRankingEntries] = useState<readonly RankingEntry[]>(() =>
    rankingStorage.list()
  )
  const [rankingFilePath, setRankingFilePath] = useState<string | null>(() => readRankingFilePath())
  const [rankingFileStatus, setRankingFileStatus] = useState<string | null>(null)
  const [isRankingFileSaving, setIsRankingFileSaving] = useState(false)
  const [playerName, setPlayerName] = useState('PLAYER')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isGodModeEnabled, setIsGodModeEnabled] = useState(false)
  const [isTimedModeEnabled, setIsTimedModeEnabled] = useState(false)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<readonly number[]>(
    DEFAULT_TIME_LIMIT_SECONDS
  )
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState<number | null>(null)
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false)
  const [gameDurationMs, setGameDurationMs] = useState(0)
  const [cityBiomeLayout, setCityBiomeLayout] = useState(() => createRandomCityBiomeLayout())
  const directionBufferRef = useRef<DirectionBuffer | null>(null)
  const previousGameStateRef = useRef<GameState | null>(null)
  const gamePhaseRef = useRef(gameState.phase)
  const isGodModeEnabledRef = useRef(isGodModeEnabled)
  const isTimedModeEnabledRef = useRef(isTimedModeEnabled)
  const timeLimitSecondsRef = useRef(timeLimitSeconds)
  const remainingTimeSecondsRef = useRef<number | null>(remainingTimeSeconds)
  const levelTimeEndsAtRef = useRef<number | null>(null)
  const levelPausedAtRef = useRef<number | null>(null)
  const levelTimeoutIdRef = useRef<number | null>(null)
  const gameStartedAtRef = useRef<number | null>(null)
  const gameOverProcessTimeoutRef = useRef<number | null>(null)
  const gameOverReturnTimeoutRef = useRef<number | null>(null)
  const levelCompleteTimeoutRef = useRef<number | null>(null)
  const currentLevel = getLevelAt(levels, gameState.levelIndex)
  const nextLevel =
    gameState.levelIndex + 1 < levels.length ? getLevelAt(levels, gameState.levelIndex + 1) : null
  const levelIsFinal = isFinalLevel(levels, gameState.levelIndex)
  const isHudVisible = isGameplayPhase(gameState.phase)
  const isStartSurfaceVisible = gameState.phase === 'idle'
  const isIntroVisible = isStartSurfaceVisible && isIntroActive
  const isMenuVisible = isStartSurfaceVisible && !isIntroActive
  const isGameMusicActive = !isStartSurfaceVisible
  const levelHudLabel = formatLevelHudLabel(gameState.levelIndex, currentLevel.name)
  const gameStageStyle = useMemo(
    () =>
      ({
        aspectRatio: `${currentLevel.width} / ${currentLevel.height}`,
        '--game-board-scale': String(gameBoardScale)
      }) as CSSProperties,
    [currentLevel.height, currentLevel.width, gameBoardScale]
  )
  const introOverlayStyle = useMemo(
    () =>
      ({
        '--intro-overlay-scale': String(introOverlayScale)
      }) as CSSProperties,
    [introOverlayScale]
  )

  const clearDirectionBuffer = useCallback(() => {
    directionBufferRef.current = null
  }, [])

  const playInteractiveSound = useCallback(
    (effectId: SoundEffectId): void => {
      void audioManager.resume()
      audioManager.play(effectId)
    },
    [audioManager]
  )

  const handleToggleAudio = useCallback(() => {
    const muted = audioManager.toggleMuted()

    writeAudioMutedPreference(muted)
    setIsAudioMuted(muted)

    if (!muted) {
      playInteractiveSound('toggleAudio')
    }
  }, [audioManager, playInteractiveSound])

  const handleMenuMusicVolumeChange = useCallback(
    (volume: number): void => {
      const normalizedVolume = normalizeMusicVolume(volume)

      audioManager.setMenuMusicVolume(normalizedVolume)
      writeMusicVolumePreference('menu', normalizedVolume)
      setMenuMusicVolume(normalizedVolume)
    },
    [audioManager]
  )

  const handleGameMusicVolumeChange = useCallback(
    (volume: number): void => {
      const normalizedVolume = normalizeMusicVolume(volume)

      audioManager.setGameMusicVolume(normalizedVolume)
      writeMusicVolumePreference('game', normalizedVolume)
      setGameMusicVolume(normalizedVolume)
    },
    [audioManager]
  )

  const handleGameBoardScaleChange = useCallback((scale: number): void => {
    const normalizedScale = normalizeGameBoardScale(scale)

    writeGameBoardScalePreference(normalizedScale)
    setGameBoardScale(normalizedScale)
  }, [])

  const handleIntroOverlayScaleChange = useCallback((scale: number): void => {
    const normalizedScale = normalizeIntroOverlayScale(scale)

    writeIntroOverlayScalePreference(normalizedScale)
    setIntroOverlayScale(normalizedScale)
  }, [])

  const handleDismissIntro = useCallback((): void => {
    setIsIntroActive(false)
  }, [])

  useEffect(() => {
    if (!isStartSurfaceVisible || isAudioMuted) {
      audioManager.stopMenuMusic()
      return
    }

    const timeoutId = window.setTimeout(
      () => {
        audioManager.playMenuMusic()
      },
      isIntroVisible ? 0 : MENU_MUSIC_DELAY_MS
    )

    return () => {
      window.clearTimeout(timeoutId)
      audioManager.stopMenuMusic()
    }
  }, [audioManager, isAudioMuted, isIntroVisible, isStartSurfaceVisible])

  useEffect(() => {
    if (!isGameMusicActive || isAudioMuted) {
      audioManager.stopGameMusic()
      return
    }

    audioManager.playGameMusic()

    return () => {
      audioManager.stopGameMusic()
    }
  }, [audioManager, isAudioMuted, isGameMusicActive])

  const verifyGodModePassword = useCallback((password: string): boolean => {
    return password === GOD_MODE_PASSWORD
  }, [])

  const handleVerifyGodModePassword = useCallback(
    (password: string): boolean => {
      const shouldEnableGodMode = verifyGodModePassword(password)

      if (shouldEnableGodMode) {
        setIsGodModeEnabled(true)
      }

      return shouldEnableGodMode
    },
    [verifyGodModePassword]
  )

  const handleDisableGodMode = useCallback(() => {
    setIsGodModeEnabled(false)
  }, [])

  const setDisplayedRemainingTime = useCallback((seconds: number | null): void => {
    if (remainingTimeSecondsRef.current === seconds) {
      return
    }

    remainingTimeSecondsRef.current = seconds
    setRemainingTimeSeconds(seconds)
  }, [])

  const updateDisplayedRemainingTime = useCallback(
    (now: number): void => {
      if (!isTimedModeEnabledRef.current || levelTimeEndsAtRef.current === null) {
        setDisplayedRemainingTime(null)
        return
      }

      const remainingSeconds = getDisplayRemainingSeconds(now, levelTimeEndsAtRef.current)

      setDisplayedRemainingTime(remainingSeconds)
    },
    [setDisplayedRemainingTime]
  )

  const clearScheduledLevelTimeout = useCallback((): void => {
    if (levelTimeoutIdRef.current === null) {
      return
    }

    window.clearTimeout(levelTimeoutIdRef.current)
    levelTimeoutIdRef.current = null
  }, [])

  const stopLevelTimerRefs = useCallback((): void => {
    levelTimeEndsAtRef.current = null
    levelPausedAtRef.current = null
    remainingTimeSecondsRef.current = null
  }, [])

  const clearLevelTimer = useCallback((): void => {
    clearScheduledLevelTimeout()
    stopLevelTimerRefs()
    setDisplayedRemainingTime(null)
  }, [clearScheduledLevelTimeout, setDisplayedRemainingTime, stopLevelTimerRefs])

  const finishGameByTimeout = useCallback(
    (state: GameState): GameState => {
      clearDirectionBuffer()
      clearScheduledLevelTimeout()
      stopLevelTimerRefs()

      return createTimedOutGameState(state)
    },
    [clearDirectionBuffer, clearScheduledLevelTimeout, stopLevelTimerRefs]
  )

  const scheduleLevelTimeout = useCallback(
    (now: number): void => {
      clearScheduledLevelTimeout()

      if (!isTimedModeEnabledRef.current || levelTimeEndsAtRef.current === null) {
        return
      }

      const timeoutDelay = Math.max(0, levelTimeEndsAtRef.current - now)

      levelTimeoutIdRef.current = window.setTimeout(() => {
        levelTimeoutIdRef.current = null

        setGameState((previousState) => {
          if (
            !isTimedModeEnabledRef.current ||
            levelTimeEndsAtRef.current === null ||
            previousState.phase === 'idle' ||
            previousState.phase === 'gameOver' ||
            previousState.phase === 'levelComplete'
          ) {
            return previousState
          }

          return finishGameByTimeout(previousState)
        })
      }, timeoutDelay)
    },
    [clearScheduledLevelTimeout, finishGameByTimeout]
  )

  const startLevelTimer = useCallback(
    (levelIndex: number, now: number): void => {
      if (!isTimedModeEnabledRef.current) {
        clearLevelTimer()
        return
      }

      const configuredSeconds =
        timeLimitSecondsRef.current[levelIndex] ??
        DEFAULT_TIME_LIMIT_SECONDS[levelIndex] ??
        DEFAULT_TIME_LIMIT_SECONDS[0]

      levelPausedAtRef.current = null
      levelTimeEndsAtRef.current =
        now + READY_DURATION_MS + clampTimeLimitSeconds(configuredSeconds) * 1000
      updateDisplayedRemainingTime(now)
      scheduleLevelTimeout(now)
    },
    [clearLevelTimer, scheduleLevelTimeout, updateDisplayedRemainingTime]
  )

  const pauseLevelTimer = useCallback(
    (now: number): void => {
      if (!isTimedModeEnabledRef.current || levelTimeEndsAtRef.current === null) {
        return
      }

      levelPausedAtRef.current = now
      clearScheduledLevelTimeout()
    },
    [clearScheduledLevelTimeout]
  )

  const resumeLevelTimer = useCallback(
    (now: number): void => {
      if (levelTimeEndsAtRef.current === null || levelPausedAtRef.current === null) {
        return
      }

      levelTimeEndsAtRef.current += now - levelPausedAtRef.current
      levelPausedAtRef.current = null
      updateDisplayedRemainingTime(now)
      scheduleLevelTimeout(now)
    },
    [scheduleLevelTimeout, updateDisplayedRemainingTime]
  )

  const handleToggleTimedMode = useCallback(
    (password: string): boolean => {
      if (password !== GOD_MODE_PASSWORD) {
        return false
      }

      setIsTimedModeEnabled((enabled) => {
        const nextEnabled = !enabled

        isTimedModeEnabledRef.current = nextEnabled

        if (!nextEnabled) {
          clearLevelTimer()
        }

        return nextEnabled
      })

      return true
    },
    [clearLevelTimer]
  )

  const handleTimeLimitMinutesChange = useCallback((levelIndex: number, minutes: number): void => {
    if (!Number.isFinite(minutes)) {
      return
    }

    setTimeLimitSeconds((currentLimits) =>
      currentLimits.map((seconds, index) =>
        index === levelIndex ? clampTimeLimitSeconds(minutes * 60) : seconds
      )
    )
  }, [])

  const rerollCityBiomeLayout = useCallback((): void => {
    setCityBiomeLayout((currentLayout) => createCityBiomeLayout(currentLayout.kind))
  }, [])

  const randomizeCityBiomeLayout = useCallback((): void => {
    setCityBiomeLayout(createRandomCityBiomeLayout())
  }, [])

  const handleCityBiomeKindChange = useCallback((kind: CityBiomeLayoutKind): void => {
    setCityBiomeLayout((currentLayout) =>
      currentLayout.kind === kind ? currentLayout : createCityBiomeLayout(kind)
    )
  }, [])

  const handleJumpToLevel = useCallback(
    (targetLevelIndex: number): void => {
      if (targetLevelIndex < 0 || targetLevelIndex >= levels.length) {
        return
      }

      clearDirectionBuffer()
      const now = performance.now()

      randomizeCityBiomeLayout()
      startLevelTimer(targetLevelIndex, now)
      playInteractiveSound('startGame')
      setGameState((previousState) => {
        const nextState = restartGame(
          getLevelAt(levels, targetLevelIndex),
          now,
          targetLevelIndex,
          previousState.skins
        )

        return {
          ...nextState,
          score: previousState.score,
          lives: previousState.lives,
          player: {
            ...nextState.player,
            lives: previousState.lives
          }
        }
      })
    },
    [clearDirectionBuffer, playInteractiveSound, randomizeCityBiomeLayout, startLevelTimer]
  )

  const handlePreviousLevel = useCallback((): void => {
    handleJumpToLevel(gameState.levelIndex - 1)
  }, [gameState.levelIndex, handleJumpToLevel])

  const handleManualNextLevel = useCallback((): void => {
    handleJumpToLevel(gameState.levelIndex + 1)
  }, [gameState.levelIndex, handleJumpToLevel])

  const handleNewGame = useCallback(() => {
    clearDirectionBuffer()
    const now = performance.now()

    gameStartedAtRef.current = now
    randomizeCityBiomeLayout()
    startLevelTimer(0, now)
    playInteractiveSound('startGame')
    setIsScoreSubmitted(false)
    setGameDurationMs(0)
    setGameState((previousState) => restartGame(firstLevel, now, 0, previousState.skins))
  }, [clearDirectionBuffer, playInteractiveSound, randomizeCityBiomeLayout, startLevelTimer])

  const handleReturnToStartMenu = useCallback(() => {
    clearDirectionBuffer()
    clearLevelTimer()
    gameStartedAtRef.current = null
    setIsScoreSubmitted(false)
    setGameState((previousState) => ({
      ...createIdleGameState(firstLevel),
      skins: previousState.skins
    }))
  }, [clearDirectionBuffer, clearLevelTimer])

  const handleNextLevel = useCallback(() => {
    clearDirectionBuffer()
    const now = performance.now()

    playInteractiveSound('startGame')
    setGameState((previousState) => {
      const nextState = advanceToNextLevel(previousState, levels, now)

      if (nextState !== previousState) {
        randomizeCityBiomeLayout()
        startLevelTimer(nextState.levelIndex, now)
      }

      return nextState
    })
  }, [clearDirectionBuffer, playInteractiveSound, randomizeCityBiomeLayout, startLevelTimer])

  const handleCycleGhostSkin = useCallback(() => {
    setGameState((previousState) => ({
      ...previousState,
      skins: {
        ...previousState.skins,
        ghost: getNextGhostSkinId(previousState.skins.ghost)
      }
    }))
  }, [])

  const saveRankingFile = useCallback(
    async (entries: readonly RankingEntry[], explicitFilePath = rankingFilePath): Promise<void> => {
      if (!explicitFilePath) {
        return
      }

      if (!rankingFileApi) {
        setRankingFileStatus('Scores file is unavailable here')
        return
      }

      setIsRankingFileSaving(true)
      setRankingFileStatus('Saving scores file...')

      try {
        const result = await rankingFileApi.writeRankingFile(explicitFilePath, entries)

        setRankingFileStatus(result.ok ? 'Scores file saved' : (result.error ?? 'Save failed'))
      } catch {
        setRankingFileStatus('Save failed')
      } finally {
        setIsRankingFileSaving(false)
      }
    },
    [rankingFileApi, rankingFilePath]
  )

  const handleChooseRankingFile = useCallback(async () => {
    if (!rankingFileApi) {
      setRankingFileStatus('Scores file is unavailable here')
      return
    }

    setIsRankingFileSaving(true)
    setRankingFileStatus('Choosing scores file...')

    try {
      const selection = await rankingFileApi.chooseRankingFile()

      if (!selection) {
        setRankingFileStatus(null)
        return
      }

      writeRankingFilePath(selection.filePath)
      setRankingFilePath(selection.filePath)
      await saveRankingFile(rankingEntries, selection.filePath)
    } catch (error) {
      setRankingFileStatus(getRankingFileSelectionError(error))
    } finally {
      setIsRankingFileSaving(false)
    }
  }, [rankingEntries, rankingFileApi, saveRankingFile])

  const handleSubmitScore = useCallback(() => {
    if (isScoreSubmitted || gameState.phase !== 'gameOver') {
      return
    }

    const updatedRanking = rankingStorage.add({
      playerName,
      phoneNumber,
      score: gameState.score,
      reachedLevel: gameState.levelIndex + 1
    })

    setRankingEntries(updatedRanking)
    setIsScoreSubmitted(true)
    void saveRankingFile(updatedRanking)
  }, [
    gameState.levelIndex,
    gameState.phase,
    gameState.score,
    isScoreSubmitted,
    phoneNumber,
    playerName,
    saveRankingFile
  ])

  const handleClearRankings = useCallback(() => {
    const updatedRanking = rankingStorage.clear()

    setRankingEntries(updatedRanking)
    setIsScoreSubmitted(false)
    void saveRankingFile(updatedRanking)
  }, [saveRankingFile])

  useEffect(() => {
    if (gameState.phase !== 'gameOver') {
      if (gameOverProcessTimeoutRef.current !== null) {
        window.clearTimeout(gameOverProcessTimeoutRef.current)
        gameOverProcessTimeoutRef.current = null
      }
      if (gameOverReturnTimeoutRef.current !== null) {
        window.clearTimeout(gameOverReturnTimeoutRef.current)
        gameOverReturnTimeoutRef.current = null
      }
      return
    }

    clearLevelTimer()

    if (gameOverProcessTimeoutRef.current !== null || gameOverReturnTimeoutRef.current !== null) {
      return
    }

    gameOverProcessTimeoutRef.current = window.setTimeout(() => {
      gameOverProcessTimeoutRef.current = null
      setGameDurationMs(getElapsedGameTimeMs(gameStartedAtRef.current))
      handleSubmitScore()

      gameOverReturnTimeoutRef.current = window.setTimeout(() => {
        gameOverReturnTimeoutRef.current = null
        handleReturnToStartMenu()
      }, GAME_OVER_RESULT_DURATION_MS)
    }, 0)
  }, [clearLevelTimer, gameState.phase, handleReturnToStartMenu, handleSubmitScore])

  useEffect(() => {
    return () => {
      if (gameOverProcessTimeoutRef.current !== null) {
        window.clearTimeout(gameOverProcessTimeoutRef.current)
      }
      if (gameOverReturnTimeoutRef.current !== null) {
        window.clearTimeout(gameOverReturnTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (gameState.phase !== 'levelComplete') {
      if (levelCompleteTimeoutRef.current !== null) {
        window.clearTimeout(levelCompleteTimeoutRef.current)
        levelCompleteTimeoutRef.current = null
      }
      return
    }

    if (levelCompleteTimeoutRef.current !== null) {
      return
    }

    levelCompleteTimeoutRef.current = window.setTimeout(() => {
      levelCompleteTimeoutRef.current = null

      if (isFinalLevel(levels, gameState.levelIndex)) {
        handleReturnToStartMenu()
        return
      }

      handleNextLevel()
    }, LEVEL_COMPLETE_DURATION_MS)
  }, [gameState.levelIndex, gameState.phase, handleNextLevel, handleReturnToStartMenu])

  useEffect(() => {
    return () => {
      if (levelCompleteTimeoutRef.current !== null) {
        window.clearTimeout(levelCompleteTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    gamePhaseRef.current = gameState.phase
  }, [gameState.phase])

  useEffect(() => {
    isGodModeEnabledRef.current = isGodModeEnabled
  }, [isGodModeEnabled])

  useEffect(() => {
    isTimedModeEnabledRef.current = isTimedModeEnabled

    if (!isTimedModeEnabled) {
      clearLevelTimer()
    }
  }, [clearLevelTimer, isTimedModeEnabled])

  useEffect(() => {
    timeLimitSecondsRef.current = timeLimitSeconds
  }, [timeLimitSeconds])

  useEffect(() => {
    if (
      !isTimedModeEnabled ||
      remainingTimeSeconds === null ||
      remainingTimeSeconds > 1 ||
      gameState.phase === 'idle' ||
      gameState.phase === 'paused' ||
      gameState.phase === 'gameOver' ||
      gameState.phase === 'levelComplete'
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((previousState) => {
        if (
          previousState.phase === 'idle' ||
          previousState.phase === 'gameOver' ||
          previousState.phase === 'levelComplete'
        ) {
          return previousState
        }

        return finishGameByTimeout(previousState)
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [finishGameByTimeout, gameState.phase, isTimedModeEnabled, remainingTimeSeconds])

  useEffect(() => {
    if (
      !isTimedModeEnabled ||
      gameState.phase === 'idle' ||
      gameState.phase === 'gameOver' ||
      gameState.phase === 'levelComplete'
    ) {
      return
    }

    const intervalId = window.setInterval(() => {
      const now = performance.now()

      updateDisplayedRemainingTime(now)

      if (
        levelTimeEndsAtRef.current === null ||
        !hasLevelTimerExpired(now, levelTimeEndsAtRef.current)
      ) {
        return
      }

      setGameState((previousState) => {
        if (
          previousState.phase === 'idle' ||
          previousState.phase === 'gameOver' ||
          previousState.phase === 'levelComplete'
        ) {
          return previousState
        }

        return finishGameByTimeout(previousState)
      })
    }, 100)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [finishGameByTimeout, gameState.phase, isTimedModeEnabled, updateDisplayedRemainingTime])

  useEffect(() => {
    const previousGameState = previousGameStateRef.current

    if (previousGameState) {
      for (const effectId of getSoundEffectsForTransition(previousGameState, gameState)) {
        audioManager.play(effectId)
      }
    }

    previousGameStateRef.current = gameState
  }, [audioManager, gameState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        isIntroActive &&
        gamePhaseRef.current === 'idle' &&
        (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar')
      ) {
        event.preventDefault()
        setIsIntroActive(false)
        return
      }

      const action = getKeyboardAction(event.key)

      if (isTextInputTarget(event.target)) {
        return
      }

      if (
        gamePhaseRef.current === 'idle' ||
        gamePhaseRef.current === 'gameOver' ||
        gamePhaseRef.current === 'levelComplete'
      ) {
        return
      }

      if (!action) {
        return
      }

      event.preventDefault()

      if (action.type === 'confirm') {
        return
      }

      if (action.type === 'toggleAudio') {
        handleToggleAudio()
        return
      }

      if (action.type === 'returnToMenu') {
        handleReturnToStartMenu()
        return
      }

      if (action.type === 'togglePause') {
        const now = performance.now()

        if (gamePhaseRef.current === 'paused') {
          resumeLevelTimer(now)
        } else {
          pauseLevelTimer(now)
        }

        setGameState((previousState) => {
          if (
            previousState.phase === 'idle' ||
            previousState.phase === 'gameOver' ||
            previousState.phase === 'levelComplete'
          ) {
            return previousState
          }

          const phase =
            previousState.phase === 'paused' ? getResumePhase(previousState, now) : 'paused'

          return {
            ...previousState,
            phase
          }
        })
        return
      }

      directionBufferRef.current = createDirectionBuffer(action.direction, performance.now())

      setGameState((previousState) => {
        if (
          previousState.phase === 'idle' ||
          previousState.phase === 'paused' ||
          previousState.phase === 'gameOver' ||
          previousState.phase === 'levelComplete'
        ) {
          return previousState
        }

        return {
          ...previousState,
          player: {
            ...previousState.player,
            nextDirection: action.direction
          }
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    handleReturnToStartMenu,
    handleToggleAudio,
    isIntroActive,
    pauseLevelTimer,
    playInteractiveSound,
    resumeLevelTimer
  ])

  const awardTimeBonusIfLevelComplete = useCallback(
    (state: GameState, now: number): GameState => {
      if (
        state.phase !== 'levelComplete' ||
        !isTimedModeEnabledRef.current ||
        levelTimeEndsAtRef.current === null
      ) {
        return state
      }

      const remainingSeconds = getDisplayRemainingSeconds(now, levelTimeEndsAtRef.current)
      const bonusScore = remainingSeconds * TIME_BONUS_POINTS_PER_SECOND

      clearLevelTimer()

      return bonusScore > 0
        ? {
            ...state,
            score: state.score + bonusScore
          }
        : state
    },
    [clearLevelTimer]
  )

  useEffect(() => {
    return startGameLoop((deltaSeconds, now) => {
      setGameState((previousState) => {
        if (
          previousState.phase === 'idle' ||
          previousState.phase === 'paused' ||
          previousState.phase === 'gameOver' ||
          previousState.phase === 'levelComplete'
        ) {
          return previousState
        }

        updateDisplayedRemainingTime(now)

        if (
          isTimedModeEnabledRef.current &&
          levelTimeEndsAtRef.current !== null &&
          hasLevelTimerExpired(now, levelTimeEndsAtRef.current)
        ) {
          return finishGameByTimeout(previousState)
        }

        if (previousState.readyUntil !== undefined && now < previousState.readyUntil) {
          return previousState
        }

        const stateAfterReady: GameState =
          previousState.readyUntil !== undefined
            ? {
                ...previousState,
                readyUntil: undefined
              }
            : previousState
        const activeState = updateGhostRespawns(expirePowerMode(stateAfterReady, now), now)

        if (
          directionBufferRef.current &&
          isDirectionBufferExpired(directionBufferRef.current, now)
        ) {
          directionBufferRef.current = null
        }

        const bufferedDirection = getBufferedDirection(directionBufferRef.current, now)
        const requestedDirection = bufferedDirection ?? activeState.player.nextDirection
        const player = moveEntity({
          entity: activeState.player,
          board: activeState.board,
          deltaSeconds,
          requestedDirection
        })

        if (bufferedDirection && player.direction === bufferedDirection) {
          directionBufferRef.current = null
        }

        const playerStatus: PlayerStatus = player.direction === 'none' ? 'ready' : 'moving'

        const nextState: GameState = {
          ...activeState,
          phase:
            activeState.phase === 'powerMode'
              ? 'powerMode'
              : activeState.phase === 'playing' || playerStatus === 'moving'
                ? 'playing'
                : 'ready',
          player: {
            ...player,
            status: playerStatus
          }
        }

        const collectedResult = collectPlayerTileWithResult(nextState)
        const scoredState =
          collectedResult.collected?.kind === 'powerPellet' &&
          collectedResult.state.phase !== 'levelComplete'
            ? activatePowerMode(collectedResult.state, now)
            : collectedResult.state
        const scoredStateWithTimeBonus = awardTimeBonusIfLevelComplete(scoredState, now)

        if (
          scoredStateWithTimeBonus.phase !== 'playing' &&
          scoredStateWithTimeBonus.phase !== 'powerMode'
        ) {
          return scoredStateWithTimeBonus
        }

        const stateWithGhosts: GameState = {
          ...scoredStateWithTimeBonus,
          ghosts: scoredStateWithTimeBonus.ghosts.map((ghost) =>
            moveGhost({
              ghost,
              board: scoredStateWithTimeBonus.board,
              deltaSeconds,
              player: scoredStateWithTimeBonus.player
            })
          )
        }

        const frightenedGhost = getFrightenedCollidingGhost(
          stateWithGhosts.player,
          stateWithGhosts.ghosts
        )

        if (frightenedGhost) {
          return eatGhost(stateWithGhosts, frightenedGhost.id, now)
        }

        if (getCollidingGhost(stateWithGhosts.player, stateWithGhosts.ghosts)) {
          if (isGodModeEnabledRef.current) {
            return stateWithGhosts
          }

          directionBufferRef.current = null
          const stateAfterLifeLoss = loseLife(stateWithGhosts, now)

          if (stateAfterLifeLoss.phase === 'gameOver') {
            clearLevelTimer()
          }

          return stateAfterLifeLoss
        }

        return stateWithGhosts
      })
    })
  }, [
    awardTimeBonusIfLevelComplete,
    clearLevelTimer,
    finishGameByTimeout,
    updateDisplayedRemainingTime
  ])

  return (
    <main className={`game-shell${isIntroVisible ? ' game-shell-intro' : ''}`}>
      {isStartSurfaceVisible && <MainMenuBackdrop />}
      {isIntroVisible && <IntroOverlay onDismiss={handleDismissIntro} style={introOverlayStyle} />}
      <section
        className={`game-layout${isHudVisible ? '' : ' game-layout-hudless'}`}
        aria-label="Pac-Map"
      >
        {isHudVisible && (
          <Hud
            levelLabel={levelHudLabel}
            score={gameState.score}
            lives={gameState.lives}
            remainingTimeSeconds={isTimedModeEnabled ? remainingTimeSeconds : null}
          />
        )}

        <div className="stage-wrap">
          {isHudVisible && (
            <div className="game-slogan" aria-label="Idź w OpenSource i unikaj kosztów">
              IDŹ W OPENSOURCE I UNIKAJ KOSZTÓW
            </div>
          )}
          <div className="game-stage" style={gameStageStyle}>
            {!isStartSurfaceVisible && (
              <SvgStage level={currentLevel}>
                <GameBoard
                  level={currentLevel}
                  collectibles={gameState.collectibles}
                  cityBiomeLayout={cityBiomeLayout}
                />
                {gameState.ghosts.map((ghost, index) => (
                  <Ghost
                    key={ghost.id}
                    ghost={ghost}
                    tileSize={TILE_SIZE}
                    index={index}
                    skinId={gameState.skins.ghost}
                  />
                ))}
                <Player
                  player={gameState.player}
                  tileSize={TILE_SIZE}
                  skinId={gameState.skins.player}
                />
              </SvgStage>
            )}
            {gameState.phase === 'ready' && (
              <div className="stage-banner stage-banner-level">
                <span className="stage-banner-level-name">{currentLevel.name}</span>
                <span className="stage-banner-status">Ready</span>
              </div>
            )}
            {gameState.phase === 'paused' && <div className="stage-banner">Paused</div>}
            {isMenuVisible && (
              <StartOverlay
                ghostSkinLabel={getGhostSkinLabel(gameState.skins.ghost)}
                isAudioMuted={isAudioMuted}
                playerName={playerName}
                phoneNumber={phoneNumber}
                rankings={rankingEntries}
                rankingFilePath={rankingFilePath}
                rankingFileStatus={rankingFileStatus}
                isRankingFileSupported={Boolean(rankingFileApi)}
                isRankingFileSaving={isRankingFileSaving}
                isGodModeEnabled={isGodModeEnabled}
                isTimedModeEnabled={isTimedModeEnabled}
                menuMusicVolume={menuMusicVolume}
                gameMusicVolume={gameMusicVolume}
                gameBoardScale={gameBoardScale}
                introOverlayScale={introOverlayScale}
                timeLimitMinutes={timeLimitSeconds.map((seconds) => seconds / 60)}
                onStart={handleNewGame}
                onPlayerNameChange={setPlayerName}
                onPhoneNumberChange={setPhoneNumber}
                onCycleGhostSkin={handleCycleGhostSkin}
                onToggleAudio={handleToggleAudio}
                onMenuMusicVolumeChange={handleMenuMusicVolumeChange}
                onGameMusicVolumeChange={handleGameMusicVolumeChange}
                onGameBoardScaleChange={handleGameBoardScaleChange}
                onIntroOverlayScaleChange={handleIntroOverlayScaleChange}
                onClearRankings={handleClearRankings}
                onVerifyClearRankingsPassword={verifyGodModePassword}
                onChooseRankingFile={handleChooseRankingFile}
                onVerifyGodModePassword={handleVerifyGodModePassword}
                onDisableGodMode={handleDisableGodMode}
                onToggleTimedMode={handleToggleTimedMode}
                onTimeLimitMinutesChange={handleTimeLimitMinutesChange}
              />
            )}
            {gameState.phase === 'levelComplete' && (
              <LevelCompleteOverlay
                score={gameState.score}
                levelName={currentLevel.name}
                nextLevelName={nextLevel?.name ?? null}
                isFinalLevel={levelIsFinal}
              />
            )}
            {gameState.phase === 'gameOver' && (
              <GameOverOverlay
                playerName={playerName}
                score={gameState.score}
                elapsedTimeMs={gameDurationMs}
              />
            )}
          </div>
          {isHudVisible && <CompanyLogo variant="stage" />}
        </div>
        {isGodModeEnabled && isHudVisible && (
          <BiomeControlPanel
            selectedKind={cityBiomeLayout.kind}
            levelIndex={gameState.levelIndex}
            totalLevels={levels.length}
            onBiomeKindChange={handleCityBiomeKindChange}
            onReroll={rerollCityBiomeLayout}
            onPreviousLevel={handlePreviousLevel}
            onNextLevel={handleManualNextLevel}
          />
        )}
      </section>
      <FullscreenButton />
    </main>
  )
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  )
}

function getResumePhase(state: GameState, now: number): GameState['phase'] {
  if (state.readyUntil !== undefined && now < state.readyUntil) {
    return 'ready'
  }

  if (state.powerModeEndsAt !== undefined && now < state.powerModeEndsAt) {
    return 'powerMode'
  }

  return 'playing'
}

function isGameplayPhase(phase: GameState['phase']): boolean {
  return (
    phase === 'ready' ||
    phase === 'playing' ||
    phase === 'powerMode' ||
    phase === 'lifeLost' ||
    phase === 'paused'
  )
}

function formatLevelHudLabel(levelIndex: number, levelName: string): string {
  const districtName = levelName.split(' - ').at(-1)?.trim() || levelName.trim()

  return `LEVEL ${levelIndex + 1} - ${districtName}`
}

function getElapsedGameTimeMs(startedAt: number | null): number {
  if (startedAt === null) {
    return 0
  }

  return Math.max(0, performance.now() - startedAt)
}

function clampTimeLimitSeconds(seconds: number): number {
  return Math.min(MAX_TIME_LIMIT_SECONDS, Math.max(MIN_TIME_LIMIT_SECONDS, Math.round(seconds)))
}

function normalizeGameBoardScale(scale: number): number {
  if (!Number.isFinite(scale)) {
    return DEFAULT_GAME_BOARD_SCALE
  }

  return Math.min(MAX_GAME_BOARD_SCALE, Math.max(MIN_GAME_BOARD_SCALE, scale))
}

function normalizeIntroOverlayScale(scale: number): number {
  if (!Number.isFinite(scale)) {
    return DEFAULT_INTRO_OVERLAY_SCALE
  }

  return Math.min(MAX_INTRO_OVERLAY_SCALE, Math.max(MIN_INTRO_OVERLAY_SCALE, scale))
}

function readGameBoardScalePreference(storage = getLocalStorage()): number {
  if (!storage) {
    return DEFAULT_GAME_BOARD_SCALE
  }

  const storedValue = storage.getItem(GAME_BOARD_SCALE_STORAGE_KEY)

  if (storedValue === null) {
    return DEFAULT_GAME_BOARD_SCALE
  }

  const storedScale = Number(storedValue)

  return normalizeGameBoardScale(storedScale)
}

function writeGameBoardScalePreference(scale: number, storage = getLocalStorage()): void {
  storage?.setItem(GAME_BOARD_SCALE_STORAGE_KEY, String(normalizeGameBoardScale(scale)))
}

function readIntroOverlayScalePreference(storage = getLocalStorage()): number {
  if (!storage) {
    return DEFAULT_INTRO_OVERLAY_SCALE
  }

  const storedValue = storage.getItem(INTRO_OVERLAY_SCALE_STORAGE_KEY)

  if (storedValue === null) {
    return DEFAULT_INTRO_OVERLAY_SCALE
  }

  const storedScale = Number(storedValue)

  return normalizeIntroOverlayScale(storedScale)
}

function writeIntroOverlayScalePreference(scale: number, storage = getLocalStorage()): void {
  storage?.setItem(INTRO_OVERLAY_SCALE_STORAGE_KEY, String(normalizeIntroOverlayScale(scale)))
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}

function hasLevelTimerExpired(now: number, endsAt: number): boolean {
  return getDisplayRemainingSeconds(now, endsAt) <= 1
}

function getDisplayRemainingSeconds(now: number, endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

function createTimedOutGameState(state: GameState): GameState {
  return {
    ...state,
    phase: 'gameOver',
    lives: 0,
    readyUntil: undefined,
    powerModeEndsAt: undefined,
    player: {
      ...state.player,
      lives: 0,
      direction: 'none',
      nextDirection: 'none',
      status: 'dead'
    }
  }
}

function getRankingFileSelectionError(error: unknown): string {
  if (error instanceof Error && error.message.includes('No handler registered')) {
    return 'Restart the app and try again'
  }

  return 'Could not open file picker'
}
