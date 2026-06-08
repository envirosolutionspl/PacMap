import { describe, expect, it } from 'vitest'

import type { Tile } from '../engine/types'
import {
  createCityBiomeLayout,
  createRandomCityBiomeLayout,
  getCityBlockMeta,
  getCityFloorMeta,
  type CityBiomeLayout
} from './cityBiomeLayout'

const stableCityCenterLayout: CityBiomeLayout = {
  kind: 'strictCityCenter',
  seed: 123,
  centerOffsetX: 0,
  centerOffsetY: 0,
  centerRadiusX: 0.36,
  centerRadiusY: 0.34,
  sideCenterBias: 0.13,
  suburbCornerReach: 0.34
}

describe('city biome layout', () => {
  it('creates different city plans from different random seeds', () => {
    const firstLayout = createCityBiomeLayout('strictCityCenter', () => 0.12)
    const secondLayout = createCityBiomeLayout('strictCityCenter', () => 0.82)

    expect(firstLayout).not.toEqual(secondLayout)
    expect(firstLayout.kind).toBe('strictCityCenter')
    expect(secondLayout.kind).toBe('strictCityCenter')
  })

  it('can randomly choose both a biome kind and a layout seed', () => {
    const firstLayout = createRandomCityBiomeLayout(createRandomSequence(0, 0.12))
    const lastLayout = createRandomCityBiomeLayout(createRandomSequence(0.999_999, 0.82))

    expect(firstLayout.kind).toBe('strictCityCenter')
    expect(lastLayout.kind).toBe('coast')
    expect(firstLayout.seed).not.toBe(lastLayout.seed)
  })

  it('assigns floor zones from the current biome layout', () => {
    const boardWidth = 18
    const boardHeight = 18
    const cityLayout = createCityBiomeLayout('strictCityCenter', () => 0.42)
    const lakeLayout = createCityBiomeLayout('lake', () => 0.42)
    const forestLayout = createCityBiomeLayout('forest', () => 0.42)
    const forestFloors = createBoardFloors(boardWidth, boardHeight, forestLayout)

    expect(getCityFloorMeta(createWallTile(9, 9), boardWidth, boardHeight, cityLayout).zone).toBe(
      'center'
    )
    expect(getCityFloorMeta(createWallTile(0, 0), boardWidth, boardHeight, cityLayout).zone).toBe(
      'suburbs'
    )
    expect(getCityFloorMeta(createWallTile(9, 9), boardWidth, boardHeight, lakeLayout).zone).toBe(
      'water'
    )
    expect(forestFloors.some((floor) => floor.zone === 'park')).toBe(true)
    expect(forestFloors.some((floor) => floor.zone === 'water')).toBe(true)
  })

  it('can create a mixed city biome with parks and water', () => {
    const layout = createCityBiomeLayout('mixedCity', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = Array.from({ length: boardHeight }).flatMap((_, row) =>
      Array.from({ length: boardWidth }).map((__, col) =>
        getCityBlockMeta(createWallTile(row, col), boardWidth, boardHeight, layout)
      )
    )

    expect(layout.kind).toBe('mixedCity')
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
  })

  it('can create a big city park surrounded by center buildings', () => {
    const layout = createCityBiomeLayout('bigCityPark', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('bigCityPark')
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
    expect(blocks.some((block) => block.biome === 'center')).toBe(true)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(false)
  })

  it('can create a suburb and city biome with a small park at the end', () => {
    const layout = createCityBiomeLayout('suburbsCity', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('suburbsCity')
    expect(blocks.some((block) => block.biome === 'center')).toBe(true)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(true)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
  })

  it('can create suburbs without center buildings and with small parks', () => {
    const layout = createCityBiomeLayout('suburbs', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('suburbs')
    expect(blocks.some((block) => block.biome === 'center')).toBe(false)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(true)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
  })

  it('can create a forest town with suburban buildings, forest and lakes', () => {
    const layout = createCityBiomeLayout('forestTown', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('forestTown')
    expect(blocks.some((block) => block.biome === 'center')).toBe(false)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(true)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
  })

  it('can create a lake biome without buildings', () => {
    const layout = createCityBiomeLayout('lake', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('lake')
    expect(blocks.some((block) => block.kind === 'building')).toBe(false)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
    expect(getCityBlockMeta(createWallTile(9, 9), boardWidth, boardHeight, layout).kind).toBe(
      'water'
    )
  })

  it('can create a forest biome without buildings', () => {
    const layout = createCityBiomeLayout('forest', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('forest')
    expect(blocks.some((block) => block.kind === 'building')).toBe(false)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
  })

  it('can create a coast with water, forest and a small town', () => {
    const layout = createCityBiomeLayout('coast', () => 0.42)
    const boardWidth = 18
    const boardHeight = 18
    const blocks = createBoardBlocks(boardWidth, boardHeight, layout)

    expect(layout.kind).toBe('coast')
    expect(blocks.some((block) => block.biome === 'center')).toBe(false)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(true)
    expect(blocks.some((block) => block.kind === 'park')).toBe(true)
    expect(blocks.some((block) => block.kind === 'water')).toBe(true)
  })

  it('keeps the strict city center biome free from parks and water', () => {
    const boardWidth = 18
    const boardHeight = 18
    const blocks = Array.from({ length: boardHeight }).flatMap((_, row) =>
      Array.from({ length: boardWidth }).map((__, col) =>
        getCityBlockMeta(createWallTile(row, col), boardWidth, boardHeight, stableCityCenterLayout)
      )
    )

    expect(blocks.every((block) => block.kind === 'building')).toBe(true)
    expect(blocks.some((block) => block.biome === 'center')).toBe(true)
    expect(blocks.some((block) => block.biome === 'suburbs')).toBe(true)
    expect(blocks.some((block) => block.kind === 'park')).toBe(false)
    expect(blocks.some((block) => block.kind === 'water')).toBe(false)
  })

  it('dominates the middle and side avenues with center buildings while keeping suburbs in corners', () => {
    const boardWidth = 18
    const boardHeight = 18

    expect(
      getCityBlockMeta(createWallTile(9, 9), boardWidth, boardHeight, stableCityCenterLayout).biome
    ).toBe('center')
    expect(
      getCityBlockMeta(createWallTile(9, 0), boardWidth, boardHeight, stableCityCenterLayout).biome
    ).toBe('center')
    expect(
      getCityBlockMeta(createWallTile(0, 0), boardWidth, boardHeight, stableCityCenterLayout).biome
    ).toBe('suburbs')
    expect(
      getCityBlockMeta(createWallTile(17, 17), boardWidth, boardHeight, stableCityCenterLayout)
        .biome
    ).toBe('suburbs')
  })
})

function createWallTile(row: number, col: number): Tile {
  return {
    id: `wall-${row}-${col}`,
    kind: 'wall',
    position: { row, col },
    walkable: false
  }
}

function createBoardBlocks(
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): ReturnType<typeof getCityBlockMeta>[] {
  return Array.from({ length: boardHeight }).flatMap((_, row) =>
    Array.from({ length: boardWidth }).map((__, col) =>
      getCityBlockMeta(createWallTile(row, col), boardWidth, boardHeight, layout)
    )
  )
}

function createBoardFloors(
  boardWidth: number,
  boardHeight: number,
  layout: CityBiomeLayout
): ReturnType<typeof getCityFloorMeta>[] {
  return Array.from({ length: boardHeight }).flatMap((_, row) =>
    Array.from({ length: boardWidth }).map((__, col) =>
      getCityFloorMeta(createWallTile(row, col), boardWidth, boardHeight, layout)
    )
  )
}

function createRandomSequence(...values: number[]): () => number {
  let index = 0

  return () => values[Math.min(index++, values.length - 1)] ?? 0
}
