import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS classroom_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        classroom_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
        joined_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(classroom_id, user_id),
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
    db.run('DROP TABLE IF EXISTS classroom_members', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}; 