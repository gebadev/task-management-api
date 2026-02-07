const express = require('express');
const { body } = require('express-validator');
const usersController = require('../controllers/usersController');

const router = express.Router();

/**
 * バリデーションルール: ユーザー作成
 */
const createUserValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

/**
 * GET /api/users
 * すべてのユーザーを取得
 */
router.get('/', usersController.getUsers);

/**
 * GET /api/users/:id
 * IDでユーザーを取得
 */
router.get('/:id', usersController.getUserById);

/**
 * POST /api/users
 * 新しいユーザーを作成
 */
router.post('/', createUserValidation, usersController.createUser);

module.exports = router;
