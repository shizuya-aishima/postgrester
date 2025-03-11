import React, { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { FaFileExcel, FaFileCsv, FaFileCode } from 'react-icons/fa';

// フィールド情報の型
interface Field {
  name: string;
  dataTypeID: number;
}

// クエリ結果の型
interface QueryResult {
  success: boolean;
  rows?: any[];
  fields?: Field[];
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

interface ResultsTableProps {
  result: QueryResult | null;
  isLoading?: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ result, isLoading = false }) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // ソート関数
  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldName);
      setSortDirection('asc');
    }
  };
  
  // ソートされた行を取得
  const getSortedRows = () => {
    if (!result?.rows || !sortField) return result?.rows;
    
    return [...(result.rows || [])].sort((a, b) => {
      if (a[sortField] === null) return 1;
      if (b[sortField] === null) return -1;
      
      if (a[sortField] < b[sortField]) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (a[sortField] > b[sortField]) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // エクスポート関数
  const exportData = (format: 'csv' | 'json' | 'excel') => {
    if (!result?.rows) return;
    
    let content: string = '';
    const fields = result.fields?.map(f => f.name) || [];
    
    if (format === 'csv') {
      // CSVフォーマット
      content = [
        fields.join(','),
        ...result.rows.map(row => 
          fields.map(field => JSON.stringify(row[field] ?? '')).join(',')
        )
      ].join('\n');
      
      downloadFile(content, 'query-result.csv', 'text/csv');
    } else if (format === 'json') {
      // JSONフォーマット
      content = JSON.stringify(result.rows, null, 2);
      downloadFile(content, 'query-result.json', 'application/json');
    } else if (format === 'excel') {
      // CSV形式でExcelに対応
      content = [
        fields.join(','),
        ...result.rows.map(row => 
          fields.map(field => JSON.stringify(row[field] ?? '')).join(',')
        )
      ].join('\n');
      
      downloadFile(content, 'query-result.csv', 'text/csv');
    }
  };
  
  // ファイルダウンロード
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  
  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
        <p>クエリ実行中...</p>
      </div>
    );
  }
  
  // エラー表示
  if (result?.error) {
    return (
      <div className="flex flex-col h-full p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 rounded">
        <h3 className="text-lg font-semibold mb-2">エラーが発生しました</h3>
        <pre className="whitespace-pre-wrap font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded overflow-auto">
          {result.error}
        </pre>
      </div>
    );
  }
  
  // 結果がない場合
  if (!result || !result.rows || result.rows.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        <p className="text-center">クエリを実行してください。</p>
      </div>
    );
  }
  
  const sortedRows = getSortedRows();
  const fields = result.fields?.map(f => f.name) || Object.keys(result.rows[0]);
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
      {/* ツールバー */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {result.rowCount !== undefined ? (
            <span>{result.rowCount} 行</span>
          ) : (
            <span>{result.rows.length} 行</span>
          )}
          {result.executionTime !== undefined && (
            <span className="ml-2">({result.executionTime.toFixed(2)} ms)</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => exportData('excel')}
            className="flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Excelとして保存"
          >
            <FaFileExcel className="w-3 h-3 mr-1" />
            Excel
          </button>
          
          <button 
            onClick={() => exportData('csv')}
            className="flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="CSVとして保存"
          >
            <FaFileCsv className="w-3 h-3 mr-1" />
            CSV
          </button>
          
          <button 
            onClick={() => exportData('json')}
            className="flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="JSONとして保存"
          >
            <FaFileCode className="w-3 h-3 mr-1" />
            JSON
          </button>
        </div>
      </div>
      
      {/* テーブル */}
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {fields.map((field) => (
                <th 
                  key={field}
                  onClick={() => handleSort(field)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>{field}</span>
                    {sortField === field && (
                      sortDirection === 'asc' ? (
                        <ArrowUpIcon className="w-3 h-3" />
                      ) : (
                        <ArrowDownIcon className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedRows?.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {fields.map((field) => (
                  <td 
                    key={`${rowIndex}-${field}`}
                    className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono"
                  >
                    {row[field] === null ? (
                      <span className="text-gray-400 dark:text-gray-500 italic">NULL</span>
                    ) : (
                      typeof row[field] === 'object' ? 
                        JSON.stringify(row[field]) : 
                        String(row[field])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable; 