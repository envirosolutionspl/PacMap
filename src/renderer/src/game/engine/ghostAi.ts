import { moveEntity } from './movement'
import type {
  BoardState,
  Direction,
  GhostState,
  GridPosition,
  MovingDirection,
  PlayerState
} from './types'

const MOVING_DIRECTIONS: readonly MovingDirection[] = ['up', 'right', 'down', 'left']
const WANDER_CONTINUE_BONUS = 1.5

const OPPOSITE_DIRECTION: Record<MovingDirection, MovingDirection> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right'
}

interface MoveGhostOptions {
  readonly ghost: GhostState
  readonly board: BoardState
  readonly deltaSeconds: number
  readonly player?: PlayerState
  readonly random?: () => number
}

export function moveGhost({
  ghost,
  board,
  deltaSeconds,
  player,
  random = Math.random
}: MoveGhostOptions): GhostState {
  if (ghost.mode === 'eaten' || ghost.mode === 'respawning') {
    return ghost
  }

  const direction = chooseGhostDirection(ghost, board, random, player)

  return moveEntity({
    entity: {
      ...ghost,
      nextDirection: direction
    },
    board,
    deltaSeconds,
    requestedDirection: direction
  })
}

export function chooseGhostDirection(
  ghost: GhostState,
  board: BoardState,
  random: () => number = Math.random,
  player?: PlayerState
): Direction {
  const availableDirections = getAvailableDirections(ghost, board)

  if (availableDirections.length === 0) {
    return 'none'
  }

  const currentDirection = ghost.direction

  if (currentDirection !== 'none') {
    const canContinue = availableDirections.includes(currentDirection)
    const isIntersection = availableDirections.length > 2

    if (canContinue && !isIntersection) {
      return currentDirection
    }
  }

  const candidates =
    currentDirection === 'none'
      ? availableDirections
      : availableDirections.filter(
          (direction) => direction !== OPPOSITE_DIRECTION[currentDirection]
        )

  const movementCandidates = candidates.length > 0 ? candidates : availableDirections

  if (!player || ghost.mode === 'frightened') {
    return pickRandomDirection(movementCandidates, random)
  }

  switch (ghost.type) {
    case 'chaserGhost':
      return pickDirectionTowardTarget(movementCandidates, ghost.tile, player.tile, random)
    case 'ambusherGhost':
      return pickDirectionTowardTarget(
        movementCandidates,
        ghost.tile,
        getAmbushTarget(player, board),
        random
      )
    case 'wandererGhost':
      return pickWanderDirection(movementCandidates, ghost.tile, board, random, ghost.direction)
    case 'randomGhost':
      return pickRandomDirection(movementCandidates, random)
  }
}

export function getAvailableDirections(
  ghost: Pick<GhostState, 'tile'>,
  board: BoardState
): readonly MovingDirection[] {
  return MOVING_DIRECTIONS.filter((direction) => {
    const vector = directionToVector(direction)
    const row = ghost.tile.row + vector.row
    const col = ghost.tile.col + vector.col

    return (
      row >= 0 &&
      row < board.height &&
      col >= 0 &&
      col < board.width &&
      board.tiles[row][col].walkable
    )
  })
}

function pickRandomDirection(
  directions: readonly MovingDirection[],
  random: () => number
): MovingDirection {
  const index = Math.min(Math.floor(random() * directions.length), directions.length - 1)

  return directions[index]
}

function pickDirectionTowardTarget(
  directions: readonly MovingDirection[],
  tile: GridPosition,
  target: GridPosition,
  random: () => number
): MovingDirection {
  const scoredDirections = directions.map((direction) => ({
    direction,
    score: getDistance(getTileAfterMove(tile, direction), target)
  }))
  const bestScore = Math.min(...scoredDirections.map(({ score }) => score))
  const bestDirections = scoredDirections
    .filter(({ score }) => score === bestScore)
    .map(({ direction }) => direction)

  return pickRandomDirection(bestDirections, random)
}

function pickWanderDirection(
  directions: readonly MovingDirection[],
  tile: GridPosition,
  board: BoardState,
  random: () => number,
  currentDirection: Direction
): MovingDirection {
  const scoredDirections = directions.map((direction) => ({
    direction,
    score:
      getWanderScore(getTileAfterMove(tile, direction), board) +
      (direction === currentDirection ? WANDER_CONTINUE_BONUS : 0)
  }))
  const bestScore = Math.max(...scoredDirections.map(({ score }) => score))
  const bestDirections = scoredDirections
    .filter(({ score }) => score === bestScore)
    .map(({ direction }) => direction)

  return pickRandomDirection(bestDirections, random)
}

function getWanderScore(tile: GridPosition, board: BoardState): number {
  const firstStepOptions = getAvailableDirections({ tile }, board)

  return firstStepOptions.reduce((score, direction) => {
    const nextTile = getTileAfterMove(tile, direction)

    return score + 1 + getAvailableDirections({ tile: nextTile }, board).length
  }, 0)
}

function getAmbushTarget(player: PlayerState, board: BoardState): GridPosition {
  if (player.direction === 'none') {
    return player.tile
  }

  const vector = directionToVector(player.direction)

  return {
    row: clamp(player.tile.row + vector.row * 4, 0, board.height - 1),
    col: clamp(player.tile.col + vector.col * 4, 0, board.width - 1)
  }
}

function getTileAfterMove(tile: GridPosition, direction: MovingDirection): GridPosition {
  const vector = directionToVector(direction)

  return {
    row: tile.row + vector.row,
    col: tile.col + vector.col
  }
}

function getDistance(first: GridPosition, second: GridPosition): number {
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function directionToVector(direction: MovingDirection): {
  readonly row: number
  readonly col: number
} {
  switch (direction) {
    case 'up':
      return { row: -1, col: 0 }
    case 'right':
      return { row: 0, col: 1 }
    case 'down':
      return { row: 1, col: 0 }
    case 'left':
      return { row: 0, col: -1 }
  }
}
