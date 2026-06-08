import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState
} from 'react'

import { BonusPellet } from '../entities/BonusPellet'
import { Ghost } from '../entities/Ghost'
import { Pellet } from '../entities/Pellet'
import { Player } from '../entities/Player'
import { PowerPellet } from '../entities/PowerPellet'
import type { CollectibleState, GhostState, PlayerState } from '../engine/types'
import { normalizePhoneNumber, normalizePlayerName } from '../ranking/localRanking'
import type { RankingEntry } from '../ranking/rankingTypes'
import { CompanyLogo } from './CompanyLogo'
import { RankingList } from './RankingList'

type MenuView = 'main' | 'settings' | 'scores' | 'player' | 'tutorial'

interface TutorialStep {
  readonly title: string
  readonly text: string
  readonly visual: 'controls' | 'collectibles' | 'costs'
}

const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    title: 'Klawisze i poruszanie się',
    text: 'Steruj PacMapem strzałkami lub klawiszami WASD.',
    visual: 'controls'
  },
  {
    title: 'Punkty, Projekty, OpenSource',
    text: 'Zbieraj Punkty, Projekty oraz OpenSource, które pozwolą Ci pokonać koszty.',
    visual: 'collectibles'
  },
  {
    title: 'Koszty',
    text: 'Unikaj Kosztów! Z pomocą QGIS możesz je skutecznie zwalczać!',
    visual: 'costs'
  }
]

const TUTORIAL_TILE_SIZE = 42
const MENU_BACKDROP_PLAYER_TILE_SIZE = 50.6
const MENU_BACKDROP_GHOST_TILE_SIZE = 50.6
const MENU_BACKDROP_GHOST_SCALE = 1.15
const MENU_BACKDROP_QGIS_TILE_SIZE = 55.04
const MENU_BACKDROP_MAP_TILE_SIZE = MENU_BACKDROP_QGIS_TILE_SIZE
const PLAYER_DETAILS_REQUIRED_STATUS = 'Name and phone are required'
const PLAYER_DETAILS_DUPLICATE_STATUS =
  'This name and phone already have a score. Clear scores to play again.'

const TUTORIAL_PLAYER: PlayerState = {
  id: 'tutorial-player',
  kind: 'player',
  spawn: { row: 0, col: 0 },
  position: { x: 114, y: 56 },
  tile: { row: 0, col: 0 },
  direction: 'right',
  nextDirection: 'right',
  speed: 0,
  lives: 3,
  status: 'moving'
}

const MENU_BACKDROP_PLAYER_RIGHT = createMenuPlayer('menu-backdrop-player-right', 'right')
const MENU_BACKDROP_PLAYER_LEFT = createMenuPlayer('menu-backdrop-player-left', 'left')
const MENU_BACKDROP_PLAYER_UP = createMenuPlayer('menu-backdrop-player-up', 'up')
const MENU_BACKDROP_PLAYER_DOWN = createMenuPlayer('menu-backdrop-player-down', 'down')
const MENU_BACKDROP_GHOST_CHASER_RIGHT = createMenuGhost(
  'menu-backdrop-chaser-right',
  'chaserGhost',
  'normal',
  'right'
)
const MENU_BACKDROP_GHOST_WANDERER_RIGHT = createMenuGhost(
  'menu-backdrop-wanderer-right',
  'wandererGhost',
  'normal',
  'right'
)
const MENU_BACKDROP_GHOST_CHASER_LEFT = createMenuGhost(
  'menu-backdrop-chaser-left',
  'chaserGhost',
  'normal',
  'left'
)
const MENU_BACKDROP_GHOST_WANDERER_LEFT = createMenuGhost(
  'menu-backdrop-wanderer-left',
  'wandererGhost',
  'normal',
  'left'
)
const MENU_BACKDROP_GHOST_RANDOM_NORMAL_LEFT = createMenuGhost(
  'menu-backdrop-random-normal-left',
  'randomGhost',
  'normal',
  'left'
)
const MENU_BACKDROP_GHOST_AMBUSHER_NORMAL_LEFT = createMenuGhost(
  'menu-backdrop-ambusher-normal-left',
  'ambusherGhost',
  'normal',
  'left'
)
const MENU_BACKDROP_GHOST_RANDOM_LEFT = createMenuGhost(
  'menu-backdrop-random-left',
  'randomGhost',
  'frightened',
  'left'
)
const MENU_BACKDROP_GHOST_AMBUSHER_LEFT = createMenuGhost(
  'menu-backdrop-ambusher-left',
  'ambusherGhost',
  'frightened',
  'left'
)
const MENU_BACKDROP_QGIS: CollectibleState = {
  id: 'menu-backdrop-qgis',
  kind: 'powerPellet',
  position: { row: 0, col: 0 },
  score: 0,
  collected: false
}
const MENU_BACKDROP_MAP: CollectibleState = {
  id: 'menu-backdrop-map',
  kind: 'bonusPellet',
  position: { row: 0, col: 0 },
  score: 0,
  collected: false
}

