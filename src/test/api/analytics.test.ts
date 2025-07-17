import request from 'supertest';
import { app } from '../../server/index';
import db from '../../server/config/database';

describe('Analytics API', () => {
  beforeAll(async () => {
    // 테스트 통계 테이블 생성
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS analytics_data (
          id TEXT PRIMARY KEY,
          data_type TEXT NOT NULL,
          data_value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 테스트 통계 데이터 삽입
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO analytics_data (id, data_type, data_value)
        VALUES 
          ('test-analytics-1', 'user_count', '150'),
          ('test-analytics-2', 'classroom_count', '25'),
          ('test-analytics-3', 'thread_count', '300'),
          ('test-analytics-4', 'material_count', '120'),
          ('test-analytics-5', 'active_users', '85')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM analytics_data WHERE id LIKE "test-analytics-%"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('GET /api/analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalClassrooms');
      expect(response.body).toHaveProperty('totalThreads');
      expect(response.body).toHaveProperty('totalMaterials');
      expect(response.body).toHaveProperty('activeUsers');
    });

    it('should return numeric values', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200);

      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalClassrooms).toBe('number');
      expect(typeof response.body.totalThreads).toBe('number');
      expect(typeof response.body.totalMaterials).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');
    });
  });

  describe('GET /api/analytics/system', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/system')
        .expect(200);

      expect(response.body).toHaveProperty('cpuUsage');
      expect(response.body).toHaveProperty('memoryUsage');
      expect(response.body).toHaveProperty('diskUsage');
      expect(response.body).toHaveProperty('activeConnections');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return valid system metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/system')
        .expect(200);

      expect(typeof response.body.cpuUsage).toBe('number');
      expect(typeof response.body.memoryUsage).toBe('number');
      expect(typeof response.body.diskUsage).toBe('number');
      expect(typeof response.body.activeConnections).toBe('number');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /api/analytics/user/:userId', () => {
    it('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/user/test-user-1')
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('totalPosts');
      expect(response.body).toHaveProperty('totalViews');
      expect(response.body).toHaveProperty('lastActive');
    });

    it('should handle non-existent user', async () => {
      const response = await request(app)
        .get('/api/analytics/user/non-existent-user')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/classroom/:classroomId', () => {
    it('should return classroom statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/classroom/test-classroom-1')
        .expect(200);

      expect(response.body).toHaveProperty('classroomId');
      expect(response.body).toHaveProperty('totalStudents');
      expect(response.body).toHaveProperty('totalThreads');
      expect(response.body).toHaveProperty('totalMaterials');
      expect(response.body).toHaveProperty('averageEngagement');
    });

    it('should handle non-existent classroom', async () => {
      const response = await request(app)
        .get('/api/analytics/classroom/non-existent-classroom')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/analytics/popular', () => {
    it('should return popular content', async () => {
      const response = await request(app)
        .get('/api/analytics/popular')
        .expect(200);

      expect(response.body).toHaveProperty('popularContent');
      expect(Array.isArray(response.body.popularContent)).toBe(true);
    });
  });

  describe('GET /api/analytics/growth', () => {
    it('should return growth trend data', async () => {
      const response = await request(app)
        .get('/api/analytics/growth')
        .expect(200);

      expect(response.body).toHaveProperty('growthData');
      expect(Array.isArray(response.body.growthData)).toBe(true);
    });

    it('should return growth data with correct structure', async () => {
      const response = await request(app)
        .get('/api/analytics/growth')
        .expect(200);

      if (response.body.growthData.length > 0) {
        const growthItem = response.body.growthData[0];
        expect(growthItem).toHaveProperty('date');
        expect(growthItem).toHaveProperty('newUsers');
        expect(growthItem).toHaveProperty('newClassrooms');
        expect(growthItem).toHaveProperty('activeUsers');
      }
    });
  });
}); 