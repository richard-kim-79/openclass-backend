import db from '../config/database';
import { 
  SystemStats, 
  UserActivity, 
  ClassroomStats, 
  PopularContent, 
  GrowthTrend,
  UserStats,
  AnalyticsResponse 
} from '../types/analytics';

// 시스템 전체 통계
export const getSystemStats = (): Promise<SystemStats> => {
  return new Promise((resolve, reject) => {
    const stats: SystemStats = {
      total_users: 0,
      total_classrooms: 0,
      total_threads: 0,
      total_materials: 0,
      total_downloads: 0,
      active_users_today: 0,
      active_users_week: 0,
      active_users_month: 0
    };

    // 전체 사용자 수
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      stats.total_users = (row as any).count;

      // 전체 강의실 수
      db.get('SELECT COUNT(*) as count FROM classrooms', (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        stats.total_classrooms = (row as any).count;

        // 전체 스레드 수
        db.get('SELECT COUNT(*) as count FROM threads', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          stats.total_threads = (row as any).count;

          // 전체 자료 수
          db.get('SELECT COUNT(*) as count FROM materials', (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            stats.total_materials = (row as any).count;

            // 전체 다운로드 수
            db.get('SELECT SUM(download_count) as total FROM materials', (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              stats.total_downloads = (row as any).total || 0;

              // 활성 사용자 수 (최근 24시간)
              const today = new Date();
              today.setDate(today.getDate() - 1);
              db.get(
                'SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE created_at >= ?',
                [today.toISOString()],
                (err, row) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  stats.active_users_today = (row as any).count || 0;

                  // 활성 사용자 수 (최근 7일)
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  db.get(
                    'SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE created_at >= ?',
                    [weekAgo.toISOString()],
                    (err, row) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      stats.active_users_week = (row as any).count || 0;

                      // 활성 사용자 수 (최근 30일)
                      const monthAgo = new Date();
                      monthAgo.setDate(monthAgo.getDate() - 30);
                      db.get(
                        'SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE created_at >= ?',
                        [monthAgo.toISOString()],
                        (err, row) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          stats.active_users_month = (row as any).count || 0;
                          resolve(stats);
                        }
                      );
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  });
};

// 사용자 활동 통계
export const getUserActivity = (userId: string): Promise<UserActivity> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        user_id,
        login_count,
        total_time,
        thread_count,
        reply_count,
        material_upload_count,
        material_download_count,
        created_at
       FROM user_activity
       WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as UserActivity);
        }
      }
    );
  });
};

// 강의실 통계
export const getClassroomStats = (classroomId?: string): Promise<ClassroomStats[]> => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        c.id as classroom_id,
        c.name as classroom_name,
        c.created_at,
        COUNT(DISTINCT up.user_id) as member_count,
        COUNT(DISTINCT t.id) as thread_count,
        COUNT(DISTINCT m.id) as material_count,
        SUM(m.download_count) as total_downloads,
        MAX(GREATEST(t.created_at, m.created_at)) as last_activity
      FROM classrooms c
      LEFT JOIN user_permissions up ON c.id = up.classroom_id
      LEFT JOIN threads t ON c.id = t.classroom_id
      LEFT JOIN materials m ON c.id = m.classroom_id
    `;

    const params: any[] = [];
    if (classroomId) {
      sql += ' WHERE c.id = ?';
      params.push(classroomId);
    }

    sql += ' GROUP BY c.id ORDER BY last_activity DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const stats: ClassroomStats[] = rows.map((row: any) => ({
          classroom_id: row.classroom_id,
          classroom_name: row.classroom_name,
          member_count: row.member_count || 0,
          thread_count: row.thread_count || 0,
          material_count: row.material_count || 0,
          total_downloads: row.total_downloads || 0,
          active_days: 0, // 계산 필요
          created_at: row.created_at,
          last_activity: row.last_activity
        }));
        resolve(stats);
      }
    });
  });
};

// 인기 콘텐츠 조회
export const getPopularContent = (limit: number = 10): Promise<PopularContent[]> => {
  return new Promise((resolve, reject) => {
    // 인기 스레드
    db.all(
      `SELECT 
        t.id,
        'thread' as type,
        t.title,
        c.name as classroom_name,
        t.author_name,
        0 as view_count,
        t.created_at
       FROM threads t
       JOIN classrooms c ON t.classroom_id = c.id
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [limit],
      (err, threadRows) => {
        if (err) {
          reject(err);
          return;
        }

        // 인기 자료
        db.all(
          `SELECT 
            m.id,
            'material' as type,
            m.title,
            c.name as classroom_name,
            m.author_name,
            m.download_count as view_count,
            m.created_at
           FROM materials m
           JOIN classrooms c ON m.classroom_id = c.id
           ORDER BY m.download_count DESC, m.created_at DESC
           LIMIT ?`,
          [limit],
          (err, materialRows) => {
            if (err) {
              reject(err);
              return;
            }

            const popularContent: PopularContent[] = [
              ...threadRows.map((row: any) => ({
                id: row.id,
                type: row.type,
                title: row.title,
                classroom_name: row.classroom_name,
                author_name: row.author_name,
                view_count: row.view_count,
                created_at: row.created_at
              })),
              ...materialRows.map((row: any) => ({
                id: row.id,
                type: row.type,
                title: row.title,
                classroom_name: row.classroom_name,
                author_name: row.author_name,
                view_count: row.view_count,
                download_count: row.view_count,
                created_at: row.created_at
              }))
            ];

            // 인기도 순으로 정렬
            popularContent.sort((a, b) => b.view_count - a.view_count);
            resolve(popularContent.slice(0, limit));
          }
        );
      }
    );
  });
};

