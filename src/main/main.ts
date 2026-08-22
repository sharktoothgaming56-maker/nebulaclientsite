import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import fs from "fs";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

interface UpdateState {
  downloading: boolean;
  downloaded: boolean;
  version?: string;
  changelog?: string;
}

let updateState: UpdateState = { downloading: false, downloaded: false };

autoUpdater.on("checking-for-update", () => {
  updateState = { downloading: false, downloaded: false };
  sendUpdateState();
});

autoUpdater.on("download-progress", () => {
  updateState.downloading = true;
  sendUpdateState();
});

autoUpdater.on("update-downloaded", (info) => {
  updateState.downloaded = true;
  updateState.version = info.version;
  if (info.releaseNotes) {
    updateState.changelog = typeof info.releaseNotes === "string" ? info.releaseNotes : JSON.stringify(info.releaseNotes);
  } else {
    const changelogPath = path.resolve(app.getAppPath(), "CHANGELOG.md");
    if (fs.existsSync(changelogPath)) {
      updateState.changelog = fs.readFileSync(changelogPath, "utf-8");
    } else {
      updateState.changelog = "";
    }
  }
  sendUpdateState();
});

autoUpdater.on("error", (err) => {
  console.error("Auto-updater error:", err);
});

function sendUpdateState() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("update:state", updateState);
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
