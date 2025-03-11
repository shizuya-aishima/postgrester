import React, { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow">
        <div className="flex items-center space-x-2">
          <img src="/icon.png" alt="SQL Client" className="w-8 h-8" />
          <h1 className="text-xl font-bold">SQL Client</h1>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="テーマ切り替え"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </button>
      </header>
      
      {/* メインコンテンツ */}
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>
      
      {/* ステータスバー */}
      <footer className="flex items-center justify-between px-4 py-1 bg-white dark:bg-gray-800 text-xs border-t border-gray-200 dark:border-gray-700">
        <div>ステータス: 準備完了</div>
        <div>PostgreSQL</div>
      </footer>
    </div>
  );
};

export default MainLayout; 