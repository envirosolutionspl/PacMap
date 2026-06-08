import type { CollectibleKind, Direction, SkinSettings, Vector } from './types'

export const TILE_SIZE = 32

export const MAX_LIVES = 3

export const INITIAL_SCORE = 0

export const DEFAULT_SKIN_SETTINGS: SkinSettings = {
  player: 'player-default',
  ghost: 'ghost-default'
}

export const READY_DURATION_MS = 1200

export const POWER_MODE_DURATION_MS = 8000

export const GHOST_RESPAWN_DURATION_MS = 10000

export const PLAYER_SPEED_TILES_PER_SECOND = 6

export const GHOST_SPEED_TILES_PER_SECOND = 5

export const FRIGHTENED_GHOST_SPEED_TILES_PER_SECOND = 3.8

export const COLLECTIBLE_SCORE: Record<CollectibleKind, number> = {
  pellet: 10,
  bonusPellet: 30,
  powerPellet: 100
}

export const GHOST_EATEN_SCORE = 200

export const DIRECTION_VECTORS: Record<Direction, Vector> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  none: { x: 0, y: 0 }
}
