import type { CSSProperties } from 'react'

import pacIntroUrl from '../../assets/PAC.png'
import { Ghost } from '../entities/Ghost'
import type { GhostState } from '../engine/types'

const INTRO_GHOST_TILE_SIZE = 58

const INTRO_GHOSTS = [
  createIntroGhost('intro-top-ghost-1', 'chaserGhost', 'right'),
  createIntroGhost('intro-top-ghost-2', 'wandererGhost', 'right'),
  createIntroGhost('intro-top-ghost-3', 'ambusherGhost', 'right'),
  createIntroGhost('intro-bottom-ghost-1', 'randomGhost', 'left'),
  createIntroGhost('intro-bottom-ghost-2', 'wandererGhost', 'left'),
  createIntroGhost('intro-bottom-ghost-3', 'chaserGhost', 'left')
] as const

interface IntroOverlayProps {
  readonly onDismiss: () => void
  readonly style?: CSSProperties
}

export function IntroOverlay({ onDismiss, style }: IntroOverlayProps): React.JSX.Element {
  return (
    <button
      className="intro-overlay"
      type="button"
      aria-label="Continue to main menu"
      style={style}
      onClick={onDismiss}
    >
      <div className="intro-ghost-track intro-ghost-track-top" aria-hidden="true">
        {INTRO_GHOSTS.slice(0, 3).map((ghost, index) => (
          <span className="intro-ghost" key={ghost.id}>
            <Ghost
              ghost={ghost}
              tileSize={INTRO_GHOST_TILE_SIZE}
              index={index}
              skinId="ghost-default"
            />
          </span>
        ))}
      </div>
      <div className="intro-card">
        <img className="intro-logo" src={pacIntroUrl} alt="" draggable={false} />
      </div>
      <div className="intro-ghost-track intro-ghost-track-bottom" aria-hidden="true">
        {INTRO_GHOSTS.slice(3).map((ghost, index) => (
          <span className="intro-ghost" key={ghost.id}>
            <Ghost
              ghost={ghost}
              tileSize={INTRO_GHOST_TILE_SIZE}
              index={index + 3}
              skinId="ghost-default"
            />
          </span>
        ))}
      </div>
    </button>
  )
}

function createIntroGhost(
  id: string,
  type: GhostState['type'],
  direction: GhostState['direction']
): GhostState {
  return {
    id,
    kind: 'ghost',
    type,
    mode: 'normal',
    spawn: { row: 0, col: 0 },
    position: { x: 0, y: 0 },
    tile: { row: 0, col: 0 },
    direction,
    nextDirection: direction,
    speed: 0,
    baseSpeed: 0
  }
}
