export type GameLoopTick = (deltaSeconds: number, now: number) => void

const MAX_DELTA_SECONDS = 0.05

export function startGameLoop(onTick: GameLoopTick): () => void {
  let frameId = 0
  let lastFrameAt = performance.now()

  const tick = (now: number): void => {
    const deltaSeconds = Math.min((now - lastFrameAt) / 1000, MAX_DELTA_SECONDS)
    lastFrameAt = now
    onTick(deltaSeconds, now)
    frameId = requestAnimationFrame(tick)
  }

  frameId = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frameId)
  }
}
