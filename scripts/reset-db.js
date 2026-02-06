const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// パス設定
const DB_PATH = path.join(__dirname, '../data/tasks.db');

/**
 * データベースをリセット（削除して再作成）
 */
function resetDatabase() {
  console.log('🔄 データベースリセットを開始...');

  // データベースファイルが存在する場合は削除
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  既存のデータベースを削除しました');
  } else {
    console.log('ℹ️  既存のデータベースは存在しません');
  }

  // init-db.jsを実行
  console.log('🔧 データベースを再作成中...');
  try {
    execSync('node scripts/init-db.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ データベースリセットが完了しました');
  } catch (error) {
    console.error('❌ データベース再作成中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
resetDatabase();
