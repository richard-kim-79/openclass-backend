import db from './database';

interface Migration {
  id: number;
  name: string;
  sql: string;
  executed: boolean;
}

// 마이그레이션 테이블 생성
const createMigrationsTable = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// 마이그레이션 목록
const migrations: Migration[] = [
  {
    id: 1,
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
    executed: false
  },
  {
    id: 2,
    name: '002_create_classrooms_table',
    sql: `
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
    `,
    executed: false
  },
  {
    id: 3,
    name: '003_create_threads_table',
    sql: `
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
    `,
    executed: false
  },
  {
    id: 4,
    name: '004_create_materials_table',
    sql: `
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
    `,
    executed: false
  },
  {
    id: 5,
    name: '005_create_chat_messages_table',
    sql: `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `,
    executed: false
  },
  {
    id: 6,
    name: '006_create_notifications_table',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('message', 'classroom_update', 'material_upload')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `,
    executed: false
  },
  {
    id: 7,
    name: '007_create_classroom_members_table',
    sql: `
      CREATE TABLE IF NOT EXISTS classroom_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classroom_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(classroom_id, user_id),
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `,
    executed: false
  },
  {
    id: 8,
    name: '008_create_search_history_table',
    sql: `
      CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        filters TEXT,
        results_count INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `,
    executed: false
  },
  {
    id: 9,
    name: '009_create_performance_indexes',
    sql: `
      -- 사용자 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      
      -- 강의실 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_classrooms_created_at ON classrooms(created_at);
      CREATE INDEX IF NOT EXISTS idx_classrooms_is_public ON classrooms(is_public);
      CREATE INDEX IF NOT EXISTS idx_classrooms_title ON classrooms(title);
      
      -- 스레드 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_threads_classroom_id ON threads(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
      CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);
      CREATE INDEX IF NOT EXISTS idx_threads_parent_id ON threads(parent_id);
      CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads(is_pinned);
      
      -- 자료 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_materials_classroom_id ON materials(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_materials_author_id ON materials(author_id);
      CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
      CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
      CREATE INDEX IF NOT EXISTS idx_materials_title ON materials(title);
      
      -- 채팅 메시지 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom_id ON chat_messages(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
      
      -- 알림 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
      
      -- 강의실 멤버 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON classroom_members(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id ON classroom_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_classroom_members_role ON classroom_members(role);
      
      -- 검색 히스토리 테이블 인덱스
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp);
      CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
      
      -- 복합 인덱스 (자주 함께 사용되는 컬럼들)
      CREATE INDEX IF NOT EXISTS idx_classrooms_public_created ON classrooms(is_public, created_at);
      CREATE INDEX IF NOT EXISTS idx_threads_classroom_created ON threads(classroom_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_materials_classroom_type ON materials(classroom_id, type);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom_time ON chat_messages(classroom_id, timestamp);
    `,
    executed: false
  },
  {
    id: 10,
    name: '010_create_video_rooms_table',
    sql: `
      -- 화상 회의 방 테이블
      CREATE TABLE IF NOT EXISTS video_rooms (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
      );
      
      -- 화상 회의 참가자 테이블
      CREATE TABLE IF NOT EXISTS video_room_participants (
        id TEXT PRIMARY KEY,
        video_room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        left_at TEXT,
        FOREIGN KEY (video_room_id) REFERENCES video_rooms (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      -- 화상 회의 메시지 테이블
      CREATE TABLE IF NOT EXISTS video_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        message_data TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES video_rooms (id) ON DELETE CASCADE
      );
      
      -- 화상 회의 인덱스
      CREATE INDEX IF NOT EXISTS idx_video_rooms_classroom_id ON video_rooms(classroom_id);
      CREATE INDEX IF NOT EXISTS idx_video_rooms_is_active ON video_rooms(is_active);
      CREATE INDEX IF NOT EXISTS idx_video_participants_room_id ON video_participants(room_id);
      CREATE INDEX IF NOT EXISTS idx_video_participants_user_id ON video_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_video_messages_room_id ON video_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_video_messages_created_at ON video_messages(created_at);
    `,
    executed: false
  },
  {
    id: 11,
    name: '011_update_users_table_schema',
    sql: `
      -- users 테이블에 기본 컬럼들만 추가
      ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local';
      ALTER TABLE users ADD COLUMN deleted_at TEXT;
    `,
    executed: false
  },
  {
    id: 12,
    name: '012_create_login_history_table',
    sql: `
      CREATE TABLE IF NOT EXISTS login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        login_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      -- 로그인 히스토리 인덱스
      CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_history_provider ON login_history(provider);
      CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);
      CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);
      CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON login_history(user_id, created_at);
    `,
    executed: false
  },
  {
    id: 13,
    name: '013_create_user_activity_table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_activity (
        user_id TEXT PRIMARY KEY,
        login_count INTEGER DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        thread_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        material_upload_count INTEGER DEFAULT 0,
        material_download_count INTEGER DEFAULT 0,
        last_activity TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      -- 사용자 활동 인덱스
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
      CREATE INDEX IF NOT EXISTS idx_user_activity_target ON user_activity(target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity(user_id, activity_type);
    `,
    executed: false
  },
  {
    id: 14,
    name: '014_add_deleted_at_to_users',
    sql: `
      ALTER TABLE users ADD COLUMN deleted_at DATETIME;
    `,
    executed: false
  }
];

// 실행된 마이그레이션 조회
const getExecutedMigrations = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT name FROM migrations ORDER BY id', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map((row: any) => row.name));
      }
    });
  });
};

// 마이그레이션 실행
const executeMigration = (migration: Migration): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      db.run(migration.sql, (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        db.run('INSERT INTO migrations (name) VALUES (?)', [migration.name], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          db.run('COMMIT');
          console.log(`✅ 마이그레이션 실행 완료: ${migration.name}`);
          resolve();
        });
      });
    });
  });
};

// 마이그레이션 실행
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔧 마이그레이션 시작...');
    
    // 마이그레이션 테이블 생성
    await createMigrationsTable();
    
    // 실행된 마이그레이션 조회
    const executedMigrations = await getExecutedMigrations();
    
    // 실행되지 않은 마이그레이션 필터링
    const pendingMigrations = migrations.filter(
      migration => !executedMigrations.includes(migration.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ 모든 마이그레이션이 최신 상태입니다.');
      return;
    }
    
    console.log(`📋 실행할 마이그레이션: ${pendingMigrations.length}개`);
    
    // 마이그레이션 순차 실행
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('✅ 모든 마이그레이션이 완료되었습니다.');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
};

// 마이그레이션 상태 확인
export const getMigrationStatus = async (): Promise<any> => {
  try {
    const executedMigrations = await getExecutedMigrations();
    const totalMigrations = migrations.length;
    const pendingMigrations = totalMigrations - executedMigrations.length;
    
    return {
      total: totalMigrations,
      executed: executedMigrations.length,
      pending: pendingMigrations,
      migrations: migrations.map(migration => ({
        ...migration,
        executed: executedMigrations.includes(migration.name)
      }))
    };
  } catch (error) {
    console.error('❌ 마이그레이션 상태 확인 실패:', error);
    throw error;
  }
}; 