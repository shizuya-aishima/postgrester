import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';

/**
 * ウィンドウ操作関連のIPCハンドラを設定する
 */
export function setupWindowIpcHandlers(): void {
  // 接続設定用のサブウィンドウを開く
  ipcMain.handle('window:open-connection-form', async () => {
    try {
      // 新しいウィンドウを作成
      const subWindow = new BrowserWindow({
        width: 500,
        height: 700,
        parent: BrowserWindow.getFocusedWindow() || undefined,
        modal: true,
        resizable: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
          preload: path.join(__dirname, '../preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        },
        show: false,
      });
      
      // メインウィンドウの中央に配置
      subWindow.center();
      
      // タイトル設定
      subWindow.setTitle('新しい接続先の作成');
      
      // 開発環境ではDevToolsを開く
      if (process.env.NODE_ENV === 'development') {
        subWindow.webContents.openDevTools({ mode: 'detach' });
      }
      
      // URLを指定
      const url = process.env.ELECTRON_START_URL 
        ? `${process.env.ELECTRON_START_URL}/connection-form` 
        : `file://${path.join(__dirname, '../../renderer/out/connection-form.html')}`;
      
      console.log('サブウィンドウのURL:', url);
      
      await subWindow.loadURL(url);
      
      // 読み込み完了後に表示
      subWindow.once('ready-to-show', () => {
        subWindow.show();
      });
      
      // ウィンドウが閉じられたときに通知
      subWindow.on('closed', () => {
        // IDを返して識別できるようにする場合はここで通知
      });
      
      return { success: true };
    } catch (error) {
      console.error('サブウィンドウ作成エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
} 