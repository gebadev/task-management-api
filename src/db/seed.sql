-- Task Management API - Seed Data
-- Initial test data for development

-- ============================================
-- Users (3 test users)
-- ============================================
-- Password for all users: "password123"
-- Hash: $2b$10$rKZKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJh
INSERT INTO users (username, email, password_hash) VALUES
  ('alice', 'alice@example.com', '$2b$10$rKZKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJh'),
  ('bob', 'bob@example.com', '$2b$10$rKZKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJh'),
  ('charlie', 'charlie@example.com', '$2b$10$rKZKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJhJQJ9Y8tZfKKOMxJKqV0YJh');

-- ============================================
-- Tasks (10 sample tasks)
-- ============================================
INSERT INTO tasks (title, description, status, priority, creator_id, assignee_id, due_date) VALUES
  -- Alice's tasks
  (
    'APIエンドポイント実装',
    'タスクCRUDのエンドポイントを実装する',
    'in_progress',
    'high',
    1,
    1,
    '2026-02-10 00:00:00'
  ),
  (
    'データベース設計',
    'SQLiteのスキーマ設計とテーブル作成',
    'done',
    'high',
    1,
    1,
    '2026-02-06 00:00:00'
  ),
  (
    'ユーザー認証機能',
    'JWT認証の実装',
    'todo',
    'medium',
    1,
    2,
    '2026-02-15 00:00:00'
  ),

  -- Bob's tasks
  (
    'テストコード作成',
    '統合テストと単体テストの作成',
    'in_progress',
    'high',
    2,
    2,
    '2026-02-12 00:00:00'
  ),
  (
    'ドキュメント作成',
    'API仕様書とREADMEの作成',
    'todo',
    'medium',
    2,
    3,
    '2026-02-20 00:00:00'
  ),
  (
    'エラーハンドリング',
    'グローバルエラーハンドラーの実装',
    'todo',
    'medium',
    2,
    NULL,
    '2026-02-18 00:00:00'
  ),

  -- Charlie's tasks
  (
    'フィルタリング機能',
    'タスク一覧のフィルタリング実装',
    'in_progress',
    'low',
    3,
    3,
    '2026-02-14 00:00:00'
  ),
  (
    'コメント機能',
    'タスクへのコメント追加機能',
    'todo',
    'low',
    3,
    1,
    '2026-02-16 00:00:00'
  ),
  (
    '統計情報API',
    'タスク統計情報の取得エンドポイント',
    'todo',
    'low',
    3,
    NULL,
    '2026-02-22 00:00:00'
  ),
  (
    'パフォーマンス最適化',
    'データベースクエリの最適化とインデックス追加',
    'todo',
    'medium',
    3,
    2,
    '2026-02-25 00:00:00'
  );

-- ============================================
-- Comments (5 sample comments)
-- ============================================
INSERT INTO comments (task_id, user_id, content) VALUES
  (1, 2, 'APIのエンドポイント設計について相談したいです'),
  (1, 1, 'わかりました。明日MTGしましょう'),
  (2, 3, 'データベース設計完了お疲れ様です！'),
  (4, 1, 'テストカバレッジは80%以上を目標にしましょう'),
  (4, 2, '了解しました。現在70%まで達成しています');
