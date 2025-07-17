import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        classroom_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
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
    db.run('DROP TABLE IF EXISTS chat_messages', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}; 