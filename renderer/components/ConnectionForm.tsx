import { useState } from 'react';
import type React from 'react';

interface ConnectionFormProps {
  onSubmit: (connectionData: {
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
  }) => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [connectionData, setConnectionData] = useState({
    name: '',
    type: 'postgresql' as 'postgresql' | 'mysql' | 'sqlite',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    file: '',
    isGcp: true,
    serviceAccountKeyPath: '',
    instanceConnectionName: '',
  });
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testError, setTestError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setConnectionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Fileオブジェクトからパスを取得（セキュリティ上の理由で制限あり）
      const filePath = file.name;
      setConnectionData((prev) => ({
        ...prev,
        serviceAccountKeyPath: filePath,
      }));
    }
  };

  const handleFileSelect = () => {
    // 隠しファイル入力をクリック
    document.getElementById('fileInput')?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(connectionData);
  };

  const handleTestConnection = async () => {
    try {
      setTestStatus('testing');
      setTestError(null);

      // Electronの機能を使用する前に、window.electronAPIが存在するか確認
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.testConnection(connectionData);

        if (result.success) {
          setTestStatus('success');
        } else {
          setTestStatus('error');
          setTestError(result.error || '接続に失敗しました');
        }
      } else {
        setTestStatus('error');
        setTestError(
          'Electron APIが利用できません。Electron環境で実行してください。',
        );
      }
    } catch (error) {
      setTestStatus('error');
      setTestError(
        error instanceof Error ? error.message : '不明なエラーが発生しました',
      );
    }
  };

  return (
    <div className='p-4 bg-white rounded-lg shadow-md w-full max-w-md'>
      <h2 className='text-lg font-semibold mb-4'>新しい接続先</h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label
            htmlFor='name'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            接続名
          </label>
          <input
            type='text'
            id='name'
            name='name'
            value={connectionData.name}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>

        {connectionData.type === 'sqlite' ? (
          <div className='mb-4'>
            <label
              htmlFor='file'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              ファイルパス
            </label>
            <input
              type='text'
              id='file'
              name='file'
              value={connectionData.file}
              onChange={handleChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              required
            />
          </div>
        ) : (
          <>
            <div className='mb-4'>
              <label
                htmlFor='instanceConnectionName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                インスタンス接続名 (project:region:instance)
              </label>
              <input
                type='text'
                id='instanceConnectionName'
                name='instanceConnectionName'
                value={connectionData.instanceConnectionName}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='example-project:asia-northeast1:example-instance'
                required
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='database'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                データベース名
              </label>
              <input
                type='text'
                id='database'
                name='database'
                value={connectionData.database}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                required
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                ユーザー名
              </label>
              <input
                type='text'
                id='username'
                name='username'
                value={connectionData.username}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                required
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                パスワード
              </label>
              <input
                type='password'
                id='password'
                name='password'
                value={connectionData.password}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              />
            </div>

            <div className='mb-4'>
              <label
                htmlFor='serviceAccountKeyPath'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                サービスアカウントキーファイル (.json)
              </label>
              <div className='flex'>
                <input
                  type='text'
                  id='serviceAccountKeyPath'
                  name='serviceAccountKeyPath'
                  value={connectionData.serviceAccountKeyPath}
                  onChange={handleChange}
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md'
                  placeholder='/path/to/service-account-key.json'
                  required
                />
                <button
                  type='button'
                  onClick={handleFileSelect}
                  className='px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-r-md hover:bg-gray-200'
                >
                  選択
                </button>
              </div>
              <input
                type='file'
                id='fileInput'
                accept='.json'
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
          </>
        )}

        <div className='flex justify-end space-x-2 mt-6'>
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            キャンセル
          </button>
          <button
            type='button'
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className='px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50'
          >
            {testStatus === 'testing' ? '接続テスト中...' : '接続テスト'}
          </button>
          <button
            type='submit'
            className='px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700'
          >
            保存
          </button>
        </div>

        {testStatus === 'success' && (
          <div className='mt-4 p-3 bg-green-100 text-green-800 rounded-md'>
            接続に成功しました
          </div>
        )}

        {testStatus === 'error' && testError && (
          <div className='mt-4 p-3 bg-red-100 text-red-800 rounded-md'>
            エラー: {testError}
          </div>
        )}
      </form>
    </div>
  );
};

export default ConnectionForm;
