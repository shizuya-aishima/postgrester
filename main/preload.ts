import { contextBridge, ipcRenderer } from 'electron';

// レンダラープロセスに公開するAPIの定義
contextBridge.exposeInMainWorld('electron', {
  // データベース接続のテスト
  testConnection: async (config: any) => {
    return await ipcRenderer.invoke('test-connection', config);
  },
  
  // バージョン情報の取得
  getAppInfo: () => {
    return {
      version: process.env.npm_package_version || '0.1.0',
      name: process.env.npm_package_name || 'sql-client',
    };
  },
}); 