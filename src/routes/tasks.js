const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const {
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  assignTaskValidation,
  taskFilterValidation,
} = require('../middleware/validators');

// GET /api/tasks - タスク一覧取得（フィルタリング対応）
router.get('/', taskFilterValidation, tasksController.getTasks);

// POST /api/tasks - タスク作成
router.post('/', createTaskValidation, tasksController.createTask);

// GET /api/tasks/:id - タスク詳細取得
router.get('/:id', taskIdValidation, tasksController.getTaskById);

// PUT /api/tasks/:id - タスク更新
router.put('/:id', updateTaskValidation, tasksController.updateTask);

// DELETE /api/tasks/:id - タスク削除
router.delete('/:id', taskIdValidation, tasksController.deleteTask);

// PUT /api/tasks/:id/assign - タスク割り当て
router.put('/:id/assign', assignTaskValidation, tasksController.assignTask);

module.exports = router;
