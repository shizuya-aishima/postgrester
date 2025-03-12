import { app, BrowserWindow, ipcMain } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'renderer' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

// アプリケーションの起動準備ができたらウィンドウを作成
app.whenReady().then(() => {
  const mainWindow = createWindow('main', {
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    mainWindow.loadURL('app://./index.html');
  } else {
    const port = process.env.PORT || 3000;
    mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  }

  // MacOSの場合の設定
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('main', {
        width: 1200,
        height: 800,
      });
    }
  });
});

// すべてのウィンドウが閉じられたときに終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPCハンドラーの登録
// 例: データベース接続のテスト
ipcMain.handle('test-connection', async (event: Electron.IpcMainInvokeEvent, connectionConfig: any) => {
  try {
    console.log('Connection test requested for:', connectionConfig);
    // ここでデータベース接続テストを実装
    return { success: true, message: 'Connection successful' };
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return { success: false, message: error.message };
  }
}); 