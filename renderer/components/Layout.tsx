import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import type React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header />
        <main className='flex-1 overflow-auto p-4'>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
