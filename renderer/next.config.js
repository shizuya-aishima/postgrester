/** @type {import('next').NextConfig} */
const nextConfig = {
  // 出力先をElectronアプリケーション用に設定
  output: 'export',
  // 静的HTMLエクスポート
  images: {
    unoptimized: true,
  },
  // アプリケーションパス
  distDir: "../app",
  // ベースパスの設定
  basePath: '',
  // ウェブサーバーのルート相対でアセットをロード
  assetPrefix: process.env.NODE_ENV === 'production' ? '.' : '',
  // トレースを無効化（サイズ削減のため）
  trailingSlash: true,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 