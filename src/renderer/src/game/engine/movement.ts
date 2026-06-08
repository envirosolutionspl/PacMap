import { DIRECTION_VECTORS } from './constants'
import type {
  BoardState,
  Direction,
  Entity,
  GridPosition,
  MovingDirection,
  Position
} from './types'

const CENTER_EPSILON = 0.001

interface MoveEntityOptions<T extends Entity> {
  readonly entity: T
  readonly board: BoardState
  readonly deltaSeconds: number
  readonly requestedDirection?: Direction
}

export function moveEntity<T extends Entity>({
  entity,
  board,
  deltaSeconds,
  requestedDirection = entity.nextDirection
}: MoveEntityOptions<T>): T {
  const maxDistance = Math.max(0, deltaSeconds) * entity.speed * board.tileSize
  let remainingDistance = maxDistance
  let position = entity.position
  let tile = getTileFromPosition(position, board.tileSize)
  let direction = entity.direction
  const nextDirection = requestedDirection

  while (remainingDistance > CENTER_EPSILON) {
    tile = getTileFromPosition(position, board.tileSize)
    const atTileCenter = isAtTileCenter(position, tile, board.tileSize)

    if (atTileCenter) {
      position = getTileCenter(tile, board.tileSize)

      if (
        isMovingDirection(requestedDirection) &&
        canMoveFromTile(board, tile, requestedDirection)
      ) {
        direction = requestedDirection
      } else if (!isMovingDirection(direction) || !canMoveFromTile(board, tile, direction)) {
        direction = 'none'
        break
      }
    }

    if (!isMovingDirection(direction)) {
      break
    }

    const targetTile = atTileCenter
      ? getNeighborTile(tile, direction)
      : getMovementTargetTile(position, direction, board.tileSize)

    if (!isWalkableTile(board, targetTile)) {
      direction = 'none'
      position = getTileCenter(tile, board.tileSize)
      break
    }

    const targetCenter = getTileCenter(targetTile, board.tileSize)
    const distanceToTarget = getDistanceAlongDirection(position, targetCenter, direction)
    const stepDistance = Math.min(remainingDistance, distanceToTarget)
    const vector = DIRECTION_VECTORS[direction]

    position = {
      x: position.x + vector.x * stepDistance,
      y: position.y + vector.y * stepDistance
    }
    remainingDistance -= stepDistance

    if (Math.abs(stepDistance - distanceToTarget) <= CENTER_EPSILON) {
      position = targetCenter
    }
  }

  const finalTile = getTileFromPosition(position, board.tileSize)

  return {
    ...entity,
    position,
    tile: finalTile,
    direction,
    nextDirection
  }
}

export function getTileCenter(tile: GridPosition, tileSize: number): Position {
  return {
    x: tile.col * tileSize + tileSize / 2,
    y: tile.row * tileSize + tileSize / 2
  }
}

export function getTileFromPosition(position: Position, tileSize: number): GridPosition {
  return {
    row: Math.round((position.y - tileSize / 2) / tileSize),
    col: Math.round((position.x - tileSize / 2) / tileSize)
  }
}

export function getNeighborTile(tile: GridPosition, direction: MovingDirection): GridPosition {
  const vector = DIRECTION_VECTORS[direction]

  return {
    row: tile.row + vector.y,
    col: tile.col + vector.x
  }
}

export function canMoveFromTile(
  board: BoardState,
  tile: GridPosition,
  direction: MovingDirection
): boolean {
  return isWalkableTile(board, getNeighborTile(tile, direction))
}

export function isWalkableTile(board: BoardState, tile: GridPosition): boolean {
  if (tile.row < 0 || tile.row >= board.height || tile.col < 0 || tile.col >= board.width) {
    return false
  }

  return board.tiles[tile.row][tile.col].walkable
}

function isAtTileCenter(position: Position, tile: GridPosition, tileSize: number): boolean {
  const center = getTileCenter(tile, tileSize)

  return (
    Math.abs(position.x - center.x) <= CENTER_EPSILON &&
    Math.abs(position.y - center.y) <= CENTER_EPSILON
  )
}

function getMovementTargetTile(
  position: Position,
  direction: MovingDirection,
  tileSize: number
): GridPosition {
  const floatingRow = (position.y - tileSize / 2) / tileSize
  const floatingCol = (position.x - tileSize / 2) / tileSize

  switch (direction) {
    case 'up':
      return { row: Math.floor(floatingRow), col: Math.round(floatingCol) }
    case 'right':
      return { row: Math.round(floatingRow), col: Math.ceil(floatingCol) }
    case 'down':
      return { row: Math.ceil(floatingRow), col: Math.round(floatingCol) }
    case 'left':
      return { row: Math.round(floatingRow), col: Math.floor(floatingCol) }
  }
}

function getDistanceAlongDirection(
  position: Position,
  targetCenter: Position,
  direction: MovingDirection
): number {
  if (direction === 'left' || direction === 'right') {
    return Math.abs(targetCenter.x - position.x)
  }

  return Math.abs(targetCenter.y - position.y)
}

function isMovingDirection(direction: Direction): direction is MovingDirection {
  return direction !== 'none'
}
