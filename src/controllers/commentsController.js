const commentService = require('../services/commentService');

class CommentsController {
  /**
   * タスクのコメント一覧を取得
   * GET /api/tasks/:id/comments
   */
  async getCommentsByTaskId(req, res) {
    try {
      const taskId = parseInt(req.params.id, 10);
      
      // パラメータのバリデーション
      if (!taskId || taskId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID'
        });
      }

      // タスクの存在確認
      const taskExists = await commentService.taskExists(taskId);
      if (!taskExists) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }

      // コメント一覧を取得
      const comments = await commentService.getCommentsByTaskId(taskId);
      
      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * コメントを作成
   * POST /api/tasks/:id/comments
   */
  async createComment(req, res) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { user_id, content } = req.body;
      
      // パラメータのバリデーション
      if (!taskId || taskId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID'
        });
      }

      // リクエストボディのバリデーション
      if (!user_id || !content) {
        return res.status(400).json({
          success: false,
          error: 'user_id and content are required'
        });
      }

      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content must be a non-empty string'
        });
      }

      if (!Number.isInteger(user_id) || user_id <= 0) {
        return res.status(400).json({
          success: false,
          error: 'user_id must be a positive integer'
        });
      }

      // コメントを作成
      const comment = await commentService.createComment(taskId, user_id, content.trim());
      
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      
      // エラータイプに応じた適切なレスポンス
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new CommentsController();