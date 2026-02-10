# Task Management API

Claude Codeを用いた並列開発の検証を目的としたシンプルなタスク管理REST APIです。Node.jsとExpressで構築され、SQLiteをデータベースとして使用しています。

## 技術スタック

| カテゴリ | 技術 | バージョン |
| --- | --- | --- |
| ランタイム | Node.js | v18以上 |
| フレームワーク | Express.js | ^4.18.2 |
| データベース | SQLite (better-sqlite3) | ^12.6.2 |
| バリデーション | express-validator | ^7.0.1 |
| パスワードハッシュ | bcrypt | ^5.1.1 |
| テスト | Jest + Supertest | ^29.7.0 / ^6.3.3 |
| リンター | ESLint | ^9.15.0 |
| フォーマッター | Prettier | ^3.1.1 |

## セットアップ

### 必要な環境

- Node.js v18以上
- npm v9以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/gebadev/task-management-api.git
cd task-management-api

# 依存関係のインストール
npm install

# データベースの初期化（スキーマ作成 + シードデータ投入）
npm run db:init

# 開発サーバーの起動
npm run dev
```

サーバーはデフォルトで `http://localhost:3000` で起動します。

## 開発コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `npm start` | 本番サーバー起動 |
| `npm run dev` | ホットリロード付き開発サーバー起動 |
| `npm test` | 全テスト実行 |
| `npm run test:watch` | ウォッチモードでテスト実行 |
| `npm run test:coverage` | カバレッジレポート付きテスト実行 |
| `npm run lint` | ESLintでコード品質チェック |
| `npm run lint:fix` | ESLintで自動修正 |
| `npm run format` | Prettierでコードフォーマット |
| `npm run format:check` | Prettierフォーマットチェック |
| `npm run db:init` | データベース初期化 |
| `npm run db:reset` | データベース削除・再作成 |

## API エンドポイント一覧

### ヘルスチェック

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/health` | ヘルスチェック |

### ユーザー管理

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/users` | ユーザー一覧取得 |
| POST | `/api/users` | ユーザー作成 |
| GET | `/api/users/:id` | ユーザー詳細取得 |

### タスク管理

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/tasks` | タスク一覧取得（フィルタリング対応） |
| POST | `/api/tasks` | タスク作成 |
| GET | `/api/tasks/:id` | タスク詳細取得 |
| PUT | `/api/tasks/:id` | タスク更新 |
| DELETE | `/api/tasks/:id` | タスク削除 |
| PUT | `/api/tasks/:id/assign` | タスク割り当て |

### コメント

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/tasks/:id/comments` | タスクのコメント一覧取得 |
| POST | `/api/tasks/:id/comments` | コメント作成 |

### 統計情報

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/stats` | タスク統計情報取得 |

## API 使用例

### ユーザーを作成する

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2026-02-05T10:00:00Z"
  }
}
```

### タスクを作成する

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "APIエンドポイント実装",
    "description": "タスクCRUDのエンドポイントを実装する",
    "priority": "high",
    "assignee_id": 1,
    "due_date": "2026-02-15T00:00:00Z"
  }'
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "APIエンドポイント実装",
    "description": "タスクCRUDのエンドポイントを実装する",
    "status": "todo",
    "priority": "high",
    "creator_id": 1,
    "assignee_id": 1,
    "due_date": "2026-02-15T00:00:00Z",
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T10:00:00Z"
  }
}
```

### タスク一覧をフィルタリングして取得する

```bash
curl "http://localhost:3000/api/tasks?status=in_progress&priority=high&limit=10&offset=0"
```

**レスポンス:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "APIエンドポイント実装",
      "status": "in_progress",
      "priority": "high",
      "creator_id": 1,
      "assignee_id": 2,
      "due_date": "2026-02-10T00:00:00Z",
      "created_at": "2026-02-05T10:00:00Z",
      "updated_at": "2026-02-05T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### タスクを担当者に割り当てる

```bash
curl -X PUT http://localhost:3000/api/tasks/1/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee_id": 2}'
```

### コメントを投稿する

```bash
curl -X POST http://localhost:3000/api/tasks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "content": "進捗を確認しました。問題なさそうです。"
  }'
