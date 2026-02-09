const statsService = require('../services/statsService');

const statsController = {
  // GET /api/stats - タスク統計情報取得
  async getStats(req, res) {
    try {
      const stats = await statsService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};

module.exports = statsController;
