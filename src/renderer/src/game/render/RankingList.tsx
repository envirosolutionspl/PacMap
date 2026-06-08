import type { RankingEntry } from '../ranking/rankingTypes'

interface RankingListProps {
  readonly entries: readonly RankingEntry[]
}

export function RankingList({ entries }: RankingListProps): React.JSX.Element {
  if (entries.length === 0) {
    return <p className="ranking-empty">No scores yet</p>
  }

  return (
    <ol className="ranking-list" aria-label="Best scores">
      {entries.map((entry, index) => (
        <li className="ranking-entry" key={entry.id}>
          <span className="ranking-position">{(index + 1).toString().padStart(2, '0')}</span>
          <span className="ranking-player">
            <span className="ranking-name">{entry.playerName}</span>
            {entry.phoneNumber && <span className="ranking-phone">{entry.phoneNumber}</span>}
          </span>
          <span className="ranking-level">L{entry.reachedLevel.toString().padStart(2, '0')}</span>
          <strong className="ranking-score">{entry.score.toString().padStart(4, '0')}</strong>
        </li>
      ))}
    </ol>
  )
}
