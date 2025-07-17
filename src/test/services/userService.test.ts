import { getUserList } from '../../server/services/userService';
import db from '../../server/config/database';

describe('UserService', () => {
  beforeAll(async () => {
    // 테스트 사용자 테이블 생성
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

    // 테스트 데이터 삽입
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

  describe('getUserList', () => {
    it('should return list of users', async () => {
      const users = await getUserList();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should return users with correct structure', async () => {
      const users = await getUserList();
      
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
      }
    });

    it('should return users ordered by creation date', async () => {
      const users = await getUserList();
      
      if (users.length > 1) {
        const firstUser = new Date(users[0].createdAt);
        const secondUser = new Date(users[1].createdAt);
        expect(firstUser.getTime()).toBeGreaterThanOrEqual(secondUser.getTime());
      }
    });
  });
}); 