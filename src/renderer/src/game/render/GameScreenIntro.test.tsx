/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GameScreen } from './GameScreen'

describe('GameScreen startup intro', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('opens the main menu after Enter from the startup intro', () => {
    render(<GameScreen />)

    expect(screen.getByRole('button', { name: 'Continue to main menu' })).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'New game' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Continue to main menu' })).toBeNull()
  })

  it('keeps the startup intro open when the fullscreen button is clicked', () => {
    render(<GameScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Pelny ekran' }))

    expect(screen.getByRole('button', { name: 'Continue to main menu' })).toBeTruthy()
  })
})
