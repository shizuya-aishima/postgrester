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

interface Window {
  electronAPI: {
    testConnection: (connectionConfig: ConnectionConfig) => Promise<{ success: boolean; error?: string }>;
    
    executeQuery: (
      connectionConfig: ConnectionConfig,
      query: string
    ) => Promise<{
      success: boolean;
      rows?: Record<string, unknown>[];
      fields?: QueryResultField[];
      rowCount?: number;
      error?: string;
    }>;
    
    openFileDialog: (options: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
      filters?: Array<{
        name: string;
        extensions: string[];
      }>;
    }) => Promise<string | null>;
    
    getConnections: () => Promise<Connection[]>;
    
    addConnection: (connectionConfig: ConnectionConfig) => Promise<{ 
      success: boolean; 
      connection?: Connection; 
      error?: string 
    }>;
    
    deleteConnection: (id: string) => Promise<{ 
      success: boolean; 
      error?: string 
    }>;
  };
}
