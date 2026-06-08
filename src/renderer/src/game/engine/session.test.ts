import { describe, expect, it } from 'vitest'

import { READY_DURATION_MS } from './constants'
import {
  advanceToNextLevel,
  createIdleGameState,
  restartGame,
  restartLevel,
  startGame
} from './session'
import { level01, levels, parseLevel } from '../levels'

describe('game session', () => {
  it('creates an idle game state for the start screen', () => {
    const state = createIdleGameState(parseLevel(level01))

    expect(state.phase).toBe('idle')
    expect(state.readyUntil).toBeUndefined()
    expect(state.score).toBe(0)
    expect(state.lives).toBe(3)
  })

  it('starts the game with a short ready state', () => {
    const state = createIdleGameState(parseLevel(level01))
    const started = startGame(state, 1000)

    expect(started.phase).toBe('ready')
    expect(started.readyUntil).toBe(1000 + READY_DURATION_MS)
    expect(started.player.direction).toBe('none')
    expect(started.player.status).toBe('ready')
  })

  it('restarts the current level while keeping score and lives', () => {
    const level = parseLevel(level01)
    const state = {
      ...createIdleGameState(level),
      phase: 'levelComplete' as const,
      skins: {
        player: 'player-default',
        ghost: 'ghost-neon'
      } as const,
      score: 1230,
      lives: 2
    }
    const restarted = restartLevel(state, level, 3000)

    expect(restarted.phase).toBe('ready')
    expect(restarted.readyUntil).toBe(3000 + READY_DURATION_MS)
    expect(restarted.score).toBe(1230)
    expect(restarted.lives).toBe(2)
    expect(restarted.skins.ghost).toBe('ghost-neon')
    expect(restarted.player.lives).toBe(2)
    expect(restarted.collectibles.every((collectible) => !collectible.collected)).toBe(true)
  })

  it('restarts the whole game from a clean score and full lives', () => {
    const restarted = restartGame(parseLevel(level01), 5000, 0, {
      player: 'player-default',
      ghost: 'ghost-neon'
    })

    expect(restarted.phase).toBe('ready')
    expect(restarted.readyUntil).toBe(5000 + READY_DURATION_MS)
    expect(restarted.score).toBe(0)
    expect(restarted.lives).toBe(3)
    expect(restarted.skins.ghost).toBe('ghost-neon')
  })

  it('advances to the next level while keeping score and lives', () => {
    const state = {
      ...createIdleGameState(levels[0]),
      phase: 'levelComplete' as const,
      skins: {
        player: 'player-default',
        ghost: 'ghost-neon'
      } as const,
      score: 900,
      lives: 2
    }

    const advanced = advanceToNextLevel(state, levels, 7000)

    expect(advanced.levelId).toBe('level-02')
    expect(advanced.levelIndex).toBe(1)
    expect(advanced.score).toBe(900)
    expect(advanced.lives).toBe(2)
    expect(advanced.skins.ghost).toBe('ghost-neon')
    expect(advanced.player.lives).toBe(2)
  })
})
