import request from 'supertest';
import { app } from '../../server/index';
import db from '../../server/config/database';

describe('Search API', () => {
  beforeAll(async () => {
    // 테스트 검색 히스토리 테이블 생성
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS search_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          query TEXT NOT NULL,
          search_type TEXT DEFAULT 'all',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 테스트 검색 히스토리 데이터 삽입
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO search_history (id, user_id, query, search_type)
        VALUES 
          ('test-search-1', 'test-user-1', 'JavaScript', 'classroom'),
          ('test-search-2', 'test-user-2', 'React', 'material'),
          ('test-search-3', 'test-user-1', 'TypeScript', 'all'),
          ('test-search-4', 'test-user-3', 'Node.js', 'thread')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM search_history WHERE id LIKE "test-search-%"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('GET /api/search/advanced', () => {
    it('should return search results', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .query({ q: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should handle search with type filter', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .query({ q: 'test', type: 'classroom' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    it('should handle search with pagination', async () => {
      const response = await request(app)
        .get('/api/search/advanced')
        .query({ q: 'test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.page).toBe(1);
    });
  });

  describe('GET /api/search/history/:userId', () => {
    it('should return search history for user', async () => {
      const response = await request(app)
        .get('/api/search/history/test-user-1')
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
    });

    it('should return empty history for non-existent user', async () => {
      const response = await request(app)
        .get('/api/search/history/non-existent-user')
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(response.body.history).toEqual([]);
    });
  });

  describe('GET /api/search/popular', () => {
    it('should return popular search terms', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .expect(200);

      expect(response.body).toHaveProperty('popularTerms');
      expect(Array.isArray(response.body.popularTerms)).toBe(true);
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should return search suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: 'Java' })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should handle empty query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ q: '' })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
    });
  });
}); 