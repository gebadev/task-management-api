const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const fs = require('fs');
const path = require('path');

// テスト用データベースのパス（環境変数から取得）
const TEST_DB_PATH = process.env.TEST_DB_PATH;

/**
 * テスト用データベースを初期化
 */
async function initTestDatabase() {
  // テストデータベースファイルが存在する場合は削除
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const connection = await db.getConnection();
  try {
    // スキーマを適用
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(connection, schema);
  } finally {
    await db.closeConnection(connection);
  }
}

/**
 * テストユーザーとタスクを作成
 */
async function createTestData() {
  // テスト用のユーザーとタスクを作成（高レベルAPIを使用）
  const userResult = await db.run(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    ['testuser', 'test@example.com', 'hashedpassword']
  );
  const testUserId = userResult.lastID;

  const taskResult = await db.run(
    'INSERT INTO tasks (title, description, creator_id) VALUES (?, ?, ?)',
    ['Test Task', 'Test Description', testUserId]
  );
  const testTaskId = taskResult.lastID;

  return { testUserId, testTaskId };
}

describe('Comments API Tests', () => {
  let testTaskId;
  let testUserId;

  beforeEach(async () => {
    await initTestDatabase();
    const testData = await createTestData();
    testUserId = testData.testUserId;
    testTaskId = testData.testTaskId;
  });

  describe('GET /api/tasks/:id/comments', () => {
    it('should return empty array for task with no comments', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return comments for task with comments', async () => {
      // テストコメントを作成（APIを通して）
      await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send({ user_id: testUserId, content: 'Test comment 1' });
      await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send({ user_id: testUserId, content: 'Test comment 2' });

      const response = await request(app)
        .get(`/api/tasks/${testTaskId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      // コメントの構造チェック
      const comment = response.body.data[0];
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('task_id', testTaskId);
      expect(comment).toHaveProperty('user_id', testUserId);
      expect(comment).toHaveProperty('content');
      expect(comment).toHaveProperty('created_at');
      expect(comment).toHaveProperty('username', 'testuser');
      expect(comment).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid/comments');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid task ID');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/99999/comments');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    it('should create a new comment successfully', async () => {
      const commentData = {
        user_id: testUserId,
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const comment = response.body.data;
      expect(comment).toHaveProperty('id');
      expect(comment).toHaveProperty('task_id', testTaskId);
      expect(comment).toHaveProperty('user_id', testUserId);
      expect(comment).toHaveProperty('content', commentData.content);
      expect(comment).toHaveProperty('created_at');
      expect(comment).toHaveProperty('username', 'testuser');
      expect(comment).toHaveProperty('email', 'test@example.com');
    });

    it('should return 400 for missing user_id', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'user_id and content are required');
    });

    it('should return 400 for missing content', async () => {
      const commentData = {
        user_id: testUserId
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'user_id and content are required');
    });

    it('should return 400 for empty content', async () => {
      const commentData = {
        user_id: testUserId,
        content: '   '
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Content must be a non-empty string');
    });

    it('should return 400 for invalid user_id', async () => {
      const commentData = {
        user_id: 'invalid',
        content: 'Test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'user_id must be a positive integer');
    });

    it('should return 400 for invalid task ID', async () => {
      const commentData = {
        user_id: testUserId,
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/tasks/invalid/comments')
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid task ID');
    });

    it('should return 404 for non-existent task', async () => {
      const commentData = {
        user_id: testUserId,
        content: 'Test comment'
      };

      const response = await request(app)
        .post('/api/tasks/99999/comments')
        .send(commentData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 404 for non-existent user', async () => {
      const commentData = {
        user_id: 99999,
        content: 'Test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should trim whitespace from content', async () => {
      const commentData = {
        user_id: testUserId,
        content: '  Test comment with whitespace  '
      };

      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.content).toBe('Test comment with whitespace');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce task_id foreign key constraint', async () => {
      // APIを通して無効なtask_idでコメントを作成しようとする
      const response = await request(app)
        .post('/api/tasks/99999/comments')
        .send({ user_id: testUserId, content: 'Test comment' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should enforce user_id foreign key constraint', async () => {
      // APIを通して無効なuser_idでコメントを作成しようとする
      const response = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send({ user_id: 99999, content: 'Test comment' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('Comments Ordering', () => {
    it('should return comments in chronological order (oldest first)', async () => {
      // 複数のコメントを時間差で作成（APIを通して）
      await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send({ user_id: testUserId, content: 'First comment' });

      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .send({ user_id: testUserId, content: 'Second comment' });

      const response = await request(app)
        .get(`/api/tasks/${testTaskId}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].content).toBe('First comment');
      expect(response.body.data[1].content).toBe('Second comment');

      // 作成日時が昇順（古い順）になっていることを確認
      const firstDate = new Date(response.body.data[0].created_at);
      const secondDate = new Date(response.body.data[1].created_at);
      expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
    });
  });
});