import {
  DEFAULT_SKIN_SETTINGS,
  INITIAL_SCORE,
  MAX_LIVES,
  PLAYER_SPEED_TILES_PER_SECOND,
  TILE_SIZE
} from './constants'
import { getLevelGhostSpeed } from './levelProgression'
import { getTileCenter } from './movement'
import type { BoardState, GameState, PlayerState } from './types'
import type { ParsedLevel } from '../levels'

export function createInitialGameState(level: ParsedLevel, levelIndex = 0): GameState {
  const board: BoardState = {
    width: level.width,
    height: level.height,
    tileSize: TILE_SIZE,
    tiles: level.tiles
  }

  return {
    phase: 'ready',
    levelId: level.id,
    levelIndex,
    skins: DEFAULT_SKIN_SETTINGS,
    score: INITIAL_SCORE,
    lives: MAX_LIVES,
    board,
    player: createInitialPlayer(level),
    ghosts: level.ghostSpawns.map((spawn, spawnIndex) => {
      const speed = getLevelGhostSpeed(level, spawnIndex)

      return {
        id: spawn.id.replace('spawn', 'ghost'),
        kind: 'ghost',
        type: spawn.type,
        mode: 'normal',
        spawn: spawn.position,
        position: getTileCenter(spawn.position, TILE_SIZE),
        tile: spawn.position,
        direction: 'none',
        nextDirection: 'none',
        speed,
        baseSpeed: speed
      }
    }),
    collectibles: level.collectibles
  }
}

function createInitialPlayer(level: ParsedLevel): PlayerState {
  return {
    id: 'player-1',
    kind: 'player',
    spawn: level.playerSpawn,
    position: getTileCenter(level.playerSpawn, TILE_SIZE),
    tile: level.playerSpawn,
    direction: 'none',
    nextDirection: 'none',
    speed: PLAYER_SPEED_TILES_PER_SECOND,
    lives: MAX_LIVES,
    status: 'ready'
  }
}
