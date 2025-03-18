import { Client, ClientConfig } from 'pg';

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

/**
 * PostgreSQLに接続するための関数
 * GCP Cloud SQL Connectorを使用
 */
export async function connectToPostgres(config: ConnectionConfig): Promise<Client> {
  try {
    let clientConfig: ClientConfig = {
      database: config.database,
      user: config.username,
      password: config.password,
    };

    // GCP Cloud SQL接続の場合
    if (config.isGcp && config.serviceAccountKeyPath && config.instanceConnectionName) {
      // Cloud SQL Connectorを動的にインポート
      const { Connector } = await import('@google-cloud/cloud-sql-connector');
      
      const connector = new Connector();
      const clientOpts = await connector.getOptions({
        instanceConnectionName: config.instanceConnectionName,
      });
      
      // Cloud SQL Connector経由の接続設定を使用
      clientConfig = {
        ...clientConfig,
        ...clientOpts,
      };
    } else {
      // 通常の接続設定
      clientConfig.host = config.host;
      clientConfig.port = parseInt(config.port || '5432');
    }

    const pgClient = new Client(clientConfig);
    await pgClient.connect();
    
    return pgClient;
  } catch (error) {
    console.error('PostgreSQL接続エラー:', error);
    throw error;
  }
}

/**
 * データベース接続をテストする関数
 */
export async function testConnection(config: ConnectionConfig): Promise<boolean> {
  try {
    if (config.type === 'postgresql') {
      const client = await connectToPostgres(config);
      const result = await client.query('SELECT 1 as connection_test');
      await client.end();
      return result.rows[0].connection_test === 1;
    }
    
    // ここに他のデータベースタイプの接続テストを追加

    return false;
  } catch (error) {
    console.error('接続テストエラー:', error);
    return false;
  }
} 