// 성장 추이 조회
export const getGrowthTrend = (days: number = 30): Promise<GrowthTrend[]> => {
  return new Promise((resolve, reject) => {
    const trends: GrowthTrend[] = [];
    const today = new Date();

    // 최근 N일간의 데이터 생성
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';

      trends.push({
        date: dateStr,
        new_users: 0,
        new_classrooms: 0,
        new_threads: 0,
        new_materials: 0,
        total_activity: 0
      });
    }

    // 실제 데이터로 업데이트
    db.all(
      `SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'user' THEN 1 END) as new_users,
        COUNT(CASE WHEN type = 'classroom' THEN 1 END) as new_classrooms,
        COUNT(CASE WHEN type = 'thread' THEN 1 END) as new_threads,
        COUNT(CASE WHEN type = 'material' THEN 1 END) as new_materials
       FROM activity_log
       WHERE created_at >= DATE('now', '-${days} days')
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // 실제 데이터로 트렌드 업데이트
        rows.forEach((row: any) => {
          const trend = trends.find(t => t.date === row.date);
          if (trend) {
            trend.new_users = row.new_users || 0;
            trend.new_classrooms = row.new_classrooms || 0;
            trend.new_threads = row.new_threads || 0;
            trend.new_materials = row.new_materials || 0;
            trend.total_activity = (row.new_users || 0) + (row.new_classrooms || 0) + 
                                 (row.new_threads || 0) + (row.new_materials || 0);
          }
        });

        resolve(trends);
      }
    );
  });
};

// 사용자별 통계
export const getUserStats = (userId: string): Promise<UserStats> => {
  return new Promise((resolve, reject) => {
    // 사용자 기본 정보
    db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId],
      async (err, user: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!user) {
          reject(new Error('사용자를 찾을 수 없습니다'));
          return;
        }

        try {
          const activity = await getUserActivity(userId);
          const popularContent = await getPopularContent(5);
          const classroomStats = await getClassroomStats();

          const userStats: UserStats = {
            user_id: (user as any).id,
            user_name: (user as any).name,
            email: (user as any).email,
            join_date: (user as any).created_at,
            activity_stats: activity,
            classroom_participation: classroomStats,
            popular_content: popularContent
          };

          resolve(userStats);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// 통합 분석 데이터
export const getAnalytics = (userId?: string): Promise<AnalyticsResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      const systemStats = await getSystemStats();
      const popularContent = await getPopularContent(10);
      const growthTrend = await getGrowthTrend(30);
      const classroomStats = await getClassroomStats();

      const analytics: AnalyticsResponse = {
        system_stats: systemStats,
        classroom_stats: classroomStats,
        popular_content: popularContent,
        growth_trend: growthTrend,
        recent_activity: []
      };

      // 사용자별 통계 (사용자 ID가 제공된 경우)
      if (userId) {
        try {
          const userStats = await getUserStats(userId);
          analytics.user_stats = userStats;
        } catch (error) {
          console.error('사용자 통계 조회 실패:', error);
        }
      }

      resolve(analytics);
    } catch (error) {
      reject(error);
    }
  });
}; 