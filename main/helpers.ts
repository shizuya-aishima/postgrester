import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import Store from 'electron-store';

// ウィンドウ状態の型定義
interface WindowState {
  width: number;
  height: number;
}

// 永続化ストア
export const store = new Store({
  name: 'sql-client-store',
});

/**
 * ウィンドウを作成する関数
 * @param windowName ウィンドウ名
 * @param options ブラウザウィンドウのオプション
 * @returns 作成されたブラウザウィンドウインスタンス
 */
export function createWindow(
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow {
  const key = 'window-state';
  const name = `window-state-${windowName}`;

  // 前回のウィンドウの状態を復元
  const windowState = store.get(name, {
    width: options.width,
    height: options.height,
  }) as WindowState;

  const win = new BrowserWindow({
    ...options,
    width: windowState.width,
    height: windowState.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  });

  // ウィンドウの状態変更を監視して保存
  win.on('close', () => {
    const bounds = win.getBounds();

    store.set(name, {
      width: bounds.width,
      height: bounds.height,
    });
  });

  return win;
}
