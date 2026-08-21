// =====================================================================
// AUTO-UPDATE ENGINE
//
// Using electron-updater (built for electron-builder). Automatically
// checks GitHub Releases for new versions, downloads silently in the
// background, and prompts the user to restart when ready.
// =====================================================================
// Loaded defensively. Auto-update is a nice-to-have; if the module is
// missing or fails to load for any reason, the launcher must still open.
// It previously crashed on startup with "Cannot find module
// 'electron-updater'" — a packaging mistake, but the app dying over a
// non-essential feature made a small problem into a fatal one.
let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); }
catch (err) { console.warn('[autoupdate] unavailable:', err.message); }

const { ipcMain } = require('electron');

let updateState = {
  checking: false,
  available: false,
  downloaded: false,
  downloadProgress: 0,
  version: null,
  error: null,
};

function getUpdateState() {
  return { ...updateState };
}

function initAutoUpdate(mainWindow) {
  if (!autoUpdater) {
    updateState.error = null;
    console.log('[autoupdate] module unavailable — update checks disabled.');
    return;
  }

  // electron-updater reads resources/app-update.yml, which only exists in a
  // PACKAGED build. Running from source it throws ENOENT on every check and
  // the rejection surfaces as an unhandledRejection in the console — which
  // is exactly the noise you get when launching with `npm start`. There is
  // nothing to update when running from a folder anyway.
  // Do NOT use app.isPackaged here. Electron implements that as simply
  // "is the running executable named electron.exe?" — so the moment we
  // renamed the binary to SolarClient.exe to fix the taskbar icon, Electron
  // began reporting itself as packaged, electron-updater started running for
  // real, and it threw ENOENT on app-update.yml on every launch. That file
  // is the actual precondition, so check for the file.
  const { app } = require('electron');
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.resourcesPath || '', 'app-update.yml');
  const runningFromSource = !!process.defaultApp || !fs.existsSync(configPath);
  if (runningFromSource) {
    updateState.error = null;
    console.log('[autoupdate] running from source — update checks disabled.');
    return;
  }
  void app;

  // Configure: don't spam the console, allow prerelease if current version is prerelease
  autoUpdater.logger = null;
  autoUpdater.allowDowngrade = false;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  // Check for updates on startup, then every 10 minutes
  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 1.5 * 60 * 1000);

  autoUpdater.on('checking-for-update', () => {
    updateState.checking = true;
    updateState.error = null;
  });

  autoUpdater.on('update-available', (info) => {
    updateState.available = true;
    updateState.version = info.version;
    updateState.checking = false;
    console.log(`[autoupdate] ${info.version} available`);
    if (mainWindow) mainWindow.webContents.send('update:state', getUpdateState());
  });

  autoUpdater.on('update-not-available', () => {
    updateState.available = false;
    updateState.checking = false;
    updateState.error = null;
  });

  autoUpdater.on('error', (err) => {
    updateState.checking = false;
    updateState.error = err.message;
    console.error('[autoupdate] error:', err.message);
  });

  autoUpdater.on('download-progress', (progress) => {
    updateState.downloadProgress = Math.round(progress.percent);
    if (mainWindow) mainWindow.webContents.send('update:progress', updateState.downloadProgress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateState.downloaded = true;
    updateState.version = info.version;
    console.log(`[autoupdate] ${info.version} ready to install`);
    // The "restart to apply" prompt is drawn by the renderer as a themed
    // glass modal (see #update-modal in index.html and the onUpdateState
    // handler in renderer.js) so it matches the launcher instead of a bare
    // Windows message box. The modal's Restart button calls the
    // update:restart IPC channel, which runs quitAndInstall() below.
    if (mainWindow) mainWindow.webContents.send('update:state', getUpdateState());
  });
}

ipcMain.handle('update:state', async () => getUpdateState());
ipcMain.handle('update:check', async () => {
  // Reachable from the UI, so it has to cope with updates being off —
  // whether that's an unpackaged build or a missing module.
  if (!autoUpdater) return { ...getUpdateState(), error: 'Updates are not available in this build.' };
  updateState.checking = true;
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    updateState.error = err.message;
  } finally {
    updateState.checking = false;
  }
  return getUpdateState();
});
ipcMain.handle('update:restart', async () => {
  if (!autoUpdater) return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
});

module.exports = { initAutoUpdate, getUpdateState };
