import { describe, expect, it } from 'vitest'

import {
  LOCAL_RANKING_KEY,
  RANKING_LIMIT,
  addRankingEntry,
  createLocalRankingStorage,
  createRankingEntry,
  normalizePlayerName,
  normalizePhoneNumber,
  readLocalRanking,
  sortRankingEntries
} from './localRanking'
import type { RankingEntry, RankingStorageLike } from './rankingTypes'

describe('local ranking', () => {
  it('normalizes player names', () => {
    expect(normalizePlayerName('  Ada   Lovelace  ')).toBe('Ada Lovelace')
    expect(normalizePlayerName('')).toBe('PLAYER')
    expect(normalizePlayerName('abcdefghijklmnop')).toBe('abcdefghijkl')
  })

  it('normalizes optional phone numbers', () => {
    expect(normalizePhoneNumber(' +48  123-456-789 ext. 1 ')).toBe('+48 123-456-789 1')
    expect(normalizePhoneNumber('abc')).toBe('')
  })

  it('sorts by score descending and date ascending on tie', () => {
    const entries = [
      createEntry('newer', 100, '2026-01-02T00:00:00.000Z'),
      createEntry('best', 300, '2026-01-03T00:00:00.000Z'),
      createEntry('older', 100, '2026-01-01T00:00:00.000Z')
    ]

    expect(sortRankingEntries(entries).map((entry) => entry.playerName)).toEqual([
      'best',
      'older',
      'newer'
    ])
  })

  it('limits ranking to ten best entries', () => {
    const entries = Array.from({ length: 12 }, (_, index) =>
      createEntry(`p${index}`, index, `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`)
    )

    const ranking = entries.reduce(
      (currentRanking, entry) => addRankingEntry(currentRanking, entry),
      [] as readonly ReturnType<typeof createEntry>[]
    )

    expect(ranking).toHaveLength(RANKING_LIMIT)
    expect(ranking[0].score).toBe(11)
    expect(ranking.at(-1)?.score).toBe(2)
  })

  it('reads and writes through storage abstraction', () => {
    const storage = new MemoryStorage()
    const ranking = createLocalRankingStorage(storage)

    const updatedRanking = ranking.add({
      playerName: 'Oskar',
      phoneNumber: '+48 123 456 789',
      score: 420,
      reachedLevel: 3,
      createdAt: '2026-05-21T12:00:00.000Z'
    })

    expect(updatedRanking[0]).toMatchObject({
      playerName: 'Oskar',
      phoneNumber: '+48 123 456 789',
      score: 420,
      reachedLevel: 3
    })
    expect(readLocalRanking(storage)).toHaveLength(1)
  })

  it('clears ranking entries through storage abstraction', () => {
    const storage = new MemoryStorage()
    const ranking = createLocalRankingStorage(storage)

    ranking.add({
      playerName: 'Oskar',
      score: 420,
      reachedLevel: 3,
      createdAt: '2026-05-21T12:00:00.000Z'
    })

    expect(ranking.clear()).toEqual([])
    expect(readLocalRanking(storage)).toEqual([])
  })

  it('keeps old ranking entries without phone numbers valid', () => {
    const storage = new MemoryStorage()

    storage.setItem(
      LOCAL_RANKING_KEY,
      JSON.stringify([
        {
          id: 'old-entry',
          playerName: 'Old',
          score: 100,
          reachedLevel: 1,
          createdAt: '2026-05-21T12:00:00.000Z'
        }
      ])
    )

    const [entry] = readLocalRanking(storage)

    expect(entry.playerName).toBe('Old')
    expect(entry.phoneNumber).toBeUndefined()
  })

  it('returns an empty ranking for invalid storage data', () => {
    const storage = new MemoryStorage()

    storage.setItem(LOCAL_RANKING_KEY, '{bad json')

    expect(readLocalRanking(storage)).toEqual([])
  })
})

function createEntry(playerName: string, score: number, createdAt: string): RankingEntry {
  return createRankingEntry({
    playerName,
    score,
    reachedLevel: 1,
    createdAt
  })
}

class MemoryStorage implements RankingStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}
