export interface WindowControlApi {
  readonly toggleFullscreen: () => Promise<boolean>
  readonly isFullscreen: () => Promise<boolean>
}

export function getWindowControlApi(): WindowControlApi | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const api = window.api as Partial<WindowControlApi> | undefined

  if (
    !api ||
    typeof api.toggleFullscreen !== 'function' ||
    typeof api.isFullscreen !== 'function'
  ) {
    return undefined
  }

  return api as WindowControlApi
}
