const express = require('express');
const router = express.Router();

// Routes will be registered here by respective issues:
// - Issue #3: User routes
// - Issue #4: Task routes (implemented)
// - Issue #7: Comment routes
// - Issue #8: Stats routes

// Issue #4: Task routes
const taskRoutes = require('./tasks');
router.use('/tasks', taskRoutes);

// Future routes:
// const userRoutes = require('./users');
// const commentRoutes = require('./comments');
// const statsRoutes = require('./stats');
//
// router.use('/users', userRoutes);
// router.use('/comments', commentRoutes);
// router.use('/stats', statsRoutes);

module.exports = router;
