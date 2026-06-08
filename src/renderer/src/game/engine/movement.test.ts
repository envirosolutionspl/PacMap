import { describe, expect, it } from 'vitest'

import { TILE_SIZE } from './constants'
import { getTileCenter, moveEntity } from './movement'
import type { BoardState, MovingDirection, PlayerState } from './types'
import { level01, parseLevel } from '../levels'
import type { ParsedLevel, RawLevelDefinition } from '../levels'

describe('moveEntity', () => {
  it('moves one tile through a walkable path', () => {
    const level = parseLevel(createMovementLevel())
    const player = createPlayer(level)

    const moved = moveEntity({
      entity: player,
      board: createBoard(level),
      deltaSeconds: 1,
      requestedDirection: 'right'
    })

    expect(moved.position).toEqual(getTileCenter({ row: 2, col: 3 }, TILE_SIZE))
    expect(moved.tile).toEqual({ row: 2, col: 3 })
    expect(moved.direction).toBe('right')
  })

  it('stops at a wall', () => {
    const level = parseLevel({
      ...createMovementLevel(),
      map: ['#####', '#___#', '#_P##', '#_G_#', '#####']
    })
    const player = createPlayer(level)

    const moved = moveEntity({
      entity: player,
      board: createBoard(level),
      deltaSeconds: 1,
      requestedDirection: 'right'
    })

    expect(moved.position).toEqual(getTileCenter(level.playerSpawn, TILE_SIZE))
    expect(moved.tile).toEqual(level.playerSpawn)
    expect(moved.direction).toBe('none')
  })

  it('keeps moving in the current direction without a new requested direction', () => {
    const level = parseLevel(createMovementLevel())
    const board = createBoard(level)
    const player = createPlayer(level)

    const halfway = moveEntity({
      entity: player,
      board,
      deltaSeconds: 0.5,
      requestedDirection: 'right'
    })
    const moved = moveEntity({
      entity: halfway,
      board,
      deltaSeconds: 0.5,
      requestedDirection: 'none'
    })

    expect(moved.position).toEqual(getTileCenter({ row: 2, col: 3 }, TILE_SIZE))
    expect(moved.direction).toBe('right')
  })

  it('keeps a buffered turn until the entity reaches a tile center', () => {
    const level = parseLevel(createMovementLevel())
    const board = createBoard(level)
    const player = createPlayer(level)
    const halfTileRight = {
      ...player,
      position: {
        x: player.position.x + TILE_SIZE / 2,
        y: player.position.y
      },
      direction: 'right' as const
    }

    const moved = moveEntity({
      entity: halfTileRight,
      board,
      deltaSeconds: 1,
      requestedDirection: 'up'
    })

    expect(moved.position).toEqual({
      x: getTileCenter({ row: 2, col: 3 }, TILE_SIZE).x,
      y: getTileCenter({ row: 2, col: 3 }, TILE_SIZE).y - TILE_SIZE / 2
    })
    expect(moved.direction).toBe('up')
  })

  it.each<MovingDirection>(['up', 'right', 'left'])(
    'lets the player leave the level-01 spawn toward open direction %s',
    (direction) => {
      const level = parseLevel(level01)
      const player = createPlayer(level)

      const moved = moveEntity({
        entity: player,
        board: createBoard(level),
        deltaSeconds: 1 / 60,
        requestedDirection: direction
      })

      expect(moved.position).not.toEqual(player.position)
      expect(moved.direction).toBe(direction)
    }
  )
})

function createMovementLevel(): RawLevelDefinition {
  return {
    id: 'movement-test',
    name: 'Movement Test',
    difficulty: 'easy',
    map: ['#####', '#___#', '#_P_#', '#_G_#', '#####']
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

function createPlayer(level: ParsedLevel): PlayerState {
  return {
    id: 'player-test',
    kind: 'player',
    spawn: level.playerSpawn,
    position: getTileCenter(level.playerSpawn, TILE_SIZE),
    tile: level.playerSpawn,
    direction: 'none',
    nextDirection: 'none',
    speed: 1,
    lives: 3,
    status: 'ready'
  }
}
