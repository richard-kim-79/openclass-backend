import { Request, Response } from 'express';
import {
  getOptimizedClassroomList as getOptimizedClassroomListService,
  getOptimizedClassroomById,
  getClassroomStats,
  getPopularClassrooms,
  getRecentActiveClassrooms,
  searchClassrooms
} from '../services/optimizedClassroomService';
import { CacheService, cacheKeys } from '../services/cacheService';

/**
 * 최적화된 강의실 목록 조회 (페이지네이션, 필터링, 캐싱)
 */
export const getOptimizedClassroomList = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      teacherId,
      isPublic,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const filters = {
      teacherId: teacherId as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      search: search as string,
      limit: Number(limit),
      offset,
      sortBy: sortBy as 'created_at' | 'title' | 'student_count',
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await getOptimizedClassroomListService(filters);

    return res.json({
      success: true,
      data: result.classrooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(limit)),
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('최적화된 강의실 목록 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: '강의실 목록 조회에 실패했습니다.'
    });
  }
};

/**
 * 최적화된 강의실 상세 조회 (통계 포함)
 */
export const getOptimizedClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '강의실 ID가 필요합니다.'
      });
    }

    const classroom = await getOptimizedClassroomById(id);

    return res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    console.error('최적화된 강의실 상세 조회 실패:', error);
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({
        success: false,
        error: '강의실을 찾을 수 없습니다.'
      });
    }
    return res.status(500).json({
      success: false,
      error: '강의실 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 강의실 통계 조회
 */
export const getClassroomStatsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '강의실 ID가 필요합니다.'
      });
    }

    const stats = await getClassroomStats(id);

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('강의실 통계 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: '강의실 통계 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 인기 강의실 조회
 */
export const getPopularClassroomsController = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const classrooms = await getPopularClassrooms(Number(limit));

    return res.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error('인기 강의실 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: '인기 강의실 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 최근 활동 강의실 조회
 */
export const getRecentActiveClassroomsController = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const classrooms = await getRecentActiveClassrooms(Number(limit));

    return res.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error('최근 활동 강의실 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: '최근 활동 강의실 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 강의실 검색
 */
export const searchClassroomsController = async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 20, teacherId, isPublic, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다.'
      });
    }

    const offset = (Number(page) - 1) * Number(limit);
    
    const filters = {
      teacherId: teacherId as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      limit: Number(limit),
      offset,
      sortBy: sortBy as 'created_at' | 'title' | 'student_count',
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await searchClassrooms(q as string, filters);

    return res.json({
      success: true,
      data: result.classrooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(limit)),
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('강의실 검색 실패:', error);
    return res.status(500).json({
      success: false,
      error: '강의실 검색 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 대시보드 데이터 조회 (홈페이지용)
 */
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // 병렬로 여러 데이터 조회
    const [popularClassrooms, recentActiveClassrooms] = await Promise.all([
      getPopularClassrooms(6),
      getRecentActiveClassrooms(6)
    ]);

    return res.json({
      success: true,
      data: {
        popularClassrooms,
        recentActiveClassrooms
      }
    });
  } catch (error) {
    console.error('대시보드 데이터 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: '대시보드 데이터 조회 중 오류가 발생했습니다.'
    });
  }
}; 