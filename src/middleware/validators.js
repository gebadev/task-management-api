const { body, param, query, validationResult } = require('express-validator');

/**
 * バリデーション結果をチェックし、エラーがあれば400レスポンスを返すミドルウェア
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

// ステータス値のホワイトリスト
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
// 優先度値のホワイトリスト
const VALID_PRIORITIES = ['low', 'medium', 'high'];

/**
 * タスク作成用バリデーション
 */
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters')
    .escape(),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters')
    .escape(),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('assignee_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('assignee_id must be a positive integer')
    .toInt(),
  body('due_date')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

/**
 * タスク更新用バリデーション
 */
const updateTaskValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid task ID').toInt(),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters')
    .escape(),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters')
    .escape(),
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  body('assignee_id')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('assignee_id must be a positive integer')
    .toInt(),
  body('due_date')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date'),
  handleValidationErrors,
];

/**
 * タスクID パラメータバリデーション
 */
const taskIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid task ID').toInt(),
  handleValidationErrors,
];

/**
 * タスク割り当て用バリデーション
 */
const assignTaskValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid task ID').toInt(),
  body('assignee_id')
    .exists({ checkNull: false })
    .withMessage('assignee_id is required'),
  handleValidationErrors,
];

/**
 * タスクフィルタリング用クエリバリデーション
 */
const taskFilterValidation = [
  query('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  query('priority')
    .optional()
    .isIn(VALID_PRIORITIES)
    .withMessage(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`),
  query('assignee_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('assignee_id must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),
  handleValidationErrors,
];

/**
 * ユーザー作成用バリデーション
 */
const createUserValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Username can only contain letters, numbers, underscores, and hyphens',
    ),
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
  handleValidationErrors,
];

/**
 * ユーザーID パラメータバリデーション
 */
const userIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID').toInt(),
  handleValidationErrors,
];

/**
 * コメント作成用バリデーション
 */
const createCommentValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid task ID').toInt(),
  body('user_id')
    .notEmpty()
    .withMessage('user_id is required')
    .isInt({ min: 1 })
    .withMessage('user_id must be a positive integer')
    .toInt(),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters')
    .escape(),
  handleValidationErrors,
];

/**
 * コメント取得用バリデーション（タスクIDパラメータ）
 */
const commentTaskIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid task ID').toInt(),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  assignTaskValidation,
  taskFilterValidation,
  createUserValidation,
  userIdValidation,
  createCommentValidation,
  commentTaskIdValidation,
};
