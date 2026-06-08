// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BiomeControlPanel } from './BiomeControlPanel'

describe('BiomeControlPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('switches biome options and rerolls the current layout', () => {
    const onBiomeKindChange = vi.fn()
    const onReroll = vi.fn()
    const onPreviousLevel = vi.fn()
    const onNextLevel = vi.fn()

    render(
      <BiomeControlPanel
        selectedKind="strictCityCenter"
        levelIndex={1}
        totalLevels={5}
        onBiomeKindChange={onBiomeKindChange}
        onReroll={onReroll}
        onPreviousLevel={onPreviousLevel}
        onNextLevel={onNextLevel}
      />
    )

    expect(
      screen.getByRole('button', { name: /Ścisłe centrum/ }).getAttribute('aria-pressed')
    ).toBe('true')
    expect(screen.getByRole('button', { name: /Park w wielkim mieście/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Przedmieście \/ miasto/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Przedmieścia/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Leśna miejscowość/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Jezioro/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Las/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Wybrzeże/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Małe miasto/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Losuj układ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Poprzedni' }))
    fireEvent.click(screen.getByRole('button', { name: 'Następny' }))

    expect(onBiomeKindChange).toHaveBeenCalledWith('mixedCity')
    expect(onReroll).toHaveBeenCalledTimes(1)
    expect(onPreviousLevel).toHaveBeenCalledTimes(1)
    expect(onNextLevel).toHaveBeenCalledTimes(1)
  })

  it('disables level navigation at level bounds', () => {
    render(
      <BiomeControlPanel
        selectedKind="strictCityCenter"
        levelIndex={0}
        totalLevels={1}
        onBiomeKindChange={vi.fn()}
        onReroll={vi.fn()}
        onPreviousLevel={vi.fn()}
        onNextLevel={vi.fn()}
      />
    )

    expect(screen.getByText('1 / 1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Poprzedni' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Następny' }).hasAttribute('disabled')).toBe(true)
  })
})
