import type { Tile } from '../engine/types'
import {
  DEFAULT_CITY_BIOME_LAYOUT,
  getCityBlockMeta,
  type BuildingVariant,
  type CityBiomeLayout,
  type CityBlockMeta
} from './cityBiomeLayout'

interface WallProps {
  readonly tile: Tile
  readonly tileSize: number
  readonly boardWidth: number
  readonly boardHeight: number
  readonly biomeLayout?: CityBiomeLayout
}

export function Wall({
  tile,
  tileSize,
  boardWidth,
  boardHeight,
  biomeLayout = DEFAULT_CITY_BIOME_LAYOUT
}: WallProps): React.JSX.Element {
  const x = tile.position.col * tileSize
  const y = tile.position.row * tileSize
  const block = getCityBlockMeta(tile, boardWidth, boardHeight, biomeLayout)

  return (
    <g
      className={[
        'city-block',
        `city-biome-${block.biome}`,
        `city-block-${block.kind}`,
        `city-block-tone-${block.tone}`,
        block.buildingVariant ? `city-building-${block.buildingVariant}` : ''
      ]
        .filter(Boolean)
        .join(' ')}
      transform={`translate(${x} ${y})`}
    >
      <rect
        className="city-block-shadow"
        x="1"
        y="2"
        width={tileSize - 2}
        height={tileSize - 2}
        rx="2"
      />
      {renderCityBlock(block, tileSize)}
    </g>
  )
}

function renderCityBlock(block: CityBlockMeta, tileSize: number): React.JSX.Element {
  switch (block.kind) {
    case 'building':
      return <BuildingBlock tileSize={tileSize} variant={block.buildingVariant ?? 'house'} />
    case 'park':
      return <ParkBlock tileSize={tileSize} />
    case 'water':
      return <WaterBlock tileSize={tileSize} />
  }
}

function BuildingBlock({
  tileSize,
  variant
}: {
  readonly tileSize: number
  readonly variant: BuildingVariant
}): React.JSX.Element {
  return (
    <>
      <rect
        className="city-building-base"
        x="0.8"
        y="0.8"
        width={tileSize - 1.6}
        height={tileSize - 1.6}
        rx="2"
      />
      {renderBuildingVariant(variant)}
    </>
  )
}

function renderBuildingVariant(variant: BuildingVariant): React.JSX.Element {
  switch (variant) {
    case 'tower':
      return <TowerBuilding />
    case 'office':
      return <OfficeBuilding />
    case 'apartment':
      return <ApartmentBuilding />
    case 'civic':
      return <CivicBuilding />
    case 'house':
      return <HouseBuilding />
    case 'rowHouse':
      return <RowHouseBuilding />
  }
}

function TowerBuilding(): React.JSX.Element {
  return (
    <>
      <rect className="city-building-tower-main" x="8" y="4" width="16" height="24" rx="1.5" />
      <rect className="city-building-roof-flat" x="7" y="3" width="18" height="3" rx="1" />
      <WindowGrid columns={3} rows={5} startX={10} startY={8} gapX={4} gapY={4} />
    </>
  )
}

function OfficeBuilding(): React.JSX.Element {
  return (
    <>
      <rect className="city-building-office-main" x="4" y="8" width="24" height="20" rx="1.8" />
      <rect className="city-building-office-top" x="7" y="4" width="18" height="6" rx="1.5" />
      <WindowGrid columns={4} rows={3} startX={7} startY={12} gapX={5} gapY={5} />
      <rect className="city-building-door" x="14" y="22" width="4.5" height="6" rx="0.8" />
    </>
  )
}

function ApartmentBuilding(): React.JSX.Element {
  return (
    <>
      <rect className="city-building-apartment-main" x="5" y="6" width="22" height="22" rx="1.8" />
      <path className="city-building-roof-flat" d="M 5 7 H 27 L 24 4 H 8 Z" />
      <WindowGrid columns={3} rows={4} startX={9} startY={10} gapX={6} gapY={4.5} />
    </>
  )
}

