import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// 接続設定の型
interface ConnectionConfig {
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

// 初期接続設定
const defaultConnection: ConnectionConfig = {
  id: '',
  name: '',
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: '',
  username: '',
  password: '',
  useSSL: false
};

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: ConnectionConfig) => void;
  initialConnection?: ConnectionConfig;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConnection
}) => {
  const [connection, setConnection] = useState<ConnectionConfig>(
    initialConnection || defaultConnection
  );
  
  // GCP接続かどうかのトグル
  const [isGCPConnection, setIsGCPConnection] = useState<boolean>(
    initialConnection?.isGCP || false
  );
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(connection);
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {connection.id ? '接続設定を編集' : '新規接続の追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* 基本設定 */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">接続名</label>
            <input
              type="text"
              id="name"
              className="form-input"
              value={connection.name}
              onChange={(e) => setConnection({
                ...connection,
                name: e.target.value
              })}
              required
              placeholder="開発環境PostgreSQL"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type" className="form-label">データベースタイプ</label>
            <select
              id="type"
              className="form-input"
              value={connection.type}
              onChange={(e) => setConnection({
                ...connection,
                type: e.target.value as 'postgres' | 'mysql' | 'oracle'
              })}
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql" disabled>MySQL (近日対応予定)</option>
              <option value="oracle" disabled>Oracle (近日対応予定)</option>
            </select>
          </div>
          
          {/* GCP接続切り替え */}
          <div className="form-group">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isGCPConnection}
                onChange={(e) => {
                  setIsGCPConnection(e.target.checked);
                  setConnection({
                    ...connection,
                    isGCP: e.target.checked
                  });
                }}
              />
              <span className="ml-2 text-sm">Google Cloud SQL (GCP)</span>
            </label>
          </div>
          
          {/* 共通接続設定 - GCPでもホスト/ポートを入力できるようにする */}
          <div className="form-group">
            <label htmlFor="host" className="form-label">
              {isGCPConnection ? 'パブリックIPアドレス' : 'ホスト'}
            </label>
            <input
              type="text"
              id="host"
              className="form-input"
              value={connection.host}
              onChange={(e) => setConnection({
                ...connection,
                host: e.target.value
              })}
              required
              placeholder={isGCPConnection ? '例: 34.56.78.90' : 'localhost'}
            />
            {isGCPConnection && (
              <div className="text-xs text-gray-500 mt-1">
                GCPコンソールで確認できるCloud SQLインスタンスのパブリックIPアドレスを入力してください。
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="port" className="form-label">ポート</label>
            <input
              type="number"
              id="port"
              className="form-input"
              value={connection.port}
              onChange={(e) => setConnection({
                ...connection,
                port: parseInt(e.target.value)
              })}
              required
              placeholder={isGCPConnection ? '5432' : '5432'}
            />
          </div>
          
          {/* GCP固有の接続設定 */}
          {isGCPConnection && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-md border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                GCP Cloud SQL接続設定
              </h3>
              
              <div className="form-group">
                <label htmlFor="gcpProjectId" className="form-label">GCPプロジェクトID <span className="text-xs text-gray-500">(オプション)</span></label>
                <input
                  type="text"
                  id="gcpProjectId"
                  className="form-input"
                  value={connection.gcpProjectId || ''}
                  onChange={(e) => setConnection({
                    ...connection,
                    gcpProjectId: e.target.value
                  })}
                  placeholder="my-gcp-project-123456"
                />
                <div className="text-xs text-gray-500 mt-1">
                  パブリックIP接続の場合は必須ではありませんが、将来的な機能のために保存されます。
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="gcpInstanceName" className="form-label">インスタンス名 <span className="text-xs text-gray-500">(オプション)</span></label>
                <input
                  type="text"
                  id="gcpInstanceName"
                  className="form-input"
                  value={connection.gcpInstanceName || ''}
                  onChange={(e) => setConnection({
                    ...connection,
                    gcpInstanceName: e.target.value
                  })}
                  placeholder="my-postgres-instance"
                />
                <div className="text-xs text-gray-500 mt-1">
                  パブリックIP接続の場合は必須ではありませんが、将来的な機能のために保存されます。
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="serviceAccountKeyPath" className="form-label">
                  サービスアカウントキーのパス <span className="text-xs text-gray-500">(オプション)</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="serviceAccountKeyPath"
                    className="form-input flex-1 rounded-r-none"
                    value={connection.serviceAccountKeyPath || ''}
                    onChange={(e) => setConnection({
                      ...connection,
                      serviceAccountKeyPath: e.target.value
                    })}
                    placeholder="/path/to/key.json"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      // Electronの場合、ファイル選択ダイアログを表示
                      if (typeof window !== 'undefined' && (window as any).electron) {
                        (window as any).electron.dialog.showOpenDialog({
                          filters: [{ name: 'JSON', extensions: ['json'] }],
                          properties: ['openFile']
                        }).then((result: { canceled: boolean; filePaths: string[] }) => {
                          if (!result.canceled && result.filePaths.length > 0) {
                            setConnection({
                              ...connection,
                              serviceAccountKeyPath: result.filePaths[0]
                            });
                          }
                        });
                      }
                    }}
                  >
                    選択
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  パブリックIP接続の場合は必須ではありませんが、将来的な機能のために保存されます。
                </div>
              </div>
              
              <div className="form-group mb-0">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={connection.useSSL || false}
                    onChange={(e) => setConnection({
                      ...connection,
                      useSSL: e.target.checked
                    })}
                  />
                  <span className="ml-2 text-sm">SSL/TLS接続を使用する (セキュリティ上強く推奨)</span>
                </label>
              </div>
            </div>
          )}
          
          {/* 共通設定 */}
          <div className="form-group">
            <label htmlFor="database" className="form-label">データベース名</label>
            <input
              type="text"
              id="database"
              className="form-input"
              value={connection.database}
              onChange={(e) => setConnection({
                ...connection,
                database: e.target.value
              })}
              required
              placeholder="postgres"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username" className="form-label">ユーザー名</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={connection.username}
              onChange={(e) => setConnection({
                ...connection,
                username: e.target.value
              })}
              required
              placeholder="postgres"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">パスワード</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={connection.password}
              onChange={(e) => setConnection({
                ...connection,
                password: e.target.value
              })}
              required
            />
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {connection.id ? '更新' : '接続を追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal; 