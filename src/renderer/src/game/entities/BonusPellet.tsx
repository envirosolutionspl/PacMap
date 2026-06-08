import type { CollectibleState } from '../engine/types'

interface BonusPelletProps {
  readonly collectible: CollectibleState
  readonly tileSize: number
}

export function BonusPellet({ collectible, tileSize }: BonusPelletProps): React.JSX.Element {
  const cx = collectible.position.col * tileSize + tileSize / 2
  const cy = collectible.position.row * tileSize + tileSize / 2
  const scale = tileSize / 32

  return (
    <g className="bonus-map" transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <g className="bonus-map-art">
        <path
          className="bonus-map-panel bonus-map-panel-left"
          d="M -11 -8 L -4 -10 L -4 8 L -11 10 Z"
        />
        <path className="bonus-map-panel bonus-map-panel-mid" d="M -4 -10 L 4 -8 L 4 10 L -4 8 Z" />
        <path
          className="bonus-map-panel bonus-map-panel-right"
          d="M 4 -8 L 11 -10 L 11 8 L 4 10 Z"
        />
        <path className="bonus-map-route" d="M -10 5 L -5 -2 L -1 1.5 L 3 -4 L 9 -7" />
        <path className="bonus-map-route" d="M -7 -7 L -1 -3 L 4 2 L 10 3.5" />
        <path
          className="bonus-map-pin"
          d="M -7.2 -8.5 C -9.4 -8.5 -11 -6.8 -11 -4.7 C -11 -1.7 -7.2 2 -7.2 2 C -7.2 2 -3.4 -1.7 -3.4 -4.7 C -3.4 -6.8 -5 -8.5 -7.2 -8.5 Z"
        />
        <circle className="bonus-map-pin-hole" cx="-7.2" cy="-4.8" r="1.15" />
      </g>
    </g>
  )
}
