const express = require('express');
const router = express.Router();

// Routes will be registered here by respective issues:
// - Issue #3: User routes
// - Issue #4: Task routes
// - Issue #7: Comment routes
// - Issue #8: Stats routes

const userRoutes = require('./users');

router.use('/users', userRoutes);

// Example:
// const taskRoutes = require('./tasks');
// const commentRoutes = require('./comments');
// const statsRoutes = require('./stats');
//
// router.use('/tasks', taskRoutes);
// router.use('/comments', commentRoutes);
// router.use('/stats', statsRoutes);

module.exports = router;
