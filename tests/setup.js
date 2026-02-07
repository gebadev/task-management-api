const path = require('path');

// テスト用データベースのパスを環境変数で設定
const TEST_DB_PATH = path.join(__dirname, '../data/test.db');
process.env.TEST_DB_PATH = TEST_DB_PATH;
