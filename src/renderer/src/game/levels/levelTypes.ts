import type { CollectibleState, GhostType, GridPosition, Tile } from '../engine/types'

export type LevelDifficulty = 'easy' | 'normal' | 'hard'

export type LevelMapSymbol = '#' | '.' | 'b' | 'o' | 'P' | 'G' | '_' | ' '

export interface RawLevelDefinition {
  readonly id: string
  readonly name: string
  readonly difficulty: LevelDifficulty
  readonly map: readonly string[]
  readonly ghostTypes?: readonly GhostType[]
}

export interface GhostSpawnDefinition {
  readonly id: string
  readonly position: GridPosition
  readonly type: GhostType
}

export interface ParsedLevel {
  readonly id: string
  readonly name: string
  readonly difficulty: LevelDifficulty
  readonly width: number
  readonly height: number
  readonly tiles: readonly (readonly Tile[])[]
  readonly playerSpawn: GridPosition
  readonly ghostSpawns: readonly GhostSpawnDefinition[]
  readonly collectibles: readonly CollectibleState[]
  readonly pelletCount: number
  readonly bonusPelletCount: number
  readonly powerPelletCount: number
  readonly totalCollectibleCount: number
  readonly totalAvailableScore: number
}
