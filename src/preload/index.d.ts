import { ElectronAPI } from '@electron-toolkit/preload'

interface PacMapApi {
  readonly chooseRankingFile: () => Promise<{ readonly filePath: string } | null>
  readonly writeRankingFile: (
    filePath: string,
    entries: readonly unknown[]
  ) => Promise<{ readonly ok: boolean; readonly error?: string }>
  readonly toggleFullscreen: () => Promise<boolean>
  readonly isFullscreen: () => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PacMapApi
  }
}
