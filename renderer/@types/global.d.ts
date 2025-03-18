interface QueryResultField {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

interface Window {
  electronAPI: {
    testConnection: (connectionConfig: {
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
    }) => Promise<{ success: boolean; error?: string }>;

    executeQuery: (
      connectionConfig: {
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
      },
      query: string,
    ) => Promise<{
      success: boolean;
      rows?: Record<string, unknown>[];
      fields?: QueryResultField[];
      rowCount?: number;
      error?: string;
    }>;
  };
}
