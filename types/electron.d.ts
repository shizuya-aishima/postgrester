/**
 * Electronブリッジの型定義
 * このファイルはレンダラープロセス（Next.js）からElectron APIにアクセスするための
 * 型定義を提供します。
 */

declare namespace ElectronBridge {
  // データベース接続設定の型定義
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
    // GCP Cloud SQL 特有の設定
    isGCP?: boolean;
    gcpProjectId?: string;
    gcpInstanceName?: string;
    serviceAccountKeyPath?: string;
  }

  // クエリ結果の型定義
  interface QueryResult {
    success: boolean;
    rows?: any[];
    fields?: Array<{ name: string; dataTypeID: number }>;
    rowCount?: number;
    error?: string;
    executionTime?: number;
  }

  // ファイル保存オプションの型定義
  interface FileSaveOptions {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    content: string;
  }

  // ファイルを開くオプションの型定義
  interface FileOpenOptions {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }

  // テーブルカラムの型定義
  interface TableColumn {
    name: string;
    type: string;
    nullable: boolean;
    isPrimary: boolean;
    defaultValue?: string;
  }

  // アプリケーション設定の型定義
  interface AppSettings {
    connections: ConnectionConfig[];
    theme: 'light' | 'dark';
    editorFontSize: number;
    // その他の設定
    [key: string]: any;
  }
}

// WindowのElectronインターフェース拡張
declare global {
  interface Window {
    electron: {
      // 設定管理
      settings: {
        save: (settings: any) => Promise<{ success: boolean; error?: string }>;
        load: () => Promise<any>;
      };
      
      // データベース操作
      database: {
        // PostgreSQL接続
        connectPostgres: (config: ElectronBridge.ConnectionConfig) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
        
        // クエリ実行
        executeQuery: (connectionId: string, query: string) => Promise<ElectronBridge.QueryResult>;
        
        // トランザクション管理
        beginTransaction: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
        commitTransaction: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
        rollbackTransaction: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
        
        // 接続切断
        disconnect: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
        
        // データベーススキーマ情報取得
        getDatabases: (connectionId: string) => Promise<{ success: boolean; databases?: string[]; error?: string }>;
        getSchemas: (connectionId: string, database: string) => Promise<{ success: boolean; schemas?: string[]; error?: string }>;
        getTables: (connectionId: string, database: string, schema: string) => Promise<{ 
          success: boolean; 
          tables?: Array<{ name: string; type: string; }>;
          error?: string 
        }>;
        getTableColumns: (connectionId: string, database: string, schema: string, table: string) => Promise<{
          success: boolean;
          columns?: ElectronBridge.TableColumn[];
          error?: string;
        }>;
      };
      
      // システム情報
      system: {
        platform: string;
      };
      
      // ファイルシステム操作
      files: {
        saveAs: (options: ElectronBridge.FileSaveOptions) => Promise<{ success: boolean; filePath?: string; error?: string }>;
        open: (options: ElectronBridge.FileOpenOptions) => Promise<{ success: boolean; filePath?: string; content?: string; error?: string }>;
      };
    };
  }
}

export {}; 