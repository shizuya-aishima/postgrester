import { ipcMain } from 'electron';
import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
// @ts-ignore - pg-cursorの型定義がないため
import Cursor from 'pg-cursor';
import { promisify } from 'util';
import * as fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

// ESMでの__dirnameの代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 接続設定の型定義
export interface ConnectionConfig {
  id: string;
  name: string;
  type: 'postgres' | 'mysql' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  useSSL?: boolean;
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

// トランザクション状態の型定義
interface TransactionState {
  client: PoolClient;
  connectionId: string;
}

// カーソルの型定義（pg-cursorに型定義がないため）
interface CursorField {
  name: string;
  dataTypeID: number;
  [key: string]: any;
}

interface CursorType {
  _fields?: CursorField[];
  hasFields: boolean;
  read: (count: number, callback: (err: Error | null, rows: any[]) => void) => void;
  close: (callback: (err: Error | null) => void) => void;
}

/**
 * データベース接続を管理するクラス
 */
class ConnectionManager {
  // 接続プールをコネクションIDで管理
  private connections: Map<string, Pool> = new Map();
  // アクティブなトランザクションを管理
  private activeTransactions: Map<string, TransactionState> = new Map();
  private eventEmitter: EventEmitter;
  
  constructor() {
    this.eventEmitter = new EventEmitter();
  }
  
  /**
   * データベース接続を作成
   * @param connectionConfig 接続設定
   * @returns 接続結果（成功/失敗）
   */
  async createDatabaseConnection(connectionConfig: ConnectionConfig): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    const { type, name, host, port, database, username, password, isGCP, gcpProjectId, gcpInstanceName, serviceAccountKeyPath, useSSL } = connectionConfig;

