import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const createLoginHistoryTable = `
      CREATE TABLE IF NOT EXISTS login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        success INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.run(createLoginHistoryTable, (err) => {
      if (err) {
        reject(err);
      } else {
        // 인덱스 생성
        const createIndexes = [
          'CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id)',
          'CREATE INDEX IF NOT EXISTS idx_login_history_provider ON login_history(provider)',
          'CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success)',
          'CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at)',
          'CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON login_history(user_id, created_at)'
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
      'DROP INDEX IF EXISTS idx_login_history_user_id',
      'DROP INDEX IF EXISTS idx_login_history_provider',
      'DROP INDEX IF EXISTS idx_login_history_success',
      'DROP INDEX IF EXISTS idx_login_history_created_at',
      'DROP INDEX IF EXISTS idx_login_history_user_created'
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
          db.run('DROP TABLE IF EXISTS login_history', (dropErr) => {
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