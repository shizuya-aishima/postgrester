// ESMモードでelectronを使用するためのインポート設定
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require('electron');

// Electron型定義
type OpenDialogOptions = {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<string>;
  message?: string;
  securityScopedBookmarks?: boolean;
};

type SaveDialogOptions = {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  message?: string;
  nameFieldLabel?: string;
  showsTagField?: boolean;
  securityScopedBookmarks?: boolean;
};

// データベース接続の設定インターフェース
interface ConnectionConfig {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  isGCP?: boolean;
  gcpProjectId?: string;
  gcpInstanceName?: string;
  serviceAccountKeyPath?: string;
  useSSL?: boolean;
}

// ファイル保存オプションインターフェース
interface FileSaveOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  content: string;
}

// ファイルを開くオプションインターフェース
interface FileOpenOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

// クエリ結果インターフェース
interface QueryResult {
  success: boolean;
  rows?: any[];
  fields?: Array<{ name: string; dataTypeID: number; }>;
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

/**
 * コンテキストブリッジを使用して、レンダラープロセス（Next.js）からElectron APIへの
 * 安全なアクセスを提供します。
 * このブリッジは、明示的に公開されたAPIのみを提供します。
 */
contextBridge.exposeInMainWorld('electron', {
  // 設定の管理
  settings: {
    save: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    load: () => ipcRenderer.invoke('load-settings'),
  },
  
  // データベース操作
  database: {
    // PostgreSQL接続
    connectToPostgres: (config: ConnectionConfig) => {
      return ipcRenderer.invoke('connect-postgres', config);
    },
    
    // クエリ実行
    executeQuery: (connectionId: string, query: string) => {
      return ipcRenderer.invoke('execute-query', connectionId, query);
    },
    
    // トランザクション管理
    beginTransaction: (connectionId: string) => {
      return ipcRenderer.invoke('begin-transaction', connectionId);
    },
    
    commitTransaction: (connectionId: string, transactionId: string) => {
      return ipcRenderer.invoke('commit-transaction', connectionId, transactionId);
    },
    
    rollbackTransaction: (connectionId: string, transactionId: string) => {
      return ipcRenderer.invoke('rollback-transaction', connectionId, transactionId);
    },
    
    // 接続切断
    disconnect: (connectionId: string) => {
      return ipcRenderer.invoke('disconnect-database', connectionId);
    },
    
    // データベーススキーマ情報取得
    getDatabases: (connectionId: string) => 
      ipcRenderer.invoke('get-databases', connectionId),
    getSchemas: (connectionId: string, database: string) => 
      ipcRenderer.invoke('get-schemas', connectionId, database),
    getTables: (connectionId: string, database: string, schema: string) => 
      ipcRenderer.invoke('get-tables', connectionId, database, schema),
    getTableColumns: (connectionId: string, database: string, schema: string, table: string) => 
      ipcRenderer.invoke('get-table-columns', connectionId, database, schema, table),
    getTableIndexes: (connectionId: string, database: string, schema: string, table: string) => 
      ipcRenderer.invoke('get-table-indexes', connectionId, database, schema, table),
    getTableForeignKeys: (connectionId: string, database: string, schema: string, table: string) => 
      ipcRenderer.invoke('get-table-foreign-keys', connectionId, database, schema, table),
    getTableConstraints: (connectionId: string, database: string, schema: string, table: string) => 
      ipcRenderer.invoke('get-table-constraints', connectionId, database, schema, table),
    getQueryPlan: (connectionId: string, query: string) => 
      ipcRenderer.invoke('get-query-plan', connectionId, query),
    
    // イベントリスナー
    onConnectionCreated: (callback: (data: any) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('database-connection-created', listener);
      return () => {
        ipcRenderer.removeListener('database-connection-created', listener);
      };
    },
    
    onConnectionError: (callback: (data: any) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('database-connection-error', listener);
      return () => {
        ipcRenderer.removeListener('database-connection-error', listener);
      };
    },
    
    onConnectionClosed: (callback: (data: any) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('database-connection-closed', listener);
      return () => {
        ipcRenderer.removeListener('database-connection-closed', listener);
      };
    }
  },
  
  // システム情報
  system: {
    platform: process.platform,
  },
  
  // ファイルシステム操作
  files: {
    saveAs: (options: FileSaveOptions) => 
      ipcRenderer.invoke('save-file', options),
    open: (options: FileOpenOptions) => 
      ipcRenderer.invoke('open-file', options),
  },
  
  // ファイルダイアログAPI
  dialog: {
    // ファイル選択ダイアログを表示
    showOpenDialog: (options: OpenDialogOptions) => {
      return ipcRenderer.invoke('show-open-dialog', options);
    },
    
    // ファイル保存ダイアログを表示
    showSaveDialog: (options: SaveDialogOptions) => {
      return ipcRenderer.invoke('show-save-dialog', options);
    }
  }
}); 