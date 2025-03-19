interface ElectronAPI {
  testConnection: (connectionData: {
    name: string;
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    file?: string;
    isGcp: boolean;
    serviceAccountKeyPath: string;
    instanceConnectionName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  saveConnection: (connectionData: {
    name: string;
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    file?: string;
    isGcp: boolean;
    serviceAccountKeyPath: string;
    instanceConnectionName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
