import { useEffect, useId, useState } from 'react'

import { getPlayerSkin } from '../assets/svg/skinRegistry'
import type { Direction, PlayerSkinId, PlayerState } from '../engine/types'
import { AnimatedSvgSprite } from '../render/AnimatedSvgSprite'

interface PlayerProps {
  readonly player: PlayerState
  readonly tileSize: number
  readonly skinId: PlayerSkinId
}

const ROTATION_BY_DIRECTION: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
  none: 0
}

export function Player({ player, tileSize, skinId }: PlayerProps): React.JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion()
  const skin = getPlayerSkin(skinId)
  const playerId = useId().replace(/:/g, '')
  const maskId = `player-mouth-${playerId}`
  const clipPathId = `player-clip-${playerId}`
  const radius = tileSize * 0.39
  const baseRadius = 12
  const scale = radius / baseRadius
  const closedMouth = 0
  const openMouth = baseRadius * 0.58
  const mouthCut = baseRadius * 1.35
  const mouthEdgeRadius = baseRadius - 1.25
  const rotation = ROTATION_BY_DIRECTION[player.direction]
  const mouthPath = (mouth: number): string =>
    `M 0 0 L ${mouthCut} ${-mouth} L ${mouthCut} ${mouth} Z`
  const mouthEdgePath = (mouth: number): string => {
    if (mouth <= 0) {
      return `M 0 0 L ${mouthEdgeRadius} 0 M 0 0 L ${mouthEdgeRadius} 0`
    }

    const slope = mouth / mouthCut
    const edgeX = mouthEdgeRadius / Math.sqrt(1 + slope * slope)
    const edgeY = slope * edgeX

    return `M 0 0 L ${edgeX} ${-edgeY} M 0 0 L ${edgeX} ${edgeY}`
  }
  const isMoving = player.status === 'moving'
  const shouldAnimateMouth = isMoving && !prefersReducedMotion
  const currentMouth = shouldAnimateMouth ? openMouth : closedMouth

  return (
    <AnimatedSvgSprite
      asset={skin}
      position={player.position}
      direction={player.direction}
      animationState={player.status}
      rotation={rotation}
      className={`player-sprite-${player.status}`}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-radius * 1.5}
          y={-radius * 1.5}
          width={radius * 3}
          height={radius * 3}
        >
          <rect
            x={-radius * 1.5}
            y={-radius * 1.5}
            width={radius * 3}
            height={radius * 3}
            fill="black"
          />
          <g transform={`scale(${scale})`}>
            <circle cx="0" cy="0" r={baseRadius} fill="white" />
            <path className="player-mouth-cut" d={mouthPath(currentMouth)} fill="black">
              {shouldAnimateMouth && (
                <animate
                  attributeName="d"
                  dur="0.5s"
                  repeatCount="indefinite"
                  values={`${mouthPath(openMouth)}; ${mouthPath(closedMouth)}; ${mouthPath(openMouth)}`}
                />
              )}
            </path>
          </g>
        </mask>
        <clipPath id={clipPathId}>
          <circle cx="0" cy="0" r={baseRadius} />
        </clipPath>
      </defs>
      <g className="player-globe" transform={`scale(${scale})`} mask={`url(#${maskId})`}>
        <circle className="player-ocean" cx="0" cy="0" r={baseRadius} />
        <path
          className="player-land player-land-americas"
          d="M -7.8 -10.4 C -10 -8.8 -10.8 -6.1 -9.4 -4.8 C -8.2 -3.8 -5.7 -4.1 -5.3 -2.4 C -4.8 -0.5 -7 0.4 -6.7 2.4 C -6.4 4.7 -3.6 5.4 -3.5 7.7 C -3.5 9.2 -4.8 10.3 -6.1 11 C -9.6 8.9 -11.9 5 -12 0.4 C -12.1 -4.5 -10.4 -8.1 -7.8 -10.4 Z"
        />
        <path
          className="player-land player-land-eurasia"
          d="M -1.4 -11.7 C 1.2 -12.3 4.1 -11.6 5.5 -9.8 C 6.8 -8.2 5.4 -6.5 6.8 -5.4 C 8.2 -4.2 10.2 -5.7 11.2 -4.3 C 11.9 -3.4 11.2 -1.6 9.7 -0.8 C 7.7 0.3 5.2 -1.1 3.8 0 C 2.6 1 3.4 3.2 1.9 4 C 0.1 5 -2.7 3.1 -3.3 1 C -4 -1.5 -0.7 -3.5 -1.7 -5.6 C -2.7 -7.6 -5.5 -6.7 -6.1 -8.5 C -6.5 -9.9 -4.3 -11 -1.4 -11.7 Z"
        />
        <path
          className="player-land player-land-africa"
          d="M 0.3 2.8 C 3 2.1 5.4 3.7 5.8 6.1 C 6.1 7.8 4.9 8.5 5 10 C 5.1 11.1 5.7 11.7 5.2 12 C 4.3 12.6 1.8 11.6 0.7 9.5 C -0.1 8 0.6 6.8 -0.6 5.8 C -1.7 4.9 -3.1 5.1 -3.5 4.1 C -4 2.9 -2.2 3.4 0.3 2.8 Z"
        />
        <circle className="player-eye" cx="2.4" cy="-5.1" r="1.8" />
        <circle className="player-globe-outline" cx="0" cy="0" r={baseRadius} />
      </g>
      <g transform={`scale(${scale})`} clipPath={`url(#${clipPathId})`}>
        <path className="player-mouth-edge" d={mouthEdgePath(currentMouth)}>
          {shouldAnimateMouth && (
            <animate
              attributeName="d"
              dur="0.5s"
              repeatCount="indefinite"
              values={`${mouthEdgePath(openMouth)}; ${mouthEdgePath(closedMouth)}; ${mouthEdgePath(openMouth)}`}
            />
          )}
        </path>
      </g>
    </AnimatedSvgSprite>
  )
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (): void => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => {
      mediaQuery.removeEventListener('change', updatePreference)
    }
  }, [])

  return prefersReducedMotion
}
