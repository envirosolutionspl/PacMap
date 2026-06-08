import { describe, expect, it } from 'vitest'

import { createInitialGameState } from './createInitialGameState'
import { getLevelAt, getLevelGhostSpeed, getNextLevelIndex, isFinalLevel } from './levelProgression'
import { levels } from '../levels'

describe('level progression', () => {
  it('exposes five levels with staged difficulty', () => {
    expect(levels.map((level) => level.difficulty)).toEqual([
      'easy',
      'easy',
      'normal',
      'normal',
      'hard'
    ])
    expect(levels.map((level) => level.ghostSpawns.length)).toEqual([2, 3, 4, 4, 5])
    expect(
      levels.map(
        (level) => level.ghostSpawns.filter((spawn) => spawn.type === 'chaserGhost').length
      )
    ).toEqual([0, 0, 0, 0, 1])
    expect(levels.map((level) => level.ghostSpawns.map((spawn) => spawn.type))).toEqual([
      ['randomGhost', 'randomGhost'],
      ['randomGhost', 'randomGhost', 'wandererGhost'],
      ['randomGhost', 'randomGhost', 'randomGhost', 'wandererGhost'],
      ['randomGhost', 'randomGhost', 'wandererGhost', 'ambusherGhost'],
      ['randomGhost', 'randomGhost', 'wandererGhost', 'wandererGhost', 'chaserGhost']
    ])
  })

  it('uses every MVP ghost type across the campaign', () => {
    const ghostTypes = new Set(
      levels.flatMap((level) => level.ghostSpawns.map((spawn) => spawn.type))
    )

    expect(ghostTypes).toEqual(
      new Set(['randomGhost', 'chaserGhost', 'ambusherGhost', 'wandererGhost'])
    )
  })

  it('returns next level indexes until the final level', () => {
    expect(getNextLevelIndex(levels, 0)).toBe(1)
    expect(getNextLevelIndex(levels, 1)).toBe(2)
    expect(getNextLevelIndex(levels, 2)).toBe(3)
    expect(getNextLevelIndex(levels, 3)).toBe(4)
    expect(getNextLevelIndex(levels, 4)).toBeNull()
    expect(isFinalLevel(levels, 4)).toBe(true)
  })

  it('keeps ghost speed nondecreasing by level difficulty', () => {
    expect(getLevelGhostSpeed(getLevelAt(levels, 0), 0)).toBe(
      getLevelGhostSpeed(getLevelAt(levels, 1), 0)
    )
    expect(getLevelGhostSpeed(getLevelAt(levels, 1), 0)).toBeLessThan(
      getLevelGhostSpeed(getLevelAt(levels, 2), 0)
    )
    expect(getLevelGhostSpeed(getLevelAt(levels, 2), 0)).toBe(
      getLevelGhostSpeed(getLevelAt(levels, 3), 0)
    )
    expect(getLevelGhostSpeed(getLevelAt(levels, 3), 0)).toBeLessThan(
      getLevelGhostSpeed(getLevelAt(levels, 4), 0)
    )
  })

  it('keeps the first three levels free of direct chaser ghosts', () => {
    expect(
      levels
        .slice(0, 3)
        .flatMap((level) => level.ghostSpawns.map((spawn) => spawn.type))
        .includes('chaserGhost')
    ).toBe(false)
  })

  it('creates ghosts with level-specific base speed', () => {
    const hardState = createInitialGameState(getLevelAt(levels, 4), 4)

    expect(hardState.ghosts[0].speed).toBe(getLevelGhostSpeed(getLevelAt(levels, 4), 0))
    expect(hardState.ghosts[0].baseSpeed).toBe(hardState.ghosts[0].speed)
  })
})
