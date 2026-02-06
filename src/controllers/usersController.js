const { validationResult } = require('express-validator');
const userService = require('../services/userService');

/**
 * すべてのユーザーを取得
 * GET /api/users
 */
async function getUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
}

/**
 * IDでユーザーを取得
 * GET /api/users/:id
 */
async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
}

/**
 * 新しいユーザーを作成
 * POST /api/users
 */
async function createUser(req, res) {
  try {
    // バリデーション結果をチェック
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    const newUser = await userService.createUser({
      username,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
      });
    }

    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
};
