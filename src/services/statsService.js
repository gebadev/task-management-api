const db = require('../db/connection');

const statsService = {
  // タスク統計情報を取得
  async getStats() {
    try {
      const [totalResult, byStatus, byPriority, overdueResult, byAssignee] =
        await Promise.all([
          // 総タスク数
          db.get('SELECT COUNT(*) as total FROM tasks'),
          // ステータス別集計
          db.all(`
          SELECT status, COUNT(*) as count
          FROM tasks
          GROUP BY status
        `),
          // 優先度別集計
          db.all(`
          SELECT priority, COUNT(*) as count
          FROM tasks
          GROUP BY priority
        `),
          // 期限超過タスク数（未完了かつ期限切れ）
          db.get(`
          SELECT COUNT(*) as count
          FROM tasks
          WHERE due_date < datetime('now')
            AND status != 'done'
        `),
          // 担当者別タスク数
          db.all(`
          SELECT
            u.id as user_id,
            u.username,
            COUNT(t.id) as task_count
          FROM users u
          LEFT JOIN tasks t ON t.assignee_id = u.id
          GROUP BY u.id, u.username
          ORDER BY task_count DESC
        `),
        ]);

      const total = totalResult.total;

      // ステータス別をオブジェクトに変換
      const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
      for (const row of byStatus) {
        tasksByStatus[row.status] = row.count;
      }

      // 優先度別をオブジェクトに変換
      const tasksByPriority = { low: 0, medium: 0, high: 0 };
      for (const row of byPriority) {
        tasksByPriority[row.priority] = row.count;
      }

      // 完了率の計算
      const completionRate =
        total > 0 ? Math.round((tasksByStatus.done / total) * 100) : 0;

      return {
        total_tasks: total,
        tasks_by_status: tasksByStatus,
        tasks_by_priority: tasksByPriority,
        completion_rate: completionRate,
        overdue_tasks: overdueResult.count,
        tasks_by_assignee: byAssignee,
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  },
};

module.exports = statsService;
