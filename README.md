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

# Electron with Typescript application example

This example shows how to use Next.js inside an Electron application. To avoid a lot of configuration, we use Next.js as a router for pages, and use server rendering to speed up the initial render of the application. Both Next.js and Electron layers are written in TypeScript and compiled to JavaScript during the build process.

| Part       | Source code (Typescript) | Builds (JavaScript) |
| ---------- | ------------------------ | ------------------- |
| Next.js    | `/renderer`              | `/renderer`         |
| Electron   | `/electron-src`          | `/main`             |
| Production |                          | `/dist`             |

For development it's going to run a HTTP server and let Next.js handle routing. In production it will use `output: 'export'` to pre-generate HTML static files and use them in your app (instead of running a HTTP server).

## How to use

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init), [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/), or [pnpm](https://pnpm.io) to bootstrap the example:

```bash
npx create-next-app --example with-electron-typescript with-electron-typescript-app
```

```bash
yarn create next-app --example with-electron-typescript with-electron-typescript-app
```

```bash
pnpm create next-app --example with-electron-typescript with-electron-typescript-app
```

Available commands:

```bash
"build-renderer": build and transpile Next.js layer
"build-electron": transpile electron layer
"build": build both layers
"dev": start dev version
"dist": create production electron build
"type-check": check TypeScript in project
```

## Notes

You can create the production app using `npm run dist`.

_note regarding types:_

- Electron provides its own type definitions, so you don't need @types/electron installed!
  source: https://www.npmjs.com/package/@types/electron
- There were no types available for `electron-next` at the time of creating this example, so until they are available there is a file `electron-next.d.ts` in `electron-src` directory.
