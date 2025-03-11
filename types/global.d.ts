interface Window {
  electron: {
    settings: {
      save: (settings: any) => Promise<{ success: boolean; error?: string }>;
      load: () => Promise<any>;
    };
    database: {
      connect: (config: any) => Promise<{ success: boolean; error?: string }>;
      disconnect: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
      query: (connectionId: string, sql: string) => Promise<{ success: boolean; results?: any; error?: string }>;
      executeQuery: (connectionId: string, sql: string) => Promise<{ success: boolean; results?: any; error?: string }>;
      connectPostgres: (config: any) => Promise<{ success: boolean; error?: string }>;
    };
  };
} 