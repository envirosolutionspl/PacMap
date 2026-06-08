import type { RankingEntry, RankingStorageLike } from './rankingTypes'

export const RANKING_FILE_PATH_KEY = 'pac-map-ranking-file-path-v1'

export interface RankingFileApi {
  readonly chooseRankingFile: () => Promise<{ readonly filePath: string } | null>
  readonly writeRankingFile: (
    filePath: string,
    entries: readonly RankingEntry[]
  ) => Promise<{ readonly ok: boolean; readonly error?: string }>
}

export function getRankingFileApi(): RankingFileApi | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const api = window.api as Partial<RankingFileApi> | undefined

  if (
    !api ||
    typeof api.chooseRankingFile !== 'function' ||
    typeof api.writeRankingFile !== 'function'
  ) {
    return undefined
  }

  return api as RankingFileApi
}

export function readRankingFilePath(storage = getBrowserStorage()): string | null {
  if (!storage) {
    return null
  }

  const filePath = storage.getItem(RANKING_FILE_PATH_KEY)

  return filePath && filePath.trim().length > 0 ? filePath : null
}

export function writeRankingFilePath(filePath: string, storage = getBrowserStorage()): void {
  if (!storage) {
    return
  }

  storage.setItem(RANKING_FILE_PATH_KEY, filePath)
}

function getBrowserStorage(): RankingStorageLike | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}
