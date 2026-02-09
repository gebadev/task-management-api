const db = require('../db/connection');

const taskService = {
  // タスク一覧取得（フィルタリング対応）
  async getTasks(filters = {}, options = {}) {
    const { status, priority, assignee_id } = filters;
    const { limit = 50, offset = 0 } = options;
    
    const whereConditions = [];
    const params = [];
    
    // フィルタリング条件の構築
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (priority) {
      whereConditions.push('priority = ?');
      params.push(priority);
    }
    
    if (assignee_id) {
      whereConditions.push('assignee_id = ?');
      params.push(assignee_id);
    }
    
    // WHERE句の構築
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // データ取得クエリ
    const query = `
      SELECT 
        id, title, description, status, priority, 
        creator_id, assignee_id, due_date, 
        created_at, updated_at
      FROM tasks 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    // カウントクエリ
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM tasks 
      ${whereClause}
    `;
    
    try {
      // データとカウントを並列で取得
      const [tasks, countResult] = await Promise.all([
        db.all(query, [...params, limit, offset]),
        db.get(countQuery, params)
      ]);
      
      return {
        tasks,
        total: countResult.total
      };
    } catch (error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  },

  // タスク作成
  async createTask(taskData) {
    const { 
      title, 
      description, 
      priority = 'medium', 
      creator_id, 
      assignee_id, 
      due_date 
    } = taskData;
    
    // バリデーション
    if (!title || !creator_id) {
      throw new Error('Title and creator_id are required');
    }
    
    // 優先度の妥当性チェック
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Priority must be one of: low, medium, high');
    }
    
    const query = `
      INSERT INTO tasks (
        title, description, priority, creator_id, assignee_id, due_date
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      title,
      description,
      priority,
      creator_id,
      assignee_id,
      due_date
    ];
    
    try {
      const result = await db.run(query, params);
      
      // 作成されたタスクを取得して返す
      return await this.getTaskById(result.lastID);
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  },

  // タスク詳細取得
  async getTaskById(id) {
    const query = `
      SELECT 
        id, title, description, status, priority, 
        creator_id, assignee_id, due_date, 
        created_at, updated_at
      FROM tasks 
      WHERE id = ?
    `;
    
    try {
      const task = await db.get(query, [id]);
      return task || null;
    } catch (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
  },

  // タスク更新
  async updateTask(id, updateData) {
    // 存在確認
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      return null;
    }
    
    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date'];
    const updateFields = [];
    const params = [];
    
    // 更新フィールドの構築
    for (const [field, value] of Object.entries(updateData)) {
      if (allowedFields.includes(field) && value !== undefined) {
        // ステータスの妥当性チェック
        if (field === 'status') {
          const validStatuses = ['todo', 'in_progress', 'done'];
          if (!validStatuses.includes(value)) {
            throw new Error('Status must be one of: todo, in_progress, done');
          }
        }
        
        // 優先度の妥当性チェック
        if (field === 'priority') {
          const validPriorities = ['low', 'medium', 'high'];
          if (!validPriorities.includes(value)) {
            throw new Error('Priority must be one of: low, medium, high');
          }
        }
        
        updateFields.push(`${field} = ?`);
        params.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      // 何も更新する項目がない場合、既存のタスクを返す
      return existingTask;
    }
    
    params.push(id);
    
    const query = `
      UPDATE tasks 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    try {
      await db.run(query, params);
      
      // 更新されたタスクを取得して返す
      return await this.getTaskById(id);
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  },

  // タスク削除
  async deleteTask(id) {
    // 存在確認
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      return false;
    }

    const query = 'DELETE FROM tasks WHERE id = ?';

    try {
      const result = await db.run(query, [id]);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  },

  // タスク割り当て
  async assignTask(taskId, assigneeId) {
    // タスクの存在確認
    const existingTask = await this.getTaskById(taskId);
    if (!existingTask) {
      return { error: 'Task not found', status: 404 };
    }

    // assigneeIdがnullでない場合、ユーザーの存在確認
    if (assigneeId !== null) {
      const userQuery = 'SELECT id FROM users WHERE id = ?';
      try {
        const user = await db.get(userQuery, [assigneeId]);
        if (!user) {
          return { error: 'Assignee not found', status: 404 };
        }
      } catch (error) {
        throw new Error(`Failed to verify assignee: ${error.message}`);
      }
    }

    // タスクの割り当てを更新
    const updateQuery = 'UPDATE tasks SET assignee_id = ? WHERE id = ?';

    try {
      await db.run(updateQuery, [assigneeId, taskId]);

      // 更新されたタスクを取得して返す
      const updatedTask = await this.getTaskById(taskId);
      return { task: updatedTask };
    } catch (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }
  }
};

module.exports = taskService;