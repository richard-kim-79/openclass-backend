import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Material {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  author_id: string | null;
  author_name: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialData {
  classroomId: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  authorName: string;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export const getMaterialsByClassroom = (classroomId: string): Promise<Material[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, classroom_id, title, description, type, url, file_path, file_size, mime_type, author_id, author_name, download_count, created_at, updated_at
       FROM materials
       WHERE classroom_id = ?
       ORDER BY created_at DESC`,
      [classroomId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Material[]);
        }
      }
    );
  });
};

export const createNewMaterial = (data: CreateMaterialData): Promise<Material> => {
  return new Promise((resolve, reject) => {
    const materialId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO materials (id, classroom_id, title, description, type, url, file_path, file_size, mime_type, author_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        materialId, 
        data.classroomId, 
        data.title, 
        data.description || null, 
        data.type, 
        data.url, 
        data.filePath || null,
        data.fileSize || null,
        data.mimeType || null,
        data.authorName, 
        now, 
        now
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // 생성된 자료 조회
          db.get(
            `SELECT id, classroom_id, title, description, type, url, file_path, file_size, mime_type, author_id, author_name, download_count, created_at, updated_at
             FROM materials
             WHERE id = ?`,
            [materialId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Material);
              }
            }
          );
        }
      }
    );
  });
}; 