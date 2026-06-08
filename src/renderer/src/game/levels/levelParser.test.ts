import { describe, expect, it } from 'vitest'

import { COLLECTIBLE_SCORE } from '../engine/constants'
import { levels, rawLevels } from '.'
import { level01 } from './level-01'
import { parseLevel } from './levelParser'
import type { ParsedLevel, RawLevelDefinition } from './levelTypes'

describe('parseLevel', () => {
  it('parses level dimensions, spawns, tiles and collectibles', () => {
    const level = parseLevel(level01)

    expect(level.id).toBe('level-01')
    expect(level.width).toBe(15)
    expect(level.height).toBe(15)
    expect(level.playerSpawn).toEqual({ row: 13, col: 7 })
    expect(level.ghostSpawns).toHaveLength(2)
    expect(level.ghostSpawns.map((spawn) => spawn.position)).toEqual([
      { row: 7, col: 6 },
      { row: 7, col: 8 }
    ])
    expect(level.tiles[0][0]).toMatchObject({
      id: 'tile-0-0',
      kind: 'wall',
      walkable: false
    })
    expect(level.tiles[1][1]).toMatchObject({
      id: 'tile-1-1',
      kind: 'powerPellet',
      walkable: true,
      collectibleId: 'powerPellet-1-1'
    })
    expect(level.tiles[7][6]).toMatchObject({
      kind: 'ghostSpawn',
      walkable: true
    })
  })

  it('parses empty passable tiles from underscore symbols', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#P_G#', '#####']
    })

    expect(level.tiles[1][2]).toMatchObject({
      kind: 'empty',
      walkable: true
    })
  })

  it('counts collectibles and available score from map symbols', () => {
    const level = parseLevel(level01)
    const expectedPelletCount = countSymbols(level01, '.')
    const expectedBonusPelletCount = countSymbols(level01, 'b')
    const expectedPowerPelletCount = countSymbols(level01, 'o')
    const expectedScore =
      expectedPelletCount * COLLECTIBLE_SCORE.pellet +
      expectedBonusPelletCount * COLLECTIBLE_SCORE.bonusPellet +
      expectedPowerPelletCount * COLLECTIBLE_SCORE.powerPellet

    expect(level.pelletCount).toBe(expectedPelletCount)
    expect(level.bonusPelletCount).toBe(expectedBonusPelletCount)
    expect(level.powerPelletCount).toBe(expectedPowerPelletCount)
    expect(level.totalCollectibleCount).toBe(
      expectedPelletCount + expectedBonusPelletCount + expectedPowerPelletCount
    )
    expect(level.totalAvailableScore).toBe(expectedScore)
    expect(level.collectibles.every((collectible) => collectible.collected === false)).toBe(true)
  })

  it('parses every campaign level', () => {
    expect(levels).toHaveLength(5)
    expect(levels.map((level) => level.id)).toEqual([
      'level-01',
      'level-02',
      'level-03',
      'level-04',
      'level-05'
    ])
    expect(levels.map((level) => level.name)).toEqual([
      'I plansza - Bałuty',
      'II plansza - Fabryczna',
      'III plansza - Retkinia',
      'IV plansza - Widzew',
      'V plansza - Łagiewniki'
    ])
    expect(levels.map((level) => `${level.width}x${level.height}`)).toEqual([
      '15x15',
      '15x15',
      '20x20',
      '20x20',
      '20x20'
    ])
    expect(levels.map((level) => level.bonusPelletCount)).toEqual([2, 3, 3, 4, 4])
    expect(levels.map((level) => level.powerPelletCount)).toEqual([1, 1, 2, 2, 3])
    expect(levels.every((level) => level.totalCollectibleCount > 0)).toBe(true)
  })

  it('keeps player spawns away from ghost spawns', () => {
    const minimumDistances = [6, 6, 6, 6, 6]

    for (const [index, level] of levels.entries()) {
      const closestGhostDistance = Math.min(
        ...level.ghostSpawns.map((spawn) => getDistance(level.playerSpawn, spawn.position))
      )

      expect(closestGhostDistance).toBeGreaterThanOrEqual(minimumDistances[index])
    }
  })

  it('keeps campaign QGIS pellets in corners and map bonuses away from key spawns', () => {
    for (const level of levels) {
      const qgisPellets = level.collectibles.filter(
        (collectible) => collectible.kind === 'powerPellet'
      )
      const mapBonuses = level.collectibles.filter(
        (collectible) => collectible.kind === 'bonusPellet'
      )

      expect(
        qgisPellets.every(
          (collectible) =>
            (collectible.position.row === 1 || collectible.position.row === level.height - 2) &&
            (collectible.position.col === 1 || collectible.position.col === level.width - 2)
        )
      ).toBe(true)

      for (const bonus of mapBonuses) {
        expect(getDistance(bonus.position, level.playerSpawn)).toBeGreaterThanOrEqual(6)

        for (const qgisPellet of qgisPellets) {
          expect(getDistance(bonus.position, qgisPellet.position)).toBeGreaterThanOrEqual(6)
        }
      }
    }
  })

  it('keeps raw campaign maps rectangular', () => {
    for (const rawLevel of rawLevels) {
      const width = rawLevel.map[0].length

      expect(rawLevel.map.every((row) => row.length === width)).toBe(true)
    }
  })

  it('keeps campaign collectibles reachable from the player spawn', () => {
    for (const level of levels) {
      const reachablePositions = getReachablePositions(level)

      expect(
        level.collectibles.every((collectible) =>
          reachablePositions.has(getPositionKey(collectible.position))
        )
      ).toBe(true)
    }
  })

  it('keeps campaign walkable areas connected to the player spawn', () => {
    for (const level of levels) {
      const reachablePositions = getReachablePositions(level)
      const walkableTiles = level.tiles.flat().filter((tile) => tile.walkable)

      expect(
        walkableTiles.every((tile) => reachablePositions.has(getPositionKey(tile.position)))
      ).toBe(true)
    }
  })

  it('keeps updated campaign mazes free of 3x3 open plazas', () => {
    for (const level of levels.slice(1)) {
      expect(hasOpenWalkableBlock(level, 3)).toBe(false)
    }
  })

  it('rejects maps with inconsistent row widths', () => {
    expect(() =>
      parseLevel({
        ...createBaseLevel(),
        map: ['###', '#P#', '#G##']
      })
    ).toThrow('row 2 has inconsistent width')
  })

  it('requires exactly one player spawn', () => {
    expect(() =>
      parseLevel({
        ...createBaseLevel(),
        map: ['#####', '#P.P#', '#.G.#', '#####']
      })
    ).toThrow('must contain exactly one player spawn')
  })

  it('requires at least one ghost spawn', () => {
    expect(() =>
      parseLevel({
        ...createBaseLevel(),
        map: ['#####', '#P..#', '#####']
      })
    ).toThrow('must contain at least one ghost spawn')
  })

  it('rejects unsupported map symbols', () => {
    expect(() =>
      parseLevel({
        ...createBaseLevel(),
        map: ['#####', '#P?G#', '#####']
      })
    ).toThrow('Unsupported level symbol "?" at row 1, col 2')
  })
})