const TUTORIAL_PELLET: CollectibleState = {
  id: 'tutorial-pellet',
  kind: 'pellet',
  position: { row: 0, col: 0 },
  score: 10,
  collected: false
}

const TUTORIAL_PROJECT: CollectibleState = {
  id: 'tutorial-project',
  kind: 'bonusPellet',
  position: { row: 0, col: 0 },
  score: 30,
  collected: false
}

const TUTORIAL_OPEN_SOURCE: CollectibleState = {
  id: 'tutorial-open-source',
  kind: 'powerPellet',
  position: { row: 0, col: 0 },
  score: 100,
  collected: false
}

interface StartOverlayProps {
  readonly ghostSkinLabel: string
  readonly isAudioMuted: boolean
  readonly playerName: string
  readonly phoneNumber: string
  readonly rankings: readonly RankingEntry[]
  readonly rankingFilePath: string | null
  readonly rankingFileStatus: string | null
  readonly isRankingFileSupported: boolean
  readonly isRankingFileSaving: boolean
  readonly isGodModeEnabled: boolean
  readonly isTimedModeEnabled: boolean
  readonly menuMusicVolume: number
  readonly gameMusicVolume: number
  readonly timeLimitMinutes: readonly number[]
  readonly onStart: () => void
  readonly onPlayerNameChange: (playerName: string) => void
  readonly onPhoneNumberChange: (phoneNumber: string) => void
  readonly onCycleGhostSkin: () => void
  readonly onToggleAudio: () => void
  readonly onMenuMusicVolumeChange: (volume: number) => void
  readonly onGameMusicVolumeChange: (volume: number) => void
  readonly onClearRankings: () => void
  readonly onVerifyClearRankingsPassword: (password: string) => boolean
  readonly onChooseRankingFile: () => void
  readonly onVerifyGodModePassword: (password: string) => boolean
  readonly onDisableGodMode: () => void
  readonly onToggleTimedMode: (password: string) => boolean
  readonly onTimeLimitMinutesChange: (levelIndex: number, minutes: number) => void
}

export function StartOverlay({
  ghostSkinLabel,
  isAudioMuted,
  playerName,
  phoneNumber,
  rankings,
  rankingFilePath,
  rankingFileStatus,
  isRankingFileSupported,
  isRankingFileSaving,
  isGodModeEnabled,
  isTimedModeEnabled,
  menuMusicVolume,
  gameMusicVolume,
  timeLimitMinutes,
  onStart,
  onPlayerNameChange,
  onPhoneNumberChange,
  onCycleGhostSkin,
  onToggleAudio,
  onMenuMusicVolumeChange,
  onGameMusicVolumeChange,
  onClearRankings,
  onVerifyClearRankingsPassword,
  onChooseRankingFile,
  onVerifyGodModePassword,
  onDisableGodMode,
  onToggleTimedMode,
  onTimeLimitMinutesChange
}: StartOverlayProps): React.JSX.Element {
  const [view, setView] = useState<MenuView>('main')
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    focusFirstMenuElement(panelRef.current)
  }, [tutorialStepIndex, view])

  const openTutorial = (): void => {
    setTutorialStepIndex(0)
    setView('tutorial')
  }

  const openMenuView = (nextView: MenuView): void => {
    if (nextView === 'player') {
      onPlayerNameChange('')
      onPhoneNumberChange('')
    }

    setView(nextView)
  }

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (isTextInputTarget(event.target)) {
      return
    }

    if (!isMenuNavigationKey(event.key)) {
      return
    }

    const buttons = getMenuButtons(panelRef.current)

    if (buttons.length === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const activeIndex = buttons.findIndex((button) => button === document.activeElement)

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      buttons[Math.max(activeIndex, 0)].click()
      return
    }

    const step = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1
    const nextIndex = activeIndex === -1 ? 0 : wrapIndex(activeIndex + step, buttons.length)

    buttons[nextIndex].focus()
  }

  return (
    <div
      className="game-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      onKeyDown={handleMenuKeyDown}
    >
      <div className={`game-overlay-panel main-menu-panel main-menu-panel-${view}`} ref={panelRef}>
        <CompanyLogo variant="menu" />
        <span className="game-overlay-label">PacMap</span>
        {view === 'main' && <MainMenu onOpenView={openMenuView} />}
        {view === 'player' && (
          <PlayerMenu
            playerName={playerName}
            phoneNumber={phoneNumber}
            rankings={rankings}
            onPlayerNameChange={onPlayerNameChange}
            onPhoneNumberChange={onPhoneNumberChange}
            onContinue={openTutorial}
            onBack={() => setView('main')}
          />
        )}
        {view === 'tutorial' && (
          <TutorialMenu
            stepIndex={tutorialStepIndex}
            onBack={() => {
              if (tutorialStepIndex === 0) {
                setView('player')
                return
              }

              setTutorialStepIndex((currentStepIndex) => currentStepIndex - 1)
            }}
            onNext={() => setTutorialStepIndex((currentStepIndex) => currentStepIndex + 1)}
            onStart={onStart}
          />
        )}
        {view === 'settings' && (
          <SettingsMenu
            ghostSkinLabel={ghostSkinLabel}
            isAudioMuted={isAudioMuted}
            rankingFilePath={rankingFilePath}
            rankingFileStatus={rankingFileStatus}
            isRankingFileSupported={isRankingFileSupported}
            isRankingFileSaving={isRankingFileSaving}
            isGodModeEnabled={isGodModeEnabled}
            isTimedModeEnabled={isTimedModeEnabled}
            menuMusicVolume={menuMusicVolume}
            gameMusicVolume={gameMusicVolume}
            timeLimitMinutes={timeLimitMinutes}
            onCycleGhostSkin={onCycleGhostSkin}
            onToggleAudio={onToggleAudio}
            onMenuMusicVolumeChange={onMenuMusicVolumeChange}
            onGameMusicVolumeChange={onGameMusicVolumeChange}
            onChooseRankingFile={onChooseRankingFile}
            onVerifyGodModePassword={onVerifyGodModePassword}
            onDisableGodMode={onDisableGodMode}
            onToggleTimedMode={onToggleTimedMode}
            onTimeLimitMinutesChange={onTimeLimitMinutesChange}
            onBack={() => setView('main')}
          />
        )}
        {view === 'scores' && (
          <ScoresMenu
            rankings={rankings}
            onClearRankings={onClearRankings}
            onVerifyClearRankingsPassword={onVerifyClearRankingsPassword}
            onBack={() => setView('main')}
          />
        )}
      </div>
    </div>
  )
}

