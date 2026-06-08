import type { CollectibleState } from '../engine/types'

interface PelletProps {
  readonly collectible: CollectibleState
  readonly tileSize: number
}

export function Pellet({ collectible, tileSize }: PelletProps): React.JSX.Element {
  const cx = collectible.position.col * tileSize + tileSize / 2
  const cy = collectible.position.row * tileSize + tileSize / 2

  return <circle className="pellet-dot" cx={cx} cy={cy} r={tileSize * 0.11} />
}
