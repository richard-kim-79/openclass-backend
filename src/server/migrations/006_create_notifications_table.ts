import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('message', 'classroom_update', 'material_upload')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const down = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run('DROP TABLE IF EXISTS notifications', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}; 