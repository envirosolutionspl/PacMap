import type { MovingDirection } from '../engine/types'

export type KeyboardAction =
  | {
      readonly type: 'move'
      readonly direction: MovingDirection
    }
  | {
      readonly type: 'togglePause'
    }
  | {
      readonly type: 'returnToMenu'
    }
  | {
      readonly type: 'confirm'
    }
  | {
      readonly type: 'toggleAudio'
    }

const DIRECTION_KEYS: Record<string, MovingDirection> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left'
}

export function getKeyboardAction(key: string): KeyboardAction | null {
  const direction = DIRECTION_KEYS[key]

  if (direction) {
    return { type: 'move', direction }
  }

  if (key === 'Escape') {
    return { type: 'returnToMenu' }
  }

  if (key === 'p' || key === 'P') {
    return { type: 'togglePause' }
  }

  if (key === ' ' || key === 'Spacebar') {
    return { type: 'confirm' }
  }

  if (key === 'm' || key === 'M') {
    return { type: 'toggleAudio' }
  }

  return null
}
