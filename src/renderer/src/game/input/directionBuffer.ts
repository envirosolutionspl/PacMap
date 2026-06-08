import type { MovingDirection } from '../engine/types'

export const DIRECTION_BUFFER_DURATION_MS = 320

export interface DirectionBuffer {
  readonly direction: MovingDirection
  readonly requestedAt: number
}

export function createDirectionBuffer(
  direction: MovingDirection,
  requestedAt: number
): DirectionBuffer {
  return {
    direction,
    requestedAt
  }
}

export function isDirectionBufferExpired(buffer: DirectionBuffer, now: number): boolean {
  return now - buffer.requestedAt > DIRECTION_BUFFER_DURATION_MS
}

export function getBufferedDirection(
  buffer: DirectionBuffer | null,
  now: number
): MovingDirection | null {
  if (!buffer || isDirectionBufferExpired(buffer, now)) {
    return null
  }

  return buffer.direction
}
