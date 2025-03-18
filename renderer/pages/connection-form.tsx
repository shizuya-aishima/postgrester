import ConnectionForm from '@/components/ConnectionForm';
import type { ConnectionConfig } from '@/types/connection';
import { useEffect } from 'react';

export default function ConnectionFormPage() {
  // 接続情報が保存されたときの処理
  const handleSubmit = async (connectionData: ConnectionConfig) => {
    try {
      // メインプロセスに接続情報を送信して保存
      if (typeof window !== 'undefined' && window.electron) {
        const result = await window.electron.addConnection(connectionData);

        if (result.success) {
          // 接続情報の保存に成功したらウィンドウを閉じる
          window.close();
        } else {
          console.error('接続情報の保存に失敗しました:', result.error);
        }
      }
    } catch (error) {
      console.error('接続情報の送信エラー:', error);
    }
  };

  // キャンセル時の処理
  const handleCancel = () => {
    // ウィンドウを閉じる
    window.close();
  };

  return (
    <div className='flex justify-center items-center min-h-screen bg-gray-50'>
      <ConnectionForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
