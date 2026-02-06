const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// パス設定
const DB_PATH = path.join(__dirname, '../data/tasks.db');
const SCHEMA_PATH = path.join(__dirname, '../src/db/schema.sql');
const SEED_PATH = path.join(__dirname, '../src/db/seed.sql');

/**
 * SQLファイルを読み込んで実行
 * @param {sqlite3.Database} db
 * @param {string} filePath
 * @returns {Promise<void>}
 */
function executeSqlFile(db, filePath) {
  return new Promise((resolve, reject) => {
    const sql = fs.readFileSync(filePath, 'utf8');

    db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * データベースを初期化
 */
async function initDatabase() {
  console.log('🔧 データベース初期化を開始...');

  // dataディレクトリが存在しない場合は作成
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ dataディレクトリを作成しました');
  }

  // データベース接続
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ データベース接続エラー:', err.message);
      process.exit(1);
    }
  });

  try {
    // 外部キー制約を有効化
    await new Promise((resolve, reject) => {
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ 外部キー制約を有効化しました');

    // スキーマを適用
    console.log('📝 スキーマを適用中...');
    await executeSqlFile(db, SCHEMA_PATH);
    console.log('✅ スキーマを適用しました');

    // シードデータを投入
    console.log('🌱 シードデータを投入中...');
    await executeSqlFile(db, SEED_PATH);
    console.log('✅ シードデータを投入しました');

    // データベースを閉じる
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('🎉 データベース初期化が完了しました');
    console.log(`📁 データベースパス: ${DB_PATH}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    db.close();
    process.exit(1);
  }
}

// スクリプト実行
initDatabase();
