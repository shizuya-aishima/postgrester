import type React from 'react';
import { useState } from 'react';

interface Connection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
}

const Sidebar: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([
    { id: '1', name: 'Local PostgreSQL', type: 'postgresql' },
    { id: '2', name: 'Production MySQL', type: 'mysql' },
  ]);

  return (
    <aside className='w-64 bg-white border-r border-gray-200 h-screen'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-sm font-semibold text-gray-600'>接続</h2>
          <button
            type='button'
            className='text-gray-600 hover:text-gray-800'
            aria-label='新しい接続を追加'
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
        <div className='space-y-1'>
          {connections.map((connection) => (
            <button
              key={connection.id}
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
              </span>
              {connection.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
