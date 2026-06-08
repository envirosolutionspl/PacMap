import type {
  NewRankingEntry,
  RankingEntry,
  RankingStorage,
  RankingStorageLike
} from './rankingTypes'

export const LOCAL_RANKING_KEY = 'pac-map-ranking-v1'
export const RANKING_LIMIT = 10
const DEFAULT_PLAYER_NAME = 'PLAYER'
const PHONE_ALLOWED_CHARACTERS = /[^\d()+\-\s]/g

export function createRankingEntry(entry: NewRankingEntry): RankingEntry {
  const createdAt = entry.createdAt ?? new Date().toISOString()
  const phoneNumber = normalizePhoneNumber(entry.phoneNumber ?? '')

  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 10)}`,
    playerName: normalizePlayerName(entry.playerName),
    ...(phoneNumber ? { phoneNumber } : {}),
    score: Math.max(0, Math.floor(entry.score)),
    reachedLevel: Math.max(1, Math.floor(entry.reachedLevel)),
    createdAt
  }
}

export function normalizePlayerName(playerName: string): string {
  const normalized = playerName.trim().replace(/\s+/g, ' ').slice(0, 12)

  return normalized.length > 0 ? normalized : DEFAULT_PLAYER_NAME
}

export function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.trim().replace(PHONE_ALLOWED_CHARACTERS, '').replace(/\s+/g, ' ').slice(0, 18)
}

export function addRankingEntry(
  entries: readonly RankingEntry[],
  entry: RankingEntry
): readonly RankingEntry[] {
  return sortRankingEntries([...entries, entry]).slice(0, RANKING_LIMIT)
}

export function sortRankingEntries(entries: readonly RankingEntry[]): readonly RankingEntry[] {
  return [...entries].sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score
    }

    return first.createdAt.localeCompare(second.createdAt)
  })
}

export function readLocalRanking(storage = getBrowserStorage()): readonly RankingEntry[] {
  if (!storage) {
    return []
  }

  try {
    const rawValue = storage.getItem(LOCAL_RANKING_KEY)
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : []

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return sortRankingEntries(parsedValue.filter(isRankingEntry)).slice(0, RANKING_LIMIT)
  } catch {
    return []
  }
}

export function writeLocalRanking(
  entries: readonly RankingEntry[],
  storage = getBrowserStorage()
): void {
  if (!storage) {
    return
  }

  storage.setItem(
    LOCAL_RANKING_KEY,
    JSON.stringify(sortRankingEntries(entries).slice(0, RANKING_LIMIT))
  )
}

export function createLocalRankingStorage(storage = getBrowserStorage()): RankingStorage {
  return {
    list: () => readLocalRanking(storage),
    add: (entry) => {
      const updatedRanking = addRankingEntry(readLocalRanking(storage), createRankingEntry(entry))

      writeLocalRanking(updatedRanking, storage)

      return updatedRanking
    },
    clear: () => {
      writeLocalRanking([], storage)

      return []
    }
  }
}

function isRankingEntry(value: unknown): value is RankingEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    typeof entry.id === 'string' &&
    typeof entry.playerName === 'string' &&
    (entry.phoneNumber === undefined || typeof entry.phoneNumber === 'string') &&
    typeof entry.score === 'number' &&
    typeof entry.reachedLevel === 'number' &&
    typeof entry.createdAt === 'string'
  )
}

function getBrowserStorage(): RankingStorageLike | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}
