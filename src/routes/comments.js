const express = require('express');
const router = express.Router({ mergeParams: true });
const commentsController = require('../controllers/commentsController');
const {
  createCommentValidation,
  commentTaskIdValidation,
} = require('../middleware/validators');

/**
 * @route GET /api/tasks/:id/comments
 * @description タスクのコメント一覧を取得
 * @access Public
 */
router.get('/', commentTaskIdValidation, commentsController.getCommentsByTaskId);

/**
 * @route POST /api/tasks/:id/comments
 * @description コメントを作成
 * @access Public
 */
router.post('/', createCommentValidation, commentsController.createComment);

module.exports = router;