export function MainMenuBackdrop(): React.JSX.Element {
  return (
    <div className="main-menu-backdrop" aria-hidden="true">
      <svg
        className="main-menu-backdrop-svg"
        viewBox="0 0 1000 720"
        preserveAspectRatio="none"
        focusable="false"
      >
        <g className="main-menu-chase main-menu-chase-ghosts" transform="translate(-260 84)">
          <animateTransform
            id="main-menu-chase-ghosts-animation"
            attributeName="transform"
            begin="0s; main-menu-ghost-parade-animation.end + 0.45s"
            dur="9s"
            fill="freeze"
            type="translate"
            values="-260 84; 1320 84"
          />
          <Player
            player={MENU_BACKDROP_PLAYER_RIGHT}
            tileSize={MENU_BACKDROP_PLAYER_TILE_SIZE}
            skinId="player-default"
          />
          <g transform="translate(-86 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_CHASER_RIGHT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={0}
                skinId="ghost-default"
              />
            </g>
          </g>
          <g transform="translate(-164 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_WANDERER_RIGHT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={1}
                skinId="ghost-default"
              />
            </g>
          </g>
        </g>

        <g className="main-menu-chase main-menu-chase-player" transform="translate(1260 622)">
          <animateTransform
            id="main-menu-chase-player-animation"
            attributeName="transform"
            begin="main-menu-chase-ghosts-animation.end + 0.45s"
            dur="10.5s"
            fill="freeze"
            type="translate"
            values="1260 622; -360 622"
          />
          <g transform="translate(136 0)">
            <Player
              player={MENU_BACKDROP_PLAYER_LEFT}
              tileSize={MENU_BACKDROP_PLAYER_TILE_SIZE}
              skinId="player-default"
            />
          </g>
          <g transform="translate(83 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_RANDOM_LEFT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={2}
                skinId="ghost-default"
              />
            </g>
          </g>
          <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
            <Ghost
              ghost={MENU_BACKDROP_GHOST_AMBUSHER_LEFT}
              tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
              index={3}
              skinId="ghost-default"
            />
          </g>
        </g>

        <g className="main-menu-chase main-menu-chase-qgis">
          <g className="main-menu-qgis-target" transform="translate(747 337)" opacity="0">
            <animate
              attributeName="opacity"
              begin="main-menu-chase-player-animation.end + 0.45s"
              calcMode="discrete"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;0.46;1"
              values="1;0;0"
            />
            <PowerPellet collectible={MENU_BACKDROP_QGIS} tileSize={MENU_BACKDROP_QGIS_TILE_SIZE} />
          </g>

          <g className="main-menu-qgis-player" transform="translate(775 850)" opacity="0">
            <animate
              attributeName="opacity"
              begin="main-menu-chase-player-animation.end + 0.45s"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;0.98;1"
              values="1;1;0"
            />
            <animateTransform
              id="main-menu-qgis-exit-animation"
              attributeName="transform"
              begin="main-menu-chase-player-animation.end + 0.45s"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;1"
              type="translate"
              values="775 850; 775 -170"
            />
            <Player
              player={MENU_BACKDROP_PLAYER_UP}
              tileSize={MENU_BACKDROP_PLAYER_TILE_SIZE}
              skinId="player-default"
            />
          </g>
        </g>

        <g className="main-menu-chase main-menu-chase-map">
          <g className="main-menu-map-target" transform="translate(198 337)" opacity="0">
            <animate
              attributeName="opacity"
              begin="main-menu-qgis-exit-animation.end + 0.45s"
              calcMode="discrete"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;0.5;1"
              values="1;0;0"
            />
            <BonusPellet collectible={MENU_BACKDROP_MAP} tileSize={MENU_BACKDROP_MAP_TILE_SIZE} />
          </g>

          <g className="main-menu-map-player" transform="translate(225 -170)" opacity="0">
            <animate
              attributeName="opacity"
              begin="main-menu-qgis-exit-animation.end + 0.45s"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;0.98;1"
              values="1;1;0"
            />
            <animateTransform
              id="main-menu-map-exit-animation"
              attributeName="transform"
              begin="main-menu-qgis-exit-animation.end + 0.45s"
              dur="7.6s"
              fill="freeze"
              keyTimes="0;1"
              type="translate"
              values="225 -170; 225 850"
            />
            <Player
              player={MENU_BACKDROP_PLAYER_DOWN}
              tileSize={MENU_BACKDROP_PLAYER_TILE_SIZE}
              skinId="player-default"
            />
          </g>
        </g>

        <g className="main-menu-chase main-menu-ghost-parade" transform="translate(1280 58)">
          <animateTransform
            id="main-menu-ghost-parade-animation"
            attributeName="transform"
            begin="main-menu-map-exit-animation.end + 0.45s"
            dur="9s"
            fill="freeze"
            type="translate"
            values="1280 58; -420 58"
          />
          <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
            <Ghost
              ghost={MENU_BACKDROP_GHOST_CHASER_LEFT}
              tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
              index={0}
              skinId="ghost-default"
            />
          </g>
          <g transform="translate(78 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_WANDERER_LEFT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={1}
                skinId="ghost-default"
              />
            </g>
          </g>
          <g transform="translate(156 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_RANDOM_NORMAL_LEFT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={2}
                skinId="ghost-default"
              />
            </g>
          </g>
          <g transform="translate(234 0)">
            <g transform={`scale(${MENU_BACKDROP_GHOST_SCALE})`}>
              <Ghost
                ghost={MENU_BACKDROP_GHOST_AMBUSHER_NORMAL_LEFT}
                tileSize={MENU_BACKDROP_GHOST_TILE_SIZE}
                index={3}
                skinId="ghost-default"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}

function MainMenu({
  onOpenView
}: {
  readonly onOpenView: (view: MenuView) => void
}): React.JSX.Element {
  return (
    <>
      <div className="game-overlay-actions game-overlay-actions-column">
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-primary"
          type="button"
          autoFocus
          onClick={() => onOpenView('player')}
        >
          New game
        </button>
        <button
          data-menu-item
          className="game-overlay-action"
          type="button"
          onClick={() => onOpenView('settings')}
        >
          Settings
        </button>
        <button
          data-menu-item
          className="game-overlay-action"
          type="button"
          onClick={() => onOpenView('scores')}
        >
          Scores
        </button>
      </div>
    </>
  )
}

function PlayerMenu({
  playerName,
  phoneNumber,
  rankings,
  onPlayerNameChange,
  onPhoneNumberChange,
  onContinue,
  onBack
}: {
  readonly playerName: string
  readonly phoneNumber: string
  readonly rankings: readonly RankingEntry[]
  readonly onPlayerNameChange: (playerName: string) => void
  readonly onPhoneNumberChange: (phoneNumber: string) => void
  readonly onContinue: () => void
  readonly onBack: () => void
}): React.JSX.Element {
  const [validationStatus, setValidationStatus] = useState<string | null>(null)
  const isPlayerNameMissing = playerName.trim().length === 0
  const isPhoneNumberMissing = phoneNumber.trim().length === 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (isPlayerNameMissing || isPhoneNumberMissing) {
      setValidationStatus(PLAYER_DETAILS_REQUIRED_STATUS)
      return
    }

    if (hasRankingEntryForPlayerDetails(rankings, playerName, phoneNumber)) {
      setValidationStatus(PLAYER_DETAILS_DUPLICATE_STATUS)
      return
    }

    setValidationStatus(null)
    onContinue()
  }

  return (
    <>
      <strong className="game-overlay-score">Player details</strong>
      <form className="ranking-form menu-ranking-form" noValidate onSubmit={handleSubmit}>
        <label className="ranking-label" htmlFor="start-player-name">
          Name
        </label>
        <div className="ranking-form-row ranking-form-row-single">
          <input
            className="ranking-input"
            id="start-player-name"
            data-menu-autofocus
            maxLength={12}
            required
            aria-describedby={validationStatus ? 'player-details-validation' : undefined}
            aria-invalid={validationStatus !== null && isPlayerNameMissing}
            value={playerName}
            onChange={(event) => {
              setValidationStatus(null)
              onPlayerNameChange(event.target.value)
            }}
          />
        </div>
        <label className="ranking-label ranking-label-secondary" htmlFor="start-phone-number">
          Phone
        </label>
        <div className="ranking-form-row ranking-form-row-single">
          <input
            className="ranking-input"
            id="start-phone-number"
            maxLength={18}
            required
            aria-describedby={validationStatus ? 'player-details-validation' : undefined}
            aria-invalid={validationStatus !== null && isPhoneNumberMissing}
            type="tel"
            value={phoneNumber}
            onChange={(event) => {
              setValidationStatus(null)
              onPhoneNumberChange(event.target.value)
            }}
          />
        </div>
        {validationStatus && (
          <span className="settings-file-status" id="player-details-validation" role="alert">
            {validationStatus}
          </span>
        )}
        <div className="game-overlay-actions game-overlay-actions-column">
          <button
            data-menu-item
            className="game-overlay-action game-overlay-action-primary"
            type="submit"
          >
            Continue
          </button>
          <button data-menu-item className="game-overlay-action" type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </>
  )
}