```

### 統計情報を取得する

```bash
curl http://localhost:3000/api/stats
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "total_tasks": 10,
    "tasks_by_status": {
      "todo": 4,
      "in_progress": 3,
      "done": 3
    },
    "tasks_by_priority": {
      "low": 2,
      "medium": 5,
      "high": 3
    },
    "completion_rate": 30,
    "overdue_tasks": 1,
    "tasks_by_assignee": [
      {
        "user_id": 1,
        "username": "alice",
        "task_count": 5
      }
    ]
  }
}
```

### エラーレスポンス例

**バリデーションエラー (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**リソース未検出 (404):**

```json
{
  "success": false,
  "error": "Task not found"
}
```

**重複エラー (409):**

```json
{
  "success": false,
  "error": "Username already exists"
}
```

## ディレクトリ構造

```
task-management-api/
├── src/
│   ├── app.js                    # Expressアプリ設定
│   ├── routes/
│   │   ├── index.js              # ルート集約
│   │   ├── tasks.js              # タスク関連ルート
│   │   ├── users.js              # ユーザー関連ルート
│   │   ├── comments.js           # コメント関連ルート
│   │   └── stats.js              # 統計関連ルート
│   ├── controllers/
│   │   ├── tasksController.js    # タスクリクエスト処理
│   │   ├── usersController.js    # ユーザーリクエスト処理
│   │   ├── commentsController.js # コメントリクエスト処理
│   │   └── statsController.js    # 統計リクエスト処理
│   ├── services/
│   │   ├── taskService.js        # タスクビジネスロジック
│   │   ├── userService.js        # ユーザービジネスロジック
│   │   ├── commentService.js     # コメントビジネスロジック
│   │   └── statsService.js       # 統計ビジネスロジック
│   ├── db/
│   │   ├── connection.js         # DB接続モジュール
│   │   ├── schema.sql            # スキーマ定義
│   │   └── seed.sql              # シードデータ
│   ├── middleware/
│   │   ├── errorHandler.js       # グローバルエラーハンドラー
│   │   └── validators.js         # バリデーションルール
│   └── utils/
│       └── constants.js          # 定数定義
├── tests/                        # テストコード
├── scripts/                      # DBスクリプト
├── docs/                         # ドキュメント
│   ├── basic-design.md           # 基本設計書
│   ├── parallel-development-guide.md  # 並列開発ガイド
│   ├── api-spec.md               # API仕様書
│   └── parallel-dev-report.md    # 並列開発検証レポート
├── server.js                     # エントリーポイント
├── package.json
├── jest.config.js
├── eslint.config.mjs
└── .prettierrc
```

## アーキテクチャ

レイヤードアーキテクチャを採用し、各層の責務を明確に分離しています。

```
Routes → Controllers → Services → Data Access → SQLite Database
```

| レイヤー | 責務 |
| --- | --- |
| Routes | エンドポイント定義、リクエストルーティング |
| Controllers | リクエスト/レスポンス処理、バリデーション |
| Services | ビジネスロジック |
| Data Access | パラメータ化SQLクエリによるDB操作 |

## テスト

```bash
# 全テスト実行
npm test

# カバレッジレポート付き
npm run test:coverage

# ウォッチモード
npm run test:watch
```

テストはJest + Supertestで構築されており、各テストスイートの前にテスト用データベースがリセットされます。

### カバレッジ目標

- Services層: 90%以上
- Controllers層: 80%以上
- 全体: 80%以上

## 並列開発検証について

このプロジェクトは、Claude Codeの並列開発能力を検証するために設計されました。10個のGitHub Issueを4フェーズに分けて、複数のClaude Codeインスタンスが同時に実装を行いました。

詳細は以下のドキュメントを参照してください:

- [基本設計書](docs/basic-design.md) - システムアーキテクチャ、データモデル、API仕様
- [並列開発ガイド](docs/parallel-development-guide.md) - 並列開発の手順とガイドライン
- [API仕様書](docs/api-spec.md) - 全エンドポイントの詳細仕様
- [並列開発検証レポート](docs/parallel-dev-report.md) - 検証結果と学んだこと

## ライセンス

MIT
