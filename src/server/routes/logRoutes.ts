import express from 'express';
import { getLogStats, clearOldLogs, getLogFile } from '../controllers/logController';

const router = express.Router();

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: 로그 정보 조회
 *     description: 로그 시스템의 기본 정보를 조회합니다.
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: 로그 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: string
 *                     clear:
 *                       type: string
 *                     file:
 *                       type: string
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '로그 시스템이 정상적으로 작동 중입니다.',
    endpoints: {
      stats: '/api/logs/stats',
      clear: '/api/logs/clear',
      file: '/api/logs/file'
    }
  });
});

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: 로그 통계 조회
 *     description: 애플리케이션의 로그 통계를 조회합니다.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalLogs:
 *                       type: number
 *                     errorCount:
 *                       type: number
 *                     warningCount:
 *                       type: number
 *                     infoCount:
 *                       type: number
 *                     averageResponseTime:
 *                       type: number
 *                     topEndpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint:
 *                             type: string
 *                           count:
 *                             type: number
 *                     topErrors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           error:
 *                             type: string
 *                           count:
 *                             type: number
 *                     hourlyDistribution:
 *                       type: object
 *       500:
 *         description: 서버 오류
 */
router.get('/stats', getLogStats);

/**
 * @swagger
 * /api/logs/clear:
 *   post:
 *     summary: 오래된 로그 정리
 *     description: 지정된 일수 이전의 로그를 정리합니다.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: 보관할 로그 일수
 *     responses:
 *       200:
 *         description: 로그 정리 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/clear', clearOldLogs);

/**
 * @swagger
 * /api/logs/file:
 *   get:
 *     summary: 로그 파일 조회
 *     description: 특정 타입의 로그 파일 내용을 조회합니다.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [application, error, access]
 *           default: application
 *         description: 로그 파일 타입
 *     responses:
 *       200:
 *         description: 로그 파일 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     totalLines:
 *                       type: number
 *                     recentLines:
 *                       type: array
 *                       items:
 *                         type: string
 *                     fileSize:
 *                       type: number
 *       404:
 *         description: 로그 파일을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/file', getLogFile);

export default router; 