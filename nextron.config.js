module.exports = {
  // Electronのウィンドウ設定
  webpack: (config, { dev }) => {
    config.target = 'electron-renderer';
    
    // メインプロセスのビルド設定
    if (!dev && config.name === 'main') {
      config.output = {
        ...config.output,
        filename: '[name].js',
        path: __dirname
      }
    }
    
    return config;
  },
  // 開発サーバーのポート
  devServer: {
    port: 3000
  }
}; 