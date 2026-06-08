import type { GhostState, PlayerState } from './types'

export function getCollidingGhost(
  player: PlayerState,
  ghosts: readonly GhostState[]
): GhostState | null {
  return (
    ghosts.find((ghost) => ghost.mode === 'normal' && isSameTile(player.tile, ghost.tile)) ?? null
  )
}

export function getFrightenedCollidingGhost(
  player: PlayerState,
  ghosts: readonly GhostState[]
): GhostState | null {
  return (
    ghosts.find((ghost) => ghost.mode === 'frightened' && isSameTile(player.tile, ghost.tile)) ??
    null
  )
}

export function isPlayerCollidingWithGhost(
  player: PlayerState,
  ghosts: readonly GhostState[]
): boolean {
  return getCollidingGhost(player, ghosts) !== null
}

function isSameTile(
  first: { readonly row: number; readonly col: number },
  second: { readonly row: number; readonly col: number }
): boolean {
  return first.row === second.row && first.col === second.col
}
