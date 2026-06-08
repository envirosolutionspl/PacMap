import { describe, expect, it } from 'vitest'

import { activatePowerMode, eatGhost } from '../engine/powerMode'
import { collectPlayerTileWithResult } from '../engine/scoring'
import { createInitialGameState } from '../engine/createInitialGameState'
import { loseLife } from '../engine/lives'
import { level01, parseLevel } from '../levels'
import { getSoundEffectsForTransition } from './soundTransitions'

describe('sound transitions', () => {
  it('detects collectible sounds by collected tile kind', () => {
    const level = parseLevel(level01)
    const powerPellet = level.collectibles.find((collectible) => collectible.kind === 'powerPellet')

    if (!powerPellet) {
      throw new Error('Expected level to contain a power pellet')
    }

    const previousState = {
      ...createInitialGameState(level),
      player: {
        ...createInitialGameState(level).player,
        tile: powerPellet.position
      }
    }
    const currentState = collectPlayerTileWithResult(previousState).state

    expect(getSoundEffectsForTransition(previousState, currentState)).toContain('powerPellet')
  })

  it('detects eaten ghosts, lost lives, level clear and game over', () => {
    const baseState = createInitialGameState(parseLevel(level01))
    const poweredState = activatePowerMode(baseState, 1000)
    const eatenGhostState = eatGhost(poweredState, poweredState.ghosts[0].id, 1200)
    const lifeLostState = loseLife(baseState, 1400)
    const gameOverState = loseLife({ ...baseState, lives: 1 }, 1600)
    const levelCompleteState = {
      ...baseState,
      phase: 'levelComplete' as const
    }

    expect(getSoundEffectsForTransition(poweredState, eatenGhostState)).toContain('eatGhost')
    expect(getSoundEffectsForTransition(baseState, lifeLostState)).toEqual(['lifeLost'])
    expect(getSoundEffectsForTransition(baseState, gameOverState)).toEqual(['gameOver'])
    expect(getSoundEffectsForTransition(baseState, levelCompleteState)).toEqual(['levelComplete'])
  })
})
