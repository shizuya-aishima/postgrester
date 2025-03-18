/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from "electron";

// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.

// レンダラープロセスに公開するAPIを定義
contextBridge.exposeInMainWorld("electron", {
  // メッセージの送受信
  sayHello: () => ipcRenderer.send("message", "Hello from the renderer process!"),
  receiveHello: (handler: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on("message", handler);
  },
  stopReceivingHello: (handler: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.removeListener("message", handler);
  },
  
  // データベース接続テスト
  testConnection: (connectionConfig: any) => {
    return ipcRenderer.invoke('database:test-connection', connectionConfig);
  },
  
  // クエリ実行
  executeQuery: (connectionConfig: any, query: string) => {
    return ipcRenderer.invoke('database:execute-query', { connectionConfig, query });
  },
  
  // ファイル選択ダイアログを開く
  openFileDialog: (options: any) => {
    return ipcRenderer.invoke('dialog:open-file', options);
  },
  
  // 保存された接続リストを取得
  getConnections: () => {
    return ipcRenderer.invoke('database:get-connections');
  },
  
  // 新しい接続を保存
  addConnection: (connectionConfig: any) => {
    return ipcRenderer.invoke('database:add-connection', connectionConfig);
  },
  
  // 接続を削除
  deleteConnection: (id: string) => {
    return ipcRenderer.invoke('database:delete-connection', id);
  },
  
  // 接続フォーム用のサブウィンドウを開く
  openConnectionFormWindow: () => {
    return ipcRenderer.invoke('window:open-connection-form');
  }
});

// 後方互換性のため、electronAPIも同じ内容で提供
contextBridge.exposeInMainWorld('electronAPI', {
  testConnection: (connectionConfig: any) => {
    return ipcRenderer.invoke('database:test-connection', connectionConfig);
  },
  executeQuery: (connectionConfig: any, query: string) => {
    return ipcRenderer.invoke('database:execute-query', { connectionConfig, query });
  },
  openFileDialog: (options: any) => {
    return ipcRenderer.invoke('dialog:open-file', options);
  },
  getConnections: () => {
    return ipcRenderer.invoke('database:get-connections');
  },
  addConnection: (connectionConfig: any) => {
    return ipcRenderer.invoke('database:add-connection', connectionConfig);
  },
  deleteConnection: (id: string) => {
    return ipcRenderer.invoke('database:delete-connection', id);
  },
  openConnectionFormWindow: () => {
    return ipcRenderer.invoke('window:open-connection-form');
  }
});
