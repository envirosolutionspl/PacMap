export type Direction = 'up' | 'right' | 'down' | 'left' | 'none'

export type MovingDirection = Exclude<Direction, 'none'>

export interface Vector {
  readonly x: number
  readonly y: number
}

export interface GridPosition {
  readonly row: number
  readonly col: number
}

export interface Position {
  readonly x: number
  readonly y: number
}

export type TileKind =
  | 'wall'
  | 'empty'
  | 'pellet'
  | 'bonusPellet'
  | 'powerPellet'
  | 'playerSpawn'
  | 'ghostSpawn'

export type CollectibleKind = 'pellet' | 'bonusPellet' | 'powerPellet'

export interface CollectibleState {
  readonly id: string
  readonly kind: CollectibleKind
  readonly position: GridPosition
  readonly score: number
  readonly collected: boolean
}

export interface Tile {
  readonly id: string
  readonly kind: TileKind
  readonly position: GridPosition
  readonly walkable: boolean
  readonly collectibleId?: string
}

export type EntityKind = 'player' | 'ghost'

export interface Entity {
  readonly id: string
  readonly kind: EntityKind
  readonly position: Position
  readonly tile: GridPosition
  readonly direction: Direction
  readonly nextDirection: Direction
  readonly speed: number
}

export type PlayerStatus = 'ready' | 'moving' | 'dead'

export type PlayerSkinId = 'player-default'

export interface PlayerState extends Entity {
  readonly kind: 'player'
  readonly spawn: GridPosition
  readonly lives: number
  readonly status: PlayerStatus
}

export type GhostType = 'randomGhost' | 'chaserGhost' | 'ambusherGhost' | 'wandererGhost'

export type GhostMode = 'normal' | 'frightened' | 'eaten' | 'respawning'

export type GhostSkinId = 'ghost-default' | 'ghost-neon'

export interface SkinSettings {
  readonly player: PlayerSkinId
  readonly ghost: GhostSkinId
}

export interface GhostState extends Entity {
  readonly kind: 'ghost'
  readonly type: GhostType
  readonly mode: GhostMode
  readonly spawn: GridPosition
  readonly baseSpeed: number
  readonly respawnAt?: number
}

export type GamePhase =
  | 'idle'
  | 'ready'
  | 'playing'
  | 'powerMode'
  | 'lifeLost'
  | 'levelComplete'
  | 'gameOver'
  | 'paused'

export interface BoardState {
  readonly width: number
  readonly height: number
  readonly tileSize: number
  readonly tiles: readonly (readonly Tile[])[]
}

export interface GameState {
  readonly phase: GamePhase
  readonly levelId: string
  readonly levelIndex: number
  readonly skins: SkinSettings
  readonly score: number
  readonly lives: number
  readonly board: BoardState
  readonly player: PlayerState
  readonly ghosts: readonly GhostState[]
  readonly collectibles: readonly CollectibleState[]
  readonly readyUntil?: number
  readonly powerModeEndsAt?: number
}
