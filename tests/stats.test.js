const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const path = require('path');
const fs = require('fs');

// テスト用データベースのパス
const TEST_DB_PATH = path.join(__dirname, '../data/test.db');

// テスト環境変数を設定
process.env.NODE_ENV = 'test';

describe('Stats API Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    await initTestDatabase();
  });

  beforeEach(async () => {
    // テーブルをクリア
    await db.run('DELETE FROM comments');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM users');
    await db.run(
      "DELETE FROM sqlite_sequence WHERE name IN ('comments', 'tasks', 'users')"
    );

    // テスト用ユーザーを作成
    await db.run(`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (1, 'testuser1', 'test1@example.com', 'hashedpassword')
    `);
    await db.run(`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (2, 'testuser2', 'test2@example.com', 'hashedpassword')
    `);
    await db.run(`
      INSERT INTO users (id, username, email, password_hash)
      VALUES (3, 'testuser3', 'test3@example.com', 'hashedpassword')
    `);
  });

  afterAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('GET /api/stats', () => {
    it('should return stats with no tasks', async () => {
      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_tasks).toBe(0);
      expect(response.body.data.tasks_by_status).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
      });
      expect(response.body.data.tasks_by_priority).toEqual({
        low: 0,
        medium: 0,
        high: 0,
      });
      expect(response.body.data.completion_rate).toBe(0);
      expect(response.body.data.overdue_tasks).toBe(0);
      expect(response.body.data.tasks_by_assignee).toBeInstanceOf(Array);
    });

    it('should return correct task counts by status', async () => {
      // 各ステータスのタスクを作成
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id) VALUES
        ('Task 1', 'todo', 'medium', 1),
        ('Task 2', 'todo', 'medium', 1),
        ('Task 3', 'in_progress', 'medium', 1),
        ('Task 4', 'done', 'medium', 1)
      `);

      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_tasks).toBe(4);
      expect(response.body.data.tasks_by_status).toEqual({
        todo: 2,
        in_progress: 1,
        done: 1,
      });
    });

    it('should return correct task counts by priority', async () => {
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id) VALUES
        ('Task 1', 'todo', 'low', 1),
        ('Task 2', 'todo', 'medium', 1),
        ('Task 3', 'todo', 'medium', 1),
        ('Task 4', 'todo', 'high', 1),
        ('Task 5', 'todo', 'high', 1),
        ('Task 6', 'todo', 'high', 1)
      `);

      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body.data.tasks_by_priority).toEqual({
        low: 1,
        medium: 2,
        high: 3,
      });
    });

    it('should calculate correct completion rate', async () => {
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id) VALUES
        ('Task 1', 'todo', 'medium', 1),
        ('Task 2', 'in_progress', 'medium', 1),
        ('Task 3', 'done', 'medium', 1),
        ('Task 4', 'done', 'medium', 1)
      `);

      const response = await request(app).get('/api/stats').expect(200);

      // 4タスク中2完了 = 50%
      expect(response.body.data.completion_rate).toBe(50);
    });

    it('should count overdue tasks correctly', async () => {
      // 期限切れ未完了タスク
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id, due_date) VALUES
        ('Overdue 1', 'todo', 'medium', 1, '2020-01-01 00:00:00'),
        ('Overdue 2', 'in_progress', 'medium', 1, '2020-01-01 00:00:00')
      `);
      // 期限切れだが完了済み（カウントしない）
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id, due_date)
        VALUES ('Done past', 'done', 'medium', 1, '2020-01-01 00:00:00')
      `);
      // 期限が未来のタスク（カウントしない）
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id, due_date)
        VALUES ('Future', 'todo', 'medium', 1, '2099-12-31 00:00:00')
      `);
      // 期限なしタスク（カウントしない）
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id)
        VALUES ('No due date', 'todo', 'medium', 1)
      `);

      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body.data.overdue_tasks).toBe(2);
    });

    it('should return tasks by assignee', async () => {
      await db.run(`
        INSERT INTO tasks (title, status, priority, creator_id, assignee_id) VALUES
        ('Task 1', 'todo', 'medium', 1, 1),
        ('Task 2', 'todo', 'medium', 1, 1),
        ('Task 3', 'todo', 'medium', 1, 2)
      `);

      const response = await request(app).get('/api/stats').expect(200);

      const assignees = response.body.data.tasks_by_assignee;
      expect(assignees).toBeInstanceOf(Array);

      const user1 = assignees.find((a) => a.user_id === 1);
      const user2 = assignees.find((a) => a.user_id === 2);
      const user3 = assignees.find((a) => a.user_id === 3);

      expect(user1.task_count).toBe(2);
      expect(user1.username).toBe('testuser1');
      expect(user2.task_count).toBe(1);
      expect(user2.username).toBe('testuser2');
      expect(user3.task_count).toBe(0);
    });

    it('should return correct response format', async () => {
      const response = await request(app).get('/api/stats').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total_tasks');
      expect(response.body.data).toHaveProperty('tasks_by_status');
      expect(response.body.data).toHaveProperty('tasks_by_priority');
      expect(response.body.data).toHaveProperty('completion_rate');
      expect(response.body.data).toHaveProperty('overdue_tasks');
      expect(response.body.data).toHaveProperty('tasks_by_assignee');
    });
  });
});

// テスト用データベース初期化関数
async function initTestDatabase() {
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const statements = schema
    .replace(/--.*$/gm, '')
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    try {
      await db.run(statement);
    } catch (error) {
      console.warn(`Warning executing statement: ${statement}`, error.message);
    }
  }
}
