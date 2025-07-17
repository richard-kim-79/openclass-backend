import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 성능 최적화를 위한 인덱스 생성
    const indexes = [
      // 사용자 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // 강의실 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id)',
      'CREATE INDEX IF NOT EXISTS idx_classrooms_created_at ON classrooms(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_classrooms_is_public ON classrooms(is_public)',
      'CREATE INDEX IF NOT EXISTS idx_classrooms_title ON classrooms(title)',
      
      // 스레드 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_threads_classroom_id ON threads(classroom_id)',
      'CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_threads_parent_id ON threads(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON threads(is_pinned)',
      
      // 자료 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_materials_classroom_id ON materials(classroom_id)',
      'CREATE INDEX IF NOT EXISTS idx_materials_author_id ON materials(author_id)',
      'CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type)',
      'CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_materials_title ON materials(title)',
      
      // 채팅 메시지 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom_id ON chat_messages(classroom_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)',
      
      // 알림 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp)',
      
      // 강의실 멤버 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON classroom_members(classroom_id)',
      'CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id ON classroom_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_classroom_members_role ON classroom_members(role)',
      
      // 검색 히스토리 테이블 인덱스
      'CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query)',
      
      // 복합 인덱스 (자주 함께 사용되는 컬럼들)
      'CREATE INDEX IF NOT EXISTS idx_classrooms_public_created ON classrooms(is_public, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_threads_classroom_created ON threads(classroom_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_materials_classroom_type ON materials(classroom_id, type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom_time ON chat_messages(classroom_id, timestamp)'
    ];

    // 인덱스 생성 실행
    const createIndexes = async () => {
      for (const index of indexes) {
        await new Promise<void>((resolveIndex, rejectIndex) => {
          db.run(index, (err) => {
            if (err) {
              console.error(`인덱스 생성 실패: ${index}`, err);
              rejectIndex(err);
            } else {
              resolveIndex();
            }
          });
        });
      }
    };

    createIndexes()
      .then(() => {
        console.log('✅ 성능 최적화 인덱스 생성 완료');
        resolve();
      })
      .catch(reject);
  });
};

export const down = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 인덱스 삭제
    const dropIndexes = [
      'DROP INDEX IF EXISTS idx_users_email',
      'DROP INDEX IF EXISTS idx_users_provider',
      'DROP INDEX IF EXISTS idx_users_created_at',
      'DROP INDEX IF EXISTS idx_classrooms_teacher_id',
      'DROP INDEX IF EXISTS idx_classrooms_created_at',
      'DROP INDEX IF EXISTS idx_classrooms_is_public',
      'DROP INDEX IF EXISTS idx_classrooms_title',
      'DROP INDEX IF EXISTS idx_threads_classroom_id',
      'DROP INDEX IF EXISTS idx_threads_author_id',
      'DROP INDEX IF EXISTS idx_threads_created_at',
      'DROP INDEX IF EXISTS idx_threads_parent_id',
      'DROP INDEX IF EXISTS idx_threads_is_pinned',
      'DROP INDEX IF EXISTS idx_materials_classroom_id',
      'DROP INDEX IF EXISTS idx_materials_author_id',
      'DROP INDEX IF EXISTS idx_materials_type',
      'DROP INDEX IF EXISTS idx_materials_created_at',
      'DROP INDEX IF EXISTS idx_materials_title',
      'DROP INDEX IF EXISTS idx_chat_messages_classroom_id',
      'DROP INDEX IF EXISTS idx_chat_messages_user_id',
      'DROP INDEX IF EXISTS idx_chat_messages_timestamp',
      'DROP INDEX IF EXISTS idx_notifications_user_id',
      'DROP INDEX IF EXISTS idx_notifications_type',
      'DROP INDEX IF EXISTS idx_notifications_is_read',
      'DROP INDEX IF EXISTS idx_notifications_timestamp',
      'DROP INDEX IF EXISTS idx_classroom_members_classroom_id',
      'DROP INDEX IF EXISTS idx_classroom_members_user_id',
      'DROP INDEX IF EXISTS idx_classroom_members_role',
      'DROP INDEX IF EXISTS idx_search_history_user_id',
      'DROP INDEX IF EXISTS idx_search_history_timestamp',
      'DROP INDEX IF EXISTS idx_search_history_query',
      'DROP INDEX IF EXISTS idx_classrooms_public_created',
      'DROP INDEX IF EXISTS idx_threads_classroom_created',
      'DROP INDEX IF EXISTS idx_materials_classroom_type',
      'DROP INDEX IF EXISTS idx_notifications_user_read',
      'DROP INDEX IF EXISTS idx_chat_messages_classroom_time'
    ];

    const removeIndexes = async () => {
      for (const dropIndex of dropIndexes) {
        await new Promise<void>((resolveIndex, rejectIndex) => {
          db.run(dropIndex, (err) => {
            if (err) {
              console.error(`인덱스 삭제 실패: ${dropIndex}`, err);
              rejectIndex(err);
            } else {
              resolveIndex();
            }
          });
        });
      }
    };

    removeIndexes()
      .then(() => {
        console.log('✅ 성능 최적화 인덱스 삭제 완료');
        resolve();
      })
      .catch(reject);
  });
}; 