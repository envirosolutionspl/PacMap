import {
  FRIGHTENED_GHOST_SPEED_TILES_PER_SECOND,
  GHOST_EATEN_SCORE,
  GHOST_RESPAWN_DURATION_MS,
  POWER_MODE_DURATION_MS
} from './constants'
import { getTileCenter } from './movement'
import type { GameState, GhostState } from './types'

export function activatePowerMode(state: GameState, now: number): GameState {
  return {
    ...state,
    phase: 'powerMode',
    powerModeEndsAt: now + POWER_MODE_DURATION_MS,
    ghosts: state.ghosts.map((ghost) =>
      ghost.mode === 'normal' || ghost.mode === 'frightened'
        ? setGhostMode(ghost, 'frightened')
        : ghost
    )
  }
}

export function expirePowerMode(state: GameState, now: number): GameState {
  if (state.powerModeEndsAt === undefined || now < state.powerModeEndsAt) {
    return state
  }

  return {
    ...state,
    phase: state.phase === 'powerMode' ? 'playing' : state.phase,
    powerModeEndsAt: undefined,
    ghosts: state.ghosts.map((ghost) =>
      ghost.mode === 'frightened' ? setGhostMode(ghost, 'normal') : ghost
    )
  }
}

export function eatGhost(state: GameState, ghostId: string, now: number): GameState {
  return {
    ...state,
    score: state.score + GHOST_EATEN_SCORE,
    ghosts: state.ghosts.map((ghost) => {
      if (ghost.id !== ghostId) {
        return ghost
      }

      return {
        ...setGhostMode(ghost, 'eaten'),
        position: getTileCenter(ghost.spawn, state.board.tileSize),
        tile: ghost.spawn,
        direction: 'none',
        nextDirection: 'none',
        respawnAt: now + GHOST_RESPAWN_DURATION_MS
      }
    })
  }
}

export function updateGhostRespawns(state: GameState, now: number): GameState {
  let changed = false
  const ghosts = state.ghosts.map((ghost) => {
    if (
      (ghost.mode === 'eaten' || ghost.mode === 'respawning') &&
      ghost.respawnAt !== undefined &&
      now >= ghost.respawnAt
    ) {
      changed = true

      return {
        ...setGhostMode(ghost, 'normal'),
        respawnAt: undefined
      }
    }

    return ghost
  })

  return changed ? { ...state, ghosts } : state
}

function setGhostMode(ghost: GhostState, mode: GhostState['mode']): GhostState {
  return {
    ...ghost,
    mode,
    speed: mode === 'frightened' ? FRIGHTENED_GHOST_SPEED_TILES_PER_SECOND : ghost.baseSpeed
  }
}