function hasRankingEntryForPlayerDetails(
  rankings: readonly RankingEntry[],
  playerName: string,
  phoneNumber: string
): boolean {
  const normalizedPlayerName = normalizePlayerName(playerName).toLocaleLowerCase()
  const normalizedPhoneNumber = normalizeComparablePhoneNumber(phoneNumber)

  return rankings.some(
    (entry) =>
      normalizePlayerName(entry.playerName).toLocaleLowerCase() === normalizedPlayerName &&
      normalizeComparablePhoneNumber(entry.phoneNumber ?? '') === normalizedPhoneNumber
  )
}

function normalizeComparablePhoneNumber(phoneNumber: string): string {
  return normalizePhoneNumber(phoneNumber).replace(/\D/g, '')
}

function TutorialMenu({
  stepIndex,
  onBack,
  onNext,
  onStart
}: {
  readonly stepIndex: number
  readonly onBack: () => void
  readonly onNext: () => void
  readonly onStart: () => void
}): React.JSX.Element {
  const step = TUTORIAL_STEPS[stepIndex] ?? TUTORIAL_STEPS[0]
  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1

  return (
    <>
      <strong className="game-overlay-score">Tutorial</strong>
      <section className="tutorial-panel" aria-label={`Tutorial step ${stepIndex + 1}`}>
        <span className="tutorial-progress">
          {stepIndex + 1}/{TUTORIAL_STEPS.length}
        </span>
        <TutorialVisual visual={step.visual} />
        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-text">{step.text}</p>
      </section>
      <div className="game-overlay-actions tutorial-actions">
        <button
          data-menu-item
          className="game-overlay-action tutorial-action-back"
          type="button"
          onClick={onBack}
        >
          Back
        </button>
        {isLastStep ? (
          <button
            data-menu-item
            className="game-overlay-action game-overlay-action-primary tutorial-action-forward"
            type="button"
            onClick={onStart}
          >
            Start first level
          </button>
        ) : (
          <button
            data-menu-item
            className="game-overlay-action game-overlay-action-primary tutorial-action-forward"
            type="button"
            onClick={onNext}
          >
            Next
          </button>
        )}
      </div>
    </>
  )
}

