import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Thread {
  id: string;
  classroom_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  parent_id: string | null;
  is_pinned: number;
  created_at: string;
  updated_at: string;
}

export interface CreateThreadData {
  classroomId: string;
  content: string;
  authorName: string;
  parentId?: string;
}

export const getThreadsByClassroom = (classroomId: string): Promise<Thread[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, classroom_id, author_id, author_name, content, parent_id, is_pinned, created_at, updated_at
       FROM threads
       WHERE classroom_id = ?
       ORDER BY is_pinned DESC, created_at DESC`,
      [classroomId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Thread[]);
        }
      }
    );
  });
};

export const createNewThread = (data: CreateThreadData): Promise<Thread> => {
  return new Promise((resolve, reject) => {
    const threadId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO threads (id, classroom_id, author_name, content, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [threadId, data.classroomId, data.authorName, data.content, data.parentId || null, now, now],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // 생성된 스레드 조회
          db.get(
            `SELECT id, classroom_id, author_id, author_name, content, parent_id, is_pinned, created_at, updated_at
             FROM threads
             WHERE id = ?`,
            [threadId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Thread);
              }
            }
          );
        }
      }
    );
  });
}; 