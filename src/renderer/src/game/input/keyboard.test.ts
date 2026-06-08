import { describe, expect, it } from 'vitest'

import { getKeyboardAction } from './keyboard'

describe('keyboard input', () => {
  it('maps Space to confirm', () => {
    expect(getKeyboardAction(' ')).toEqual({ type: 'confirm' })
  })

  it('keeps movement keys mapped to directions', () => {
    expect(getKeyboardAction('ArrowUp')).toEqual({ type: 'move', direction: 'up' })
    expect(getKeyboardAction('d')).toEqual({ type: 'move', direction: 'right' })
  })

  it('maps M to audio toggle', () => {
    expect(getKeyboardAction('m')).toEqual({ type: 'toggleAudio' })
    expect(getKeyboardAction('M')).toEqual({ type: 'toggleAudio' })
  })

  it('maps Escape to return to the main menu and P to pause', () => {
    expect(getKeyboardAction('Escape')).toEqual({ type: 'returnToMenu' })
    expect(getKeyboardAction('p')).toEqual({ type: 'togglePause' })
    expect(getKeyboardAction('P')).toEqual({ type: 'togglePause' })
  })
})
