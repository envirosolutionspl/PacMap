interface GameOverOverlayProps {
  readonly playerName: string
  readonly score: number
  readonly elapsedTimeMs: number
}

export function GameOverOverlay({
  playerName,
  score,
  elapsedTimeMs
}: GameOverOverlayProps): React.JSX.Element {
  return (
    <div className="game-overlay" role="status" aria-live="polite">
      <div className="game-overlay-panel game-over-panel game-over-result-panel">
        <span className="game-overlay-label">Game over</span>
        <strong className="game-overlay-score game-over-final-score">{formatScore(score)}</strong>

        <dl className="game-over-result">
          <div className="game-over-result-row">
            <dt>Nick</dt>
            <dd>{playerName}</dd>
          </div>
          <div className="game-over-result-row">
            <dt>Points</dt>
            <dd>{formatScore(score)}</dd>
          </div>
          <div className="game-over-result-row">
            <dt>Time</dt>
            <dd>{formatGameTime(elapsedTimeMs)}</dd>
          </div>
        </dl>

        <span className="game-overlay-note">Returning to menu</span>
      </div>
    </div>
  )
}

function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toLocaleString('en-US')
}

function formatGameTime(elapsedTimeMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedTimeMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
