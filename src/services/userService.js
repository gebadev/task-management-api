const bcrypt = require('bcrypt');
const db = require('../db/connection');

const SALT_ROUNDS = 10;

/**
 * すべてのユーザーを取得
 * @returns {Promise<Array>}
 */
async function getAllUsers() {
  const connection = await db.getConnection();
  try {
    const users = await db.query(
      connection,
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
    );
    return users;
  } finally {
    await db.closeConnection(connection);
  }
}

/**
 * IDでユーザーを取得
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
async function getUserById(userId) {
  const connection = await db.getConnection();
  try {
    const user = await db.get(
      connection,
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [userId]
    );
    return user || null;
  } finally {
    await db.closeConnection(connection);
  }
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
  const connection = await db.getConnection();
  try {
    // ユーザー名の重複チェック
    const existingUsername = await db.get(
      connection,
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // メールアドレスの重複チェック
    const existingEmail = await db.get(
      connection,
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
      connection,
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    // 作成されたユーザーを取得
    const newUser = await db.get(
      connection,
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    return newUser;
  } finally {
    await db.closeConnection(connection);
  }
}

/**
 * ユーザー名またはメールアドレスでユーザーを検索
 * @param {string} usernameOrEmail
 * @returns {Promise<Object|null>}
 */
async function findUserByUsernameOrEmail(usernameOrEmail) {
  const connection = await db.getConnection();
  try {
    const user = await db.get(
      connection,
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail]
    );
    return user || null;
  } finally {
    await db.closeConnection(connection);
  }
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
