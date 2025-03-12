module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // プロジェクト固有のルール
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
  },
  ignorePatterns: ['node_modules/', 'main/**/*.js']
}; 