    try {
      let connectionId: string;
      
      // 接続タイプに基づいて適切な接続を作成
      switch (type) {
        case 'postgres':
          connectionId = await this.createPostgresConnection(
            name,
            host,
            port,
            database,
            username,
            password,
            isGCP,
            gcpProjectId, 
            gcpInstanceName,
            serviceAccountKeyPath,
            useSSL
          );
          break;
          
        // 将来的には他のデータベースタイプをサポート
        default:
          throw new Error(`未サポートのデータベースタイプ: ${type}`);
      }
      
      // 接続が成功したことをメインプロセスに通知
      this.eventEmitter.emit('database-connection-created', { 
        connectionId,
        name,
        type,
        host,
        port,
        database,
        isGCP 
      });
      
      return {
        success: true,
        connectionId
      };
    } catch (error) {
      console.error('データベース接続の作成に失敗しました:', error);
      this.eventEmitter.emit('database-connection-error', { 
        error: error instanceof Error ? error.message : '不明なエラー',
        config: connectionConfig 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
  
  /**
   * PostgreSQL接続を作成する
   * GCP Cloud SQLに接続する場合はパブリックIPを使用
   */
  private async createPostgresConnection(
    name: string,
    host: string,
    port: number,
    database: string,
    user: string,
    password: string,
    isGCP: boolean = false,
    gcpProjectId?: string,
    gcpInstanceName?: string,
    serviceAccountKeyPath?: string,
    useSSL: boolean = true
  ): Promise<string> {
    try {
      console.log(`PostgreSQL接続を作成中: ${name} (${host}:${port}/${database})`);
      
      // 接続オプションを設定
      const connectionOptions: any = {
        host,
        port,
        database,
        user,
        password,
        // タイムアウトを30秒に設定
        connectionTimeoutMillis: 30000,
        // 最大接続数
        max: 10,
        // アイドル接続をクリーンアップする時間（ミリ秒）
        idleTimeoutMillis: 60000
      };
      
      // SSL設定（デフォルトで有効）
      if (useSSL) {
        connectionOptions.ssl = {
          // 開発環境では自己署名証明書を許可
          rejectUnauthorized: false
        };
      }
      
      // GCP Cloud SQL接続の場合
      if (isGCP) {
        console.log(`GCP Cloud SQL接続: プロジェクト=${gcpProjectId || 'なし'}, インスタンス=${gcpInstanceName || 'なし'}`);
        
        // サービスアカウントキーが提供されている場合は読み込む
        if (serviceAccountKeyPath) {
          try {
            if (fs.existsSync(serviceAccountKeyPath)) {
              console.log(`サービスアカウントキーを読み込み中: ${serviceAccountKeyPath}`);
              const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));
              console.log('サービスアカウントキーが正常に読み込まれました');
              
              // 将来的にはクライアント証明書認証などに使用可能
            } else {
              console.warn(`サービスアカウントキーファイルが見つかりません: ${serviceAccountKeyPath}`);
            }
          } catch (error) {
            console.error('サービスアカウントキーの読み込みに失敗しました:', error);
          }
        }
        
        // パブリックIPを使用して直接接続
        // hostはすでに設定済み（ユーザーが入力したパブリックIPアドレス）
        console.log(`GCP Cloud SQLへのパブリックIP接続を使用: ${host}`);
      }
      
      // 接続IDを生成（一意のID）
      const connectionId = `postgres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 接続プールを作成
      const pool = new Pool(connectionOptions);
      
      // 接続テスト
      const client = await pool.connect();
      try {
        console.log('PostgreSQL接続が確立されました。接続テスト中...');
        const result = await client.query('SELECT version()');
        console.log(`接続成功 - PostgreSQLバージョン: ${result.rows[0].version}`);
      } finally {
        client.release();
      }
      
      // 接続プールをキャッシュに保存
      this.connections.set(connectionId, pool);
      
      return connectionId;
    } catch (error) {
      console.error('PostgreSQL接続の作成に失敗しました:', error);
      throw error;
    }
  }
  
  /**
   * SQLクエリを実行
   * @param connectionId 接続ID
   * @param queryText 実行するSQLクエリ
   * @returns クエリ実行結果
   */
  async executeQuery(connectionId: string, queryText: string): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // トランザクション内の場合、トランザクションのクライアントを使用
      if (this.activeTransactions.has(connectionId)) {
        const transaction = this.activeTransactions.get(connectionId)!;
        const result = await transaction.client.query(queryText);
        return this.formatQueryResult(result, startTime);
      }
      
      // 通常の接続プールから実行
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      const result = await pool.query(queryText);
      return this.formatQueryResult(result, startTime);
    } catch (error) {
      console.error('クエリ実行エラー:', error);
      return {
        success: false,
        error: `クエリの実行に失敗しました: ${(error as Error).message}`,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * カーソルを使用して大量データを取得するクエリを実行
   * @param connectionId 接続ID
   * @param queryText 実行するSQLクエリ
   * @param batchSize 一度に取得する行数
   * @returns クエリ実行結果
   */
  async executeQueryWithCursor(connectionId: string, queryText: string, batchSize: number = 1000): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      // クライアントを取得
      const client = await pool.connect();
      
      try {
        // カーソルを作成
        const cursor = client.query(new Cursor(queryText)) as CursorType;
        
        // 最初のバッチを読み込む
        const read = promisify(cursor.read.bind(cursor));
        const rows = await read(batchSize);
        
        // カーソルを閉じる
        const close = promisify(cursor.close.bind(cursor));
        await close();
        
        // 結果を整形
        return {
          success: true,
          rows,
          fields: cursor._fields?.map(field => ({
            name: field.name,
            dataTypeID: field.dataTypeID
          })),
          rowCount: rows.length,
          executionTime: Date.now() - startTime
        };
      } finally {
        // クライアントを解放
        client.release();
      }
    } catch (error) {
      console.error('カーソルクエリ実行エラー:', error);
      return {
        success: false,
        error: `カーソルを使用したクエリの実行に失敗しました: ${(error as Error).message}`,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * データベーストランザクションを開始
   * @param connectionId 接続ID
   * @returns トランザクションID
   */
  async beginTransaction(connectionId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return { success: false, error: '接続が見つかりません' };
      }

      const client = await pool.connect();
      await client.query('BEGIN');

      // トランザクションIDを生成
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // トランザクション状態を保存
      this.activeTransactions.set(transactionId, { client, connectionId });
      
      return { success: true, transactionId };
    } catch (error) {
      console.error('トランザクション開始エラー:', error);
      return { success: false, error: `トランザクションの開始に失敗しました: ${(error as Error).message}` };
    }
  }
  
  /**
   * データベーストランザクションをコミット
   * @param connectionId 接続ID
   * @param transactionId トランザクションID
   * @returns 成功/失敗
   */
  async commitTransaction(connectionId: string, transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const transactionState = this.activeTransactions.get(transactionId);
      if (!transactionState || transactionState.connectionId !== connectionId) {
        return { success: false, error: 'トランザクションが見つかりません' };
      }

      const { client } = transactionState;
      await client.query('COMMIT');
      client.release();
      
      // 完了したトランザクションを削除
      this.activeTransactions.delete(transactionId);
      
      return { success: true };
    } catch (error) {
      console.error('トランザクションコミットエラー:', error);
      return { success: false, error: `トランザクションのコミットに失敗しました: ${(error as Error).message}` };
    }
  }
  
  /**
   * データベーストランザクションをロールバック
   * @param connectionId 接続ID
   * @param transactionId トランザクションID
   * @returns 成功/失敗
   */
  async rollbackTransaction(connectionId: string, transactionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const transactionState = this.activeTransactions.get(transactionId);
      if (!transactionState || transactionState.connectionId !== connectionId) {
        return { success: false, error: 'トランザクションが見つかりません' };
      }

      const { client } = transactionState;
      await client.query('ROLLBACK');
      client.release();
      
      // 完了したトランザクションを削除
      this.activeTransactions.delete(transactionId);
      
      return { success: true };
    } catch (error) {
      console.error('トランザクションロールバックエラー:', error);
      return { success: false, error: `トランザクションのロールバックに失敗しました: ${(error as Error).message}` };
    }
  }
  
  /**
   * データベース接続を切断
   * @param connectionId 接続ID
   * @returns 成功/失敗
   */
  async disconnectDatabase(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return { success: false, error: '接続が見つかりません' };
      }

      // このプール接続を使用しているアクティブなトランザクションを終了
      for (const [transactionId, state] of this.activeTransactions.entries()) {
        if (state.connectionId === connectionId) {
          try {
            state.client.query('ROLLBACK');
            state.client.release();
            this.activeTransactions.delete(transactionId);
          } catch (e) {
            console.warn(`トランザクション ${transactionId} のクリーンアップに失敗しました`, e);
          }
        }
      }

      // プールを終了
      await pool.end();
      
      // 接続を削除
      this.connections.delete(connectionId);
      
      // 切断イベントを発行
      this.eventEmitter.emit('database-connection-closed', { connectionId });
      
      return { success: true };
    } catch (error) {
      console.error('データベース切断エラー:', error);
      return { success: false, error: `データベース接続の切断に失敗しました: ${(error as Error).message}` };
    }
  }
  
  /**
   * クエリ結果を整形
   * @param result PostgreSQLクエリ結果
   * @param startTime クエリ開始時間
   * @returns 整形されたクエリ結果
   */
  private formatQueryResult(result: PgQueryResult, startTime: number): QueryResult {
    return {
      success: true,
      rows: result.rows,
      fields: result.fields.map(field => ({
        name: field.name,
        dataTypeID: field.dataTypeID
      })),
      rowCount: result.rowCount ?? undefined,
      executionTime: Date.now() - startTime
    };
  }
  
  /**
   * データベース一覧を取得
   * @param connectionId 接続ID
   * @returns データベース一覧
   */
  async getDatabases(connectionId: string): Promise<{ success: boolean; databases?: string[]; error?: string }> {
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      const result = await pool.query(`
        SELECT datname 
        FROM pg_database 
        WHERE datistemplate = false
        ORDER BY datname
      `);
      
      return {
        success: true,
        databases: result.rows.map(row => row.datname)
      };
    } catch (error) {
      console.error('データベース一覧取得エラー:', error);
      return {
        success: false,
        error: `データベース一覧の取得に失敗しました: ${(error as Error).message}`
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
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      const result = await pool.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT LIKE 'pg_%' 
          AND schema_name != 'information_schema'
        ORDER BY schema_name
      `);
      
      return {
        success: true,
        schemas: result.rows.map(row => row.schema_name)
      };
    } catch (error) {
      console.error('スキーマ一覧取得エラー:', error);
      return {
        success: false,
        error: `スキーマ一覧の取得に失敗しました: ${(error as Error).message}`
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
    tables?: Array<{ name: string; type: string; }>;
    error?: string 
  }> {
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      const result = await pool.query(`
        SELECT 
          table_name as name,
          table_type as type
        FROM 
          information_schema.tables 
        WHERE 
          table_schema = $1
        ORDER BY 
          table_type, table_name
      `, [schema]);
      
      return {
        success: true,
        tables: result.rows.map(row => ({
          name: row.name,
          type: row.type === 'BASE TABLE' ? 'table' : 'view'
        }))
      };
    } catch (error) {
      console.error('テーブル一覧取得エラー:', error);
      return {
        success: false,
        error: `テーブル一覧の取得に失敗しました: ${(error as Error).message}`
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
    columns?: Array<{
      name: string;
      type: string;
      nullable: boolean;
      isPrimary: boolean;
      defaultValue?: string;
    }>;
    error?: string;
  }> {
    try {
      const pool = this.connections.get(connectionId);
      if (!pool) {
        return {
          success: false,
          error: `接続IDが無効です: ${connectionId}`
        };
      }
      
      // プライマリキー情報を取得
      const pkQuery = `
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      `;
      
      const pkResult = await pool.query(pkQuery, [`${schema}.${table}`]);
      const primaryKeys = new Set(pkResult.rows.map(row => row.attname));
      
      // カラム情報を取得
      const columnQuery = `
        SELECT 
          c.column_name as name,
          c.data_type as type,
          c.is_nullable = 'YES' as nullable,
          c.column_default as default_value
        FROM 
          information_schema.columns c
        WHERE 
          c.table_schema = $1
          AND c.table_name = $2
        ORDER BY 
          c.ordinal_position
      `;
      
      const columnResult = await pool.query(columnQuery, [schema, table]);
      
      return {
        success: true,
        columns: columnResult.rows.map(row => ({
          name: row.name,
          type: row.type,
          nullable: row.nullable,
          isPrimary: primaryKeys.has(row.name),
          defaultValue: row.default_value
        }))
      };
    } catch (error) {
      console.error('テーブルカラム取得エラー:', error);
      return {
        success: false,
        error: `テーブルのカラム情報取得に失敗しました: ${(error as Error).message}`
      };
    }
  }

  /**
   * テーブルのインデックス情報を取得する
   */
  async getTableIndexes(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    indexes?: Array<{
      name: string;
      indexType: string;
      isUnique: boolean;
      isPrimary: boolean;
      columns: string[];
    }>;
    error?: string;
  }> {
    try {
      const client = this.connections.get(connectionId);
      if (!client) {
        return { success: false, error: `接続ID ${connectionId} は存在しません` };
      }

      // PostgreSQLのインデックス情報を取得するクエリ
      const query = `
        SELECT
          i.relname AS name,
          am.amname AS index_type,
          ix.indisunique AS is_unique,
          ix.indisprimary AS is_primary,
          array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) AS columns
        FROM
          pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_am am ON am.oid = i.relam
          LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE
          t.relname = $1
          AND n.nspname = $2
        GROUP BY
          i.relname,
          am.amname,
          ix.indisunique,
          ix.indisprimary
        ORDER BY
          i.relname;
      `;
      
      const result = await client.query(query, [table, schema]);
      
      return {
        success: true,
        indexes: result.rows.map(row => ({
          name: row.name,
          indexType: row.index_type,
          isUnique: row.is_unique,
          isPrimary: row.is_primary,
          columns: row.columns
        }))
      };
    } catch (error) {
      console.error(`テーブル ${table} のインデックス情報取得中にエラーが発生しました:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * テーブルの外部キー情報を取得する
   */
  async getTableForeignKeys(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    foreignKeys?: Array<{
      constraintName: string;
      columnName: string;
      referencedSchema: string;
      referencedTable: string;
      referencedColumn: string;
      updateRule: string;
      deleteRule: string;
    }>;
    error?: string;
  }> {
    try {
      const client = this.connections.get(connectionId);
      if (!client) {
        return { success: false, error: `接続ID ${connectionId} は存在しません` };
      }

      // PostgreSQLの外部キー情報を取得するクエリ
      const query = `
        SELECT
          c.conname AS constraint_name,
          kcu.column_name,
          rel_nsp.nspname AS referenced_schema,
          rel_tbl.relname AS referenced_table,
          rel_col.attname AS referenced_column,
          CASE c.confupdtype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE c.confupdtype::text
          END AS update_rule,
          CASE c.confdeltype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
            ELSE c.confdeltype::text
          END AS delete_rule
        FROM
          pg_constraint c
          JOIN pg_namespace nsp ON nsp.oid = c.connamespace
          JOIN pg_class tbl ON tbl.oid = c.conrelid
          JOIN information_schema.key_column_usage kcu ON
            kcu.constraint_schema = nsp.nspname AND
            kcu.constraint_name = c.conname AND
            kcu.table_name = tbl.relname
          JOIN pg_attribute col ON 
            col.attrelid = tbl.oid AND 
            col.attnum = ANY(c.conkey)
          JOIN pg_class rel_tbl ON rel_tbl.oid = c.confrelid
          JOIN pg_namespace rel_nsp ON rel_nsp.oid = rel_tbl.relnamespace
          JOIN pg_attribute rel_col ON 
            rel_col.attrelid = rel_tbl.oid AND 
            rel_col.attnum = ANY(c.confkey)
        WHERE
          c.contype = 'f' AND
          nsp.nspname = $1 AND
          tbl.relname = $2 AND
          kcu.column_name = col.attname AND
          array_position(c.conkey, col.attnum) = array_position(c.confkey, rel_col.attnum)
        ORDER BY
          c.conname, kcu.column_name;
      `;
      
      const result = await client.query(query, [schema, table]);
      
      return {
        success: true,
        foreignKeys: result.rows.map(row => ({
          constraintName: row.constraint_name,
          columnName: row.column_name,
          referencedSchema: row.referenced_schema,
          referencedTable: row.referenced_table,
          referencedColumn: row.referenced_column,
          updateRule: row.update_rule,
          deleteRule: row.delete_rule
        }))
      };
    } catch (error) {
      console.error(`テーブル ${table} の外部キー情報取得中にエラーが発生しました:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * テーブルの制約情報を取得する
   */
  async getTableConstraints(connectionId: string, database: string, schema: string, table: string): Promise<{
    success: boolean;
    constraints?: Array<{
      name: string;
      type: string;
      definition: string;
    }>;
    error?: string;
  }> {
    try {
      const client = this.connections.get(connectionId);
      if (!client) {
        return { success: false, error: `接続ID ${connectionId} は存在しません` };
      }

      // PostgreSQLの制約情報を取得するクエリ
      const query = `
        SELECT
          c.conname AS name,
          CASE c.contype
            WHEN 'c' THEN 'CHECK'
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 't' THEN 'TRIGGER'
            WHEN 'x' THEN 'EXCLUSION'
            ELSE c.contype::text
          END AS type,
          pg_get_constraintdef(c.oid) AS definition
        FROM
          pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          JOIN pg_class t ON t.oid = c.conrelid
        WHERE
          n.nspname = $1
          AND t.relname = $2
        ORDER BY
          c.contype, c.conname;
      `;
      
      const result = await client.query(query, [schema, table]);
      
      return {
        success: true,
        constraints: result.rows.map(row => ({
          name: row.name,
          type: row.type,
          definition: row.definition
        }))
      };
    } catch (error) {
      console.error(`テーブル ${table} の制約情報取得中にエラーが発生しました:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * クエリプランを取得する
   * @param connectionId 接続ID 
   * @param queryText クエリテキスト
   * @returns クエリプラン情報
   */
  async getQueryPlan(connectionId: string, queryText: string): Promise<{
    success: boolean;
    plan?: any;
    error?: string;
  }> {
    try {
      const client = this.connections.get(connectionId);
      if (!client) {
        return { success: false, error: `接続ID ${connectionId} は存在しません` };
      }

      // クエリプラン取得のためのEXPLAIN ANALYZE構文
      const explainQuery = `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS, VERBOSE) ${queryText}`;
      
      const startTime = Date.now();
      const result = await client.query(explainQuery);
      const executionTime = Date.now() - startTime;
      
      if (result.rows && result.rows.length > 0 && result.rows[0].hasOwnProperty('QUERY PLAN')) {
        return {
          success: true,
          plan: {
            planData: result.rows[0]['QUERY PLAN'],
            executionTime
          }
        };
      } else {
        return { 
          success: true, 
          plan: {
            planData: result.rows,
            executionTime
          }
        };
      }
    } catch (error) {
      console.error('クエリプラン取得中にエラーが発生しました:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// コネクションマネージャーをインスタンス化
const connectionManager = new ConnectionManager();

// データベースハンドラーを登録
function registerDatabaseHandlers() {
  // PostgreSQL接続ハンドラー
  ipcMain.handle('connect-postgres', async (_event, config: ConnectionConfig) => {
    return await connectionManager.createDatabaseConnection(config);
  });

  // クエリ実行ハンドラー
  ipcMain.handle('execute-query', async (_event, connectionId: string, query: string) => {
    return await connectionManager.executeQuery(connectionId, query);
  });
  
  // トランザクション開始
  ipcMain.handle('begin-transaction', async (_event, connectionId: string) => {
    return await connectionManager.beginTransaction(connectionId);
  });
  
  // トランザクションコミット
  ipcMain.handle('commit-transaction', async (_event, connectionId: string, transactionId: string) => {
    return await connectionManager.commitTransaction(connectionId, transactionId);
  });
  
  // トランザクションロールバック
  ipcMain.handle('rollback-transaction', async (_event, connectionId: string, transactionId: string) => {
    return await connectionManager.rollbackTransaction(connectionId, transactionId);
  });
  
  // データベース接続切断
  ipcMain.handle('disconnect-database', async (_event, connectionId: string) => {
    return await connectionManager.disconnectDatabase(connectionId);
  });

  // データベーススキーマ情報取得ハンドラー
  ipcMain.handle('get-databases', async (_event, connectionId: string) => {
    return await connectionManager.getDatabases(connectionId);
  });

  ipcMain.handle('get-schemas', async (_event, connectionId: string, database: string) => {
    return await connectionManager.getSchemas(connectionId, database);
  });

  ipcMain.handle('get-tables', async (_event, connectionId: string, database: string, schema: string) => {
    return await connectionManager.getTables(connectionId, database, schema);
  });

  ipcMain.handle('get-table-columns', async (_event, connectionId: string, database: string, schema: string, table: string) => {
    return await connectionManager.getTableColumns(connectionId, database, schema, table);
  });

  ipcMain.handle('get-table-indexes', async (_event, connectionId: string, database: string, schema: string, table: string) => {
    return await connectionManager.getTableIndexes(connectionId, database, schema, table);
  });

  ipcMain.handle('get-table-foreign-keys', async (_event, connectionId: string, database: string, schema: string, table: string) => {
    return await connectionManager.getTableForeignKeys(connectionId, database, schema, table);
  });

  ipcMain.handle('get-table-constraints', async (_event, connectionId: string, database: string, schema: string, table: string) => {
    return await connectionManager.getTableConstraints(connectionId, database, schema, table);
  });

  ipcMain.handle('get-query-plan', async (_event, connectionId: string, query: string) => {
    return await connectionManager.getQueryPlan(connectionId, query);
  });
}

// エクスポート
export { connectionManager, registerDatabaseHandlers }; 