import { afterEach, describe, expect, it, vi } from 'vitest'

import { startGameLoop } from './gameLoop'

describe('game loop', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('ticks with capped delta time and cancels the active frame', () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextFrameId = 1
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId

      callbacks.set(frameId, callback)
      nextFrameId += 1

      return frameId
    })
    const cancelAnimationFrame = vi.fn((frameId: number) => {
      callbacks.delete(frameId)
    })
    const onTick = vi.fn()

    vi.spyOn(performance, 'now').mockReturnValue(1000)
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame)

    const stop = startGameLoop(onTick)

    callbacks.get(1)?.(1020)
    callbacks.get(2)?.(1300)
    stop()

    expect(onTick).toHaveBeenNthCalledWith(1, 0.02, 1020)
    expect(onTick).toHaveBeenNthCalledWith(2, 0.05, 1300)
    expect(cancelAnimationFrame).toHaveBeenCalledWith(3)
  })
})
