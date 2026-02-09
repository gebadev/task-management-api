const bcrypt = require('bcrypt');
const db = require('../db/connection');

const SALT_ROUNDS = 10;

/**
 * すべてのユーザーを取得
 * @returns {Promise<Array>}
 */
async function getAllUsers() {
  return await db.all(
    'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
  );
}

/**
 * IDでユーザーを取得
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
async function getUserById(userId) {
  const user = await db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [userId]
  );
  return user || null;
}

/**
 * 新しいユーザーを作成
 * @param {Object} userData
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 * @returns {Promise<Object>}
 */
async function createUser({ username, email, password }) {
  // ユーザー名の重複チェック
  const existingUsername = await db.get(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  // メールアドレスの重複チェック
  const existingEmail = await db.get(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // ユーザーを作成
  const result = await db.run(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );

  // 作成されたユーザーを取得
  const newUser = await db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [result.lastID]
  );

  return newUser;
}

/**
 * ユーザー名またはメールアドレスでユーザーを検索
 * @param {string} usernameOrEmail
 * @returns {Promise<Object|null>}
 */
async function findUserByUsernameOrEmail(usernameOrEmail) {
  const user = await db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail, usernameOrEmail]
  );
  return user || null;
}

/**
 * パスワードを検証
 * @param {string} password
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  findUserByUsernameOrEmail,
  verifyPassword,
};
