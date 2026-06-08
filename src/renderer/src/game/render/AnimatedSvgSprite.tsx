import type { ReactNode } from 'react'

import type { SvgSpriteAsset, SpriteAnimationState } from '../assets/svg/skinRegistry'
import type { Direction, Position } from '../engine/types'

interface AnimatedSvgSpriteProps {
  readonly asset: SvgSpriteAsset
  readonly position: Position
  readonly direction: Direction
  readonly animationState: SpriteAnimationState
  readonly rotation?: number
  readonly className?: string
  readonly children: ReactNode
}

export function AnimatedSvgSprite({
  asset,
  position,
  direction,
  animationState,
  rotation = 0,
  className,
  children
}: AnimatedSvgSpriteProps): React.JSX.Element {
  const transform = `translate(${position.x} ${position.y})${rotation === 0 ? '' : ` rotate(${rotation})`}`
  const classes = [
    'animated-svg-sprite',
    `${asset.kind}-sprite`,
    asset.className,
    `sprite-skin-${asset.id}`,
    `sprite-state-${animationState}`,
    `sprite-direction-${direction}`,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <g
      className={classes}
      transform={transform}
      data-sprite-id={asset.id}
      data-sprite-state={animationState}
    >
      {children}
    </g>
  )
}
