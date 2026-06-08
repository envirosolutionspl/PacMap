import { COLLECTIBLE_SCORE } from '../engine/constants'
import type {
  CollectibleKind,
  CollectibleState,
  GhostType,
  GridPosition,
  Tile,
  TileKind
} from '../engine/types'
import type { GhostSpawnDefinition, ParsedLevel, RawLevelDefinition } from './levelTypes'

const DEFAULT_GHOST_TYPES: readonly GhostType[] = ['randomGhost']

interface ParsedSymbol {
  readonly kind: TileKind
  readonly walkable: boolean
  readonly collectibleKind?: CollectibleKind
}

export function parseLevel(definition: RawLevelDefinition): ParsedLevel {
  validateLevelHeader(definition)

  const height = definition.map.length
  const width = definition.map[0].length
  const tiles: Tile[][] = []
  const collectibles: CollectibleState[] = []
  const ghostSpawns: GhostSpawnDefinition[] = []
  let playerSpawn: GridPosition | undefined

  for (let row = 0; row < height; row += 1) {
    const rowTiles: Tile[] = []

    for (let col = 0; col < width; col += 1) {
      const symbol = definition.map[row][col]
      const position = { row, col }
      const parsedSymbol = parseLevelSymbol(symbol, position)
      const collectible = parsedSymbol.collectibleKind
        ? createCollectible(parsedSymbol.collectibleKind, position)
        : undefined

      if (symbol === 'P') {
        if (playerSpawn) {
          throw new Error(`Level "${definition.id}" must contain exactly one player spawn`)
        }

        playerSpawn = position
      }

      if (symbol === 'G') {
        ghostSpawns.push({
          id: `ghost-spawn-${ghostSpawns.length + 1}`,
          position,
          type: resolveGhostType(definition.ghostTypes, ghostSpawns.length)
        })
      }

      if (collectible) {
        collectibles.push(collectible)
      }

      rowTiles.push({
        id: createTileId(position),
        kind: parsedSymbol.kind,
        position,
        walkable: parsedSymbol.walkable,
        collectibleId: collectible?.id
      })
    }

    tiles.push(rowTiles)
  }

  if (!playerSpawn) {
    throw new Error(`Level "${definition.id}" must contain exactly one player spawn`)
  }

  if (ghostSpawns.length === 0) {
    throw new Error(`Level "${definition.id}" must contain at least one ghost spawn`)
  }

  const pelletCount = countCollectibles(collectibles, 'pellet')
  const bonusPelletCount = countCollectibles(collectibles, 'bonusPellet')
  const powerPelletCount = countCollectibles(collectibles, 'powerPellet')
  const totalAvailableScore = collectibles.reduce(
    (score, collectible) => score + collectible.score,
    0
  )

  return {
    id: definition.id,
    name: definition.name,
    difficulty: definition.difficulty,
    width,
    height,
    tiles,
    playerSpawn,
    ghostSpawns,
    collectibles,
    pelletCount,
    bonusPelletCount,
    powerPelletCount,
    totalCollectibleCount: collectibles.length,
    totalAvailableScore
  }
}

function validateLevelHeader(definition: RawLevelDefinition): void {
  if (!definition.id.trim()) {
    throw new Error('Level id is required')
  }

  if (!definition.name.trim()) {
    throw new Error(`Level "${definition.id}" name is required`)
  }

  if (definition.map.length === 0) {
    throw new Error(`Level "${definition.id}" must contain at least one map row`)
  }

  const width = definition.map[0].length

  if (width === 0) {
    throw new Error(`Level "${definition.id}" rows cannot be empty`)
  }

  for (let row = 0; row < definition.map.length; row += 1) {
    if (definition.map[row].length !== width) {
      throw new Error(`Level "${definition.id}" row ${row} has inconsistent width`)
    }
  }
}

function parseLevelSymbol(symbol: string, position: GridPosition): ParsedSymbol {
  switch (symbol) {
    case '#':
      return { kind: 'wall', walkable: false }
    case '.':
      return { kind: 'pellet', walkable: true, collectibleKind: 'pellet' }
    case 'b':
      return { kind: 'bonusPellet', walkable: true, collectibleKind: 'bonusPellet' }
    case 'o':
      return { kind: 'powerPellet', walkable: true, collectibleKind: 'powerPellet' }
    case 'P':
      return { kind: 'playerSpawn', walkable: true }
    case 'G':
      return { kind: 'ghostSpawn', walkable: true }
    case '_':
    case ' ':
      return { kind: 'empty', walkable: true }
    default:
      throw new Error(
        `Unsupported level symbol "${symbol}" at row ${position.row}, col ${position.col}`
      )
  }
}

function createCollectible(kind: CollectibleKind, position: GridPosition): CollectibleState {
  return {
    id: `${kind}-${position.row}-${position.col}`,
    kind,
    position,
    score: COLLECTIBLE_SCORE[kind],
    collected: false
  }
}

function createTileId(position: GridPosition): string {
  return `tile-${position.row}-${position.col}`
}

function resolveGhostType(
  ghostTypes: readonly GhostType[] | undefined,
  spawnIndex: number
): GhostType {
  const type =
    ghostTypes?.[spawnIndex] ?? DEFAULT_GHOST_TYPES[spawnIndex % DEFAULT_GHOST_TYPES.length]

  return type
}

function countCollectibles(
  collectibles: readonly CollectibleState[],
  kind: CollectibleKind
): number {
  return collectibles.filter((collectible) => collectible.kind === kind).length
}
