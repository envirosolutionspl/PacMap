interface HudProps {
  readonly levelLabel: string
  readonly score: number
  readonly lives: number
  readonly remainingTimeSeconds?: number | null
}

export function Hud({
  levelLabel,
  score,
  lives,
  remainingTimeSeconds = null
}: HudProps): React.JSX.Element {
  return (
    <header className="game-hud">
      <div className="hud-score" aria-label={`Score ${score}`}>
        <span className="hud-score-label">Score</span>
        <strong className="hud-score-value hud-value-pulse" key={score}>
          {formatScore(score)}
        </strong>
      </div>
      <div className="hud-level" aria-label={levelLabel}>
        <strong className="hud-level-value">{levelLabel}</strong>
      </div>
      <div className="hud-status">
        <div className="hud-lives" aria-label={`${lives} lives`}>
          {Array.from({ length: Math.max(0, lives) }, (_, index) => (
            <span className="hud-heart hud-value-pulse" aria-hidden="true" key={index}>
              ♥
            </span>
          ))}
        </div>
        {remainingTimeSeconds !== null && (
          <div
            className={`hud-timer${remainingTimeSeconds <= 10 ? ' hud-timer-low' : ''}`}
            aria-label={`Time ${formatTime(remainingTimeSeconds)}`}
          >
            <span className="hud-score-label">Time</span>
            <strong className="hud-timer-value hud-value-pulse" key={remainingTimeSeconds}>
              {formatTime(remainingTimeSeconds)}
            </strong>
          </div>
        )}
      </div>
    </header>
  )
}

function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toLocaleString('en-US')
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
