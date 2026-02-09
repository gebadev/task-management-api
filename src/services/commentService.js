const db = require('../db/connection');

class CommentService {
  /**
   * タスクのコメント一覧を取得
   * @param {number} taskId - タスクID
   * @returns {Promise<Array>} コメント一覧
   */
  async getCommentsByTaskId(taskId) {
    const sql = `
      SELECT
        c.id,
        c.task_id,
        c.user_id,
        c.content,
        c.created_at,
        u.username,
        u.email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `;

    return await db.all(sql, [taskId]);
  }

  /**
   * コメントを作成
   * @param {number} taskId - タスクID
   * @param {number} userId - ユーザーID
   * @param {string} content - コメント内容
   * @returns {Promise<Object>} 作成されたコメント
   */
  async createComment(taskId, userId, content) {
    // タスクの存在確認
    const taskExists = await db.get('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (!taskExists) {
      throw new Error('Task not found');
    }

    // ユーザーの存在確認
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists) {
      throw new Error('User not found');
    }

    // コメントを挿入
    const insertSql = `
      INSERT INTO comments (task_id, user_id, content)
      VALUES (?, ?, ?)
    `;

    const result = await db.run(insertSql, [taskId, userId, content]);

    // 作成されたコメントを取得
    const selectSql = `
      SELECT
        c.id,
        c.task_id,
        c.user_id,
        c.content,
        c.created_at,
        u.username,
        u.email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    return await db.get(selectSql, [result.lastID]);
  }

  /**
   * コメントIDでコメントを取得
   * @param {number} commentId - コメントID
   * @returns {Promise<Object|null>} コメント
   */
  async getCommentById(commentId) {
    const sql = `
      SELECT
        c.id,
        c.task_id,
        c.user_id,
        c.content,
        c.created_at,
        u.username,
        u.email
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    const comment = await db.get(sql, [commentId]);
    return comment || null;
  }

  /**
   * タスクが存在するかチェック
   * @param {number} taskId - タスクID
   * @returns {Promise<boolean>} 存在するかどうか
   */
  async taskExists(taskId) {
    const task = await db.get('SELECT id FROM tasks WHERE id = ?', [taskId]);
    return !!task;
  }
}

module.exports = new CommentService();
