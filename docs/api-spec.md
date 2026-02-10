# API仕様書

Task Management APIの全エンドポイント詳細仕様です。

**ベースURL:** `http://localhost:3000`

---

## 共通仕様

### レスポンス形式

すべてのエンドポイントは以下の統一された形式でレスポンスを返します。

**成功時:**

```json
{
  "success": true,
  "data": { ... }
}
```

**一覧取得時（ページネーション付き）:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

**エラー時:**

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

**バリデーションエラー時:**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "フィールド名",
      "message": "エラー内容"
    }
  ]
}
```

### HTTPステータスコード

| コード | 意味 |
| --- | --- |
| 200 | 成功 |
| 201 | リソース作成成功 |
| 400 | バリデーションエラー |
| 404 | リソース未検出 |
| 409 | 重複エラー（一意制約違反） |
| 500 | サーバー内部エラー |

---

## ヘルスチェック

### GET /health

サーバーの稼働状態を確認します。

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

## ユーザー管理 API

### GET /api/users

登録済みユーザーの一覧を取得します。パスワードハッシュは返却されません。

**パラメータ:** なし

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "created_at": "2026-02-05T10:00:00Z"
    },
    {
      "id": 2,
      "username": "bob",
      "email": "bob@example.com",
      "created_at": "2026-02-05T10:00:00Z"
    }
  ]
}
```

---

### GET /api/users/:id

指定したIDのユーザー詳細を取得します。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | ユーザーID（正の整数） |

**レスポンス:**

```
200 OK
```

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

**エラーレスポンス:**

```
404 Not Found
```

```json
{
  "success": false,
  "error": "User not found"
}
```

---

### POST /api/users

新しいユーザーを作成します。パスワードはbcrypt（コストファクター10）でハッシュ化されて保存されます。

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
| --- | --- | --- | --- | --- |
| username | string | Yes | 3〜50文字、英数字・アンダースコア・ハイフンのみ | ユーザー名（一意） |
| email | string | Yes | 有効なメールアドレス形式 | メールアドレス（一意） |
| password | string | Yes | 6文字以上 | パスワード |

**リクエスト例:**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

**レスポンス:**

```
201 Created
```

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

**エラーレスポンス:**

```
400 Bad Request（バリデーションエラー）
```

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be between 3 and 50 characters"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

```
409 Conflict（重複エラー）
```

```json
{
  "success": false,
  "error": "Username already exists"
}
```

---

## タスク管理 API

### GET /api/tasks

タスク一覧を取得します。クエリパラメータによるフィルタリングとページネーションに対応しています。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | バリデーション | 説明 |
| --- | --- | --- | --- | --- | --- |
| status | string | No | - | `todo`, `in_progress`, `done` のいずれか | ステータスでフィルタ |
| priority | string | No | - | `low`, `medium`, `high` のいずれか | 優先度でフィルタ |
| assignee_id | integer | No | - | 正の整数 | 担当者IDでフィルタ |
| limit | integer | No | 50 | 1〜100 | 取得件数 |
| offset | integer | No | 0 | 0以上の整数 | オフセット |

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "APIエンドポイント実装",
      "description": "タスクCRUDのエンドポイントを実装する",
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
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

---

### GET /api/tasks/:id

指定したIDのタスク詳細を取得します。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "APIエンドポイント実装",
    "description": "タスクCRUDのエンドポイントを実装する",
    "status": "in_progress",
    "priority": "high",
    "creator_id": 1,
    "assignee_id": 2,
    "due_date": "2026-02-10T00:00:00Z",
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T14:30:00Z"
  }
}
```

**エラーレスポンス:**

```
404 Not Found
```

```json
{
  "success": false,
  "error": "Task not found"
}
```

---

### POST /api/tasks

新しいタスクを作成します。

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
| --- | --- | --- | --- | --- |
| title | string | Yes | 最大255文字、HTMLエスケープ | タスクタイトル |
| description | string | No | 最大5000文字、HTMLエスケープ | タスク詳細 |
| priority | string | No | `low`, `medium`, `high` のいずれか（デフォルト: `medium`） | 優先度 |
| assignee_id | integer | No | 正の整数 | 担当者ID |
| due_date | string | No | ISO 8601形式 | 期限 |

**リクエスト例:**

```json
{
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "priority": "high",
  "assignee_id": 2,
  "due_date": "2026-02-15T00:00:00Z"
}
```

**レスポンス:**

```
201 Created
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "新しいタスク",
    "description": "タスクの詳細説明",
    "status": "todo",
    "priority": "high",
    "creator_id": 1,
    "assignee_id": 2,
    "due_date": "2026-02-15T00:00:00Z",
    "created_at": "2026-02-05T15:00:00Z",
    "updated_at": "2026-02-05T15:00:00Z"
  }
}
```

**エラーレスポンス:**

```
400 Bad Request
```

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

---

### PUT /api/tasks/:id

既存のタスクを更新します。指定したフィールドのみが更新されます。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**リクエストボディ（すべてオプション）:**

| フィールド | 型 | バリデーション | 説明 |
| --- | --- | --- | --- |
| title | string | 最大255文字、空文字不可、HTMLエスケープ | タスクタイトル |
| description | string | 最大5000文字、HTMLエスケープ | タスク詳細 |
| status | string | `todo`, `in_progress`, `done` のいずれか | ステータス |
| priority | string | `low`, `medium`, `high` のいずれか | 優先度 |
| assignee_id | integer | 正の整数 | 担当者ID |
| due_date | string | ISO 8601形式 | 期限 |

**リクエスト例:**

```json
{
  "status": "in_progress",
  "priority": "high"
}
```

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "APIエンドポイント実装",
    "description": "タスクCRUDのエンドポイントを実装する",
    "status": "in_progress",
    "priority": "high",
    "creator_id": 1,
    "assignee_id": 2,
    "due_date": "2026-02-10T00:00:00Z",
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T16:00:00Z"
  }
}
```

