const express = require('express');
const router = express.Router();

// Routes will be registered here by respective issues:
// - Issue #3: User routes
const userRoutes = require('./users');
// - Issue #4: Task routes
// - Issue #7: Comment routes
const commentRoutes = require('./comments');
// - Issue #8: Stats routes

router.use('/users', userRoutes);
router.use('/tasks/:id/comments', commentRoutes);

// Example for other routes:
// const taskRoutes = require('./tasks');
// const statsRoutes = require('./stats');
//
// router.use('/tasks', taskRoutes);
// router.use('/stats', statsRoutes);

module.exports = router;
