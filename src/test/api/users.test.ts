import request from 'supertest';
import { app } from '../../server/index';
import db from '../../server/config/database';

describe('Users API', () => {
  beforeAll(async () => {
    // 테스트 데이터베이스 초기화
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT DEFAULT 'student',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 테스트 사용자 데이터 삽입
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO users (id, username, email, role)
        VALUES 
          ('test-user-1', '테스트 사용자 1', 'test1@example.com', 'student'),
          ('test-user-2', '테스트 사용자 2', 'test2@example.com', 'teacher'),
          ('test-user-3', '테스트 사용자 3', 'test3@example.com', 'admin')
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM users WHERE id LIKE "test-user-%"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should return users with correct structure', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      const user = response.body.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });
}); 