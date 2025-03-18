import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';

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

/**
 * 接続情報を保存するクラス
 */
export class ConnectionStorage {
  private storagePath: string;
  private connections: Connection[] = [];

  constructor() {
    // アプリのユーザーデータディレクトリ内に保存
    const userDataPath = app.getPath('userData');
    this.storagePath = join(userDataPath, 'connections.json');
    
    // 初期化時に保存済みのデータを読み込む
    this.loadConnections();
  }

  /**
   * 接続情報を保存する
   */
  private saveConnections(): void {
    try {
      // パスワードなど機密情報は暗号化するべきだが、簡略化のためそのまま保存
      writeFileSync(this.storagePath, JSON.stringify(this.connections), 'utf8');
    } catch (error) {
      console.error('接続情報の保存に失敗しました:', error);
    }
  }

  /**
   * 保存済みの接続情報を読み込む
   */
  private loadConnections(): void {
    try {
      if (existsSync(this.storagePath)) {
        const data = readFileSync(this.storagePath, 'utf8');
        this.connections = JSON.parse(data);
      } else {
        this.connections = [];
      }
    } catch (error) {
      console.error('接続情報の読み込みに失敗しました:', error);
      this.connections = [];
    }
  }

  /**
   * 全ての接続情報を取得
   */
  getAllConnections(): Connection[] {
    return [...this.connections];
  }

  /**
   * 指定したIDの接続情報を取得
   */
  getConnection(id: string): Connection | undefined {
    return this.connections.find(conn => conn.id === id);
  }

  /**
   * 新しい接続情報を追加
   */
  addConnection(connection: Omit<Connection, 'id'>): Connection {
    const newConnection: Connection = {
      ...connection,
      id: Date.now().toString(), // 簡易的なID生成
    };
    
    this.connections.push(newConnection);
    this.saveConnections();
    
    return newConnection;
  }

  /**
   * 接続情報を更新
   */
  updateConnection(id: string, connection: Partial<Omit<Connection, 'id'>>): boolean {
    const index = this.connections.findIndex(conn => conn.id === id);
    
    if (index === -1) {
      return false;
    }
    
    this.connections[index] = {
      ...this.connections[index],
      ...connection
    };
    
    this.saveConnections();
    return true;
  }

  /**
   * 接続情報を削除
   */
  deleteConnection(id: string): boolean {
    const initialLength = this.connections.length;
    this.connections = this.connections.filter(conn => conn.id !== id);
    
    if (this.connections.length !== initialLength) {
      this.saveConnections();
      return true;
    }
    
    return false;
  }
} 