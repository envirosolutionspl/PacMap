import { getGhostSkin } from '../assets/svg/skinRegistry'
import type { Direction, GhostSkinId, GhostState } from '../engine/types'
import { AnimatedSvgSprite } from '../render/AnimatedSvgSprite'

interface GhostProps {
  readonly ghost: GhostState
  readonly tileSize: number
  readonly index: number
  readonly skinId: GhostSkinId
}

export function Ghost({ ghost, tileSize, index, skinId }: GhostProps): React.JSX.Element {
  const skin = getGhostSkin(skinId)
  const baseRadius = 12
  const scale = (tileSize * 0.39) / baseRadius
  const motionClass =
    ghost.direction === 'none' || ghost.mode === 'eaten' || ghost.mode === 'respawning'
      ? 'ghost-sprite-idle'
      : 'ghost-sprite-moving'
  const className = `money-bag-sprite money-bag-sprite-${index % 4} ghost-sprite-${index % 4} ghost-sprite-${ghost.mode} ghost-type-${ghost.type} ${motionClass}`
  const leftEyeX = -3.2
  const rightEyeX = 3.2
  const eyeY = 0.7
  const pupilOffset = getPupilOffset(ghost.direction)

  return (
    <AnimatedSvgSprite
      asset={skin}
      position={ghost.position}
      direction={ghost.direction}
      animationState={ghost.mode}
      className={className}
    >
      <g className="money-bag" transform={`scale(${scale})`}>
        <path
          className="money-bag-neck"
          d="M -5.9 -11 C -4.2 -9.5 -2.4 -10.9 -0.8 -9.9 C 0.8 -8.9 2.7 -10.7 4.7 -9.5 C 6.3 -8.6 5.6 -5.9 3.9 -5.1 L -4.3 -5.1 C -6.4 -6.2 -7.7 -9.1 -5.9 -11 Z"
        />
        <path
          className="money-bag-band"
          d="M -6.6 -5.6 H 6.7 C 7.6 -5.6 8.2 -5 8.2 -4.2 C 8.2 -3.4 7.6 -2.8 6.7 -2.8 H -6.6 C -7.5 -2.8 -8.1 -3.4 -8.1 -4.2 C -8.1 -5 -7.5 -5.6 -6.6 -5.6 Z"
        />
        <path
          className="money-bag-body"
          d="M -4.8 -3.1 C -6.9 -1 -8.9 2.6 -9.9 5.9 C -11.2 10.3 -7.5 12 -0.3 12 C 7.2 12 11.1 10.1 9.8 5.6 C 8.8 2.3 6.9 -1 4.8 -3.1 Z"
        />
        <path
          className="money-bag-highlight"
          d="M -5.4 -1.9 C -7.1 0.4 -8.6 3.4 -8.9 6.3 C -9.2 9.1 -7.2 10.3 -4.1 10.7 C -6.1 8.3 -5.8 4.4 -4.1 0.7 C -3.6 -0.3 -3.2 -1.2 -2.7 -1.9 Z"
        />
        <path className="money-bag-string" d="M 6.6 -4 C 9.6 -4.1 10.5 -2.3 12 -2.1" />
        <path className="money-bag-string" d="M 6.6 -3.5 C 9.4 -2.2 9.6 -0.6 11.6 0.1" />
        <circle className="money-bag-knot" cx="12.2" cy="-2" r="0.9" />
        <circle className="money-bag-eye" cx={leftEyeX} cy={eyeY} r="2.1" />
        <circle className="money-bag-eye" cx={rightEyeX} cy={eyeY} r="2.1" />
        <circle
          className="money-bag-pupil"
          cx={leftEyeX + pupilOffset.x}
          cy={eyeY + pupilOffset.y}
          r="0.82"
        />
        <circle
          className="money-bag-pupil"
          cx={rightEyeX + pupilOffset.x}
          cy={eyeY + pupilOffset.y}
          r="0.82"
        />
      </g>
    </AnimatedSvgSprite>
  )
}

function getPupilOffset(direction: Direction): { readonly x: number; readonly y: number } {
  const amount = 0.9

  switch (direction) {
    case 'up':
      return { x: 0, y: -amount }
    case 'right':
      return { x: amount, y: 0 }
    case 'down':
      return { x: 0, y: amount }
    case 'left':
      return { x: -amount, y: 0 }
    case 'none':
      return { x: 0, y: 0 }
  }
}
