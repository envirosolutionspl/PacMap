import { READY_DURATION_MS } from './constants'
import { getTileCenter } from './movement'
import type { GameState } from './types'

export function loseLife(state: GameState, now = 0): GameState {
  const lives = Math.max(0, state.lives - 1)

  if (lives === 0) {
    return {
      ...state,
      phase: 'gameOver',
      lives,
      readyUntil: undefined,
      powerModeEndsAt: undefined,
      player: {
        ...state.player,
        lives,
        direction: 'none',
        nextDirection: 'none',
        status: 'dead'
      }
    }
  }

  return {
    ...state,
    phase: 'ready',
    lives,
    readyUntil: now + READY_DURATION_MS,
    powerModeEndsAt: undefined,
    player: {
      ...state.player,
      lives,
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
      speed: ghost.baseSpeed,
      mode: 'normal',
      respawnAt: undefined
    }))
  }
}
