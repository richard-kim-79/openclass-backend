import express from 'express';
import {
  getAnalyticsData,
  getSystemStatistics,
  getUserStatistics,
  getClassroomStatistics,
  getPopularContentData,
  getGrowthTrendData
} from '../controllers/analyticsController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsData:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: 전체 사용자 수
 *         totalClassrooms:
 *           type: integer
 *           description: 전체 강의실 수
 *         totalThreads:
 *           type: integer
 *           description: 전체 스레드 수
 *         totalMaterials:
 *           type: integer
 *           description: 전체 자료 수
 *         activeUsers:
 *           type: integer
 *           description: 활성 사용자 수
 *         systemStats:
 *           type: object
 *           description: 시스템 통계
 *         userStats:
 *           type: object
 *           description: 사용자 통계
 *         classroomStats:
 *           type: object
 *           description: 강의실 통계
 *     SystemStatistics:
 *       type: object
 *       properties:
 *         cpuUsage:
 *           type: number
 *           description: CPU 사용률
 *         memoryUsage:
 *           type: number
 *           description: 메모리 사용률
 *         diskUsage:
 *           type: number
 *           description: 디스크 사용률
 *         activeConnections:
 *           type: integer
 *           description: 활성 연결 수
 *         uptime:
 *           type: number
 *           description: 서버 가동 시간
 */

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: 통합 분석 데이터 조회
 *     description: 시스템의 전체적인 분석 데이터를 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 분석 데이터 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsData'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/', getAnalyticsData);

/**
 * @swagger
 * /api/analytics/system:
 *   get:
 *     summary: 시스템 통계 조회
 *     description: 서버 시스템의 성능 통계를 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 시스템 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemStatistics'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/system', getSystemStatistics);

/**
 * @swagger
 * /api/analytics/user/{userId}:
 *   get:
 *     summary: 사용자 통계 조회
 *     description: 특정 사용자의 활동 통계를 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 totalPosts:
 *                   type: integer
 *                 totalViews:
 *                   type: integer
 *                 lastActive:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId', getUserStatistics);

/**
 * @swagger
 * /api/analytics/classroom/{classroomId}:
 *   get:
 *     summary: 강의실 통계 조회
 *     description: 특정 강의실의 활동 통계를 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 강의실 ID
 *     responses:
 *       200:
 *         description: 강의실 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classroomId:
 *                   type: string
 *                 totalStudents:
 *                   type: integer
 *                 totalThreads:
 *                   type: integer
 *                 totalMaterials:
 *                   type: integer
 *                 averageEngagement:
 *                   type: number
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 강의실을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/classroom/:classroomId', getClassroomStatistics);

/**
 * @swagger
 * /api/analytics/popular:
 *   get:
 *     summary: 인기 콘텐츠 조회
 *     description: 가장 인기 있는 콘텐츠 목록을 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 인기 콘텐츠 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popularContent:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       views:
 *                         type: integer
 *                       engagement:
 *                         type: number
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/popular', getPopularContentData);

/**
 * @swagger
 * /api/analytics/growth:
 *   get:
 *     summary: 성장 추이 조회
 *     description: 시스템의 성장 추이 데이터를 조회합니다.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성장 추이 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 growthData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       newUsers:
 *                         type: integer
 *                       newClassrooms:
 *                         type: integer
 *                       activeUsers:
 *                         type: integer
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/growth', getGrowthTrendData);

export default router; 