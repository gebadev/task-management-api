// Task status constants
const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

// Task priority constants
const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// API response messages
const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
};

// Database configuration
const DB_CONFIG = {
  TEST_DB_PATH: './data/test.db',
  DEV_DB_PATH: './data/tasks.db',
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
  MESSAGES,
  DB_CONFIG,
};
