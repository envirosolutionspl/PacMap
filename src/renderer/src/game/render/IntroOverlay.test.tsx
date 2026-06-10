/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { IntroOverlay } from './IntroOverlay'

describe('IntroOverlay', () => {
  it('dismisses the intro when clicked', () => {
    const onDismiss = vi.fn()

    const { container } = render(<IntroOverlay onDismiss={onDismiss} />)

    expect(screen.getByRole('button', { name: 'Continue to main menu' })).toBeTruthy()
    expect(container.querySelector('.intro-slogan')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Continue to main menu' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
