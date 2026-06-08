import { describe, expect, it } from 'vitest'

import {
  FRIGHTENED_GHOST_SPEED_TILES_PER_SECOND,
  GHOST_EATEN_SCORE,
  GHOST_RESPAWN_DURATION_MS,
  POWER_MODE_DURATION_MS
} from './constants'
import { createInitialGameState } from './createInitialGameState'
import { getTileCenter } from './movement'
import { activatePowerMode, eatGhost, expirePowerMode, updateGhostRespawns } from './powerMode'
import { level01, parseLevel } from '../levels'

describe('power mode', () => {
  it('activates frightened ghosts for a limited time', () => {
    const now = 1000
    const state = createInitialGameState(parseLevel(level01))

    const powered = activatePowerMode(state, now)

    expect(powered.phase).toBe('powerMode')
    expect(powered.powerModeEndsAt).toBe(now + POWER_MODE_DURATION_MS)
    expect(powered.ghosts.every((ghost) => ghost.mode === 'frightened')).toBe(true)
    expect(
      powered.ghosts.every((ghost) => ghost.speed === FRIGHTENED_GHOST_SPEED_TILES_PER_SECOND)
    ).toBe(true)
  })

  it('returns frightened ghosts to normal after power time ends', () => {
    const now = 1000
    const state = createInitialGameState(parseLevel(level01))
    const powered = activatePowerMode(state, now)

    const expired = expirePowerMode(powered, now + POWER_MODE_DURATION_MS)

    expect(expired.phase).toBe('playing')
    expect(expired.powerModeEndsAt).toBeUndefined()
    expect(expired.ghosts.every((ghost) => ghost.mode === 'normal')).toBe(true)
    expect(expired.ghosts.every((ghost) => ghost.speed === ghost.baseSpeed)).toBe(true)
  })

  it('eats a frightened ghost and sends it inactive to spawn', () => {
    const now = 1000
    const state = activatePowerMode(createInitialGameState(parseLevel(level01)), now)
    const ghost = state.ghosts[0]

    const updated = eatGhost(state, ghost.id, now)
    const eatenGhost = updated.ghosts[0]

    expect(updated.score).toBe(state.score + GHOST_EATEN_SCORE)
    expect(eatenGhost.mode).toBe('eaten')
    expect(eatenGhost.tile).toEqual(ghost.spawn)
    expect(eatenGhost.position).toEqual(getTileCenter(ghost.spawn, state.board.tileSize))
    expect(eatenGhost.direction).toBe('none')
    expect(eatenGhost.respawnAt).toBe(now + GHOST_RESPAWN_DURATION_MS)
  })

  it('respawns eaten ghosts as normal after 10 seconds', () => {
    const now = 1000
    const state = activatePowerMode(createInitialGameState(parseLevel(level01)), now)
    const eaten = eatGhost(state, state.ghosts[0].id, now)

    const waiting = updateGhostRespawns(eaten, now + GHOST_RESPAWN_DURATION_MS - 1)
    const respawned = updateGhostRespawns(eaten, now + GHOST_RESPAWN_DURATION_MS)

    expect(waiting.ghosts[0].mode).toBe('eaten')
    expect(respawned.ghosts[0].mode).toBe('normal')
    expect(respawned.ghosts[0].respawnAt).toBeUndefined()
    expect(respawned.ghosts[0].speed).toBe(respawned.ghosts[0].baseSpeed)
  })
})
