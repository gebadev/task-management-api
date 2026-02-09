const commentService = require('../services/commentService');

class CommentsController {
  /**
   * タスクのコメント一覧を取得
   * GET /api/tasks/:id/comments
   */
  async getCommentsByTaskId(req, res, next) {
    try {
      const taskId = req.params.id;

      // タスクの存在確認
      const taskExists = await commentService.taskExists(taskId);
      if (!taskExists) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      // コメント一覧を取得
      const comments = await commentService.getCommentsByTaskId(taskId);

      res.json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * コメントを作成
   * POST /api/tasks/:id/comments
   */
  async createComment(req, res, next) {
    try {
      const taskId = req.params.id;
      const { user_id, content } = req.body;

      // コメントを作成
      const comment = await commentService.createComment(
        taskId,
        user_id,
        content.trim(),
      );

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      // エラータイプに応じた適切なレスポンス
      if (error.message === 'Task not found') {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      next(error);
    }
  }
}

module.exports = new CommentsController();
