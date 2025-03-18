import { ipcMain } from 'electron';
import { connectToPostgres, testConnection } from '../../main/services/database';
import { ConnectionStorage } from '../../main/storage/connections';

// 接続情報を管理するストレージインスタンス
const connectionStorage = new ConnectionStorage();

/**
 * データベース接続関連のIPCハンドラを設定する
 */
export function setupDatabaseIpcHandlers(): void {
  // 接続テスト
  ipcMain.handle('database:test-connection', async (_, connectionConfig) => {
    try {
      const result = await testConnection(connectionConfig);
      return { success: result };
    } catch (error) {
      console.error('接続テストエラー (IPC):', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      };
    }
  });

  // クエリ実行
  ipcMain.handle('database:execute-query', async (_, { connectionConfig, query }) => {
    try {
      if (connectionConfig.type === 'postgresql') {
        const client = await connectToPostgres(connectionConfig);
        
        try {
          const result = await client.query(query);
          return {
            success: true,
            rows: result.rows,
            fields: result.fields,
            rowCount: result.rowCount,
          };
        } finally {
          // クエリ実行後は常に接続を閉じる
          await client.end();
        }
      }
      
      // 他のデータベースタイプのサポートはここに追加

      throw new Error('サポートされていないデータベースタイプです');
    } catch (error) {
      console.error('クエリ実行エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
  
  // 接続リストの取得
  ipcMain.handle('database:get-connections', async () => {
    return connectionStorage.getAllConnections();
  });
  
  // 接続を追加
  ipcMain.handle('database:add-connection', async (_, connectionConfig) => {
    try {
      const newConnection = connectionStorage.addConnection(connectionConfig);
      return { success: true, connection: newConnection };
    } catch (error) {
      console.error('接続追加エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
  
  // 接続を削除
  ipcMain.handle('database:delete-connection', async (_, id) => {
    try {
      const result = connectionStorage.deleteConnection(id);
      return { success: result };
    } catch (error) {
      console.error('接続削除エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  });
} 