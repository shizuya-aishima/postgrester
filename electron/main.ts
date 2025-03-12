// ESMモードでelectronを使用するためのインポート設定
// @ts-ignore - ESMでのelectronモジュールインポートを許可
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const serve = require('electron-serve');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import { registerDatabaseHandlers, connectionManager } from './database.js';

// ESMでの__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 開発モードではlocalhostを提供し、本番モードではビルドされたNext.jsアプリを提供
const serveURL = serve({ directory: path.join(__dirname, '../out') });

// メインウィンドウの参照を保持
let mainWindow: any = null;

// データベースイベントをメインウィンドウに転送するヘルパー関数
const forwardToRenderer = (channel: string, data: any) => {
  if (mainWindow) {
    mainWindow.webContents.send(channel, data);
  }
};

/**
 * メインウィンドウを作成する関数
 */
function createMainWindow(): void {
  // @ts-ignore - 型エラーを無視
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // セキュリティのためfalse
      contextIsolation: true, // セキュリティのためtrue
      preload: path.join(__dirname, 'preload.js'), // preloadスクリプトへのパス
    },
    title: 'Postgrester',
    // Windowsネイティブの外観
    frame: true,
    backgroundColor: '#fff',
    show: false, // 準備ができるまで表示しない
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '..', 'out', 'index.html'),
    protocol: 'file:',
    slashes: true,
  });

  // 開発モードではDevToolsを開く
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/');
    mainWindow.webContents.openDevTools();
  } else {
    // 本番モードではビルドされたアプリを読み込む
    serveURL(mainWindow);
  }

  // データベース接続イベントリスナーを追加
  if (connectionManager) {
    // @ts-ignore - privateプロパティにアクセスする必要がある
    connectionManager.eventEmitter.on('database-connection-created', (data: any) => {
      forwardToRenderer('database-connection-created', data);
    });
    
    // @ts-ignore - privateプロパティにアクセスする必要がある
    connectionManager.eventEmitter.on('database-connection-error', (data: any) => {
      forwardToRenderer('database-connection-error', data);
    });
  }

  // ウィンドウが準備できたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * アプリケーションの初期化時に各種ハンドラーを登録
 */
function registerHandlers() {
  // データベース関連ハンドラーを登録
  registerDatabaseHandlers();
  
  // ファイルダイアログハンドラーを登録
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    return await dialog.showOpenDialog(options);
  });
  
  ipcMain.handle('show-save-dialog', async (_event, options) => {
    return await dialog.showSaveDialog(options);
  });
}

// アプリケーションの準備ができたらウィンドウを作成
app.whenReady().then(() => {
  registerHandlers();
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// 全てのウィンドウが閉じられたらアプリケーションを終了（Windowsの標準的な挙動）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// アプリケーションの設定を保存・読み込みするためのStore
interface Settings {
  connections?: ConnectionConfig[];
  theme?: string;
  fontSize?: number;
  recentQueries?: {
    id: string;
    name: string;
    connectionId: string;
    sql: string;
    timestamp: number;
  }[];
  [key: string]: unknown;
}

interface ConnectionConfig {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  useSSL: boolean;
  sslCertPath?: string;
  serviceAccountKeyPath?: string;
  connectionTimeout?: number;
  queryTimeout?: number;
}

// Store のインスタンスを作成
const store = new Store({
  // 設定の暗号化（セキュリティ対策）
  encryptionKey: 'your-encryption-key', // 注意: 実際のアプリでは安全な方法で保管
});

// 設定を保存するIPCハンドラ
ipcMain.handle('save-settings', async (_event, settings: Settings) => {
  try {
    (store as any).set('settings', settings);
    return { success: true };
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    return { success: false, error: (error as Error).message };
  }
});

// 設定を読み込むIPCハンドラ
ipcMain.handle('load-settings', async () => {
  try {
    return (store as any).get('settings') || {};
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    return {};
  }
}); 