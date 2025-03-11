import React, { useState, useEffect } from 'react';
import MainLayout from './Layout/MainLayout';
import Sidebar from './Sidebar/Sidebar';
import SqlEditor from './Editor/SqlEditor';
import ResultsTable from './ResultsPanel/ResultsTable';
import ConnectionModal from './common/ConnectionModal';
import databaseService, { ConnectionConfig, QueryResult, QueryPlanInfo } from './services/DatabaseService';
import ConnectionTree from './Sidebar/ConnectionTree';
import SchemaDetails from './SchemaDetails';
import { MonacoEditor } from './Editor/MonacoEditor';
import QueryResultView from './QueryResultView';
import QueryPlanView from './QueryPlanView';

// モックデータの作成
const generateMockResult = (): QueryResult => {
  // 成功パターン
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
  
  // エラーパターン（コメントアウト）
  /*
  return {
    success: false,
    error: 'ERROR: relation "users" does not exist\nLINE 1: SELECT * FROM users\n                      ^',
    executionTime: 5.2
  };
  */
};

const SqlClientApp: React.FC = () => {
  // 状態管理
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionConfig | undefined>(undefined);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<string>('SELECT * FROM users LIMIT 10;');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showQueryPlan, setShowQueryPlan] = useState<boolean>(false);
  const [queryPlanInfo, setQueryPlanInfo] = useState<QueryPlanInfo | null>(null);
  // スキーマブラウザ用の状態
  const [selectedTableInfo, setSelectedTableInfo] = useState<{
    connectionId: string;
    database: string;
    schema: string;
    table: string;
  } | null>(null);
  const [showSchemaDetails, setShowSchemaDetails] = useState<boolean>(false);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electron?.settings) {
          const settings = await (window as any).electron.settings.load();
          if (settings && settings.connections) {
            setConnections(settings.connections);
          }
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  useEffect(() => {
    // システムの設定からダークモードを取得
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);

    // ダークモード設定の変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // 接続設定を保存
  const handleSaveConnection = async (connection: ConnectionConfig) => {
    try {
      // 新規接続の場合はIDを生成
      if (!connection.id) {
        connection.id = `conn_${Date.now()}`;
      }
      
      // 既存の接続を更新または新規追加
      const updatedConnections = connection.id && connections.find(c => c.id === connection.id)
        ? connections.map(c => c.id === connection.id ? connection : c)
        : [...connections, connection];
      
      setConnections(updatedConnections);
      
      // 設定を保存
      if (typeof window !== 'undefined' && (window as any).electron?.settings) {
        await (window as any).electron.settings.save({ 
          connections: updatedConnections 
        });
      }
      
      setIsConnectionModalOpen(false);
      setEditingConnection(undefined);
      
      // 接続を試みる
      await handleConnectToDatabase(connection);
    } catch (error) {
      console.error('接続設定の保存に失敗しました:', error);
      setErrorMessage('接続設定の保存に失敗しました');
    }
  };
  
  // 新規接続モーダルを開く
  const handleOpenConnectionModal = () => {
    setEditingConnection(undefined);
    setIsConnectionModalOpen(true);
  };
  
  // 既存の接続を編集
  const handleEditConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setEditingConnection(connection);
      setIsConnectionModalOpen(true);
    }
  };
  
  // データベースへ接続
  const handleConnectToDatabase = async (connection: ConnectionConfig) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await databaseService.connectPostgres(connection);
      
      if (result.success && result.connectionId) {
        setActiveConnectionId(result.connectionId);
      } else {
        setErrorMessage(result.error || 'データベースへの接続に失敗しました');
      }
    } catch (error) {
      console.error('データベース接続エラー:', error);
      setErrorMessage('データベース接続中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 接続IDでデータベースへ接続
  const handleSelectConnection = (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (connection) {
      handleConnectToDatabase(connection);
    }
  };
  
  // クエリ実行のハンドラー
  const handleExecuteQuery = async (sql: string) => {
    if (!activeConnectionId) {
      setErrorMessage('データベースに接続してください');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await databaseService.executeQuery(activeConnectionId, sql);
      setQueryResult(result);
      
      if (!result.success) {
        setErrorMessage(result.error || 'クエリ実行中にエラーが発生しました');
      }
    } catch (error) {
      console.error('クエリ実行エラー:', error);
      setErrorMessage('クエリ実行中にエラーが発生しました');
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // テーブルが選択されたときのハンドラ
  const handleSelectTable = (connectionId: string, database: string, schema: string, table: string) => {
    setSelectedTableInfo({ connectionId, database, schema, table });
    setShowSchemaDetails(true);
  };

  // クエリプランを取得する
  const handleGetQueryPlan = async () => {
    if (!currentConnectionId) {
      setErrorMessage('データベースに接続されていません');
      return;
    }

    try {
      setErrorMessage(null);
      
      // クエリプランの取得
      const result = await databaseService.getQueryPlan(currentConnectionId, editorValue);
      
      if (result.success && result.plan) {
        setQueryPlanInfo(result.plan);
        setShowQueryPlan(true);
        setShowSchemaDetails(false);
      } else {
        setErrorMessage(`クエリプランの取得に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('クエリプランの取得に失敗しました:', error);
      setErrorMessage(`クエリプランの取得に失敗しました: ${(error as Error).message}`);
    }
  };

  // SQLエディタに戻る
  const handleBackToEditor = () => {
    setShowQueryPlan(false);
  };

  return (
    <MainLayout>
      {/* 接続モーダル */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSave={handleSaveConnection}
        initialConnection={editingConnection}
      />
      
      {/* 3分割レイアウト */}
      <Sidebar 
        onAddConnection={handleOpenConnectionModal}
        connections={connections}
        activeConnectionId={activeConnectionId}
        onSelectConnection={handleSelectConnection}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 上部: SQLエディタ */}
        <div className="h-1/2 p-4 overflow-hidden">
          <SqlEditor onExecute={handleExecuteQuery} />
        </div>
        
        {/* 下部: 結果テーブル */}
        <div className="h-1/2 p-4 overflow-hidden border-t border-gray-200 dark:border-gray-700">
          <ResultsTable result={queryResult} isLoading={isLoading} />
        </div>
      </div>

      {/* サイドバー */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <Sidebar 
          onAddConnection={handleOpenConnectionModal}
          connections={connections}
          activeConnectionId={activeConnectionId}
          onSelectConnection={handleSelectConnection}
        />
        <div className="flex-1 overflow-y-auto">
          <ConnectionTree 
            connections={connections}
            onSelectConnection={handleSelectConnection}
            activeConnectionId={activeConnectionId}
            onSelectTable={handleSelectTable}
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-2 rounded relative">
            <span className="block sm:inline">{errorMessage}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setErrorMessage(null)}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        {/* コンテンツ表示部分 */}
        <div className="flex-1 p-2 flex flex-col">
          {showSchemaDetails && selectedTableInfo ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between mb-2">
                <h2 className="text-xl font-bold">
                  テーブル詳細: {selectedTableInfo.schema}.{selectedTableInfo.table}
                </h2>
                <button 
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  onClick={() => setShowSchemaDetails(false)}
                >
                  SQLエディタに戻る
                </button>
              </div>
              <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-700 rounded">
                <SchemaDetails 
                  connectionId={selectedTableInfo.connectionId}
                  database={selectedTableInfo.database}
                  schema={selectedTableInfo.schema}
                  table={selectedTableInfo.table}
                />
              </div>
            </div>
          ) : showQueryPlan ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between mb-2">
                <h2 className="text-xl font-bold">クエリプラン分析</h2>
                <button 
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  onClick={handleBackToEditor}
                >
                  SQLエディタに戻る
                </button>
              </div>
              <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-700 rounded">
                <QueryPlanView planInfo={queryPlanInfo} />
              </div>
            </div>
          ) : (
            <>
              {/* SQLエディタ */}
              <div className="h-1/2 mb-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 mb-2 rounded flex justify-between items-center">
                  <h2 className="text-xl font-bold">SQLエディタ</h2>
                  <div className="flex gap-2">
                    <button 
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
                      onClick={handleGetQueryPlan}
                      disabled={!currentConnectionId}
                    >
                      プラン取得
                    </button>
                    <button 
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                      onClick={() => handleExecuteQuery(editorValue)}
                      disabled={!currentConnectionId}
                    >
                      実行
                    </button>
                  </div>
                </div>
                <div className="h-full border border-gray-300 dark:border-gray-700 rounded">
                  <MonacoEditor
                    height="100%"
                    language="sql"
                    theme={isDarkMode ? 'vs-dark' : 'vs-light'}
                    value={editorValue}
                    onChange={setEditorValue}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
              
              {/* クエリ結果 */}
              <div className="h-1/2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 mb-2 rounded">
                  <h2 className="text-xl font-bold">クエリ結果</h2>
                </div>
                <div className="h-full border border-gray-300 dark:border-gray-700 rounded overflow-auto">
                  <QueryResultView result={queryResult} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SqlClientApp; 