import { describe, expect, it } from 'vitest'

import { createInitialGameState } from './createInitialGameState'
import { loseLife } from './lives'
import { getTileCenter } from './movement'
import { level01, parseLevel } from '../levels'

describe('loseLife', () => {
  it('subtracts one life and resets player and ghosts', () => {
    const level = parseLevel(level01)
    const state = createInitialGameState(level)
    const movedState = {
      ...state,
      player: {
        ...state.player,
        position: getTileCenter({ row: 1, col: 1 }, state.board.tileSize),
        tile: { row: 1, col: 1 },
        direction: 'right' as const,
        nextDirection: 'right' as const,
        status: 'moving' as const
      }
    }

    const result = loseLife(movedState, 1000)

    expect(result.phase).toBe('ready')
    expect(result.readyUntil).toBe(2200)
    expect(result.lives).toBe(2)
    expect(result.player.lives).toBe(2)
    expect(result.player.position).toEqual(getTileCenter(level.playerSpawn, state.board.tileSize))
    expect(result.player.tile).toEqual(level.playerSpawn)
    expect(result.player.direction).toBe('none')
    expect(result.ghosts[0].tile).toEqual(level.ghostSpawns[0].position)
  })

  it('sets game over when last life is lost', () => {
    const level = parseLevel(level01)
    const state = createInitialGameState(level)

    const result = loseLife(
      {
        ...state,
        lives: 1,
        player: {
          ...state.player,
          lives: 1
        }
      },
      1000
    )

    expect(result.phase).toBe('gameOver')
    expect(result.readyUntil).toBeUndefined()
    expect(result.lives).toBe(0)
    expect(result.player.lives).toBe(0)
    expect(result.player.status).toBe('dead')
  })
})
