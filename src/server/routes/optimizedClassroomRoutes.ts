import express from 'express';
import {
  getOptimizedClassroomList,
  getOptimizedClassroom,
  getClassroomStatsController,
  getPopularClassroomsController,
  getRecentActiveClassroomsController,
  searchClassroomsController,
  getDashboardData
} from '../controllers/optimizedClassroomController';
import { authenticateToken } from '../middleware/auth';
import { CacheMiddleware, cacheOptions } from '../middleware/cacheMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/optimized/classrooms:
 *   get:
 *     summary: 최적화된 강의실 목록 조회
 *     description: 페이지네이션, 필터링, 통계가 포함된 최적화된 강의실 목록을 조회합니다.
 *     tags: [Optimized Classrooms]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: 강사 ID로 필터링
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: 공개 여부로 필터링
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, title, student_count]
 *           default: created_at
 *         description: 정렬 기준
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *                       student_count:
 *                         type: integer
 *                       thread_count:
 *                         type: integer
 *                       material_count:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */

// 최적화된 강의실 목록 조회 (캐싱 적용)
router.get('/', getOptimizedClassroomList);

// 최적화된 강의실 상세 조회 (캐싱 적용)
router.get('/:id', getOptimizedClassroom);

// 강의실 통계 조회
router.get('/:id/stats', getClassroomStatsController);

// 인기 강의실 조회 (캐싱 적용)
router.get('/popular/list', getPopularClassroomsController);

// 최근 활동 강의실 조회 (캐싱 적용)
router.get('/recent/list', getRecentActiveClassroomsController);

// 강의실 검색 (캐싱 적용)
router.get('/search/list', searchClassroomsController);

// 대시보드 데이터 조회 (캐싱 적용)
router.get('/dashboard/data', getDashboardData);

export default router; 