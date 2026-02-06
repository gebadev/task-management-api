const express = require('express');
const router = express.Router({ mergeParams: true });
const commentsController = require('../controllers/commentsController');

/**
 * @route GET /api/tasks/:id/comments
 * @description タスクのコメント一覧を取得
 * @access Public
 */
router.get('/', commentsController.getCommentsByTaskId);

/**
 * @route POST /api/tasks/:id/comments
 * @description コメントを作成
 * @access Public
 */
router.post('/', commentsController.createComment);

module.exports = router;