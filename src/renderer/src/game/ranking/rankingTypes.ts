export interface RankingEntry {
  readonly id: string
  readonly playerName: string
  readonly phoneNumber?: string
  readonly score: number
  readonly reachedLevel: number
  readonly createdAt: string
}

export interface NewRankingEntry {
  readonly playerName: string
  readonly phoneNumber?: string
  readonly score: number
  readonly reachedLevel: number
  readonly createdAt?: string
}

export interface RankingStorage {
  readonly list: () => readonly RankingEntry[]
  readonly add: (entry: NewRankingEntry) => readonly RankingEntry[]
  readonly clear: () => readonly RankingEntry[]
}

export interface RankingStorageLike {
  readonly getItem: (key: string) => string | null
  readonly setItem: (key: string, value: string) => void
}
