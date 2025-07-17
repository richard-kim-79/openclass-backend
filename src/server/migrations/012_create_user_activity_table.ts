import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const createUserActivityTable = `
      CREATE TABLE IF NOT EXISTS user_activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.run(createUserActivityTable, (err) => {
      if (err) {
        reject(err);
      } else {
        // 인덱스 생성
        const createIndexes = [
          'CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type)',
          'CREATE INDEX IF NOT EXISTS idx_user_activity_target ON user_activity(target_type, target_id)',
          'CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at)',
          'CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity(user_id, activity_type)'
        ];

        let completed = 0;
        const total = createIndexes.length;

        createIndexes.forEach(indexQuery => {
          db.run(indexQuery, (indexErr) => {
            if (indexErr) {
              console.error('인덱스 생성 오류:', indexErr);
            }
            completed++;
            if (completed === total) {
              resolve();
            }
          });
        });
      }
    });
  });
};

export const down = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const dropIndexes = [
      'DROP INDEX IF EXISTS idx_user_activity_user_id',
      'DROP INDEX IF EXISTS idx_user_activity_type',
      'DROP INDEX IF EXISTS idx_user_activity_target',
      'DROP INDEX IF EXISTS idx_user_activity_created_at',
      'DROP INDEX IF EXISTS idx_user_activity_user_type'
    ];

    let completed = 0;
    const total = dropIndexes.length;

    dropIndexes.forEach(dropQuery => {
      db.run(dropQuery, (err) => {
        if (err) {
          console.error('인덱스 삭제 오류:', err);
        }
        completed++;
        if (completed === total) {
          db.run('DROP TABLE IF EXISTS user_activity', (dropErr) => {
            if (dropErr) {
              reject(dropErr);
            } else {
              resolve();
            }
          });
        }
      });
    });
  });
}; 