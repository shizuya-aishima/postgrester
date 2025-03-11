import React from 'react';
import { QueryResult } from './services/DatabaseService';

interface QueryResultViewProps {
  result: QueryResult | null;
}

const QueryResultView: React.FC<QueryResultViewProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p>クエリを実行すると結果がここに表示されます</p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
        <h3 className="font-bold mb-2">エラーが発生しました</h3>
        <p className="font-mono text-sm whitespace-pre-wrap">{result.error}</p>
      </div>
    );
  }

  if (!result.rows || result.rows.length === 0) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
        <p>結果が0件です</p>
        {result.rowCount !== undefined && (
          <p>{result.rowCount} 行が影響を受けました</p>
        )}
        {result.executionTime !== undefined && (
          <p>実行時間: {result.executionTime.toFixed(2)} ms</p>
        )}
      </div>
    );
  }

  const fields = result.fields || Object.keys(result.rows[0]).map(key => ({ name: key, dataTypeID: 0 }));

  return (
    <div className="overflow-x-auto">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 mb-2 text-sm">
        <span className="font-bold">{result.rows.length} 行</span>
        {result.executionTime !== undefined && (
          <span className="ml-4">実行時間: {result.executionTime.toFixed(2)} ms</span>
        )}
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {fields.map((field, idx) => (
              <th 
                key={idx} 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {field.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {result.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
              {fields.map((field, colIdx) => (
                <td 
                  key={colIdx} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 font-mono"
                >
                  {formatCellValue(row[field.name])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// セル値のフォーマット
function formatCellValue(value: any): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  
  return String(value);
}

export default QueryResultView; 