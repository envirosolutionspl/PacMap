import { READY_DURATION_MS } from './constants'
import { createInitialGameState } from './createInitialGameState'
import { getLevelAt, getNextLevelIndex } from './levelProgression'
import { getTileCenter } from './movement'
import type { GameState, SkinSettings } from './types'
import type { ParsedLevel } from '../levels'

export function createIdleGameState(level: ParsedLevel, levelIndex = 0): GameState {
  return {
    ...createInitialGameState(level, levelIndex),
    phase: 'idle',
    readyUntil: undefined
  }
}

export function startGame(state: GameState, now: number): GameState {
  return makeReadyState(state, now)
}

export function restartLevel(state: GameState, level: ParsedLevel, now: number): GameState {
  const baseState = createInitialGameState(level, state.levelIndex)

  return makeReadyState(
    {
      ...baseState,
      skins: state.skins,
      score: state.score,
      lives: state.lives,
      player: {
        ...baseState.player,
        lives: state.lives
      }
    },
    now
  )
}

export function restartGame(
  level: ParsedLevel,
  now: number,
  levelIndex = 0,
  skins?: SkinSettings
): GameState {
  const baseState = createInitialGameState(level, levelIndex)

  return makeReadyState(
    {
      ...baseState,
      skins: skins ?? baseState.skins
    },
    now
  )
}

export function advanceToNextLevel(
  state: GameState,
  levels: readonly ParsedLevel[],
  now: number
): GameState {
  const nextLevelIndex = getNextLevelIndex(levels, state.levelIndex)

  if (nextLevelIndex === null) {
    return state
  }

  const nextLevelState = createInitialGameState(getLevelAt(levels, nextLevelIndex), nextLevelIndex)

  return makeReadyState(
    {
      ...nextLevelState,
      skins: state.skins,
      score: state.score,
      lives: state.lives,
      player: {
        ...nextLevelState.player,
        lives: state.lives
      }
    },
    now
  )
}

function makeReadyState(state: GameState, now: number): GameState {
  return {
    ...state,
    phase: 'ready',
    readyUntil: now + READY_DURATION_MS,
    powerModeEndsAt: undefined,
    player: {
      ...state.player,
      position: getTileCenter(state.player.spawn, state.board.tileSize),
      tile: state.player.spawn,
      direction: 'none',
      nextDirection: 'none',
      status: 'ready'
    },
    ghosts: state.ghosts.map((ghost) => ({
      ...ghost,
      position: getTileCenter(ghost.spawn, state.board.tileSize),
      tile: ghost.spawn,
      direction: 'none',
      nextDirection: 'none',
      mode: 'normal',
      respawnAt: undefined
    }))
  }
}
