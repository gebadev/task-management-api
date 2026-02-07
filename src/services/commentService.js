const { getConnection, closeConnection, query, run, get } = require('../db/connection');

class CommentService {
  /**
   * タスクのコメント一覧を取得
   * @param {number} taskId - タスクID
   * @returns {Promise<Array>} コメント一覧
   */
  async getCommentsByTaskId(taskId) {
    const db = await getConnection();
    try {
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
      
      const comments = await query(db, sql, [taskId]);
      return comments;
    } finally {
      await closeConnection(db);
    }
  }

  /**
   * コメントを作成
   * @param {number} taskId - タスクID
   * @param {number} userId - ユーザーID
   * @param {string} content - コメント内容
   * @returns {Promise<Object>} 作成されたコメント
   */
  async createComment(taskId, userId, content) {
    const db = await getConnection();
    try {
      // タスクの存在確認
      const taskExists = await get(db, 'SELECT id FROM tasks WHERE id = ?', [taskId]);
      if (!taskExists) {
        throw new Error('Task not found');
      }

      // ユーザーの存在確認
      const userExists = await get(db, 'SELECT id FROM users WHERE id = ?', [userId]);
      if (!userExists) {
        throw new Error('User not found');
      }

      // コメントを挿入
      const insertSql = `
        INSERT INTO comments (task_id, user_id, content)
        VALUES (?, ?, ?)
      `;
      
      const result = await run(db, insertSql, [taskId, userId, content]);
      
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
      
      const comment = await get(db, selectSql, [result.lastID]);
      return comment;
    } finally {
      await closeConnection(db);
    }
  }

  /**
   * コメントIDでコメントを取得
   * @param {number} commentId - コメントID
   * @returns {Promise<Object|null>} コメント
   */
  async getCommentById(commentId) {
    const db = await getConnection();
    try {
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
      
      const comment = await get(db, sql, [commentId]);
      return comment || null;
    } finally {
      await closeConnection(db);
    }
  }

  /**
   * タスクが存在するかチェック
   * @param {number} taskId - タスクID
   * @returns {Promise<boolean>} 存在するかどうか
   */
  async taskExists(taskId) {
    const db = await getConnection();
    try {
      const task = await get(db, 'SELECT id FROM tasks WHERE id = ?', [taskId]);
      return !!task;
    } finally {
      await closeConnection(db);
    }
  }
}

module.exports = new CommentService();