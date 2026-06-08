import type { Tile } from '../engine/types'

export type CityBiomeLayoutKind =
  | 'strictCityCenter'
  | 'mixedCity'
  | 'bigCityPark'
  | 'suburbsCity'
  | 'suburbs'
  | 'forestTown'
  | 'lake'
  | 'forest'
  | 'coast'
export type CityBiome = 'center' | 'suburbs' | 'park'
export type CityBlockKind = 'building' | 'park' | 'water'
export type CityFloorZone = 'center' | 'suburbs' | 'park' | 'water'
export type BuildingVariant = 'tower' | 'office' | 'apartment' | 'civic' | 'house' | 'rowHouse'

export interface CityBiomeLayoutOption {
  readonly kind: CityBiomeLayoutKind
  readonly label: string
  readonly description: string
}

export interface CityBlockMeta {
  readonly biome: CityBiome
  readonly kind: CityBlockKind
  readonly tone: number
  readonly buildingVariant?: BuildingVariant
}

export interface CityFloorMeta {
  readonly zone: CityFloorZone
}

export interface CityBiomeLayout {
  readonly kind: CityBiomeLayoutKind
  readonly seed: number
  readonly centerOffsetX: number
  readonly centerOffsetY: number
  readonly centerRadiusX: number
  readonly centerRadiusY: number
  readonly sideCenterBias: number
  readonly suburbCornerReach: number
}

const CENTER_BUILDINGS: readonly BuildingVariant[] = ['tower', 'office', 'apartment', 'civic']
const SUBURB_BUILDINGS: readonly BuildingVariant[] = ['house', 'rowHouse', 'house', 'civic']
const MAX_SEED = 2_147_483_647

export const CITY_BIOME_LAYOUT_OPTIONS: readonly CityBiomeLayoutOption[] = [
  {
    kind: 'strictCityCenter',
    label: 'Ścisłe centrum',
    description: 'Szare budynki, rogi z przedmieściami'
  },
  {
    kind: 'mixedCity',
    label: 'Małe miasto',
    description: 'Parki, woda i luźniejsze dzielnice'
  },
  {
    kind: 'bigCityPark',
    label: 'Park w wielkim mieście',
    description: 'Zieleń i woda otoczone szarym miastem'
  },
  {
    kind: 'suburbsCity',
    label: 'Przedmieście / miasto',
    description: 'Duże miasto, pas przedmieść i mały park'
  },
  {
    kind: 'suburbs',
    label: 'Przedmieścia',
    description: 'Brązowa zabudowa i małe parki'
  },
  {
    kind: 'forestTown',
    label: 'Leśna miejscowość',
    description: 'Brązowe domy, las i jeziora'
  },
  {
    kind: 'lake',
    label: 'Jezioro',
    description: 'Woda w środku, las dookoła'
  },
  {
    kind: 'forest',
    label: 'Las',
    description: 'Zieleń i woda bez zabudowy'
  },
  {
    kind: 'coast',
    label: 'Wybrzeże',
    description: 'Woda, las i mała miejscowość w rogu'
  }
]

export const DEFAULT_CITY_BIOME_LAYOUT: CityBiomeLayout = {
  kind: 'strictCityCenter',
  seed: 1,
  centerOffsetX: 0,
  centerOffsetY: 0,
  centerRadiusX: 0.36,
  centerRadiusY: 0.34,
  sideCenterBias: 0.13,
  suburbCornerReach: 0.34
}

export function createCityBiomeLayout(
  kind: CityBiomeLayoutKind = 'strictCityCenter',
  random = Math.random
): CityBiomeLayout {
  const seed = Math.max(1, Math.floor(clampUnit(random()) * MAX_SEED))

  return {
    kind,
    seed,
    centerOffsetX: getSeededUnit(seed, 11) * 0.14 - 0.07,
    centerOffsetY: getSeededUnit(seed, 17) * 0.12 - 0.06,
    centerRadiusX: 0.32 + getSeededUnit(seed, 23) * 0.08,
    centerRadiusY: 0.31 + getSeededUnit(seed, 29) * 0.08,
    sideCenterBias: 0.11 + getSeededUnit(seed, 31) * 0.06,
    suburbCornerReach: 0.32 + getSeededUnit(seed, 37) * 0.07
  }
}

