import type { CollectibleState, GameState, GridPosition } from './types'

export interface CollectTileResult {
  readonly collectibles: readonly CollectibleState[]
  readonly collected: CollectibleState | null
  readonly score: number
  readonly allCollected: boolean
}

export interface CollectPlayerTileResult {
  readonly state: GameState
  readonly collected: CollectibleState | null
}

export function collectTile(
  collectibles: readonly CollectibleState[],
  tile: GridPosition,
  currentScore: number
): CollectTileResult {
  const collectible = collectibles.find(
    (item) => !item.collected && item.position.row === tile.row && item.position.col === tile.col
  )

  if (!collectible) {
    return {
      collectibles,
      collected: null,
      score: currentScore,
      allCollected: collectibles.every((item) => item.collected)
    }
  }

  const updatedCollectibles = collectibles.map((item) =>
    item.id === collectible.id ? { ...item, collected: true } : item
  )

  return {
    collectibles: updatedCollectibles,
    collected: collectible,
    score: currentScore + collectible.score,
    allCollected: updatedCollectibles.every((item) => item.collected)
  }
}

export function collectPlayerTileWithResult(state: GameState): CollectPlayerTileResult {
  const result = collectTile(state.collectibles, state.player.tile, state.score)

  if (!result.collected) {
    return {
      state,
      collected: null
    }
  }

  return {
    state: {
      ...state,
      phase: result.allCollected ? 'levelComplete' : state.phase,
      score: result.score,
      collectibles: result.collectibles
    },
    collected: result.collected
  }
}

export function collectPlayerTile(state: GameState): GameState {
  return collectPlayerTileWithResult(state).state
}
