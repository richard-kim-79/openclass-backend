import db from '../config/database';

/**
 * 강의실 목록 조회
 */
export const getClassroomList = async (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        teacher_id, 
        teacher_name, 
        is_public, 
        student_count, 
        created_at, 
        updated_at 
      FROM classrooms 
      ORDER BY created_at DESC
    `;
    
    console.log('🔍 강의실 목록 조회 쿼리 실행:', query);
    
    db.all(query, (err: any, rows: any) => {
      if (err) {
        console.error('❌ 강의실 목록 조회 실패:', err);
        reject(err);
      } else {
        console.log(`✅ 강의실 목록 조회 성공: ${rows?.length || 0}개`);
        resolve(rows || []);
      }
    });
  });
};

/**
 * 강의실 상세 조회
 */
export const getClassroomById = async (id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        teacher_id, 
        teacher_name, 
        is_public, 
        student_count, 
        created_at, 
        updated_at 
      FROM classrooms 
      WHERE id = ?
    `;
    
    console.log('🔍 강의실 상세 조회 쿼리 실행:', query, 'ID:', id);
    
    db.get(query, [id], (err: any, row: any) => {
      if (err) {
        console.error('❌ 강의실 상세 조회 실패:', err);
        reject(err);
      } else if (!row) {
        console.log('⚠️ 강의실을 찾을 수 없음:', id);
        reject(new Error('강의실을 찾을 수 없습니다.'));
      } else {
        console.log('✅ 강의실 상세 조회 성공:', row.title);
        resolve(row);
      }
    });
  });
};

/**
 * 강의실 생성
 */
export const createClassroom = async (classroomData: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO classrooms (
        id, title, description, teacher_id, teacher_name, 
        is_public, student_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      classroomData.id,
      classroomData.title,
      classroomData.description,
      classroomData.teacher_id,
      classroomData.teacher_name,
      classroomData.is_public ? 1 : 0,
      classroomData.student_count || 0,
      classroomData.created_at,
      classroomData.updated_at
    ];
    
    console.log('🔍 강의실 생성 쿼리 실행:', query, '데이터:', classroomData);
    
    db.run(query, params, function(err: any) {
      if (err) {
        console.error('❌ 강의실 생성 실패:', err);
        reject(err);
      } else {
        console.log('✅ 강의실 생성 성공, ID:', this.lastID);
        resolve({ ...classroomData, id: classroomData.id });
      }
    });
  });
};

/**
 * 강의실 수정
 */
export const updateClassroom = async (id: string, updateData: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE classrooms 
      SET title = ?, description = ?, teacher_name = ?, 
          is_public = ?, student_count = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const params = [
      updateData.title,
      updateData.description,
      updateData.teacher_name,
      updateData.is_public ? 1 : 0,
      updateData.student_count || 0,
      updateData.updated_at,
      id
    ];
    
    console.log('🔍 강의실 수정 쿼리 실행:', query, 'ID:', id, '데이터:', updateData);
    
    db.run(query, params, function(err: any) {
      if (err) {
        console.error('❌ 강의실 수정 실패:', err);
        reject(err);
      } else if (this.changes === 0) {
        console.log('⚠️ 수정할 강의실을 찾을 수 없음:', id);
        reject(new Error('수정할 강의실을 찾을 수 없습니다.'));
      } else {
        console.log('✅ 강의실 수정 성공, 변경된 행:', this.changes);
        resolve({ id, ...updateData });
      }
    });
  });
};

/**
 * 강의실 삭제
 */
export const deleteClassroom = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM classrooms WHERE id = ?';
    
    console.log('🔍 강의실 삭제 쿼리 실행:', query, 'ID:', id);
    
    db.run(query, [id], function(err: any) {
      if (err) {
        console.error('❌ 강의실 삭제 실패:', err);
        reject(err);
      } else if (this.changes === 0) {
        console.log('⚠️ 삭제할 강의실을 찾을 수 없음:', id);
        reject(new Error('삭제할 강의실을 찾을 수 없습니다.'));
      } else {
        console.log('✅ 강의실 삭제 성공, 삭제된 행:', this.changes);
        resolve();
      }
    });
  });
};

/**
 * 사용자의 강의실 목록 조회
 */
export const getClassroomsByTeacher = async (teacherId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, title, description, teacher_id, teacher_name, 
        is_public, student_count, created_at, updated_at 
      FROM classrooms 
      WHERE teacher_id = ? 
      ORDER BY created_at DESC
    `;
    
    console.log('🔍 사용자 강의실 목록 조회 쿼리 실행:', query, 'Teacher ID:', teacherId);
    
    db.all(query, [teacherId], (err: any, rows: any) => {
      if (err) {
        console.error('❌ 사용자 강의실 목록 조회 실패:', err);
        reject(err);
      } else {
        console.log(`✅ 사용자 강의실 목록 조회 성공: ${rows?.length || 0}개`);
        resolve(rows || []);
      }
    });
  });
}; 