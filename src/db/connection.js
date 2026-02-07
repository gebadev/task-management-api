const sqlite3 = require('sqlite3').verbose();
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

module.exports = {
  getConnection,
  closeConnection,
  query,
  run,
  get,
  DB_PATH,
};
