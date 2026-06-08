import type { SoundEffectId } from './audioTypes'
import type { CollectibleKind, GameState } from '../engine/types'

export function getSoundEffectsForTransition(
  previousState: GameState,
  currentState: GameState
): readonly SoundEffectId[] {
  const effects: SoundEffectId[] = []
  const collected = currentState.collectibles.find((collectible) => {
    if (!collectible.collected) {
      return false
    }

    const previousCollectible = previousState.collectibles.find(
      (item) => item.id === collectible.id
    )

    return previousCollectible?.collected === false
  })

  if (collected) {
    effects.push(getCollectibleSoundEffect(collected.kind))
  }

  const hasEatenGhost = currentState.ghosts.some((ghost) => {
    const previousGhost = previousState.ghosts.find((item) => item.id === ghost.id)

    return ghost.mode === 'eaten' && previousGhost?.mode !== 'eaten'
  })

  if (hasEatenGhost) {
    effects.push('eatGhost')
  }

  if (currentState.lives < previousState.lives) {
    effects.push(currentState.phase === 'gameOver' ? 'gameOver' : 'lifeLost')
  }

  if (previousState.phase !== 'levelComplete' && currentState.phase === 'levelComplete') {
    effects.push('levelComplete')
  }

  if (
    previousState.phase !== 'gameOver' &&
    currentState.phase === 'gameOver' &&
    !effects.includes('gameOver')
  ) {
    effects.push('gameOver')
  }

  return effects
}

function getCollectibleSoundEffect(kind: CollectibleKind): SoundEffectId {
  switch (kind) {
    case 'bonusPellet':
      return 'bonusPellet'
    case 'powerPellet':
      return 'powerPellet'
    case 'pellet':
      return 'pellet'
  }
}
