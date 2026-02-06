const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/connection');
const path = require('path');
const fs = require('fs');

// テスト用データベースのパス
const TEST_DB_PATH = path.join(__dirname, '../data/test.db');

// テスト環境変数を設定
process.env.NODE_ENV = 'test';

describe('Tasks API Tests', () => {
  beforeAll(async () => {
    // テスト用データベースの設定
    process.env.NODE_ENV = 'test';
    
    // テスト用DBファイルが存在する場合は削除
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // テスト用データベース初期化
    await initTestDatabase();
  });

  beforeEach(async () => {
    // 各テスト前にタスクテーブルをクリア
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM sqlite_sequence WHERE name="tasks"');
    
    // テスト用ユーザーを作成（creator_id用）
    await db.run(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash) 
      VALUES (1, 'testuser', 'test@example.com', 'hashedpassword')
    `);
  });

  afterAll(async () => {
    // テスト用DBファイルを削除
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with required fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.status).toBe('todo');
      expect(response.body.data.creator_id).toBe(1);
    });

    it('should create a task with minimal required data', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.priority).toBe('medium'); // デフォルト値
      expect(response.body.data.status).toBe('todo'); // デフォルト値
    });

    it('should reject task creation without title', async () => {
      const taskData = {
        description: 'No title task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Title is required');
    });

    it('should reject task creation with invalid priority', async () => {
      const taskData = {
        title: 'Invalid Priority Task',
        priority: 'invalid'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // テスト用タスクを作成
      const tasks = [
        { title: 'Task 1', status: 'todo', priority: 'low' },
        { title: 'Task 2', status: 'in_progress', priority: 'medium' },
        { title: 'Task 3', status: 'done', priority: 'high' }
      ];

      for (const task of tasks) {
        await db.run(`
          INSERT INTO tasks (title, status, priority, creator_id) 
          VALUES (?, ?, ?, 1)
        `, [task.title, task.status, task.priority]);
      }
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=todo')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/tasks?limit=2&offset=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const result = await db.run(`
        INSERT INTO tasks (title, description, status, priority, creator_id) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Test Task', 'Test description', 'todo', 'medium', 1]);
      taskId = result.lastID;
    });

    it('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid task ID');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const result = await db.run(`
        INSERT INTO tasks (title, description, status, priority, creator_id) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Original Task', 'Original description', 'todo', 'medium', 1]);
      taskId = result.lastID;
    });

    it('should update task', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('should update partial fields', async () => {
      const updateData = {
        status: 'done'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('done');
      expect(response.body.data.title).toBe('Original Task'); // 変更されていない
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const result = await db.run(`
        INSERT INTO tasks (title, description, status, priority, creator_id) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Task to Delete', 'Will be deleted', 'todo', 'medium', 1]);
      taskId = result.lastID;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Task deleted successfully');

      // 削除されていることを確認
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });
});

// テスト用データベース初期化関数
async function initTestDatabase() {
  // スキーマファイルを読み取り
  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // SQL文を分割して実行
  const statements = schema
    .replace(/--.*$/gm, '') // コメントを削除
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  for (const statement of statements) {
    try {
      await db.run(statement);
    } catch (error) {
      // CREATE TABLE IF NOT EXISTS などは重複実行してもエラーにならないはず
      console.warn(`Warning executing statement: ${statement}`, error.message);
    }
  }
}