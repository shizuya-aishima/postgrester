/**
 * データベース接続情報の型定義
 */
interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  isGCP?: boolean;
  gcpProjectId?: string;
  gcpInstanceName?: string;
  serviceAccountKeyPath?: string;
  useSSL?: boolean;
}

/**
 * クエリ結果の型定義
 */
interface QueryResult {
  rows: any[];
  fields: {
    name: string;
    dataTypeID: number;
  }[];
  rowCount: number;
  command: string;
}

/**
 * DatabaseService - データベース操作を担当するサービスクラス
 */
class DatabaseService {
  private static instance: DatabaseService;
  
  // 接続のキャッシュ
  private connections: Map<string, Connection> = new Map();
  
  // プライベートコンストラクタ（シングルトンパターン）
  private constructor() {}
  
  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  /**
   * データベース接続を作成
   * @param connection 接続情報
   * @returns 接続ID
   */
  async connectToDatabase(connection: Connection): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      console.log('データベースに接続中:', connection.name);
      
      // 接続設定を準備
      const connectionConfig: any = {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        isGCP: connection.isGCP || false,
        useSSL: connection.useSSL || false
      };
      
      // GCP固有の設定を追加
      if (connection.isGCP) {
        connectionConfig.gcpProjectId = connection.gcpProjectId;
        connectionConfig.gcpInstanceName = connection.gcpInstanceName;
        connectionConfig.serviceAccountKeyPath = connection.serviceAccountKeyPath;
      }
      
      // Electronの場合のみ
      if (typeof window !== 'undefined' && (window as any).electron) {
        // データベースタイプに基づいて接続メソッドを呼び出す
        let result;
        switch (connection.type) {
          case 'postgres':
            result = await (window as any).electron.database.connectToPostgres(connectionConfig);
            break;
          // 将来的に他のデータベースタイプをサポート
          default:
            throw new Error(`未サポートのデータベースタイプ: ${connection.type}`);
        }
        
        if (result.success) {
          // 接続情報をキャッシュに保存（パスワードは保存しない）
          const { password, ...safeConnection } = connection;
          this.connections.set(result.connectionId!, { ...safeConnection, id: result.connectionId! });
          console.log('データベース接続成功:', result.connectionId);
          return result;
        } else {
          console.error('データベース接続エラー:', result.error);
          return result;
        }
      } else {
        // Electron環境以外の場合（開発環境など）
        console.warn('Electron APIが見つかりません。開発モード？');
        // モックの成功結果を返す
        const mockConnectionId = `mock-${Date.now()}`;
        this.connections.set(mockConnectionId, { ...connection, id: mockConnectionId });
        return { success: true, connectionId: mockConnectionId };
      }
    } catch (error) {
      console.error('データベース接続エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
  
  /**
   * データベース接続を切断
   * @param connectionId 接続ID
   */
  async disconnectDatabase(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window !== 'undefined' && (window as any).electron) {
        const result = await (window as any).electron.database.disconnect(connectionId);
        if (result.success) {
          this.connections.delete(connectionId);
        }
        return result;
      } else {
        // 開発モードでは単にマップから削除
        this.connections.delete(connectionId);
        return { success: true };
      }
    } catch (error) {
      console.error('データベース切断エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
  
  /**
   * クエリを実行
   * @param connectionId 接続ID
   * @param query SQL文
   */
  async executeQuery(connectionId: string, query: string): Promise<{ success: boolean; results?: any; error?: string }> {
    try {
      if (typeof window !== 'undefined' && (window as any).electron) {
        return await (window as any).electron.database.executeQuery(connectionId, query);
      } else {
        // 開発モード用のモックデータ
        console.warn('開発モード: モックデータを返します');
        return {
          success: true,
          results: {
            rows: [{ id: 1, name: 'テストデータ' }],
            fields: [
              { name: 'id', dataTypeID: 23 },
              { name: 'name', dataTypeID: 25 }
            ],
            rowCount: 1,
            command: 'SELECT',
          }
        };
      }
    } catch (error) {
      console.error('クエリ実行エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
  
  /**
   * 接続を取得
   * @param connectionId 接続ID
   */
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }
  
  /**
   * すべての接続を取得
   */
  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * データベース接続作成イベントのリスナーを登録
   * @param callback イベントハンドラ関数
   */
  onConnectionCreated(callback: (data: any) => void): () => void {
    if (typeof window !== 'undefined' && (window as any).electron) {
      return (window as any).electron.database.onConnectionCreated(callback);
    }
    // 開発モードでは何もしない関数を返す
    return () => {};
  }
  
  /**
   * データベース接続エラーイベントのリスナーを登録
   * @param callback イベントハンドラ関数
   */
  onConnectionError(callback: (data: any) => void): () => void {
    if (typeof window !== 'undefined' && (window as any).electron) {
      return (window as any).electron.database.onConnectionError(callback);
    }
    // 開発モードでは何もしない関数を返す
    return () => {};
  }
  
  /**
   * データベース接続切断イベントのリスナーを登録
   * @param callback イベントハンドラ関数
   */
  onConnectionClosed(callback: (data: any) => void): () => void {
    if (typeof window !== 'undefined' && (window as any).electron) {
      return (window as any).electron.database.onConnectionClosed(callback);
    }
    // 開発モードでは何もしない関数を返す
    return () => {};
  }
}

export default DatabaseService; 