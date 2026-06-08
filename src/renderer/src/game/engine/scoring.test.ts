import { describe, expect, it } from 'vitest'

import { COLLECTIBLE_SCORE } from './constants'
import { collectPlayerTile, collectTile } from './scoring'
import type { CollectibleKind, CollectibleState } from './types'
import { createInitialGameState } from './createInitialGameState'
import { getTileCenter } from './movement'
import { level01, parseLevel } from '../levels'

describe('collectTile', () => {
  it('scores bonus map objects as three regular pellets', () => {
    expect(COLLECTIBLE_SCORE.bonusPellet).toBe(COLLECTIBLE_SCORE.pellet * 3)
  })

  it.each<CollectibleKind>(['pellet', 'bonusPellet', 'powerPellet'])(
    'collects %s and adds score',
    (kind) => {
      const collectible = createCollectible(kind)

      const result = collectTile([collectible], collectible.position, 0)

      expect(result.collected?.kind).toBe(kind)
      expect(result.score).toBe(COLLECTIBLE_SCORE[kind])
      expect(result.collectibles[0].collected).toBe(true)
      expect(result.allCollected).toBe(true)
    }
  )

  it('does not score an already collected tile twice', () => {
    const collectible = {
      ...createCollectible('pellet'),
      collected: true
    }

    const result = collectTile([collectible], collectible.position, 100)

    expect(result.collected).toBeNull()
    expect(result.score).toBe(100)
    expect(result.collectibles).toEqual([collectible])
  })
})

describe('collectPlayerTile', () => {
  it('updates game score and collectibles on player tile', () => {
    const level = parseLevel(level01)
    const target = level.collectibles.find((collectible) => collectible.kind === 'bonusPellet')

    expect(target).toBeDefined()

    const state = createInitialGameState(level)
    const result = collectPlayerTile({
      ...state,
      player: {
        ...state.player,
        position: getTileCenter(target!.position, state.board.tileSize),
        tile: target!.position
      }
    })

    expect(result.score).toBe(COLLECTIBLE_SCORE.bonusPellet)
    expect(
      result.collectibles.find((collectible) => collectible.id === target!.id)?.collected
    ).toBe(true)
  })

  it('completes the level after the last collectible is collected', () => {
    const state = createInitialGameState(parseLevel(level01))
    const collectible = createCollectible('pellet')
    const result = collectPlayerTile({
      ...state,
      collectibles: [collectible],
      player: {
        ...state.player,
        position: getTileCenter(collectible.position, state.board.tileSize),
        tile: collectible.position
      }
    })

    expect(result.phase).toBe('levelComplete')
    expect(result.collectibles[0].collected).toBe(true)
  })
})

function createCollectible(kind: CollectibleKind): CollectibleState {
  return {
    id: `${kind}-1-1`,
    kind,
    position: { row: 1, col: 1 },
    score: COLLECTIBLE_SCORE[kind],
    collected: false
  }
}
