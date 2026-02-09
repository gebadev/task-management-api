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

describe('User API Tests', () => {
  beforeEach(async () => {
    await initTestDatabase();
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should return 400 for missing username', async () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for missing email', async () => {
      const invalidUser = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for username too short', async () => {
      const invalidUser = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for password too short', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for username with invalid characters', async () => {
      const invalidUser = {
        username: 'test user!',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 409 for duplicate username', async () => {
      const user = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123',
      };

      await request(app).post('/api/users').send(user);

      const duplicateUser = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(duplicateUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });

    it('should return 409 for duplicate email', async () => {
      const user = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app).post('/api/users').send(user);

      const duplicateUser = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/users').send(duplicateUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Email already exists');
    });

    it('should hash the password before storing', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app).post('/api/users').send(newUser);

      const user = await db.get('SELECT password_hash FROM users WHERE username = ?', [
        'testuser',
      ]);

      expect(user).toBeDefined();
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('password123');
      expect(user.password_hash).toMatch(/^\$2[aby]\$.{56}$/);
    });
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all users', async () => {
      const users = [
        { username: 'user1', email: 'user1@example.com', password: 'password123' },
        { username: 'user2', email: 'user2@example.com', password: 'password123' },
        { username: 'user3', email: 'user3@example.com', password: 'password123' },
      ];

      for (const user of users) {
        await request(app).post('/api/users').send(user);
      }

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('username');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).not.toHaveProperty('password_hash');
    });

    it('should return users in descending order by created_at', async () => {
      const users = [
        { username: 'user1', email: 'user1@example.com', password: 'password123' },
        { username: 'user2', email: 'user2@example.com', password: 'password123' },
      ];

      for (const user of users) {
        await request(app).post('/api/users').send(user);
        // タイムスタンプの精度を確保するため小さな遅延を追加
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      // 最後に作成されたユーザーが最初に来る
      const usernames = response.body.data.map((u) => u.username);
      expect(usernames).toContain('user1');
      expect(usernames).toContain('user2');
      // created_atが降順になっていることを確認
      const timestamps = response.body.data.map((u) => new Date(u.created_at).getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const createResponse = await request(app).post('/api/users').send(newUser);
      const userId = createResponse.body.data.id;

      const response = await request(app).get(`/api/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', userId);
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app).get('/api/users/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });
  });
});
