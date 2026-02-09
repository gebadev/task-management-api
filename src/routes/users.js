const express = require('express');
const usersController = require('../controllers/usersController');
const {
  createUserValidation,
  userIdValidation,
} = require('../middleware/validators');

const router = express.Router();

/**
 * GET /api/users
 * すべてのユーザーを取得
 */
router.get('/', usersController.getUsers);

/**
 * GET /api/users/:id
 * IDでユーザーを取得
 */
router.get('/:id', userIdValidation, usersController.getUserById);

/**
 * POST /api/users
 * 新しいユーザーを作成
 */
router.post('/', createUserValidation, usersController.createUser);

module.exports = router;
