/**
 * データベース接続の設定インターフェース
 */
export interface ConnectionConfig {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  useSSL: boolean;
  isGCP?: boolean;
  gcpProjectId?: string;
  gcpInstanceName?: string;
  serviceAccountKeyPath?: string;
}

/**
 * クエリ結果のインターフェース
 */
export interface QueryResult {
  success: boolean;
  rows?: any[];
  fields?: Array<{ name: string; dataTypeID: number }>;
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

/**
 * テーブル情報のインターフェース
 */
export interface TableInfo {
  name: string;
  type: string;
}

/**
 * カラム情報のインターフェース
 */
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  defaultValue?: string;
}

/**
 * インデックス情報のインターフェース
 */
export interface IndexInfo {
  name: string;
  indexType: string;
  isUnique: boolean;
  isPrimary: boolean;
  columns: string[];
}

/**
 * 外部キー情報のインターフェース
 */
export interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  referencedSchema: string;
  referencedTable: string;
  referencedColumn: string;
  updateRule: string;
  deleteRule: string;
}

/**
 * 制約情報のインターフェース
 */
export interface ConstraintInfo {
  name: string;
  type: string;
  definition: string;
}

/**
 * クエリプラン情報のインターフェース
 */
export interface QueryPlanInfo {
  planData: any;
  executionTime: number;
}

/**
 * データベースサービスクラス
 * Electronのバックエンドと通信してデータベース操作を行う
 */