function TutorialVisual({
  visual
}: {
  readonly visual: TutorialStep['visual']
}): React.JSX.Element {
  switch (visual) {
    case 'controls':
      return <TutorialControlsVisual />
    case 'collectibles':
      return <TutorialCollectiblesVisual />
    case 'costs':
      return <TutorialCostsVisual />
  }
}

function TutorialControlsVisual(): React.JSX.Element {
  return (
    <div className="tutorial-visual tutorial-controls-visual" aria-hidden="true">
      <div className="tutorial-keypad">
        <span className="tutorial-key tutorial-key-spacer" />
        <span className="tutorial-key">↑</span>
        <span className="tutorial-key tutorial-key-spacer" />
        <span className="tutorial-key">←</span>
        <span className="tutorial-key">↓</span>
        <span className="tutorial-key">→</span>
      </div>
      <div className="tutorial-keypad tutorial-keypad-wasd">
        <span className="tutorial-key tutorial-key-spacer" />
        <span className="tutorial-key">W</span>
        <span className="tutorial-key tutorial-key-spacer" />
        <span className="tutorial-key">A</span>
        <span className="tutorial-key">S</span>
        <span className="tutorial-key">D</span>
      </div>
      <svg className="tutorial-visual-svg tutorial-controls-svg" viewBox="0 0 180 96">
        <Player player={TUTORIAL_PLAYER} tileSize={48} skinId="player-default" />
      </svg>
    </div>
  )
}

