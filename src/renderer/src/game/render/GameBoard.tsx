import { memo, useMemo } from 'react'

import { BonusPellet } from '../entities/BonusPellet'
import { Pellet } from '../entities/Pellet'
import { PowerPellet } from '../entities/PowerPellet'
import { Wall } from '../entities/Wall'
import {
  DEFAULT_CITY_BIOME_LAYOUT,
  getCityFloorMeta,
  type CityBiomeLayout
} from '../entities/cityBiomeLayout'
import { TILE_SIZE } from '../engine/constants'
import type { CollectibleState, Tile } from '../engine/types'
import type { ParsedLevel } from '../levels'

interface GameBoardProps {
  readonly level: ParsedLevel
  readonly collectibles: readonly CollectibleState[]
  readonly cityBiomeLayout?: CityBiomeLayout
}

export const GameBoard = memo(function GameBoard({
  level,
  collectibles,
  cityBiomeLayout = DEFAULT_CITY_BIOME_LAYOUT
}: GameBoardProps): React.JSX.Element {
  return (
    <>
      <StaticBoardLayer level={level} cityBiomeLayout={cityBiomeLayout} />
      <CollectibleLayer collectibles={collectibles} />
    </>
  )
})

interface StaticBoardLayerProps {
  readonly level: ParsedLevel
  readonly cityBiomeLayout: CityBiomeLayout
}

const StaticBoardLayer = memo(function StaticBoardLayer({
  level,
  cityBiomeLayout
}: StaticBoardLayerProps): React.JSX.Element {
  const boardWidth = level.width * TILE_SIZE
  const boardHeight = level.height * TILE_SIZE
  const tiles = useMemo(() => level.tiles.flat(), [level])
  const walkableTiles = useMemo(() => tiles.filter((tile) => tile.walkable), [tiles])
  const wallTiles = useMemo(() => tiles.filter((tile) => tile.kind === 'wall'), [tiles])

  return (
    <>
      <rect className="board-bg" width={boardWidth} height={boardHeight} rx={12} />
      <g className="board-floor-layer">
        {walkableTiles.map((tile) => (
          <FloorTile
            key={tile.id}
            tile={tile}
            boardWidth={level.width}
            boardHeight={level.height}
            cityBiomeLayout={cityBiomeLayout}
          />
        ))}
      </g>
      <g className="board-wall-layer">
        {wallTiles.map((tile) => (
          <Wall
            key={tile.id}
            tile={tile}
            tileSize={TILE_SIZE}
            boardWidth={level.width}
            boardHeight={level.height}
            biomeLayout={cityBiomeLayout}
          />
        ))}
      </g>
    </>
  )
})

function FloorTile({
  tile,
  boardWidth,
  boardHeight,
  cityBiomeLayout
}: {
  readonly tile: Tile
  readonly boardWidth: number
  readonly boardHeight: number
  readonly cityBiomeLayout: CityBiomeLayout
}): React.JSX.Element {
  const floor = getCityFloorMeta(tile, boardWidth, boardHeight, cityBiomeLayout)

  return (
    <rect
      className={['board-floor', `board-floor-${tile.kind}`, `board-floor-zone-${floor.zone}`].join(
        ' '
      )}
      x={tile.position.col * TILE_SIZE}
      y={tile.position.row * TILE_SIZE}
      width={TILE_SIZE}
      height={TILE_SIZE}
    />
  )
}

interface CollectibleLayerProps {
  readonly collectibles: readonly CollectibleState[]
}

const CollectibleLayer = memo(function CollectibleLayer({
  collectibles
}: CollectibleLayerProps): React.JSX.Element {
  const visibleCollectibles = useMemo(
    () => collectibles.filter((collectible) => !collectible.collected),
    [collectibles]
  )

  return (
    <g className="board-collectible-layer">
      {visibleCollectibles.map((collectible) => (
        <Collectible key={collectible.id} collectible={collectible} />
      ))}
    </g>
  )
})

function Collectible({
  collectible
}: {
  readonly collectible: CollectibleState
}): React.JSX.Element {
  switch (collectible.kind) {
    case 'bonusPellet':
      return <BonusPellet collectible={collectible} tileSize={TILE_SIZE} />
    case 'powerPellet':
      return <PowerPellet collectible={collectible} tileSize={TILE_SIZE} />
    case 'pellet':
      return <Pellet collectible={collectible} tileSize={TILE_SIZE} />
  }
}
