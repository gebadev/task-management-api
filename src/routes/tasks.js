const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');

// GET /api/tasks - タスク一覧取得（フィルタリング対応）
router.get('/', tasksController.getTasks);

// POST /api/tasks - タスク作成
router.post('/', tasksController.createTask);

// GET /api/tasks/:id - タスク詳細取得
router.get('/:id', tasksController.getTaskById);

// PUT /api/tasks/:id - タスク更新
router.put('/:id', tasksController.updateTask);

// DELETE /api/tasks/:id - タスク削除
router.delete('/:id', tasksController.deleteTask);

module.exports = router;