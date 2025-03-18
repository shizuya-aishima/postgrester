// Native
import { join } from "path";
import { format } from "url";

// Packages
import { BrowserWindow, app, ipcMain, type IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import prepareNext from "electron-next";
import { setupDatabaseIpcHandlers } from './ipc/database';
import { setupDialogIpcHandlers } from './ipc/dialog';
import { setupWindowIpcHandlers } from './ipc/window';

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  const url = isDev
    ? "http://localhost:8000/"
    : format({
        pathname: join(__dirname, "../renderer/out/index.html"),
        protocol: "file:",
        slashes: true,
      });

  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(url);
  
  // データベース接続関連のIPCハンドラを設定
  setupDatabaseIpcHandlers();
  
  // ダイアログ関連のIPCハンドラを設定
  setupDialogIpcHandlers();
  
  // ウィンドウ操作関連のIPCハンドラを設定
  setupWindowIpcHandlers();
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
