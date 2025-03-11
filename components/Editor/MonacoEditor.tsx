import React from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  height: string;
  language: string;
  theme: string;
  value: string;
  onChange: (value: string) => void;
  options?: Record<string, any>;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  height,
  language,
  theme,
  value,
  onChange,
  options = {}
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={value}
      onChange={handleEditorChange}
      options={{
        ...options,
        // デフォルトオプション
        minimap: { enabled: false },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
      }}
    />
  );
}; 