---

### DELETE /api/tasks/:id

指定したタスクを削除します。関連するコメントも同時に削除されます（CASCADE）。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "message": "Task deleted successfully"
  }
}
```

**エラーレスポンス:**

```
404 Not Found
```

```json
{
  "success": false,
  "error": "Task not found"
}
```

---

### PUT /api/tasks/:id/assign

タスクにユーザーを割り当てます。`assignee_id`に`null`を指定すると割り当てを解除できます。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
| --- | --- | --- | --- | --- |
| assignee_id | integer / null | Yes | 正の整数またはnull | 割り当てるユーザーID |

**リクエスト例（割り当て）:**

```json
{
  "assignee_id": 2
}
```

**リクエスト例（割り当て解除）:**

```json
{
  "assignee_id": null
}
```

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "APIエンドポイント実装",
    "assignee_id": 2,
    "updated_at": "2026-02-05T16:00:00Z"
  }
}
```

**エラーレスポンス:**

```
404 Not Found（タスクまたはユーザーが存在しない場合）
```

```json
{
  "success": false,
  "error": "Task not found"
}
```

---

## コメント API

### GET /api/tasks/:id/comments

指定したタスクに紐づくコメント一覧を取得します。コメント作成者のユーザー名とメールアドレスも含まれます。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**レスポンス:**

```
200 OK
```

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": 1,
      "user_id": 2,
      "content": "APIのエンドポイント設計について相談したいです",
      "created_at": "2026-02-05T10:30:00Z",
      "username": "bob",
      "email": "bob@example.com"
    }
  ]
}
```

**エラーレスポンス:**

```
404 Not Found
```

```json
{
  "success": false,
  "error": "Task not found"
}
```

---

### POST /api/tasks/:id/comments

指定したタスクにコメントを追加します。

**パスパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| id | integer | Yes | タスクID（正の整数） |

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
| --- | --- | --- | --- | --- |
| user_id | integer | Yes | 正の整数 | コメント投稿者のユーザーID |
| content | string | Yes | 最大5000文字、HTMLエスケープ | コメント内容 |

**リクエスト例:**

```json
{
  "user_id": 2,
  "content": "進捗を確認しました。問題なさそうです。"
}
```

**レスポンス:**

```
201 Created
```

```json
{
  "success": true,
  "data": {
    "id": 1,
    "task_id": 1,
    "user_id": 2,
    "content": "進捗を確認しました。問題なさそうです。",
    "created_at": "2026-02-05T11:00:00Z"
  }
}
```

**エラーレスポンス:**

```
404 Not Found（タスクまたはユーザーが存在しない場合）
```

```json
{
  "success": false,
  "error": "Task not found"
}
```

---

## 統計情報 API

### GET /api/stats

タスクに関する統計情報を取得します。

**パラメータ:** なし

**レスポンス:**

```
200 OK
```

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
      },
      {
        "user_id": 2,
        "username": "bob",
        "task_count": 3
      }
    ]
  }
}
```

**レスポンスフィールド説明:**

| フィールド | 型 | 説明 |
| --- | --- | --- |
| total_tasks | integer | 全タスク数 |
| tasks_by_status | object | ステータス別タスク数 |
| tasks_by_priority | object | 優先度別タスク数 |
| completion_rate | number | 完了率（%） |
| overdue_tasks | integer | 期限切れタスク数 |
| tasks_by_assignee | array | 担当者別タスク数 |

---

## 認証について

現在のバージョンでは認証機能は実装されていません。将来の拡張としてJWT認証の導入を予定しています。

パスワードはbcrypt（コストファクター10）でハッシュ化されて保存されており、認証機能の追加に備えた設計となっています。