export function createRandomCityBiomeLayout(random = Math.random): CityBiomeLayout {
  const optionIndex = Math.min(
    CITY_BIOME_LAYOUT_OPTIONS.length - 1,
    Math.floor(clampUnit(random()) * CITY_BIOME_LAYOUT_OPTIONS.length)
  )

  return createCityBiomeLayout(CITY_BIOME_LAYOUT_OPTIONS[optionIndex].kind, random)
}

export function getCityBlockMeta(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout = DEFAULT_CITY_BIOME_LAYOUT
): CityBlockMeta {
  const seed = getTileSeed(tile, layout.seed)
  const biome = getCityBiome(tile, boardWidth, boardHeight, layout)

  if (biome === 'park') {
    return {
      biome,
      kind: getParkBlockKind(tile, boardWidth, boardHeight, layout),
      tone: seed % 4
    }
  }

  const buildingVariants = biome === 'center' ? CENTER_BUILDINGS : SUBURB_BUILDINGS

  return {
    biome,
    kind: 'building',
    tone: seed % 4,
    buildingVariant: buildingVariants[seed % buildingVariants.length]
  }
}

export function getCityFloorMeta(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout = DEFAULT_CITY_BIOME_LAYOUT
): CityFloorMeta {
  const biome = getCityBiome(tile, boardWidth, boardHeight, layout)

  if (biome === 'park') {
    const parkKind = getParkBlockKind(tile, boardWidth, boardHeight, layout)

    return {
      zone: parkKind === 'water' ? 'water' : 'park'
    }
  }

  return {
    zone: biome
  }
}

function getCityBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  switch (layout.kind) {
    case 'strictCityCenter':
      return getStrictCityCenterBiome(tile, boardWidth, boardHeight, layout)
    case 'mixedCity':
      return getMixedCityBiome(tile, boardWidth, boardHeight, layout)
    case 'bigCityPark':
      return getBigCityParkBiome(tile, boardWidth, boardHeight, layout)
    case 'suburbsCity':
      return getSuburbsCityBiome(tile, boardWidth, boardHeight, layout)
    case 'suburbs':
      return getSuburbsBiome(tile, boardWidth, boardHeight, layout)
    case 'forestTown':
      return getForestTownBiome(tile, boardWidth, boardHeight, layout)
    case 'lake':
      return 'park'
    case 'forest':
      return 'park'
    case 'coast':
      return getCoastBiome(tile, boardWidth, boardHeight, layout)
  }
}

function getStrictCityCenterBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const centerX = 0.5 + layout.centerOffsetX
  const centerY = 0.5 + layout.centerOffsetY
  const dx = Math.abs(colRatio - centerX)
  const dy = Math.abs(rowRatio - centerY)
  const centerDistance =
    (dx / layout.centerRadiusX) * (dx / layout.centerRadiusX) +
    (dy / layout.centerRadiusY) * (dy / layout.centerRadiusY)
  const inCityCore = centerDistance <= 1
  const inCityAvenue =
    (dx < layout.sideCenterBias && dy < 0.52) || (dy < layout.sideCenterBias && dx < 0.52)

  if (inCityCore || inCityAvenue) {
    return 'center'
  }

  const distanceFromMiddleX = Math.abs(colRatio - 0.5)
  const distanceFromMiddleY = Math.abs(rowRatio - 0.5)
  const inSuburbCorner =
    distanceFromMiddleX > layout.suburbCornerReach && distanceFromMiddleY > layout.suburbCornerReach
  const nearSuburbCorner =
    distanceFromMiddleX > layout.suburbCornerReach - 0.08 &&
    distanceFromMiddleY > layout.suburbCornerReach - 0.08
  const cornerNoise = getTileNoise(tile, layout.seed)

  if (inSuburbCorner || (nearSuburbCorner && cornerNoise > 0.62)) {
    return 'suburbs'
  }

  return 'center'
}

function getMixedCityBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const parkOffsetX = getSeededUnit(layout.seed, 43) * 0.1 - 0.05
  const parkOffsetY = getSeededUnit(layout.seed, 47) * 0.1 - 0.05
  const centerDistance = Math.hypot(
    rowRatio - (0.5 + layout.centerOffsetY),
    colRatio - (0.5 + layout.centerOffsetX)
  )
  const inParkDistrict =
    (rowRatio < 0.34 + parkOffsetY && colRatio < 0.36 + parkOffsetX) ||
    (rowRatio > 0.68 + parkOffsetY && colRatio > 0.62 + parkOffsetX) ||
    (rowRatio > 0.14 && rowRatio < 0.3 + parkOffsetY && colRatio > 0.58 + parkOffsetX)

  if (inParkDistrict) {
    return 'park'
  }

  if (
    centerDistance < 0.24 ||
    (rowRatio > 0.34 && rowRatio < 0.66 && colRatio > 0.34 && colRatio < 0.72)
  ) {
    return 'center'
  }

  return 'suburbs'
}

function getBigCityParkBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const parkCenterX = 0.5 + layout.centerOffsetX * 0.55
  const parkCenterY = 0.5 + layout.centerOffsetY * 0.55
  const parkRadiusX = 0.28 + getSeededUnit(layout.seed, 59) * 0.07
  const parkRadiusY = 0.27 + getSeededUnit(layout.seed, 61) * 0.07
  const dx = (colRatio - parkCenterX) / parkRadiusX
  const dy = (rowRatio - parkCenterY) / parkRadiusY
  const parkScore = dx * dx + dy * dy
  const edgeNoise = getTileNoise(tile, layout.seed)

  if (parkScore <= 0.92 || (parkScore <= 1.18 && edgeNoise > 0.5)) {
    return 'park'
  }

  return 'center'
}

function getSuburbsCityBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const profile = getSuburbsCityProfile(rowRatio, colRatio, layout)
  const parkCenter = 0.84 + getSeededUnit(layout.seed, 67) * 0.08
  const parkCrossCenter = 0.5 + layout.centerOffsetY * 0.55
  const parkRadiusMain = 0.14 + getSeededUnit(layout.seed, 71) * 0.04
  const parkRadiusCross = 0.22 + getSeededUnit(layout.seed, 73) * 0.04
  const parkDx = (profile.progress - parkCenter) / parkRadiusMain
  const parkDy = (profile.cross - parkCrossCenter) / parkRadiusCross
  const inEndPark = parkDx * parkDx + parkDy * parkDy <= 1

  if (inEndPark) {
    return 'park'
  }

  const cityReach = 0.31 + getSeededUnit(layout.seed, 79) * 0.08
  const inCitySide = profile.progress < cityReach
  const inCityEdge = profile.progress < cityReach + 0.12 && Math.abs(profile.cross - 0.5) > 0.34

  if (inCitySide || inCityEdge) {
    return 'center'
  }

  return 'suburbs'
}

function getSuburbsBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const firstPark = getSmallParkScore(rowRatio, colRatio, 0.25 + layout.centerOffsetX, 0.28)
  const secondPark = getSmallParkScore(rowRatio, colRatio, 0.72, 0.66 + layout.centerOffsetY)
  const thirdPark = getSmallParkScore(rowRatio, colRatio, 0.47, 0.82)
  const edgeNoise = getTileNoise(tile, layout.seed)
  const inSmallPark =
    firstPark < 1 ||
    secondPark < 1 ||
    (thirdPark < 0.78 && edgeNoise > 0.32) ||
    (Math.min(firstPark, secondPark) < 1.26 && edgeNoise > 0.7)

  return inSmallPark ? 'park' : 'suburbs'
}

function getForestTownBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const townCenterX = 0.5 + layout.centerOffsetX * 0.7
  const townCenterY = 0.5 + layout.centerOffsetY * 0.7
  const dx = (colRatio - townCenterX) / (0.29 + getSeededUnit(layout.seed, 107) * 0.06)
  const dy = (rowRatio - townCenterY) / (0.27 + getSeededUnit(layout.seed, 109) * 0.06)
  const townScore = dx * dx + dy * dy
  const pathNoise = getTileNoise(tile, layout.seed)
  const inTown =
    townScore < 1 ||
    (townScore < 1.22 && pathNoise > 0.68) ||
    (Math.abs(colRatio - townCenterX) < 0.08 && Math.abs(rowRatio - townCenterY) < 0.46)

  return inTown ? 'suburbs' : 'park'
}

