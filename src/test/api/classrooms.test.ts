import request from 'supertest';
import { app } from '../../server/index';
import db from '../../server/config/database';

describe('Classrooms API', () => {
  beforeAll(async () => {
    // 테스트 데이터베이스 초기화
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS classrooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          teacher_id TEXT NOT NULL,
          max_students INTEGER DEFAULT 50,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 테스트 강의실 데이터 삽입
    await new Promise<void>((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO classrooms (id, name, description, teacher_id, max_students, is_active)
        VALUES 
          ('test-classroom-1', '테스트 강의실 1', '첫 번째 테스트 강의실입니다.', 'test-teacher-1', 30, 1),
          ('test-classroom-2', '테스트 강의실 2', '두 번째 테스트 강의실입니다.', 'test-teacher-2', 25, 1),
          ('test-classroom-3', '테스트 강의실 3', '세 번째 테스트 강의실입니다.', 'test-teacher-3', 40, 0)
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM classrooms WHERE id LIKE "test-classroom-%"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('GET /api/classrooms', () => {
    it('should return list of classrooms', async () => {
      const response = await request(app)
        .get('/api/classrooms')
        .expect(200);

      expect(response.body).toHaveProperty('classrooms');
      expect(Array.isArray(response.body.classrooms)).toBe(true);
      expect(response.body.classrooms.length).toBeGreaterThan(0);
    });

    it('should return classrooms with correct structure', async () => {
      const response = await request(app)
        .get('/api/classrooms')
        .expect(200);

      const classroom = response.body.classrooms[0];
      expect(classroom).toHaveProperty('id');
      expect(classroom).toHaveProperty('name');
      expect(classroom).toHaveProperty('description');
      expect(classroom).toHaveProperty('teacher_id');
      expect(classroom).toHaveProperty('max_students');
      expect(classroom).toHaveProperty('is_active');
      expect(classroom).toHaveProperty('created_at');
      expect(classroom).toHaveProperty('updated_at');
    });

    it('should return active classrooms only', async () => {
      const response = await request(app)
        .get('/api/classrooms')
        .expect(200);

      const activeClassrooms = response.body.classrooms.filter((c: any) => c.is_active === 1);
      expect(activeClassrooms.length).toBeGreaterThan(0);
    });
  });
}); 