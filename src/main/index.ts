import { app, shell, BrowserWindow, dialog, ipcMain, type SaveDialogOptions } from 'electron'
import { writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

interface RankingFileEntry {
  readonly playerName: string
  readonly phoneNumber?: string
  readonly score: number
  readonly reachedLevel: number
  readonly createdAt: string
}

interface RankingFileWritePayload {
  readonly filePath: string
  readonly entries: readonly RankingFileEntry[]
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 760,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  registerRankingFileHandlers()
  registerWindowControlHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function registerRankingFileHandlers(): void {
  ipcMain.handle('ranking-file:choose', async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)
    const options: SaveDialogOptions = {
      title: 'Choose Pac-Map scores file',
      buttonLabel: 'Use this file',
      defaultPath: join(app.getPath('desktop'), 'PacMap-scores.txt'),
      filters: [{ name: 'Text files', extensions: ['txt'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    }
    const result = browserWindow
      ? await dialog.showSaveDialog(browserWindow, options)
      : await dialog.showSaveDialog(options)

    if (result.canceled || !result.filePath) {
      return null
    }

    return { filePath: ensureTextFilePath(result.filePath) }
  })

  ipcMain.handle('ranking-file:write', async (_event, payload: unknown) => {
    if (!isRankingFileWritePayload(payload)) {
      return { ok: false, error: 'Invalid ranking file payload.' }
    }

    try {
      await writeFile(payload.filePath, formatRankingFile(payload.entries), 'utf8')
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not write scores file.' }
    }
  })
}

function ensureTextFilePath(filePath: string): string {
  return extname(filePath) ? filePath : `${filePath}.txt`
}

function registerWindowControlHandlers(): void {
  ipcMain.handle('window:toggle-fullscreen', (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)

    if (!browserWindow) {
      return false
    }

    const shouldEnterFullscreen = !browserWindow.isFullScreen()
    browserWindow.setFullScreen(shouldEnterFullscreen)

    return shouldEnterFullscreen
  })

  ipcMain.handle('window:is-fullscreen', (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)

    return browserWindow?.isFullScreen() ?? false
  })
}

function formatRankingFile(entries: readonly RankingFileEntry[]): string {
  const lines = [
    'Pac-Map scores',
    `Updated: ${new Date().toISOString()}`,
    '',
    'Rank\tPlayer\tScore\tLevel\tPhone\tCreated at'
  ]

  entries.forEach((entry, index) => {
    lines.push(
      [
        String(index + 1).padStart(2, '0'),
        sanitizeRankingCell(entry.playerName),
        String(Math.floor(entry.score)),
        `L${String(Math.floor(entry.reachedLevel)).padStart(2, '0')}`,
        sanitizeRankingCell(entry.phoneNumber ?? ''),
        sanitizeRankingCell(entry.createdAt)
      ].join('\t')
    )
  })

  return `${lines.join('\n')}\n`
}

function sanitizeRankingCell(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').trim()
}

function isRankingFileWritePayload(value: unknown): value is RankingFileWritePayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Record<string, unknown>

  return (
    typeof payload.filePath === 'string' &&
    payload.filePath.trim().length > 0 &&
    Array.isArray(payload.entries) &&
    payload.entries.every(isRankingFileEntry)
  )
}

function isRankingFileEntry(value: unknown): value is RankingFileEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    typeof entry.playerName === 'string' &&
    (entry.phoneNumber === undefined || typeof entry.phoneNumber === 'string') &&
    typeof entry.score === 'number' &&
    typeof entry.reachedLevel === 'number' &&
    typeof entry.createdAt === 'string'
  )
}
