import { CITY_BIOME_LAYOUT_OPTIONS, type CityBiomeLayoutKind } from '../entities/cityBiomeLayout'

interface BiomeControlPanelProps {
  readonly selectedKind: CityBiomeLayoutKind
  readonly levelIndex: number
  readonly totalLevels: number
  readonly onBiomeKindChange: (kind: CityBiomeLayoutKind) => void
  readonly onReroll: () => void
  readonly onPreviousLevel: () => void
  readonly onNextLevel: () => void
}

export function BiomeControlPanel({
  selectedKind,
  levelIndex,
  totalLevels,
  onBiomeKindChange,
  onReroll,
  onPreviousLevel,
  onNextLevel
}: BiomeControlPanelProps): React.JSX.Element {
  const canGoToPreviousLevel = levelIndex > 0
  const canGoToNextLevel = levelIndex + 1 < totalLevels

  return (
    <aside className="godmode-biome-panel" aria-label="GodMode biomes">
      <div className="godmode-biome-header">
        <span className="godmode-biome-kicker">GodMode</span>
        <h2 className="godmode-biome-title">Biomy</h2>
      </div>
      <div className="godmode-biome-options" role="group" aria-label="Biome">
        {CITY_BIOME_LAYOUT_OPTIONS.map((option) => {
          const isActive = option.kind === selectedKind

          return (
            <button
              className={`godmode-biome-option${isActive ? ' godmode-biome-option-active' : ''}`}
              key={option.kind}
              type="button"
              aria-pressed={isActive}
              onClick={() => onBiomeKindChange(option.kind)}
            >
              <span className="godmode-biome-option-label">{option.label}</span>
              <span className="godmode-biome-option-description">{option.description}</span>
            </button>
          )
        })}
      </div>
      <button className="godmode-biome-reroll" type="button" onClick={onReroll}>
        Losuj układ
      </button>
      <div className="godmode-level-panel">
        <div className="godmode-level-header">
          <span className="godmode-level-title">Levele</span>
          <span className="godmode-level-status">
            {levelIndex + 1} / {totalLevels}
          </span>
        </div>
        <div className="godmode-level-actions">
          <button
            className="godmode-level-action"
            type="button"
            disabled={!canGoToPreviousLevel}
            onClick={onPreviousLevel}
          >
            Poprzedni
          </button>
          <button
            className="godmode-level-action"
            type="button"
            disabled={!canGoToNextLevel}
            onClick={onNextLevel}
          >
            Następny
          </button>
        </div>
      </div>
    </aside>
  )
}