class DatabaseService {
  /**
   * Electronの存在確認
   * @returns Electronのデータベース機能が利用可能かどうか
   */
  private isElectronAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).electron?.database;
  }

  /**
   * PostgreSQLに接続
   * @param config 接続設定
   * @returns 接続結果
   */
  async connectPostgres(config: ConnectionConfig): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    if (!this.isElectronAvailable()) {
      return this.mockConnectPostgres(config);
    }

    try {
      return await (window as any).electron.database.connectPostgres(config);
    } catch (error) {
      console.error('PostgreSQL接続エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'PostgreSQLへの接続に失敗しました'
      };
    }
  }

  /**
   * クエリを実行
   * @param connectionId 接続ID
   * @param query SQLクエリ
   * @returns クエリ実行結果
   */
  async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    if (!this.isElectronAvailable()) {
      return this.mockExecuteQuery(query);
    }

    try {
      return await (window as any).electron.database.executeQuery(connectionId, query);
    } catch (error) {
      console.error('クエリ実行エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'クエリの実行に失敗しました',
        executionTime: 0
      };
    }
  }

  /**
   * トランザクションを開始
   * @param connectionId 接続ID
   * @returns トランザクション開始結果
   */
  async beginTransaction(connectionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectronAvailable()) {
      return { success: true };
    }

    try {
      return await (window as any).electron.database.beginTransaction(connectionId);
    } catch (error) {
      console.error('トランザクション開始エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'トランザクションの開始に失敗しました'
      };
    }
  }

  /**
   * トランザクションをコミット
   * @param connectionId 接続ID
   * @returns コミット結果
   */
  async commitTransaction(connectionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectronAvailable()) {
      return { success: true };
    }

    try {
      return await (window as any).electron.database.commitTransaction(connectionId);
    } catch (error) {
      console.error('トランザクションコミットエラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'トランザクションのコミットに失敗しました'
      };
    }
  }

  /**
   * トランザクションをロールバック
   * @param connectionId 接続ID
   * @returns ロールバック結果
   */
  async rollbackTransaction(connectionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectronAvailable()) {
      return { success: true };
    }

    try {
      return await (window as any).electron.database.rollbackTransaction(connectionId);
    } catch (error) {
      console.error('トランザクションロールバックエラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'トランザクションのロールバックに失敗しました'
      };
    }
  }

  /**
   * データベース接続を切断
   * @param connectionId 接続ID
   * @returns 切断結果
   */
  async disconnect(connectionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectronAvailable()) {
      return { success: true };
    }

    try {
      return await (window as any).electron.database.disconnect(connectionId);
    } catch (error) {
      console.error('接続切断エラー:', error);
      return {
        success: false,
        error: (error as Error).message || '接続の切断に失敗しました'
      };
    }
  }

  /**
   * データベース一覧を取得
   * @param connectionId 接続ID
   * @returns データベース一覧
   */
  async getDatabases(connectionId: string): Promise<{ success: boolean; databases?: string[]; error?: string }> {
    if (!this.isElectronAvailable()) {
      return {
        success: true,
        databases: ['postgres', 'template1', 'dev_database', 'test_database']
      };
    }

    try {
      return await (window as any).electron.database.getDatabases(connectionId);
    } catch (error) {
      console.error('データベース一覧取得エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'データベース一覧の取得に失敗しました'
      };
    }
  }

  /**
   * スキーマ一覧を取得
   * @param connectionId 接続ID
   * @param database データベース名
   * @returns スキーマ一覧
   */
  async getSchemas(connectionId: string, database: string): Promise<{ success: boolean; schemas?: string[]; error?: string }> {
    if (!this.isElectronAvailable()) {
      return {
        success: true,
        schemas: ['public', 'auth', 'app_data', 'analytics']
      };
    }

    try {
      return await (window as any).electron.database.getSchemas(connectionId, database);
    } catch (error) {
      console.error('スキーマ一覧取得エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'スキーマ一覧の取得に失敗しました'
      };
    }
  }

  /**
   * テーブル一覧を取得
   * @param connectionId 接続ID
   * @param database データベース名
   * @param schema スキーマ名
   * @returns テーブル一覧
   */
  async getTables(connectionId: string, database: string, schema: string): Promise<{
    success: boolean;
    tables?: TableInfo[];
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return {
        success: true,
        tables: [
          { name: 'users', type: 'table' },
          { name: 'products', type: 'table' },
          { name: 'orders', type: 'table' },
          { name: 'active_users', type: 'view' }
        ]
      };
    }

    try {
      return await (window as any).electron.database.getTables(connectionId, database, schema);
    } catch (error) {
      console.error('テーブル一覧取得エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'テーブル一覧の取得に失敗しました'
      };
    }
  }

  /**
   * テーブルのカラム情報を取得
   * @param connectionId 接続ID
   * @param database データベース名
   * @param schema スキーマ名
   * @param table テーブル名
   * @returns カラム情報
   */
  async getTableColumns(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    columns?: ColumnInfo[];
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return {
        success: true,
        columns: [
          { name: 'id', type: 'integer', nullable: false, isPrimary: true, defaultValue: 'nextval(\'users_id_seq\'::regclass)' },
          { name: 'username', type: 'character varying', nullable: false, isPrimary: false },
          { name: 'email', type: 'character varying', nullable: false, isPrimary: false },
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, isPrimary: false, defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      };
    }

    try {
      return await (window as any).electron.database.getTableColumns(connectionId, database, schema, table);
    } catch (error) {
      console.error('テーブルカラム取得エラー:', error);
      return {
        success: false,
        error: (error as Error).message || 'テーブルのカラム情報取得に失敗しました'
      };
    }
  }

  /**
   * テーブルのインデックス情報を取得する
   */
  async getTableIndexes(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    indexes?: IndexInfo[];
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return this.mockGetTableIndexes();
    }

    try {
      const result = await (window as any).electron.database.getTableIndexes(connectionId, database, schema, table);
      return result;
    } catch (error) {
      console.error('テーブルのインデックス情報の取得中にエラーが発生しました:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * テーブルの外部キー情報を取得する
   */
  async getTableForeignKeys(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    foreignKeys?: ForeignKeyInfo[];
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return this.mockGetTableForeignKeys();
    }

    try {
      const result = await (window as any).electron.database.getTableForeignKeys(connectionId, database, schema, table);
      return result;
    } catch (error) {
      console.error('テーブルの外部キー情報の取得中にエラーが発生しました:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * テーブルの制約情報を取得する
   */
  async getTableConstraints(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    constraints?: ConstraintInfo[];
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return this.mockGetTableConstraints();
    }

    try {
      const result = await (window as any).electron.database.getTableConstraints(connectionId, database, schema, table);
      return result;
    } catch (error) {
      console.error('テーブルの制約情報の取得中にエラーが発生しました:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * クエリプランを取得する
   */
  async getQueryPlan(connectionId: string, query: string): Promise<{
    success: boolean;
    plan?: QueryPlanInfo;
    error?: string;
  }> {
    if (!this.isElectronAvailable()) {
      return this.mockGetQueryPlan();
    }

    try {
      const result = await (window as any).electron.database.getQueryPlan(connectionId, query);
      return result;
    } catch (error) {
      console.error('クエリプランの取得中にエラーが発生しました:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * モックデータ: PostgreSQL接続
   * @param config 接続設定
   * @returns モック接続結果
   */
  private mockConnectPostgres(config: ConnectionConfig): { success: boolean; connectionId?: string; error?: string } {
    console.log('モック接続を使用します:', config);
    // 開発環境では常に成功するようにする
    return {
      success: true,
      connectionId: `mock_${config.id}`
    };
  }

  /**
   * モックデータ: クエリ実行
   * @param query SQLクエリ
   * @returns モッククエリ結果
   */
  private mockExecuteQuery(query: string): QueryResult {
    console.log('モッククエリを実行します:', query);
    
    // SELECT文かどうかの簡易判定
    const isSelect = /^\s*SELECT/i.test(query);
    
    if (isSelect) {
      // SELECTクエリのモック結果
      return {
        success: true,
        rows: [
          { id: 1, name: '山田太郎', email: 'yamada@example.com', created_at: '2023-01-01 12:00:00' },
          { id: 2, name: '鈴木花子', email: 'suzuki@example.com', created_at: '2023-01-02 13:30:00' },
          { id: 3, name: '佐藤一郎', email: 'sato@example.com', created_at: '2023-01-03 09:15:00' },
          { id: 4, name: '田中次郎', email: 'tanaka@example.com', created_at: '2023-01-04 10:45:00' },
          { id: 5, name: '高橋三郎', email: 'takahashi@example.com', created_at: '2023-01-05 14:20:00' }
        ],
        fields: [
          { name: 'id', dataTypeID: 23 },
          { name: 'name', dataTypeID: 25 },
          { name: 'email', dataTypeID: 25 },
          { name: 'created_at', dataTypeID: 1114 }
        ],
        rowCount: 5,
        executionTime: 12.5
      };
    } else {
      // 更新系クエリのモック結果
      return {
        success: true,
        rowCount: 1,
        executionTime: 8.3
      };
    }
  }

  /**
   * モック: テーブルのインデックス情報を取得する
   */
  private mockGetTableIndexes(): { success: boolean; indexes: IndexInfo[] } {
    return {
      success: true,
      indexes: [
        {
          name: 'idx_mock_id',
          indexType: 'btree',
          isUnique: true,
          isPrimary: true,
          columns: ['id']
        },
        {
          name: 'idx_mock_name',
          indexType: 'btree',
          isUnique: false,
          isPrimary: false,
          columns: ['name']
        }
      ]
    };
  }

  /**
   * モック: テーブルの外部キー情報を取得する
   */
  private mockGetTableForeignKeys(): { success: boolean; foreignKeys: ForeignKeyInfo[] } {
    return {
      success: true,
      foreignKeys: [
        {
          constraintName: 'fk_mock_user_id',
          columnName: 'user_id',
          referencedSchema: 'public',
          referencedTable: 'users',
          referencedColumn: 'id',
          updateRule: 'CASCADE',
          deleteRule: 'RESTRICT'
        }
      ]
    };
  }

  /**
   * モック: テーブルの制約情報を取得する
   */
  private mockGetTableConstraints(): { success: boolean; constraints: ConstraintInfo[] } {
    return {
      success: true,
      constraints: [
        {
          name: 'pk_mock_id',
          type: 'PRIMARY KEY',
          definition: 'PRIMARY KEY (id)'
        },
        {
          name: 'uq_mock_email',
          type: 'UNIQUE',
          definition: 'UNIQUE (email)'
        },
        {
          name: 'ch_mock_status',
          type: 'CHECK',
          definition: 'CHECK (status IN (\'active\', \'inactive\', \'pending\'))'
        }
      ]
    };
  }

  /**
   * モック: クエリプランを取得する
   */
  private mockGetQueryPlan(): { success: boolean; plan: QueryPlanInfo } {
    const mockPlanData = {
      "Plan": {
        "Node Type": "Seq Scan",
        "Relation Name": "users",
        "Alias": "users",
        "Startup Cost": 0.00,
        "Total Cost": 22.70,
        "Plan Rows": 1270,
        "Plan Width": 36,
        "Actual Startup Time": 0.019,
        "Actual Total Time": 0.020,
        "Actual Rows": 10,
        "Actual Loops": 1,
        "Output": ["id", "name", "email", "created_at"]
      },
      "Planning Time": 0.088,
      "Execution Time": 0.045
    };

    return {
      success: true,
      plan: {
        planData: [mockPlanData],
        executionTime: 45.23
      }
    };
  }
}

// シングルトンインスタンスを作成してエクスポート
const databaseService = new DatabaseService();
export default databaseService; 