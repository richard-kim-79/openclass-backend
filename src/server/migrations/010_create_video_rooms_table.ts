import { Database } from 'sqlite3';

export const createVideoRoomsTable = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS video_rooms (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
      )
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('화상 회의 방 테이블 생성 실패:', err);
        reject(err);
      } else {
        console.log('✅ 화상 회의 방 테이블이 생성되었습니다.');
        resolve();
      }
    });
  });
};

export const createVideoParticipantsTable = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS video_participants (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        is_host INTEGER DEFAULT 0,
        is_muted INTEGER DEFAULT 0,
        is_video_enabled INTEGER DEFAULT 1,
        joined_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES video_rooms (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('화상 회의 참가자 테이블 생성 실패:', err);
        reject(err);
      } else {
        console.log('✅ 화상 회의 참가자 테이블이 생성되었습니다.');
        resolve();
      }
    });
  });
};

export const createVideoMessagesTable = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const query = `
      CREATE TABLE IF NOT EXISTS video_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        message_data TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES video_rooms (id) ON DELETE CASCADE
      )
    `;

    db.run(query, (err) => {
      if (err) {
        console.error('화상 회의 메시지 테이블 생성 실패:', err);
        reject(err);
      } else {
        console.log('✅ 화상 회의 메시지 테이블이 생성되었습니다.');
        resolve();
      }
    });
  });
};

export const createVideoRoomsIndexes = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_video_rooms_classroom_id ON video_rooms(classroom_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_rooms_is_active ON video_rooms(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_video_participants_room_id ON video_participants(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_participants_user_id ON video_participants(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_messages_room_id ON video_messages(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_video_messages_created_at ON video_messages(created_at)'
    ];

    let completed = 0;
    const total = indexes.length;

    indexes.forEach((indexQuery) => {
      db.run(indexQuery, (err) => {
        if (err) {
          console.error('화상 회의 인덱스 생성 실패:', err);
          reject(err);
        } else {
          completed++;
          if (completed === total) {
            console.log('✅ 화상 회의 인덱스가 생성되었습니다.');
            resolve();
          }
        }
      });
    });
  });
};

export const migration = async (db: Database): Promise<void> => {
  try {
    await createVideoRoomsTable(db);
    await createVideoParticipantsTable(db);
    await createVideoMessagesTable(db);
    await createVideoRoomsIndexes(db);
  } catch (error) {
    console.error('화상 회의 테이블 마이그레이션 실패:', error);
    throw error;
  }
}; 