import React from 'react';
import ConnectionTree from './ConnectionTree';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ConnectionConfig } from '../services/DatabaseService';

interface SidebarProps {
  onAddConnection?: () => void;
  connections?: ConnectionConfig[];
  activeConnectionId?: string | null;
  onSelectConnection?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onAddConnection,
  connections = [],
  activeConnectionId,
  onSelectConnection
}) => {
  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold">データベース接続</h2>
        <button
          onClick={onAddConnection}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          title="新規接続"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      <ConnectionTree 
        connections={connections}
        activeConnectionId={activeConnectionId}
        onSelectConnection={onSelectConnection}
      />
    </div>
  );
};

export default Sidebar; 