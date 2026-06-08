import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createInitialGameState } from '../engine/createInitialGameState'
import { Ghost } from '../entities/Ghost'
import { Player } from '../entities/Player'
import { levels } from '../levels'
import { GameOverOverlay } from './GameOverOverlay'
import { Hud } from './Hud'
import { LevelCompleteOverlay } from './LevelCompleteOverlay'
import { RankingList } from './RankingList'
import { MainMenuBackdrop, StartOverlay } from './StartOverlay'
import { SvgStage } from './SvgStage'
import { GameBoard } from './GameBoard'

const noop = (): void => undefined
const verifyGodModePassword = (): boolean => false
const toggleTimedMode = (): boolean => false
const defaultTimeLimitMinutes = [1, 1.5, 2, 3, 5]
const defaultMusicVolume = 0.5

describe('render smoke tests', () => {
  it('renders compact HUD score and heart lives without layout-only dependencies', () => {
    const markup = renderToStaticMarkup(
      <Hud levelLabel="LEVEL 1 - Bałuty" score={1234} lives={2} remainingTimeSeconds={90} />
    )

    expect(markup).toContain('1,234')
    expect(markup).toContain('Score')
    expect(markup).toContain('LEVEL 1 - Bałuty')
    expect(markup).toContain('01:30')
    expect(markup).toContain('♥')
    expect(markup).not.toContain('Audio')
  })

  it('renders start overlay settings and ranking phone numbers', () => {
    const startMarkup = renderToStaticMarkup(
      <StartOverlay
        ghostSkinLabel="Neon"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber="+48123123123"
        rankings={[
          {
            id: 'rank-1',
            playerName: 'PLAYER',
            phoneNumber: '+48123123123',
            score: 4200,
            reachedLevel: 3,
            createdAt: '2026-05-21T12:00:00.000Z'
          }
        ]}
        rankingFilePath={null}
        rankingFileStatus={null}
        isRankingFileSupported={true}
        isRankingFileSaving={false}
        isGodModeEnabled={false}
        isTimedModeEnabled={false}
        menuMusicVolume={defaultMusicVolume}
        gameMusicVolume={defaultMusicVolume}
        timeLimitMinutes={defaultTimeLimitMinutes}
        onStart={noop}
        onPlayerNameChange={noop}
        onPhoneNumberChange={noop}
        onCycleGhostSkin={noop}
        onToggleAudio={noop}
        onMenuMusicVolumeChange={noop}
        onGameMusicVolumeChange={noop}
        onClearRankings={noop}
        onVerifyClearRankingsPassword={verifyGodModePassword}
        onChooseRankingFile={noop}
        onVerifyGodModePassword={verifyGodModePassword}
        onDisableGodMode={noop}
        onToggleTimedMode={toggleTimedMode}
        onTimeLimitMinutesChange={noop}
      />
    )
    const backdropMarkup = renderToStaticMarkup(<MainMenuBackdrop />)
    const rankingMarkup = renderToStaticMarkup(
      <RankingList
        entries={[
          {
            id: 'rank-1',
            playerName: 'PLAYER',
            phoneNumber: '+48123123123',
            score: 4200,
            reachedLevel: 3,
            createdAt: '2026-05-21T12:00:00.000Z'
          }
        ]}
      />
    )

    expect(startMarkup).toContain('New game')
    expect(startMarkup).toContain('Settings')
    expect(startMarkup).toContain('Scores')
    expect(startMarkup).toContain('company-logo-menu')
    expect(backdropMarkup).toContain('main-menu-backdrop')
    expect(backdropMarkup).toContain('main-menu-chase-ghosts')
    expect(backdropMarkup).toContain('main-menu-chase-player')
    expect(backdropMarkup).toContain('main-menu-chase-qgis')
    expect(backdropMarkup).toContain('main-menu-qgis-target')
    expect(backdropMarkup).toContain('power-qgis')
    expect(backdropMarkup).toContain('main-menu-chase-map')
    expect(backdropMarkup).toContain('main-menu-map-target')
    expect(backdropMarkup).toContain('bonus-map')
    expect(backdropMarkup).toContain('main-menu-ghost-parade')
    expect(backdropMarkup).toContain('main-menu-ghost-parade-animation')
    expect(backdropMarkup).toContain('ghost-type-chaserGhost')
    expect(backdropMarkup).toContain('ghost-type-wandererGhost')
    expect(backdropMarkup).toContain('ghost-type-randomGhost')
    expect(backdropMarkup).toContain('ghost-type-ambusherGhost')
    expect(backdropMarkup).not.toContain('main-menu-chase-map-run')
    expect(backdropMarkup).not.toContain('main-menu-chase-qgis-turn')
    expect(rankingMarkup).toContain('+48123123123')
    expect(rankingMarkup).toContain('4200')
    expect(rankingMarkup).toContain('L03')
  })

  it('renders game over result with score, time and player nick', () => {
    const markup = renderToStaticMarkup(
      <GameOverOverlay playerName="PLAYER" score={1234} elapsedTimeMs={65_000} />
    )

    expect(markup).toContain('Game over')
    expect(markup).toContain('PLAYER')
    expect(markup).toContain('1,234')
    expect(markup).toContain('01:05')
  })

  it('renders level complete as a passive timed message without controls', () => {
    const markup = renderToStaticMarkup(
      <LevelCompleteOverlay
        score={2040}
        levelName="I plansza - Bałuty"
        nextLevelName="II plansza - Fabryczna"
        isFinalLevel={false}
      />
    )

    expect(markup).toContain('Level clear')
    expect(markup).toContain('I plansza - Bałuty')
    expect(markup).toContain('2040')
    expect(markup).toContain('II plansza - Fabryczna')
    expect(markup).not.toContain('button')
    expect(markup).not.toContain('Next level')
  })

  it('renders the SVG board with a stable viewBox and collectible layer', () => {
    const level = levels[0]
    const state = createInitialGameState(level)
    const markup = renderToStaticMarkup(
      <SvgStage level={level}>
        <GameBoard level={level} collectibles={state.collectibles} />
      </SvgStage>
    )

    expect(markup).toContain(`viewBox="0 0 ${level.width * 32} ${level.height * 32}"`)
    expect(markup).toContain('board-wall-layer')
    expect(markup).toContain('board-floor-zone-')
    expect(markup).toContain('city-block')
    expect(markup).toContain('city-biome-')
    expect(markup).toContain('city-building-')
    expect(markup).toContain('board-collectible-layer')
    expect(markup).toContain('bonus-map')
    expect(markup).toContain('power-qgis')
    expect(markup).toContain('power-qgis-ring')
    expect(markup).toContain('power-qgis-cube-front')
    expect(markup).toContain('power-qgis-tail')
  })

  it('renders the Pac-Map player as a globe sprite', () => {
    const state = createInitialGameState(levels[0])
    const markup = renderToStaticMarkup(
      <svg>
        <Player player={state.player} tileSize={32} skinId="player-default" />
      </svg>
    )

    expect(markup).toContain('player-ocean')
    expect(markup).toContain('player-land')
    expect(markup).toContain('player-eye')
    expect(markup).toContain('player-mouth-edge')
  })

  it('renders opponents as money bag sprites without currency symbols', () => {
    const state = createInitialGameState(levels[0])
    const markup = renderToStaticMarkup(
      <svg>
        <Ghost ghost={state.ghosts[0]} tileSize={32} index={0} skinId="ghost-default" />
      </svg>
    )

    expect(markup).toContain('money-bag-body')
    expect(markup).toContain('money-bag-neck')
    expect(markup).toContain('money-bag-eye')
    expect(markup).toContain('money-bag-pupil')
    expect(markup).not.toContain('$')
  })
})