function CivicBuilding(): React.JSX.Element {
  return (
    <>
      <rect className="city-building-civic-main" x="4.5" y="13" width="23" height="14" rx="1.8" />
      <path className="city-building-civic-roof" d="M 4 13 L 16 5 L 28 13 Z" />
      <rect className="city-building-column" x="8" y="15" width="3" height="10" rx="0.6" />
      <rect className="city-building-column" x="14.5" y="15" width="3" height="10" rx="0.6" />
      <rect className="city-building-column" x="21" y="15" width="3" height="10" rx="0.6" />
    </>
  )
}

function HouseBuilding(): React.JSX.Element {
  return (
    <>
      <path className="city-building-roof" d="M 4 14 L 16 4.5 L 28 14 Z" />
      <rect className="city-building-face" x="5.5" y="14" width="21" height="14" rx="1.8" />
      <rect className="city-building-window" x="9.5" y="17.5" width="3.5" height="3.5" rx="0.5" />
      <rect className="city-building-window" x="19" y="17.5" width="3.5" height="3.5" rx="0.5" />
      <rect className="city-building-door" x="14" y="22" width="4.5" height="6" rx="0.8" />
    </>
  )
}

function RowHouseBuilding(): React.JSX.Element {
  return (
    <>
      <rect className="city-row-house-face" x="3.5" y="13" width="25" height="14" rx="1.6" />
      <path className="city-row-house-roof" d="M 4 13 L 9.8 7 L 15.6 13 L 21.4 7 L 28 13 Z" />
      <rect className="city-building-window" x="7" y="17" width="3.2" height="3.2" rx="0.5" />
      <rect className="city-building-window" x="14.4" y="17" width="3.2" height="3.2" rx="0.5" />
      <rect className="city-building-window" x="21.8" y="17" width="3.2" height="3.2" rx="0.5" />
      <rect className="city-building-door" x="14" y="22" width="4.2" height="5" rx="0.8" />
    </>
  )
}

function WindowGrid({
  columns,
  rows,
  startX,
  startY,
  gapX,
  gapY
}: {
  readonly columns: number
  readonly rows: number
  readonly startX: number
  readonly startY: number
  readonly gapX: number
  readonly gapY: number
}): React.JSX.Element {
  return (
    <>
      {Array.from({ length: rows }).flatMap((_, row) =>
        Array.from({ length: columns }).map((__, col) => (
          <rect
            className="city-building-window"
            key={`${row}-${col}`}
            x={startX + col * gapX}
            y={startY + row * gapY}
            width="2.5"
            height="2.5"
            rx="0.4"
          />
        ))
      )}
    </>
  )
}

function ParkBlock({ tileSize }: { readonly tileSize: number }): React.JSX.Element {
  return (
    <>
      <rect
        className="city-green-base"
        x="0.8"
        y="0.8"
        width={tileSize - 1.6}
        height={tileSize - 1.6}
        rx="2"
      />
      <Tree cx={16} cy={16} />
    </>
  )
}

function WaterBlock({ tileSize }: { readonly tileSize: number }): React.JSX.Element {
  return (
    <>
      <rect
        className="city-water-base"
        x="0.8"
        y="0.8"
        width={tileSize - 1.6}
        height={tileSize - 1.6}
        rx="2"
      />
      <path className="city-water-wave" d="M 4 10 C 9 7 13 13 18 10 C 23 7 26 11 30 9" />
      <path className="city-water-wave" d="M 3 18 C 8 15 12 21 17 18 C 22 15 26 20 30 17" />
      <path className="city-water-wave" d="M 5 25 C 10 22 14 27 19 24 C 23 22 26 25 30 23" />
    </>
  )
}

function Tree({ cx, cy }: { readonly cx: number; readonly cy: number }): React.JSX.Element {
  return (
    <g className="city-tree">
      <rect className="city-tree-trunk" x={cx - 2} y={cy + 5.5} width="4" height="8" rx="1" />
      <circle className="city-tree-canopy" cx={cx} cy={cy} r="9.2" />
      <circle className="city-tree-canopy-light" cx={cx - 2.7} cy={cy - 3} r="3.3" />
    </g>
  )
}