function TutorialCollectiblesVisual(): React.JSX.Element {
  return (
    <div className="tutorial-visual tutorial-collectibles-visual" aria-hidden="true">
      <div className="tutorial-collectible-items">
        <div className="tutorial-collectible-item">
          <svg className="tutorial-collectible-icon" viewBox="0 0 64 64">
            <g transform="translate(11 11)">
              <Pellet collectible={TUTORIAL_PELLET} tileSize={TUTORIAL_TILE_SIZE} />
            </g>
          </svg>
          <span className="tutorial-collectible-label">Punkty</span>
        </div>
        <div className="tutorial-collectible-item">
          <svg className="tutorial-collectible-icon" viewBox="0 0 64 64">
            <g transform="translate(11 11)">
              <BonusPellet collectible={TUTORIAL_PROJECT} tileSize={TUTORIAL_TILE_SIZE} />
            </g>
          </svg>
          <span className="tutorial-collectible-label">Projekty</span>
        </div>
        <div className="tutorial-collectible-item">
          <svg className="tutorial-collectible-icon" viewBox="0 0 64 64">
            <g transform="translate(11 11)">
              <PowerPellet collectible={TUTORIAL_OPEN_SOURCE} tileSize={TUTORIAL_TILE_SIZE} />
            </g>
          </svg>
          <span className="tutorial-collectible-label">OpenSource</span>
        </div>
      </div>
    </div>
  )
}

function TutorialCostsVisual(): React.JSX.Element {
  return (
    <div className="tutorial-visual" aria-hidden="true">
      <svg className="tutorial-visual-svg tutorial-costs-svg" viewBox="0 0 220 88">
        <Ghost
          ghost={createTutorialGhost('tutorial-cost-1', 'randomGhost', { x: 58, y: 44 })}
          tileSize={50}
          index={0}
          skinId="ghost-default"
        />
        <Ghost
          ghost={createTutorialGhost('tutorial-cost-2', 'wandererGhost', { x: 110, y: 44 })}
          tileSize={50}
          index={1}
          skinId="ghost-default"
        />
        <Ghost
          ghost={createTutorialGhost('tutorial-cost-3', 'ambusherGhost', { x: 162, y: 44 })}
          tileSize={50}
          index={2}
          skinId="ghost-default"
        />
      </svg>
      <div className="tutorial-visual-labels tutorial-visual-labels-single">
        <span>Koszty</span>
      </div>
    </div>
  )
}

function createTutorialGhost(
  id: string,
  type: GhostState['type'],
  position: GhostState['position']
): GhostState {
  return {
    id,
    kind: 'ghost',
    type,
    mode: 'normal',
    spawn: { row: 0, col: 0 },
    position,
    tile: { row: 0, col: 0 },
    direction: 'left',
    nextDirection: 'left',
    speed: 0,
    baseSpeed: 0
  }
}

function createMenuPlayer(id: string, direction: PlayerState['direction']): PlayerState {
  return {
    id,
    kind: 'player',
    spawn: { row: 0, col: 0 },
    position: { x: 0, y: 0 },
    tile: { row: 0, col: 0 },
    direction,
    nextDirection: direction,
    speed: 0,
    lives: 3,
    status: 'moving'
  }
}

function createMenuGhost(
  id: string,
  type: GhostState['type'],
  mode: GhostState['mode'],
  direction: GhostState['direction']
): GhostState {
  return {
    id,
    kind: 'ghost',
    type,
    mode,
    spawn: { row: 0, col: 0 },
    position: { x: 0, y: 0 },
    tile: { row: 0, col: 0 },
    direction,
    nextDirection: direction,
    speed: 0,
    baseSpeed: 0
  }
}