function createBaseLevel(): RawLevelDefinition {
  return {
    id: 'test-level',
    name: 'Test Level',
    difficulty: 'easy',
    map: ['###', '#P#', '#G#']
  }
}

function countSymbols(level: RawLevelDefinition, symbol: string): number {
  return level.map
    .join('')
    .split('')
    .filter((mapSymbol) => mapSymbol === symbol).length
}

function getDistance(
  first: { readonly row: number; readonly col: number },
  second: { readonly row: number; readonly col: number }
): number {
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col)
}

function getReachablePositions(level: ParsedLevel): Set<string> {
  const queue = [level.playerSpawn]
  const seen = new Set<string>([getPositionKey(level.playerSpawn)])

  for (let index = 0; index < queue.length; index += 1) {
    const position = queue[index]
    const neighbors = [
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 }
    ]

    for (const neighbor of neighbors) {
      const tile = level.tiles[neighbor.row]?.[neighbor.col]

      if (!tile?.walkable) {
        continue
      }

      const key = getPositionKey(neighbor)

      if (!seen.has(key)) {
        seen.add(key)
        queue.push(neighbor)
      }
    }
  }

  return seen
}

function getPositionKey(position: { readonly row: number; readonly col: number }): string {
  return `${position.row}:${position.col}`
}

function hasOpenWalkableBlock(level: ParsedLevel, blockSize: number): boolean {
  for (let row = 0; row <= level.height - blockSize; row += 1) {
    for (let col = 0; col <= level.width - blockSize; col += 1) {
      let allWalkable = true

      for (let rowOffset = 0; rowOffset < blockSize; rowOffset += 1) {
        for (let colOffset = 0; colOffset < blockSize; colOffset += 1) {
          if (!level.tiles[row + rowOffset][col + colOffset].walkable) {
            allWalkable = false
          }
        }
      }

      if (allWalkable) {
        return true
      }
    }
  }

  return false
}
