const userService = require('../services/userService');

/**
 * すべてのユーザーを取得
 * GET /api/users
 */
async function getUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * IDでユーザーを取得
 * GET /api/users/:id
 */
async function getUserById(req, res, next) {
  try {
    const userId = req.params.id;
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
  } catch (error) {
    next(error);
  }
}

/**
 * 新しいユーザーを作成
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
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

    next(error);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
};
