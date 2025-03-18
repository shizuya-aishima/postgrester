interface QueryResultField {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

interface Connection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  file?: string;
  isGcp?: boolean;
  serviceAccountKeyPath?: string;
  instanceConnectionName?: string;
}

interface ConnectionConfig {
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  file?: string;
  isGcp?: boolean;
  serviceAccountKeyPath?: string;
  instanceConnectionName?: string;
}

interface IpcRendererEvent {
  sender: unknown;
  senderId: number;
}

interface Window {
  electron: {
    // メッセージ関連
    sayHello: () => void;
    receiveHello: (
      handler: (event: IpcRendererEvent, message: string) => void,
    ) => void;
    stopReceivingHello: (
      handler: (event: IpcRendererEvent, message: string) => void,
    ) => void;

    // データベース接続関連
    testConnection: (
      connectionConfig: ConnectionConfig,
    ) => Promise<{ success: boolean; error?: string }>;
    executeQuery: (
      connectionConfig: ConnectionConfig,
      query: string,
    ) => Promise<{
      success: boolean;
      rows?: Record<string, unknown>[];
      fields?: QueryResultField[];
      rowCount?: number;
      error?: string;
    }>;

    // ファイル選択
    openFileDialog: (options: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
      filters?: Array<{
        name: string;
        extensions: string[];
      }>;
    }) => Promise<string | null>;

    // 接続管理
    getConnections: () => Promise<Connection[]>;
    addConnection: (connectionConfig: ConnectionConfig) => Promise<{
      success: boolean;
      connection?: Connection;
      error?: string;
    }>;
    deleteConnection: (id: string) => Promise<{
      success: boolean;
      error?: string;
    }>;

    // ウィンドウ管理
    openConnectionFormWindow: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };

  // 後方互換性のため
  electronAPI: typeof electron;
}
