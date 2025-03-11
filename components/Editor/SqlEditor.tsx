import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlayIcon, ClipboardIcon, TrashIcon } from '@heroicons/react/24/outline';

// Monaco Editorをクライアントサイドでのみロード
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

interface SqlEditorProps {
  onExecute?: (sql: string) => void;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ onExecute }) => {
  const [sql, setSql] = useState<string>('SELECT * FROM users LIMIT 10;');
  
  const handleExecute = () => {
    if (onExecute) {
      onExecute(sql);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
  };
  
  const handleClear = () => {
    setSql('');
  };
  
  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleExecute}
          className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
          title="実行 (Ctrl+Enter)"
        >
          <PlayIcon className="w-4 h-4 mr-1" />
          実行
        </button>
        
        <button
          onClick={handleCopy}
          className="flex items-center px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm transition-colors"
          title="クリップボードにコピー"
        >
          <ClipboardIcon className="w-4 h-4 mr-1" />
          コピー
        </button>
        
        <button
          onClick={handleClear}
          className="flex items-center px-2 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm transition-colors"
          title="クリア"
        >
          <TrashIcon className="w-4 h-4 mr-1" />
          クリア
        </button>
      </div>
      
      {/* エディタ */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language="sql"
          theme="vs-dark"
          value={sql}
          onChange={(value) => setSql(value || '')}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            suggestSelection: 'first',
            snippetSuggestions: 'inline',
            contextmenu: true,
            lineNumbers: 'on',
            rulers: [],
            folding: true,
            lineDecorationsWidth: 10,
            autoIndent: 'full',
            formatOnType: true,
            formatOnPaste: true
          }}
        />
      </div>
      
      {/* 状態表示 */}
      <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        PostgreSQL
      </div>
    </div>
  );
};

export default SqlEditor; 