function SettingsMenu({
  ghostSkinLabel,
  isAudioMuted,
  rankingFilePath,
  rankingFileStatus,
  isRankingFileSupported,
  isRankingFileSaving,
  isGodModeEnabled,
  isTimedModeEnabled,
  menuMusicVolume,
  gameMusicVolume,
  timeLimitMinutes,
  onCycleGhostSkin,
  onToggleAudio,
  onMenuMusicVolumeChange,
  onGameMusicVolumeChange,
  onChooseRankingFile,
  onVerifyGodModePassword,
  onDisableGodMode,
  onToggleTimedMode,
  onTimeLimitMinutesChange,
  onBack
}: {
  readonly ghostSkinLabel: string
  readonly isAudioMuted: boolean
  readonly rankingFilePath: string | null
  readonly rankingFileStatus: string | null
  readonly isRankingFileSupported: boolean
  readonly isRankingFileSaving: boolean
  readonly isGodModeEnabled: boolean
  readonly isTimedModeEnabled: boolean
  readonly menuMusicVolume: number
  readonly gameMusicVolume: number
  readonly timeLimitMinutes: readonly number[]
  readonly onCycleGhostSkin: () => void
  readonly onToggleAudio: () => void
  readonly onMenuMusicVolumeChange: (volume: number) => void
  readonly onGameMusicVolumeChange: (volume: number) => void
  readonly onChooseRankingFile: () => void
  readonly onVerifyGodModePassword: (password: string) => boolean
  readonly onDisableGodMode: () => void
  readonly onToggleTimedMode: (password: string) => boolean
  readonly onTimeLimitMinutesChange: (levelIndex: number, minutes: number) => void
  readonly onBack: () => void
}): React.JSX.Element {
  const [godModePassword, setGodModePassword] = useState('')
  const [godModeStatus, setGodModeStatus] = useState<string | null>(null)
  const [timedModePassword, setTimedModePassword] = useState('')
  const [timedModeStatus, setTimedModeStatus] = useState<string | null>(null)

  const handleGodModeSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (isGodModeEnabled) {
      onDisableGodMode()
      setGodModePassword('')
      setGodModeStatus('GodMode disabled')
      return
    }

    if (onVerifyGodModePassword(godModePassword)) {
      setGodModePassword('')
      setGodModeStatus('GodMode enabled')
      return
    }

    setGodModeStatus('Wrong GodMode password')
  }

  const handleTimedModeSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (onToggleTimedMode(timedModePassword)) {
      setTimedModePassword('')
      setTimedModeStatus(isTimedModeEnabled ? 'Time limits disabled' : 'Time limits enabled')
      return
    }

    setTimedModeStatus('Wrong time password')
  }

  return (
    <>
      <strong className="game-overlay-score">Settings</strong>
      <div className="settings-file" aria-live="polite">
        <span className="settings-file-label">Scores file</span>
        <span className="settings-file-path" title={rankingFilePath ?? undefined}>
          {rankingFilePath ?? 'Not selected'}
        </span>
        {rankingFileStatus && <span className="settings-file-status">{rankingFileStatus}</span>}
      </div>
      <div className="settings-volume-panel">
        <span className="settings-file-label">Volume</span>
        <VolumeControl
          id="menu-music-volume"
          label="Main menu"
          value={menuMusicVolume}
          onChange={onMenuMusicVolumeChange}
        />
        <VolumeControl
          id="game-music-volume"
          label="Game"
          value={gameMusicVolume}
          onChange={onGameMusicVolumeChange}
        />
      </div>
      <form className="settings-godmode" onSubmit={handleGodModeSubmit}>
        <div className="settings-godmode-header">
          <label className="settings-file-label" htmlFor="god-mode-password">
            GodMode
          </label>
          <span className={isGodModeEnabled ? 'settings-godmode-on' : 'settings-godmode-off'}>
            {isGodModeEnabled ? 'Enabled' : 'Locked'}
          </span>
        </div>
        {!isGodModeEnabled && (
          <input
            className="ranking-input settings-godmode-input"
            id="god-mode-password"
            type="password"
            value={godModePassword}
            onChange={(event) => {
              setGodModePassword(event.target.value)
              setGodModeStatus(null)
            }}
          />
        )}
        {godModeStatus && <span className="settings-file-status">{godModeStatus}</span>}
        <button
          data-menu-item
          className={
            isGodModeEnabled
              ? 'game-overlay-action'
              : 'game-overlay-action game-overlay-action-secondary'
          }
          type="submit"
        >
          {isGodModeEnabled ? 'Disable GodMode' : 'Enable GodMode'}
        </button>
      </form>
      <form className="settings-timemode" onSubmit={handleTimedModeSubmit}>
        <div className="settings-godmode-header">
          <label className="settings-file-label" htmlFor="timed-mode-password">
            Time limits
          </label>
          <span className={isTimedModeEnabled ? 'settings-godmode-on' : 'settings-godmode-off'}>
            {isTimedModeEnabled ? 'Enabled' : 'Off'}
          </span>
        </div>
        <div className="settings-time-grid">
          {timeLimitMinutes.map((minutes, index) => (
            <label className="settings-time-limit" htmlFor={`time-limit-${index}`} key={index}>
              <span>{index + 1}</span>
              <input
                className="ranking-input settings-time-input"
                id={`time-limit-${index}`}
                min={0.25}
                max={30}
                step={0.25}
                type="number"
                value={Number(minutes.toFixed(2))}
                onChange={(event) =>
                  onTimeLimitMinutesChange(index, event.currentTarget.valueAsNumber)
                }
              />
            </label>
          ))}
        </div>
        <input
          className="ranking-input settings-godmode-input"
          id="timed-mode-password"
          type="password"
          value={timedModePassword}
          onChange={(event) => {
            setTimedModePassword(event.target.value)
            setTimedModeStatus(null)
          }}
        />
        {timedModeStatus && <span className="settings-file-status">{timedModeStatus}</span>}
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-secondary"
          type="submit"
        >
          {isTimedModeEnabled ? 'Disable time limits' : 'Enable time limits'}
        </button>
      </form>
      <div className="game-overlay-actions game-overlay-actions-column">
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-secondary"
          type="button"
          onClick={onCycleGhostSkin}
        >
          Bags: {ghostSkinLabel}
        </button>
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-secondary"
          type="button"
          onClick={onToggleAudio}
        >
          Audio: {isAudioMuted ? 'Off' : 'On'}
        </button>
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-secondary"
          type="button"
          disabled={!isRankingFileSupported || isRankingFileSaving}
          onClick={onChooseRankingFile}
        >
          {isRankingFileSaving
            ? 'Working...'
            : rankingFilePath
              ? 'Change scores file'
              : 'Create scores file'}
        </button>
        <button data-menu-item className="game-overlay-action" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  )
}

