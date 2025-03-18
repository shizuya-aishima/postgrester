import ConnectionModal from '@/components/ConnectionModal';
import { useEffect, useState } from 'react';
import type React from 'react';

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

const Sidebar: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 保存された接続情報をロード
  useEffect(() => {
    const loadConnections = async () => {
      try {
        setIsLoading(true);
        const savedConnections = await window.electronAPI.getConnections();
        setConnections(savedConnections);
      } catch (error) {
        console.error('接続情報の読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, []);

  const handleAddConnection = async (connectionData: {
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
  }) => {
    try {
      // 接続情報を保存
      const result = await window.electronAPI.addConnection(connectionData);

      if (result.success && result.connection) {
        setConnections([...connections, result.connection]);
        setIsModalOpen(false);
      } else {
        console.error('接続情報の保存に失敗しました:', result.error);
      }
    } catch (error) {
      console.error('接続情報の保存エラー:', error);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      const result = await window.electronAPI.deleteConnection(id);

      if (result.success) {
        setConnections(connections.filter((conn) => conn.id !== id));
      } else {
        console.error('接続情報の削除に失敗しました');
      }
    } catch (error) {
      console.error('接続情報の削除エラー:', error);
    }
  };

  return (
    <aside className='w-64 bg-white border-r border-gray-200 h-screen'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-sm font-semibold text-gray-600'>接続</h2>
          <button
            type='button'
            className='text-gray-600 hover:text-gray-800'
            aria-label='新しい接続を追加'
            onClick={() => setIsModalOpen(true)}
          >
            <svg
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className='py-2 text-sm text-gray-500'>読み込み中...</div>
        ) : connections.length === 0 ? (
          <div className='py-2 text-sm text-gray-500'>
            接続がありません。新しい接続を追加してください。
          </div>
        ) : (
          <div className='space-y-1'>
            {connections.map((connection) => (
              <div key={connection.id} className='group relative'>
                <button
                  className='flex items-center w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md'
                  type='button'
                  aria-label={`${connection.name}に接続`}
                >
                  <span className='mr-2'>
                    {connection.type === 'postgresql' && (
                      <svg
                        className='h-4 w-4 text-blue-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
                      </svg>
                    )}
                    {connection.type === 'mysql' && (
                      <svg
                        className='h-4 w-4 text-orange-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
                      </svg>
                    )}
                    {connection.type === 'sqlite' && (
                      <svg
                        className='h-4 w-4 text-green-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
                      </svg>
                    )}
                  </span>
                  {connection.name}
                </button>
                <button
                  onClick={() => handleDeleteConnection(connection.id)}
                  className='absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
                  aria-label='接続を削除'
                  type='button'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddConnection}
      />
    </aside>
  );
};

export default Sidebar;
