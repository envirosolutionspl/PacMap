import { parseLevel } from './levelParser'
import { level01 } from './level-01'
import { level02 } from './level-02'
import { level03 } from './level-03'
import { level04 } from './level-04'
import { level05 } from './level-05'

export const rawLevels = [level01, level02, level03, level04, level05] as const

export const levels = rawLevels.map(parseLevel)

export { level01, level02, level03, level04, level05, parseLevel }
export type {
  GhostSpawnDefinition,
  LevelDifficulty,
  LevelMapSymbol,
  ParsedLevel,
  RawLevelDefinition
} from './levelTypes'
