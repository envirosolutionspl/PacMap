import { describe, expect, it } from 'vitest'

import { GHOST_SPEED_TILES_PER_SECOND, TILE_SIZE } from './constants'
import { chooseGhostDirection, getAvailableDirections, moveGhost } from './ghostAi'
import { getTileCenter } from './movement'
import type {
  BoardState,
  Direction,
  GhostState,
  GhostType,
  GridPosition,
  PlayerState
} from './types'
import { parseLevel } from '../levels'
import type { ParsedLevel, RawLevelDefinition } from '../levels'

describe('ghostAi', () => {
  it('continues current direction in a corridor', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#PG_#', '#####']
    })
    const ghost = createGhost(level, { row: 1, col: 2 }, 'right')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0)

    expect(direction).toBe('right')
  })

  it('does not reverse at an intersection when another direction is available', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#P__#', '#_G_#', '#___#', '#####']
    })
    const ghost = createGhost(level, { row: 2, col: 2 }, 'right')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0.99)

    expect(direction).not.toBe('left')
    expect(['up', 'right', 'down']).toContain(direction)
  })

  it('moves a ghost using selected direction', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#PG_#', '#####']
    })
    const ghost = createGhost(level, { row: 1, col: 2 }, 'none')

    const moved = moveGhost({
      ghost,
      board: createBoard(level),
      deltaSeconds: 1 / GHOST_SPEED_TILES_PER_SECOND,
      random: () => 0
    })

    expect(moved.tile).toEqual({ row: 1, col: 3 })
    expect(moved.direction).toBe('right')
  })

  it('moves chaser ghosts toward the player', () => {
    const level = parseLevel(createOpenLevel())
    const ghost = createGhost(level, { row: 2, col: 2 }, 'none', 'chaserGhost')
    const player = createPlayer(level, { row: 2, col: 3 }, 'none')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0, player)

    expect(direction).toBe('right')
  })

  it('moves ambusher ghosts toward the tile ahead of the player', () => {
    const level = parseLevel(createOpenLevel())
    const ghost = createGhost(level, { row: 2, col: 2 }, 'none', 'ambusherGhost')
    const player = createPlayer(level, { row: 3, col: 2 }, 'up')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0, player)

    expect(direction).toBe('up')
  })

  it('moves wanderer ghosts toward more open paths', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#######', '#P____#', '#######', '#_G___#', '#######']
    })
    const ghost = createGhost(level, { row: 3, col: 2 }, 'none', 'wandererGhost')
    const player = createPlayer(level, { row: 1, col: 1 }, 'none')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0, player)

    expect(direction).toBe('right')
  })

  it('keeps wanderer ghosts moving forward on similarly open intersections', () => {
    const level = parseLevel(createOpenLevel())
    const ghost = createGhost(level, { row: 2, col: 2 }, 'right', 'wandererGhost')
    const player = createPlayer(level, { row: 1, col: 1 }, 'none')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0, player)

    expect(direction).toBe('right')
  })

  it('keeps frightened tactical ghosts on random movement', () => {
    const level = parseLevel(createOpenLevel())
    const ghost = {
      ...createGhost(level, { row: 2, col: 2 }, 'none', 'chaserGhost'),
      mode: 'frightened' as const
    }
    const player = createPlayer(level, { row: 2, col: 3 }, 'none')

    const direction = chooseGhostDirection(ghost, createBoard(level), () => 0, player)

    expect(direction).toBe('up')
  })

  it('keeps eaten ghosts inactive', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#PG_#', '#####']
    })
    const ghost = {
      ...createGhost(level, { row: 1, col: 2 }, 'none'),
      mode: 'eaten' as const
    }

    const moved = moveGhost({
      ghost,
      board: createBoard(level),
      deltaSeconds: 1,
      random: () => 0
    })

    expect(moved).toEqual(ghost)
  })

  it('returns available walkable directions', () => {
    const level = parseLevel({
      ...createBaseLevel(),
      map: ['#####', '#P__#', '#_G_#', '#___#', '#####']
    })
    const ghost = createGhost(level, { row: 2, col: 2 }, 'none')

    expect(getAvailableDirections(ghost, createBoard(level))).toEqual([
      'up',
      'right',
      'down',
      'left'
    ])
  })
})

function createBaseLevel(): RawLevelDefinition {
  return {
    id: 'ghost-test',
    name: 'Ghost Test',
    difficulty: 'easy',
    map: ['#####', '#PG_#', '#####']
  }
}

function createOpenLevel(): RawLevelDefinition {
  return {
    id: 'ghost-open-test',
    name: 'Ghost Open Test',
    difficulty: 'easy',
    map: ['#####', '#P__#', '#_G_#', '#___#', '#####']
  }
}

function createBoard(level: ParsedLevel): BoardState {
  return {
    width: level.width,
    height: level.height,
    tileSize: TILE_SIZE,
    tiles: level.tiles
  }
}

function createGhost(
  level: ParsedLevel,
  tile: { readonly row: number; readonly col: number },
  direction: GhostState['direction'],
  type: GhostType = 'randomGhost'
): GhostState {
  return {
    id: 'ghost-test',
    kind: 'ghost',
    type,
    mode: 'normal',
    spawn: level.ghostSpawns[0].position,
    position: getTileCenter(tile, TILE_SIZE),
    tile,
    direction,
    nextDirection: direction,
    speed: GHOST_SPEED_TILES_PER_SECOND,
    baseSpeed: GHOST_SPEED_TILES_PER_SECOND
  }
}

function createPlayer(level: ParsedLevel, tile: GridPosition, direction: Direction): PlayerState {
  return {
    id: 'player-test',
    kind: 'player',
    spawn: level.playerSpawn,
    position: getTileCenter(tile, TILE_SIZE),
    tile,
    direction,
    nextDirection: direction,
    speed: 6,
    lives: 3,
    status: direction === 'none' ? 'ready' : 'moving'
  }
}
