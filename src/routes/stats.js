const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// GET /api/stats - タスク統計情報取得
router.get('/', statsController.getStats);

module.exports = router;
