interface LevelCompleteOverlayProps {
  readonly score: number
  readonly levelName: string
  readonly nextLevelName: string | null
  readonly isFinalLevel: boolean
}

export function LevelCompleteOverlay({
  score,
  levelName,
  nextLevelName,
  isFinalLevel
}: LevelCompleteOverlayProps): React.JSX.Element {
  return (
    <div className="game-overlay" role="status" aria-live="polite">
      <div className="game-overlay-panel">
        <span className="game-overlay-label">{isFinalLevel ? 'Victory' : 'Level clear'}</span>
        <span className="game-overlay-level-name">{levelName}</span>
        <strong className="game-overlay-score">{score.toString().padStart(4, '0')}</strong>
        {!isFinalLevel && nextLevelName && (
          <span className="game-overlay-note">{nextLevelName}</span>
        )}
      </div>
    </div>
  )
}
