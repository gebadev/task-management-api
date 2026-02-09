const taskService = require('../services/taskService');

const tasksController = {
  // GET /api/tasks - タスク一覧取得（フィルタリング対応）
  async getTasks(req, res, next) {
    try {
      const { status, priority, assignee_id, limit, offset } = req.query;

      const filters = {
        status: status || null,
        priority: priority || null,
        assignee_id: assignee_id ? parseInt(assignee_id, 10) : null,
      };

      const options = {
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = await taskService.getTasks(filters, options);

      res.json({
        success: true,
        data: result.tasks,
        pagination: {
          total: result.total,
          limit: options.limit,
          offset: options.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/tasks - タスク作成
  async createTask(req, res, next) {
    try {
      const { title, description, priority, assignee_id, due_date } = req.body;

      // TODO: 実際のユーザーID取得ロジックを実装
      const creator_id = 1;

      const taskData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || 'medium',
        creator_id,
        assignee_id: assignee_id ? parseInt(assignee_id, 10) : null,
        due_date: due_date || null,
      };

      const task = await taskService.createTask(taskData);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/tasks/:id - タスク詳細取得
  async getTaskById(req, res, next) {
    try {
      const id = req.params.id;
      const task = await taskService.getTaskById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tasks/:id - タスク更新
  async updateTask(req, res, next) {
    try {
      const id = req.params.id;
      const { title, description, status, priority, assignee_id, due_date } =
        req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined)
        updateData.description = description ? description.trim() : null;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (assignee_id !== undefined)
        updateData.assignee_id = assignee_id
          ? parseInt(assignee_id, 10)
          : null;
      if (due_date !== undefined) updateData.due_date = due_date;

      const task = await taskService.updateTask(id, updateData);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/tasks/:id - タスク削除
  async deleteTask(req, res, next) {
    try {
      const id = req.params.id;
      const deleted = await taskService.deleteTask(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        data: { message: 'Task deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/tasks/:id/assign - タスク割り当て
  async assignTask(req, res, next) {
    try {
      const id = req.params.id;
      const { assignee_id } = req.body;

      // assignee_idがnullでない場合は数値に変換
      const parsedAssigneeId =
        assignee_id === null ? null : parseInt(assignee_id, 10);

      // 数値でない場合（nullは除く）はエラー
      if (assignee_id !== null && isNaN(parsedAssigneeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid assignee_id',
        });
      }

      const result = await taskService.assignTask(id, parsedAssigneeId);

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.task,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = tasksController;