function getCoastBiome(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBiome {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const profile = getCoastProfile(rowRatio, colRatio, layout)
  const townCrossCenter = getSeededUnit(layout.seed, 149) > 0.5 ? 0.18 : 0.82
  const townProgressCenter = 0.78 + getSeededUnit(layout.seed, 151) * 0.08
  const townDx = (profile.progress - townProgressCenter) / 0.18
  const townDy = (profile.cross - townCrossCenter) / 0.17
  const townNoise = getTileNoise(tile, layout.seed)
  const inCornerTown =
    townDx * townDx + townDy * townDy <= 1 ||
    (townDx * townDx + townDy * townDy <= 1.24 && townNoise > 0.66)

  return inCornerTown ? 'suburbs' : 'park'
}

function getParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  if (layout.kind === 'bigCityPark') {
    return getBigCityParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'suburbsCity') {
    return getSuburbsCityParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'suburbs') {
    return getSuburbsParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'forestTown') {
    return getForestTownParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'lake') {
    return getLakeBiomeParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'forest') {
    return getForestBiomeParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  if (layout.kind === 'coast') {
    return getCoastParkBlockKind(tile, boardWidth, boardHeight, layout)
  }

  return getMixedCityParkBlockKind(tile, boardWidth, boardHeight, layout)
}

function getMixedCityParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const waterOffset = getSeededUnit(layout.seed, 53) * 0.06 - 0.03
  const inUpperPond = rowRatio < 0.18 + waterOffset && colRatio < 0.3
  const inLowerLake = rowRatio > 0.78 + waterOffset && colRatio > 0.72
  const inSideCanal = rowRatio > 0.18 && rowRatio < 0.28 + waterOffset && colRatio > 0.68

  return inUpperPond || inLowerLake || inSideCanal ? 'water' : 'park'
}

function getBigCityParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const lakeCenterX = 0.5 + layout.centerOffsetX * 0.35
  const lakeCenterY = 0.5 + layout.centerOffsetY * 0.35
  const lakeRadiusX = 0.1 + getSeededUnit(layout.seed, 83) * 0.04
  const lakeRadiusY = 0.08 + getSeededUnit(layout.seed, 89) * 0.04
  const dx = (colRatio - lakeCenterX) / lakeRadiusX
  const dy = (rowRatio - lakeCenterY) / lakeRadiusY
  const inLake = dx * dx + dy * dy <= 1
  const inSideWater =
    Math.abs(rowRatio - lakeCenterY) < 0.045 &&
    colRatio > lakeCenterX &&
    colRatio < lakeCenterX + 0.2

  return inLake || inSideWater ? 'water' : 'park'
}

function getSuburbsCityParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const profile = getSuburbsCityProfile(rowRatio, colRatio, layout)
  const pondCenter = 0.86 + getSeededUnit(layout.seed, 97) * 0.05
  const pondCrossCenter = 0.5 + layout.centerOffsetY * 0.35
  const pondDx = (profile.progress - pondCenter) / 0.055
  const pondDy = (profile.cross - pondCrossCenter) / 0.075

  return pondDx * pondDx + pondDy * pondDy <= 1 ? 'water' : 'park'
}

function getSuburbsParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const waterNoise = getTileNoise(tile, layout.seed)
  const firstPond = getSmallParkScore(rowRatio, colRatio, 0.25 + layout.centerOffsetX, 0.28)
  const secondPond = getSmallParkScore(rowRatio, colRatio, 0.72, 0.66 + layout.centerOffsetY)
  const inPond =
    firstPond < 0.24 ||
    secondPond < 0.2 ||
    (Math.min(firstPond, secondPond) < 0.34 && waterNoise > 0.56)

  return inPond ? 'water' : 'park'
}

function getForestTownParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const northLake = getLakeScore(rowRatio, colRatio, 0.22 + layout.centerOffsetX * 0.5, 0.22)
  const southLake = getLakeScore(rowRatio, colRatio, 0.76, 0.78 + layout.centerOffsetY * 0.5)
  const sideLake = getLakeScore(rowRatio, colRatio, 0.84, 0.34)
  const inLake = northLake < 1 || southLake < 1 || sideLake < 0.72

  return inLake ? 'water' : 'park'
}

function getLakeBiomeParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const lakeCenterX = 0.5 + layout.centerOffsetX * 0.45
  const lakeCenterY = 0.5 + layout.centerOffsetY * 0.45
  const lakeRadiusX = 0.28 + getSeededUnit(layout.seed, 113) * 0.06
  const lakeRadiusY = 0.25 + getSeededUnit(layout.seed, 127) * 0.06
  const dx = (colRatio - lakeCenterX) / lakeRadiusX
  const dy = (rowRatio - lakeCenterY) / lakeRadiusY
  const lakeScore = dx * dx + dy * dy
  const shorelineNoise = getTileNoise(tile, layout.seed)

  return lakeScore < 1 || (lakeScore < 1.22 && shorelineNoise > 0.64) ? 'water' : 'park'
}

function getForestBiomeParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const firstPond = getLakeScore(rowRatio, colRatio, 0.2 + layout.centerOffsetX * 0.45, 0.3)
  const secondPond = getLakeScore(rowRatio, colRatio, 0.7, 0.68 + layout.centerOffsetY * 0.45)
  const marsh = getSmallParkScore(rowRatio, colRatio, 0.5 + layout.centerOffsetX * 0.25, 0.48)
  const waterNoise = getTileNoise(tile, layout.seed)
  const inForestWater =
    firstPond < 0.7 ||
    secondPond < 0.66 ||
    (marsh < 0.42 && waterNoise > 0.42) ||
    (Math.min(firstPond, secondPond) < 0.95 && waterNoise > 0.72)

  return inForestWater ? 'water' : 'park'
}

function getCoastParkBlockKind(
  tile: Tile,
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): CityBlockKind {
  const rowRatio = tile.position.row / Math.max(1, boardHeight - 1)
  const colRatio = tile.position.col / Math.max(1, boardWidth - 1)
  const profile = getCoastProfile(rowRatio, colRatio, layout)
  const shoreline = 0.34 + getSeededUnit(layout.seed, 131) * 0.08
  const shorelineNoise = getTileNoise(tile, layout.seed)
  const isWater =
    profile.progress < shoreline || (profile.progress < shoreline + 0.08 && shorelineNoise > 0.72)

  return isWater ? 'water' : 'park'
}

function getSuburbsCityProfile(
  rowRatio: number,
  colRatio: number,
  layout: CityBiomeLayout
): { readonly progress: number; readonly cross: number } {
  const direction = Math.floor(getSeededUnit(layout.seed, 101) * 4)

  switch (direction) {
    case 0:
      return { progress: colRatio, cross: rowRatio }
    case 1:
      return { progress: 1 - colRatio, cross: rowRatio }
    case 2:
      return { progress: rowRatio, cross: colRatio }
    default:
      return { progress: 1 - rowRatio, cross: colRatio }
  }
}

function getCoastProfile(
  rowRatio: number,
  colRatio: number,
  layout: CityBiomeLayout
): { readonly progress: number; readonly cross: number } {
  const direction = Math.floor(getSeededUnit(layout.seed, 137) * 4)

  switch (direction) {
    case 0:
      return { progress: colRatio, cross: rowRatio }
    case 1:
      return { progress: 1 - colRatio, cross: rowRatio }
    case 2:
      return { progress: rowRatio, cross: colRatio }
    default:
      return { progress: 1 - rowRatio, cross: colRatio }
  }
}

function getSmallParkScore(
  rowRatio: number,
  colRatio: number,
  centerX: number,
  centerY: number
): number {
  const dx = (colRatio - centerX) / 0.15
  const dy = (rowRatio - centerY) / 0.12

  return dx * dx + dy * dy
}

function getLakeScore(
  rowRatio: number,
  colRatio: number,
  centerX: number,
  centerY: number
): number {
  const dx = (colRatio - centerX) / 0.14
  const dy = (rowRatio - centerY) / 0.1

  return dx * dx + dy * dy
}

function getTileSeed(tile: Tile, layoutSeed: number): number {
  return hashNumbers(layoutSeed, tile.position.row + 1, tile.position.col + 1)
}

function getTileNoise(tile: Tile, layoutSeed: number): number {
  return getSeededUnit(layoutSeed, (tile.position.row + 3) * 41 + (tile.position.col + 5) * 73)
}

function getSeededUnit(seed: number, salt: number): number {
  return hashNumbers(seed, salt, 97) / MAX_SEED
}

function hashNumbers(first: number, second: number, third: number): number {
  let value = first ^ 0x9e3779b9

  value = Math.imul(value ^ second, 1_664_525)
  value = Math.imul(value ^ third, 1_013_904_223)
  value ^= value >>> 16

  return (value >>> 0) % MAX_SEED
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.5
  }

  return Math.min(0.999_999, Math.max(0, value))
}
