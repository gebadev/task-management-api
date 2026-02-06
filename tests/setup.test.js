const request = require('supertest');
const app = require('../src/app');

describe('Basic Setup Tests', () => {
  describe('GET /health', () => {
    it('should return health check response', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent endpoint', async () => {
      const response = await request(app).get('/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });

  describe('Express Middleware', () => {
    it('should parse JSON request body', async () => {
      // This test will be more meaningful once we have POST endpoints
      // For now, we just verify the app is properly configured
      expect(app).toBeDefined();
    });
  });
});
