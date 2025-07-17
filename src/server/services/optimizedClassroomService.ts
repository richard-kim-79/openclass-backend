import db from '../config/database';

interface ClassroomFilters {
  teacherId?: string;
  isPublic?: boolean | undefined;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'title' | 'student_count';
  sortOrder?: 'ASC' | 'DESC';
}

interface ClassroomWithStats {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  teacher_name: string;
  is_public: boolean;
  student_count: number;
  thread_count: number;
  material_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 최적화된 강의실 목록 조회 (통계 포함)
 */
export const getOptimizedClassroomList = async (filters: ClassroomFilters = {}): Promise<{
  classrooms: ClassroomWithStats[];
  total: number;
  hasMore: boolean;
}> => {
  return new Promise((resolve, reject) => {
    const {
      teacherId,
      isPublic,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // WHERE 조건 구성
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (teacherId) {
      whereConditions.push('c.teacher_id = ?');
      params.push(teacherId);
    }

    if (isPublic !== undefined) {
      whereConditions.push('c.is_public = ?');
      params.push(isPublic ? 1 : 0);
    }

    if (search) {
      whereConditions.push('(c.title LIKE ? OR c.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM classrooms c
      ${whereClause}
    `;

    // 메인 쿼리 (통계 포함)
    const mainQuery = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.teacher_id,
        c.teacher_name,
        c.is_public,
        c.student_count,
        c.created_at,
        c.updated_at,
        COALESCE(t.thread_count, 0) as thread_count,
        COALESCE(m.material_count, 0) as material_count
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as thread_count
        FROM threads
        GROUP BY classroom_id
      ) t ON c.id = t.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as material_count
        FROM materials
        GROUP BY classroom_id
      ) m ON c.id = m.classroom_id
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 최적화된 강의실 목록 조회 실행');

    db.serialize(() => {
      // 전체 개수 조회
      db.get(countQuery, params, (err: any, countRow: any) => {
        if (err) {
          console.error('❌ 강의실 개수 조회 실패:', err);
          reject(err);
          return;
        }

        const total = countRow.total;

        // 메인 데이터 조회
        const mainParams = [...params, limit, offset];
        db.all(mainQuery, mainParams, (err: any, rows: any) => {
          if (err) {
            console.error('❌ 강의실 목록 조회 실패:', err);
            reject(err);
          } else {
            console.log(`✅ 최적화된 강의실 목록 조회 성공: ${rows?.length || 0}개`);
            resolve({
              classrooms: rows || [],
              total,
              hasMore: offset + limit < total
            });
          }
        });
      });
    });
  });
};

/**
 * 최적화된 강의실 상세 조회 (관련 데이터 포함)
 */
export const getOptimizedClassroomById = async (id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.*,
        COALESCE(t.thread_count, 0) as thread_count,
        COALESCE(m.material_count, 0) as material_count,
        COALESCE(cm.member_count, 0) as member_count
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as thread_count
        FROM threads
        GROUP BY classroom_id
      ) t ON c.id = t.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as material_count
        FROM materials
        GROUP BY classroom_id
      ) m ON c.id = m.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as member_count
        FROM classroom_members
        GROUP BY classroom_id
      ) cm ON c.id = cm.classroom_id
      WHERE c.id = ?
    `;

    console.log('🔍 최적화된 강의실 상세 조회 실행:', id);

    db.get(query, [id], (err: any, row: any) => {
      if (err) {
        console.error('❌ 최적화된 강의실 상세 조회 실패:', err);
        reject(err);
      } else if (!row) {
        console.log('⚠️ 강의실을 찾을 수 없음:', id);
        reject(new Error('강의실을 찾을 수 없습니다.'));
      } else {
        console.log('✅ 최적화된 강의실 상세 조회 성공:', row.title);
        resolve(row);
      }
    });
  });
};

/**
 * 강의실 통계 조회
 */
export const getClassroomStats = async (classroomId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM threads WHERE classroom_id = ?) as thread_count,
        (SELECT COUNT(*) FROM materials WHERE classroom_id = ?) as material_count,
        (SELECT COUNT(*) FROM classroom_members WHERE classroom_id = ?) as member_count,
        (SELECT COUNT(*) FROM chat_messages WHERE classroom_id = ?) as message_count
    `;

    console.log('🔍 강의실 통계 조회 실행:', classroomId);

    db.get(query, [classroomId, classroomId, classroomId, classroomId], (err: any, row: any) => {
      if (err) {
        console.error('❌ 강의실 통계 조회 실패:', err);
        reject(err);
      } else {
        console.log('✅ 강의실 통계 조회 성공:', row);
        resolve(row);
      }
    });
  });
};

/**
 * 인기 강의실 조회 (학생 수 기준)
 */
export const getPopularClassrooms = async (limit: number = 10): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.*,
        COALESCE(t.thread_count, 0) as thread_count,
        COALESCE(m.material_count, 0) as material_count
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as thread_count
        FROM threads
        GROUP BY classroom_id
      ) t ON c.id = t.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as material_count
        FROM materials
        GROUP BY classroom_id
      ) m ON c.id = m.classroom_id
      WHERE c.is_public = 1
      ORDER BY c.student_count DESC, c.created_at DESC
      LIMIT ?
    `;

    console.log('🔍 인기 강의실 조회 실행');

    db.all(query, [limit], (err: any, rows: any) => {
      if (err) {
        console.error('❌ 인기 강의실 조회 실패:', err);
        reject(err);
      } else {
        console.log(`✅ 인기 강의실 조회 성공: ${rows?.length || 0}개`);
        resolve(rows || []);
      }
    });
  });
};

/**
 * 최근 활동이 있는 강의실 조회
 */
export const getRecentActiveClassrooms = async (limit: number = 10): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT
        c.*,
        COALESCE(t.thread_count, 0) as thread_count,
        COALESCE(m.material_count, 0) as material_count,
        COALESCE(latest_activity.latest_activity, c.updated_at) as latest_activity
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as thread_count
        FROM threads
        GROUP BY classroom_id
      ) t ON c.id = t.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as material_count
        FROM materials
        GROUP BY classroom_id
      ) m ON c.id = m.classroom_id
      LEFT JOIN (
        SELECT 
          classroom_id,
          MAX(activity_time) as latest_activity
        FROM (
          SELECT classroom_id, created_at as activity_time FROM threads
          UNION ALL
          SELECT classroom_id, created_at as activity_time FROM materials
          UNION ALL
          SELECT classroom_id, timestamp as activity_time FROM chat_messages
        ) all_activities
        GROUP BY classroom_id
      ) latest_activity ON c.id = latest_activity.classroom_id
      WHERE c.is_public = 1
      ORDER BY latest_activity DESC
      LIMIT ?
    `;

    console.log('🔍 최근 활동 강의실 조회 실행');

    db.all(query, [limit], (err: any, rows: any) => {
      if (err) {
        console.error('❌ 최근 활동 강의실 조회 실패:', err);
        reject(err);
      } else {
        console.log(`✅ 최근 활동 강의실 조회 성공: ${rows?.length || 0}개`);
        resolve(rows || []);
      }
    });
  });
};

/**
 * 강의실 검색 (풀텍스트 검색)
 */
export const searchClassrooms = async (
  query: string,
  filters: ClassroomFilters = {}
): Promise<{
  classrooms: ClassroomWithStats[];
  total: number;
  hasMore: boolean;
}> => {
  return new Promise((resolve, reject) => {
    const {
      teacherId,
      isPublic,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // WHERE 조건 구성
    const whereConditions: string[] = [
      '(c.title LIKE ? OR c.description LIKE ? OR c.teacher_name LIKE ?)'
    ];
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (teacherId) {
      whereConditions.push('c.teacher_id = ?');
      params.push(teacherId);
    }

    if (isPublic !== undefined) {
      whereConditions.push('c.is_public = ?');
      params.push(isPublic ? 1 : 0);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM classrooms c
      ${whereClause}
    `;

    // 메인 쿼리
    const mainQuery = `
      SELECT 
        c.*,
        COALESCE(t.thread_count, 0) as thread_count,
        COALESCE(m.material_count, 0) as material_count
      FROM classrooms c
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as thread_count
        FROM threads
        GROUP BY classroom_id
      ) t ON c.id = t.classroom_id
      LEFT JOIN (
        SELECT classroom_id, COUNT(*) as material_count
        FROM materials
        GROUP BY classroom_id
      ) m ON c.id = m.classroom_id
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    console.log('🔍 강의실 검색 실행:', query);

    db.serialize(() => {
      // 전체 개수 조회
      db.get(countQuery, params, (err: any, countRow: any) => {
        if (err) {
          console.error('❌ 강의실 검색 개수 조회 실패:', err);
          reject(err);
          return;
        }

        const total = countRow.total;

        // 메인 데이터 조회
        const mainParams = [...params, limit, offset];
        db.all(mainQuery, mainParams, (err: any, rows: any) => {
          if (err) {
            console.error('❌ 강의실 검색 실패:', err);
            reject(err);
          } else {
            console.log(`✅ 강의실 검색 성공: ${rows?.length || 0}개`);
            resolve({
              classrooms: rows || [],
              total,
              hasMore: offset + limit < total
            });
          }
        });
      });
    });
  });
}; 