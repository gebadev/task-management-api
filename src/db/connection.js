const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// データベースファイルのパス
const DB_PATH = process.env.NODE_ENV === 'test' 
  ? path.join(__dirname, '../../data/test.db')
  : path.join(__dirname, '../../data/tasks.db');

// dataディレクトリが存在しない場合は作成
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * データベース接続を取得
 * @returns {Promise<sqlite3.Database>}
 */
function getConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        // 外部キー制約を有効化
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(db);
          }
        });
      }
    });
  });
}

/**
 * データベース接続を閉じる
 * @param {sqlite3.Database} db
 * @returns {Promise<void>}
 */
function closeConnection(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * クエリを実行（SELECT用）
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * クエリを実行（INSERT/UPDATE/DELETE用）
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{lastID: number, changes: number}>}
 */
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * 単一行を取得
 * @param {sqlite3.Database} db
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|undefined>}
 */
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
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
  DB_PATH,
  // 高レベルAPI（推奨）
  ...dbAPI
};
