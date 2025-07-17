import request from 'supertest';
import { app } from '../../server/index';

describe('Swagger API Documentation', () => {
  describe('GET /api-docs', () => {
    it('should serve swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('GET /api-docs.json', () => {
    it('should return swagger specification', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
      expect(response.body).toHaveProperty('components');
    });

    it('should have correct API info', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body.info.title).toBe('OpenClass API');
      expect(response.body.info.version).toBe('1.0.0');
      expect(response.body.info.description).toContain('OpenClass');
    });

    it('should have security schemes defined', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body.components).toHaveProperty('securitySchemes');
      expect(response.body.components.securitySchemes).toHaveProperty('bearerAuth');
    });

    it('should have API paths defined', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body.paths).toHaveProperty('/api/users');
      expect(response.body.paths).toHaveProperty('/api/classrooms');
      expect(response.body.paths).toHaveProperty('/api/search/advanced');
      expect(response.body.paths).toHaveProperty('/api/analytics');
    });
  });
}); 