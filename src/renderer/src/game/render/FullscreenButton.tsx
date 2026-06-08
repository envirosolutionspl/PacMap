import { useCallback, useEffect, useMemo, useState } from 'react'

import { getWindowControlApi } from '../window/windowControls'

export function FullscreenButton(): React.JSX.Element {
  const windowControlApi = useMemo(() => getWindowControlApi(), [])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    let isMounted = true

    void windowControlApi
      ?.isFullscreen()
      .then((value) => {
        if (isMounted) {
          setIsFullscreen(value)
        }
      })
      .catch(() => undefined)

    const handleFullscreenChange = (): void => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      isMounted = false
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [windowControlApi])

  const handleClick = useCallback(async (): Promise<void> => {
    try {
      if (windowControlApi) {
        setIsFullscreen(await windowControlApi.toggleFullscreen())
        return
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
        return
      }

      if (typeof document.documentElement.requestFullscreen === 'function') {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }, [windowControlApi])

  const label = isFullscreen ? 'Wyjdz z pelnego ekranu' : 'Pelny ekran'

  return (
    <button
      type="button"
      className={`fullscreen-button${isFullscreen ? ' fullscreen-button-active' : ''}`}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 9V4h5" />
        <path d="M15 4h5v5" />
        <path d="M20 15v5h-5" />
        <path d="M9 20H4v-5" />
        <path d="M8 4 4 8" />
        <path d="m16 4 4 4" />
        <path d="m20 16-4 4" />
        <path d="m4 16 4 4" />
      </svg>
    </button>
  )
}
