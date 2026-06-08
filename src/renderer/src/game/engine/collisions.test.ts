import { describe, expect, it } from 'vitest'

import {
  getCollidingGhost,
  getFrightenedCollidingGhost,
  isPlayerCollidingWithGhost
} from './collisions'
import { createInitialGameState } from './createInitialGameState'
import { level01, parseLevel } from '../levels'

describe('ghost collisions', () => {
  it('detects a normal ghost on player tile', () => {
    const state = createInitialGameState(parseLevel(level01))
    const ghost = {
      ...state.ghosts[0],
      tile: state.player.tile,
      position: state.player.position
    }

    expect(getCollidingGhost(state.player, [ghost])?.id).toBe(ghost.id)
    expect(isPlayerCollidingWithGhost(state.player, [ghost])).toBe(true)
  })

  it('ignores non-normal ghosts', () => {
    const state = createInitialGameState(parseLevel(level01))
    const ghost = {
      ...state.ghosts[0],
      mode: 'frightened' as const,
      tile: state.player.tile,
      position: state.player.position
    }

    expect(getCollidingGhost(state.player, [ghost])).toBeNull()
  })

  it('detects a frightened ghost on player tile', () => {
    const state = createInitialGameState(parseLevel(level01))
    const ghost = {
      ...state.ghosts[0],
      mode: 'frightened' as const,
      tile: state.player.tile,
      position: state.player.position
    }

    expect(getFrightenedCollidingGhost(state.player, [ghost])?.id).toBe(ghost.id)
  })
})
