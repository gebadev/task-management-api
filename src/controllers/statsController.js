const statsService = require('../services/statsService');

const statsController = {
  // GET /api/stats - タスク統計情報取得
  async getStats(req, res, next) {
    try {
      const stats = await statsService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = statsController;
