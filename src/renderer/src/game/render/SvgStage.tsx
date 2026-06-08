import { TILE_SIZE } from '../engine/constants'
import type { ParsedLevel } from '../levels'

interface SvgStageProps {
  readonly level: ParsedLevel
  readonly children: React.ReactNode
}

export function SvgStage({ level, children }: SvgStageProps): React.JSX.Element {
  const boardWidth = level.width * TILE_SIZE
  const boardHeight = level.height * TILE_SIZE

  return (
    <svg
      className="svg-stage"
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      role="img"
      aria-label={`${level.name} board`}
    >
      {children}
    </svg>
  )
}
