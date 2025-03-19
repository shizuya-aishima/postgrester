'use client';

import { useRouter } from 'next/navigation';
import ConnectionForm from '../../components/ConnectionForm';

export default function ConnectionPage() {
  const router = useRouter();

  const handleSubmit = (connectionData: {
    name: string;
    type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: string;
    database?: string;
    username?: string;
    password?: string;
    file?: string;
    isGcp: boolean;
    serviceAccountKeyPath: string;
    instanceConnectionName?: string;
  }) => {
    // ここで接続データを保存する処理を実装
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI
        .saveConnection(connectionData)
        .then(() => {
          // 保存後にモーダルを閉じる
          window.close();
        })
        .catch((error) => {
          console.error('接続の保存に失敗しました:', error);
        });
    } else {
      console.log('接続データ保存:', connectionData);
      window.close();
    }
  };

  const handleCancel = () => {
    console.log('キャンセル');
    // キャンセル時にウィンドウを閉じる
    window.close();
  };

  return (
    <div className='flex justify-center items-center min-h-screen bg-gray-100'>
      <ConnectionForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
