/**
 * グローバルエラーハンドラーミドルウェア
 * すべての未処理エラーをキャッチし、統一的なレスポンス形式で返す
 */
function errorHandler(err, req, res, _next) {
  // エラーログ出力
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // ステータスコードの決定
  const statusCode = err.statusCode || err.status || 500;

  // レスポンス構築
  const response = {
    success: false,
    error: statusCode === 500 ? 'Internal server error' : err.message,
  };

  // 開発環境ではスタックトレースを含める
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * アプリケーションエラークラス
 * ステータスコード付きのエラーを生成する
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = { errorHandler, AppError };
