const request = require('supertest');
const express = require('express');
const { errorHandler, AppError } = require('../src/middleware/errorHandler');
const {
  handleValidationErrors,
  createTaskValidation,
  createUserValidation,
} = require('../src/middleware/validators');
const app = require('../src/app');

describe('Error Handler Middleware', () => {
  describe('Global Error Handler', () => {
    let testApp;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });

    it('should return 500 with generic message for unhandled errors', async () => {
      testApp.get('/error', () => {
        throw new Error('Something went wrong');
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should use custom statusCode from AppError', async () => {
      testApp.get('/error', () => {
        throw new AppError('Not found', 404);
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not found');
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      testApp.get('/error', () => {
        throw new Error('Dev error');
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      testApp.get('/error', () => {
        throw new Error('Prod error');
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');

      expect(response.status).toBe(500);
      expect(response.body).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors passed via next() in async handlers', async () => {
      testApp.get('/error', async (req, res, next) => {
        next(new AppError('Async error', 422));
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Async error');
    });
  });

  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Bad request', 400);

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Validation Middleware', () => {
    let testApp;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
    });

    it('should return 400 with validation details for invalid task data', async () => {
      testApp.post('/test', createTaskValidation, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp).post('/test').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
      expect(response.body.details[0]).toHaveProperty('field');
      expect(response.body.details[0]).toHaveProperty('message');
    });

    it('should pass valid task data through validation', async () => {
      testApp.post('/test', createTaskValidation, (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const response = await request(testApp)
        .post('/test')
        .send({ title: 'Valid Task', priority: 'high' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid priority values', async () => {
      testApp.post('/test', createTaskValidation, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp)
        .post('/test')
        .send({ title: 'Task', priority: 'urgent' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      const priorityError = response.body.details.find(
        (d) => d.field === 'priority',
      );
      expect(priorityError).toBeDefined();
    });

    it('should reject invalid status values', async () => {
      testApp.put(
        '/test/:id',
        [
          require('express-validator').param('id').isInt().toInt(),
          require('express-validator')
            .body('status')
            .optional()
            .isIn(['todo', 'in_progress', 'done'])
            .withMessage('Invalid status'),
          handleValidationErrors,
        ],
        (req, res) => {
          res.json({ success: true });
        },
      );

      const response = await request(testApp)
        .put('/test/1')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 with validation details for invalid user data', async () => {
      testApp.post('/test', createUserValidation, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(testApp).post('/test').send({
        username: 'ab',
        email: 'invalid',
        password: '12',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThanOrEqual(3);
    });

    it('should sanitize XSS in title field', async () => {
      testApp.post('/test', createTaskValidation, (req, res) => {
        res.json({ success: true, data: { title: req.body.title } });
      });

      const response = await request(testApp)
        .post('/test')
        .send({ title: '<script>alert("xss")</script>' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.title).toContain('&lt;');
    });
  });

  describe('Integration: Error Handler with App', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"invalid json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