function VolumeControl({
  id,
  label,
  value,
  onChange
}: {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly onChange: (volume: number) => void
}): React.JSX.Element {
  return (
    <label className="settings-volume-control" htmlFor={id}>
      <span className="settings-volume-label-row">
        <span>{label}</span>
        <span className="settings-volume-value">{Math.round(value * 100)}%</span>
      </span>
      <input
        className="settings-volume-slider"
        id={id}
        min={0}
        max={100}
        step={1}
        type="range"
        value={Math.round(value * 100)}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber / 100)}
      />
    </label>
  )
}

function ScoresMenu({
  rankings,
  onClearRankings,
  onVerifyClearRankingsPassword,
  onBack
}: {
  readonly rankings: readonly RankingEntry[]
  readonly onClearRankings: () => void
  readonly onVerifyClearRankingsPassword: (password: string) => boolean
  readonly onBack: () => void
}): React.JSX.Element {
  const [clearPassword, setClearPassword] = useState('')
  const [clearStatus, setClearStatus] = useState<string | null>(null)

  const handleClearSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (rankings.length === 0) {
      return
    }

    if (!onVerifyClearRankingsPassword(clearPassword)) {
      setClearStatus('Wrong GodMode password')
      return
    }

    onClearRankings()
    setClearPassword('')
    setClearStatus('Scores cleared')
  }

  return (
    <>
      <strong className="game-overlay-score">Scores</strong>
      <RankingList entries={rankings} />
      <form className="scores-clear-form" onSubmit={handleClearSubmit}>
        <label className="settings-file-label" htmlFor="scores-clear-password">
          GodMode password
        </label>
        <input
          className="ranking-input settings-godmode-input"
          id="scores-clear-password"
          type="password"
          value={clearPassword}
          onChange={(event) => {
            setClearPassword(event.target.value)
            setClearStatus(null)
          }}
        />
        {clearStatus && <span className="settings-file-status">{clearStatus}</span>}
        <button
          data-menu-item
          className="game-overlay-action game-overlay-action-secondary"
          type="submit"
          disabled={rankings.length === 0}
        >
          Clear scores
        </button>
      </form>
      <div className="game-overlay-actions">
        <button data-menu-item className="game-overlay-action" type="button" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  )
}

function isMenuNavigationKey(key: string): boolean {
  return (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Enter' ||
    key === ' ' ||
    key === 'Spacebar'
  )
}

function getMenuButtons(root: HTMLElement | null): HTMLButtonElement[] {
  if (!root) {
    return []
  }

  return Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-menu-item]')).filter(
    (button) => !button.disabled
  )
}

function focusFirstMenuElement(root: HTMLElement | null): void {
  const input = root?.querySelector<HTMLInputElement>('input[data-menu-autofocus]')

  if (input) {
    input.focus()
    input.select()
    return
  }

  getMenuButtons(root)[0]?.focus()
}

function wrapIndex(index: number, length: number): number {
  return (index + length) % length
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  )
}
