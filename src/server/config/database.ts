import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 데이터베이스 파일 경로
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/openclass.db');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 데이터베이스 연결 실패:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLite 데이터베이스에 성공적으로 연결되었습니다.');
  console.log(`📁 데이터베이스 경로: ${DB_PATH}`);
});

// 데이터베이스 스키마 생성 함수
export const createTables = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 사용자 테이블
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    // 강의실 테이블
    const createClassroomsTable = `
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        teacher_id TEXT NOT NULL,
        teacher_name TEXT NOT NULL,
        is_public INTEGER DEFAULT 1,
        student_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES users (id)
      )
    `;

    // 스레드 테이블
    const createThreadsTable = `
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
        FOREIGN KEY (author_id) REFERENCES users (id)
      )
    `;

    // 자료 테이블
    const createMaterialsTable = `
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_path TEXT,
        file_name TEXT,
        file_size INTEGER,
        uploaded_by TEXT NOT NULL,
        uploaded_by_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id),
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )
    `;

    console.log('🔧 데이터베이스 테이블 생성 중...');

    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('❌ 사용자 테이블 생성 실패:', err.message);
          reject(err);
          return;
        }
        console.log('✅ 사용자 테이블 생성 완료');
      });

      db.run(createClassroomsTable, (err) => {
        if (err) {
          console.error('❌ 강의실 테이블 생성 실패:', err.message);
          reject(err);
          return;
        }
        console.log('✅ 강의실 테이블 생성 완료');
      });

      db.run(createThreadsTable, (err) => {
        if (err) {
          console.error('❌ 스레드 테이블 생성 실패:', err.message);
          reject(err);
          return;
        }
        console.log('✅ 스레드 테이블 생성 완료');
      });

      db.run(createMaterialsTable, (err) => {
        if (err) {
          console.error('❌ 자료 테이블 생성 실패:', err.message);
          reject(err);
          return;
        }
        console.log('✅ 자료 테이블 생성 완료');
        console.log('✅ 모든 테이블 생성이 완료되었습니다.');
        resolve();
      });
    });
  });
};

// 데이터베이스 초기화 함수
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 외래 키 제약 조건 활성화
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('외래 키 제약 조건 활성화 실패:', err.message);
        reject(err);
        return;
      }
      
      // 데이터베이스 최적화 설정
      db.run('PRAGMA journal_mode = WAL', (err) => {
        if (err) {
          console.error('WAL 모드 설정 실패:', err.message);
        }
      });
      
      db.run('PRAGMA synchronous = NORMAL', (err) => {
        if (err) {
          console.error('동기화 모드 설정 실패:', err.message);
        }
      });
      
      db.run('PRAGMA cache_size = 10000', (err) => {
        if (err) {
          console.error('캐시 크기 설정 실패:', err.message);
        }
      });
      
      console.log('✅ 데이터베이스 초기화가 완료되었습니다.');
      resolve();
    });
  });
};

// 데이터베이스 연결 테스트 함수
export const testDatabaseConnection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    db.get('SELECT 1 as test', (err, row) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 테스트 실패:', err.message);
        resolve(false);
      } else {
        console.log('✅ 데이터베이스 연결 테스트 성공');
        resolve(true);
      }
    });
  });
};

// 데이터베이스 통계 조회 함수
export const getDatabaseStats = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stats: any = {};
    
    // 테이블 목록 조회
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        reject(err);
        return;
      }
      
      stats.tables = tables.map((table: any) => table.name);
      
      // 각 테이블의 레코드 수 조회
      const tableCounts: any = {};
      let completedTables = 0;
      
      if (tables.length === 0) {
        stats.tableCounts = tableCounts;
        resolve(stats);
        return;
      }
      
      tables.forEach((table: any) => {
        db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row: any) => {
          if (!err && row) {
            tableCounts[table.name] = row.count;
          }
          completedTables++;
          
          if (completedTables === tables.length) {
            stats.tableCounts = tableCounts;
            resolve(stats);
          }
        });
      });
    });
  });
};

// 데이터베이스 백업 함수
export const backupDatabase = (backupPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const backupDb = new sqlite3.Database(backupPath);
    
    // SQLite3의 backup 메서드가 없는 경우를 대비한 대체 구현
    try {
      // 간단한 복사 방식으로 대체
      const fs = require('fs');
      const path = require('path');
      const sourcePath = DB_PATH;
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`✅ 데이터베이스 백업 완료: ${backupPath}`);
        resolve();
      } else {
        reject(new Error('소스 데이터베이스 파일을 찾을 수 없습니다.'));
      }
    } catch (err: any) {
      console.error('❌ 데이터베이스 백업 실패:', err.message);
      reject(err);
    } finally {
      backupDb.close();
    }
  });
};

// 데이터베이스 연결 종료 함수
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 종료 실패:', err.message);
      } else {
        console.log('✅ 데이터베이스 연결이 정상적으로 종료되었습니다.');
      }
      resolve();
    });
  });
};

// 데이터베이스 인스턴스 내보내기
export default db;

// 타입 정의
export interface DatabaseStats {
  tables: string[];
  tableCounts: { [key: string]: number };
} 