const express = require('express');
const router = express.Router();

// Routes will be registered here by respective issues:
// - Issue #3: User routes (implemented)
// - Issue #4: Task routes (implemented)
// - Issue #7: Comment routes (implemented)
// - Issue #8: Stats routes

// Issue #3: User routes
const userRoutes = require('./users');
router.use('/users', userRoutes);

// Issue #4: Task routes
const taskRoutes = require('./tasks');
router.use('/tasks', taskRoutes);

// Issue #7: Comment routes
const commentRoutes = require('./comments');
router.use('/tasks/:id/comments', commentRoutes);

// Future routes:
// const statsRoutes = require('./stats');
//
// router.use('/stats', statsRoutes);

module.exports = router;
