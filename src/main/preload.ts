import { contextBridge, ipcRenderer } from "electron";

declare global {
  interface Window {
    electronAPI: {
      onUpdateState: (callback: (state: unknown) => void) => void;
    };
  }
}

contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateState: (callback) => ipcRenderer.on("update:state", (_, state) => callback(state)),
});
