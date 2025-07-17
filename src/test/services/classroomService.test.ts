import { getClassroomList } from '../../server/services/classroomService';
import db from '../../server/config/database';

describe('ClassroomService', () => {
  beforeAll(async () => {
    // 테스트 강의실 테이블 생성
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

    // 테스트 데이터 삽입
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

  describe('getClassroomList', () => {
    it('should return list of classrooms', async () => {
      const classrooms = await getClassroomList();
      
      expect(Array.isArray(classrooms)).toBe(true);
      expect(classrooms.length).toBeGreaterThan(0);
    });

    it('should return classrooms with correct structure', async () => {
      const classrooms = await getClassroomList();
      
      if (classrooms.length > 0) {
        const classroom = classrooms[0];
        expect(classroom).toHaveProperty('id');
        expect(classroom).toHaveProperty('name');
        expect(classroom).toHaveProperty('description');
        expect(classroom).toHaveProperty('teacher_id');
        expect(classroom).toHaveProperty('max_students');
        expect(classroom).toHaveProperty('is_active');
        expect(classroom).toHaveProperty('created_at');
        expect(classroom).toHaveProperty('updated_at');
      }
    });

    it('should return classrooms ordered by creation date', async () => {
      const classrooms = await getClassroomList();
      
      if (classrooms.length > 1) {
        const firstClassroom = new Date(classrooms[0].created_at);
        const secondClassroom = new Date(classrooms[1].created_at);
        expect(firstClassroom.getTime()).toBeGreaterThanOrEqual(secondClassroom.getTime());
      }
    });

    it('should include both active and inactive classrooms', async () => {
      const classrooms = await getClassroomList();
      
      const activeClassrooms = classrooms.filter(c => c.is_active === 1);
      const inactiveClassrooms = classrooms.filter(c => c.is_active === 0);
      
      expect(activeClassrooms.length).toBeGreaterThan(0);
      expect(inactiveClassrooms.length).toBeGreaterThan(0);
    });
  });
}); 