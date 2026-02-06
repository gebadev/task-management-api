const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
const routes = require('./routes');
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler will be added by Issue #9
// app.use(errorHandler);

module.exports = app;
