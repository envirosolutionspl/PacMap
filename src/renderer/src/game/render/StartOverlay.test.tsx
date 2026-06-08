/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StartOverlay } from './StartOverlay'

const noop = (): void => undefined
const verifyGodModePassword = (): boolean => false
const toggleTimedMode = (): boolean => false
const defaultTimeLimitMinutes = [1, 1.5, 2, 3, 5]
const defaultMusicVolume = 0.5

describe('StartOverlay keyboard navigation', () => {
  afterEach(() => {
    cleanup()
  })

  it('moves focus with arrows and activates the selected menu item with Enter', () => {
    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber="123123123"
        rankings={[]}
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

    const dialog = screen.getByRole('dialog')
    const newGameButton = screen.getByRole('button', { name: 'New game' })
    const settingsButton = screen.getByRole('button', { name: 'Settings' })

    expect(document.activeElement).toBe(newGameButton)

    fireEvent.keyDown(dialog, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(settingsButton)

    fireEvent.keyDown(dialog, { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'Create scores file' })).toBeTruthy()
  })

  it('opens the player form and tutorial before starting the game', () => {
    const onStart = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber="123123123"
        rankings={[]}
        rankingFilePath={null}
        rankingFileStatus={null}
        isRankingFileSupported={true}
        isRankingFileSaving={false}
        isGodModeEnabled={false}
        isTimedModeEnabled={false}
        menuMusicVolume={defaultMusicVolume}
        gameMusicVolume={defaultMusicVolume}
        timeLimitMinutes={defaultTimeLimitMinutes}
        onStart={onStart}
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

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy()
    expect(onStart).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('Klawisze i poruszanie się')).toBeTruthy()
    expect(document.querySelector('.tutorial-controls-visual')).toBeTruthy()
    expect(
      Array.from(
        document.querySelectorAll('.tutorial-keypad-wasd .tutorial-key:not(.tutorial-key-spacer)')
      ).map((key) => key.textContent)
    ).toEqual(['W', 'A', 'S', 'D'])
    expect(
      Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          '.main-menu-panel-tutorial .game-overlay-actions button'
        )
      ).map((button) => button.textContent)
    ).toEqual(['Back', 'Next'])
    expect(onStart).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText('Punkty, Projekty, OpenSource')).toBeTruthy()
    expect(
      screen.getByText('Zbieraj Punkty, Projekty oraz OpenSource, które pozwolą Ci pokonać koszty.')
    ).toBeTruthy()
    expect(document.querySelector('.tutorial-collectibles-visual')).toBeTruthy()
    expect(screen.getByText('Projekty')).toBeTruthy()
    expect(screen.getByText('OpenSource')).toBeTruthy()
    expect(onStart).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getAllByText('Koszty').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Unikaj Kosztów! Z pomocą QGIS możesz je skutecznie zwalczać!')
    ).toBeTruthy()
    expect(document.querySelector('.tutorial-costs-svg')).toBeTruthy()
    expect(onStart).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Start first level' }))

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it.each([
    { playerName: '', phoneNumber: '123123123' },
    { playerName: 'PLAYER', phoneNumber: '' }
  ])('requires both player details before opening the tutorial', ({ playerName, phoneNumber }) => {
    const onStart = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName={playerName}
        phoneNumber={phoneNumber}
        rankings={[]}
        rankingFilePath={null}
        rankingFileStatus={null}
        isRankingFileSupported={true}
        isRankingFileSaving={false}
        isGodModeEnabled={false}
        isTimedModeEnabled={false}
        menuMusicVolume={defaultMusicVolume}
        gameMusicVolume={defaultMusicVolume}
        timeLimitMinutes={defaultTimeLimitMinutes}
        onStart={onStart}
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

    fireEvent.click(screen.getByRole('button', { name: 'New game' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('Name and phone are required')).toBeTruthy()
    expect(screen.queryByText('Klawisze i poruszanie siÄ™')).toBeNull()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('blocks a new game when the same name and phone already exist in scores', () => {
    const onStart = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="tralala"
        phoneNumber="123 123 123"
        rankings={[
          {
            id: 'rank-duplicate',
            playerName: 'TRALALA',
            phoneNumber: '123123123',
            score: 1200,
            reachedLevel: 2,
            createdAt: '2026-06-02T08:00:00.000Z'
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
        onStart={onStart}
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

    fireEvent.click(screen.getByRole('button', { name: 'New game' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      screen.getByText('This name and phone already have a score. Clear scores to play again.')
    ).toBeTruthy()
    expect(screen.queryByText('Klawisze i poruszanie siÄ™')).toBeNull()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('clears player details every time a new game starts from the main menu', () => {
    const onPlayerNameChange = vi.fn()
    const onPhoneNumberChange = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="TRALALA"
        phoneNumber="123123123"
        rankings={[]}
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
        onPlayerNameChange={onPlayerNameChange}
        onPhoneNumberChange={onPhoneNumberChange}
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

    fireEvent.click(screen.getByRole('button', { name: 'New game' }))

    expect(onPlayerNameChange).toHaveBeenCalledWith('')
    expect(onPhoneNumberChange).toHaveBeenCalledWith('')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy()
  })

  it('enables GodMode from settings only after the password is submitted', () => {
    const onVerifyGodModePassword = vi.fn((password: string) => password === 'PacMapGod12890!')

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber=""
        rankings={[]}
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
        onVerifyGodModePassword={onVerifyGodModePassword}
        onDisableGodMode={noop}
        onToggleTimedMode={toggleTimedMode}
        onTimeLimitMinutesChange={noop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.change(screen.getByLabelText('GodMode'), {
      target: { value: 'PacMapGod12890!' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enable GodMode' }))

    expect(onVerifyGodModePassword).toHaveBeenCalledWith('PacMapGod12890!')
    expect(screen.getByText('GodMode enabled')).toBeTruthy()
  })

  it('changes menu and game music volume from settings', () => {
    const onMenuMusicVolumeChange = vi.fn()
    const onGameMusicVolumeChange = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber=""
        rankings={[]}
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
        onMenuMusicVolumeChange={onMenuMusicVolumeChange}
        onGameMusicVolumeChange={onGameMusicVolumeChange}
        onClearRankings={noop}
        onVerifyClearRankingsPassword={verifyGodModePassword}
        onChooseRankingFile={noop}
        onVerifyGodModePassword={verifyGodModePassword}
        onDisableGodMode={noop}
        onToggleTimedMode={toggleTimedMode}
        onTimeLimitMinutesChange={noop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.change(screen.getByRole('slider', { name: /Main menu/ }), {
      target: { value: '75' }
    })
    fireEvent.change(screen.getByRole('slider', { name: /Game/ }), {
      target: { value: '30' }
    })

    expect(onMenuMusicVolumeChange).toHaveBeenCalledWith(0.75)
    expect(onGameMusicVolumeChange).toHaveBeenCalledWith(0.3)
  })

  it('requires the GodMode password before clearing scores', () => {
    const onClearRankings = vi.fn()
    const onVerifyClearRankingsPassword = vi.fn(
      (password: string) => password === 'PacMapGod12890!'
    )

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber=""
        rankings={[
          {
            id: 'rank-1',
            playerName: 'PLAYER',
            phoneNumber: '',
            score: 1200,
            reachedLevel: 2,
            createdAt: '2026-06-01T12:00:00.000Z'
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
        onClearRankings={onClearRankings}
        onVerifyClearRankingsPassword={onVerifyClearRankingsPassword}
        onChooseRankingFile={noop}
        onVerifyGodModePassword={verifyGodModePassword}
        onDisableGodMode={noop}
        onToggleTimedMode={toggleTimedMode}
        onTimeLimitMinutesChange={noop}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Scores' }))
    fireEvent.change(screen.getByLabelText('GodMode password'), {
      target: { value: 'wrong' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Clear scores' }))

    expect(onVerifyClearRankingsPassword).toHaveBeenCalledWith('wrong')
    expect(onClearRankings).not.toHaveBeenCalled()
    expect(screen.getByText('Wrong GodMode password')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('GodMode password'), {
      target: { value: 'PacMapGod12890!' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Clear scores' }))

    expect(onVerifyClearRankingsPassword).toHaveBeenCalledWith('PacMapGod12890!')
    expect(onClearRankings).toHaveBeenCalledTimes(1)
  })

  it('toggles timed mode from settings with the GodMode password', () => {
    const onToggleTimedMode = vi.fn((password: string) => password === 'PacMapGod12890!')
    const onTimeLimitMinutesChange = vi.fn()

    render(
      <StartOverlay
        ghostSkinLabel="Default"
        isAudioMuted={false}
        playerName="PLAYER"
        phoneNumber=""
        rankings={[]}
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
        onToggleTimedMode={onToggleTimedMode}
        onTimeLimitMinutesChange={onTimeLimitMinutesChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    fireEvent.change(screen.getByLabelText('Time limits'), {
      target: { value: 'PacMapGod12890!' }
    })
    fireEvent.change(screen.getByLabelText('3'), {
      target: { value: '2.5' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enable time limits' }))

    expect(onTimeLimitMinutesChange).toHaveBeenCalledWith(2, 2.5)
    expect(onToggleTimedMode).toHaveBeenCalledWith('PacMapGod12890!')
    expect(screen.getByText('Time limits enabled')).toBeTruthy()
  })
})
