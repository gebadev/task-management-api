const express = require('express');
const router = express.Router();

// Routes will be registered here by respective issues:
// - Issue #3: User routes
// - Issue #4: Task routes
// - Issue #7: Comment routes
// - Issue #8: Stats routes

// Comment routes (Issue #5/7)
const commentRoutes = require('./comments');

// Register comment routes as nested routes under tasks
router.use('/tasks/:id/comments', commentRoutes);

// Example for other routes:
// const taskRoutes = require('./tasks');
// const userRoutes = require('./users');
// const statsRoutes = require('./stats');
//
// router.use('/tasks', taskRoutes);
// router.use('/users', userRoutes);
// router.use('/stats', statsRoutes);

module.exports = router;
