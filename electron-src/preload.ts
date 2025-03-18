/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron/main";

// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
contextBridge.exposeInMainWorld("electron", {
  sayHello: () => ipcRenderer.send("message", "hi from next"),
  receiveHello: (handler: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("message", handler),
  stopReceivingHello: (
    handler: (event: IpcRendererEvent, ...args: any[]) => void,
  ) => ipcRenderer.removeListener("message", handler),
});

// レンダラープロセスに公開するAPIを定義
contextBridge.exposeInMainWorld('electronAPI', {
  // データベース接続テスト
  testConnection: (connectionConfig: any) => {
    return ipcRenderer.invoke('database:test-connection', connectionConfig);
  },
  
  // クエリ実行
  executeQuery: (connectionConfig: any, query: string) => {
    return ipcRenderer.invoke('database:execute-query', { connectionConfig, query });
  }
});
