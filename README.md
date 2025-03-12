# SQLクライアントアプリケーション

PostgreSQLを中心とした強力なSQLクライアントアプリケーションです。Next.js + Electronを使用して構築されています。

## 主な機能

- PostgreSQL接続管理
- クエリエディタとクエリ実行
- データベーススキーマブラウジング
- クエリ履歴と保存機能
- 将来的にMySQL、Oracleなど他のデータベースもサポート予定

## 開発環境のセットアップ

### 前提条件

- Node.js 18+
- pnpm
- PostgreSQL（ローカル開発用）

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/sql-client.git
cd sql-client
```

2. 依存関係のインストール
```bash
pnpm install
```

3. 開発サーバーの起動
```bash
pnpm dev
```

## ビルド方法

リリース用ビルドを作成するには:

```bash
pnpm build
```

ビルドされた実行ファイルは `dist` ディレクトリに生成されます。

## 技術スタック

- メインフレームワーク: Next.js + Electron
- データベース: PostgreSQL (最優先)、将来的にMySQLやOracleにも対応
- UI: React コンポーネント
- スタイリング: Tailwind CSS
- 対象プラットフォーム: Windows、Linux
- パッケージ管理: pnpm

## ライセンス

MIT 