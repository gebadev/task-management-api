const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// データベースファイルのパス（テスト環境では環境変数で上書き可能）
const DB_PATH =
  process.env.TEST_DB_PATH || path.join(__dirname, '../../data/tasks.db');

// dataディレクトリが存在しない場合は作成
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * データベース接続を取得
 * @returns {Promise<Database>}
 */
async function getConnection() {
  const db = new Database(DB_PATH);
  // 外部キー制約を有効化
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * データベース接続を閉じる
 * @param {Database} db
 * @returns {Promise<void>}
 */
async function closeConnection(db) {
  db.close();
}

/**
 * クエリを実行（SELECT用）
 * @param {Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
async function query(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * クエリを実行（INSERT/UPDATE/DELETE用）
 * @param {Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{lastID: number, changes: number}>}
 */
async function run(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { lastID: result.lastInsertRowid, changes: result.changes };
}

/**
 * 単一行を取得
 * @param {Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|undefined>}
 */
async function get(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * 複数のSQL文を実行（スキーマ適用などに使用）
 * @param {Database} db
 * @param {string} sql
 * @returns {void}
 */
function exec(db, sql) {
  db.exec(sql);
}

// 高レベルAPI - 接続の管理を自動化
const dbAPI = {
  /**
   * クエリを実行（SELECT用）- 複数行
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<Array>}
   */
  async all(sql, params = []) {
    const db = await getConnection();
    try {
      return await query(db, sql, params);
    } finally {
      await closeConnection(db);
    }
  },

  /**
   * クエリを実行（SELECT用）- 単一行
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<Object|undefined>}
   */
  async get(sql, params = []) {
    const db = await getConnection();
    try {
      return await get(db, sql, params);
    } finally {
      await closeConnection(db);
    }
  },

  /**
   * クエリを実行（INSERT/UPDATE/DELETE用）
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<{lastID: number, changes: number}>}
   */
  async run(sql, params = []) {
    const db = await getConnection();
    try {
      return await run(db, sql, params);
    } finally {
      await closeConnection(db);
    }
  }
};

module.exports = {
  getConnection,
  closeConnection,
  query,
  run,
  get,
  exec,
  DB_PATH,
  // 高レベルAPI（推奨）
  ...dbAPI
};
