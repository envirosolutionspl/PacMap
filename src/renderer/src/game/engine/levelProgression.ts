import { GHOST_SPEED_TILES_PER_SECOND } from './constants'
import type { ParsedLevel } from '../levels'
import type { LevelDifficulty } from '../levels'

const GHOST_SPEED_MULTIPLIER: Record<LevelDifficulty, number> = {
  easy: 1,
  normal: 1.1,
  hard: 1.2
}

export function getLevelAt(levels: readonly ParsedLevel[], levelIndex: number): ParsedLevel {
  const level = levels[levelIndex]

  if (!level) {
    throw new Error(`Level index ${levelIndex} is out of range`)
  }

  return level
}

export function getNextLevelIndex(
  levels: readonly ParsedLevel[],
  levelIndex: number
): number | null {
  return levelIndex + 1 < levels.length ? levelIndex + 1 : null
}

export function isFinalLevel(levels: readonly ParsedLevel[], levelIndex: number): boolean {
  return getNextLevelIndex(levels, levelIndex) === null
}

export function getLevelGhostSpeed(level: ParsedLevel, ghostIndex: number): number {
  const multiplier = GHOST_SPEED_MULTIPLIER[level.difficulty]
  const formationOffset = Math.min(ghostIndex, 4) * 0.08

  return Number((GHOST_SPEED_TILES_PER_SECOND * multiplier + formationOffset).toFixed(2))
}
