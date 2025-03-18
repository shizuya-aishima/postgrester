'use client';

import Layout from '@/components/Layout';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const handleMessage = (_event, args) => alert(args);

    // listen to the 'message' channel
    window.electron.receiveHello(handleMessage);

    return () => {
      window.electron.stopReceivingHello(handleMessage);
    };
  }, []);

  const onSayHiClick = () => {
    window.electron.sayHello();
  };

  return (
    <Layout>
      <div className='max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm'>
        <h1 className='text-2xl font-bold mb-4'>Hello Next.js 👋</h1>
        <button
          type='button'
          onClick={onSayHiClick}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
        >
          Say hi to electron
        </button>
      </div>
    </Layout>
  );
}
