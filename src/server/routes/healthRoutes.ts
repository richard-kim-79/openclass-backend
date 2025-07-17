import express from 'express';
import { healthCheck, detailedHealthCheck } from '../controllers/healthController';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: 기본 헬스체크
 *     description: 애플리케이션의 기본 상태를 확인합니다.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 서비스가 정상 동작 중
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: 서버 가동 시간 (초)
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       description: 메모리 사용량 (MB)
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     external:
 *                       type: number
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 *       503:
 *         description: 서비스가 비정상 상태
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: 상세 헬스체크
 *     description: 애플리케이션의 상세한 상태를 확인합니다.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 모든 서비스가 정상 동작 중
 *       503:
 *         description: 일부 서비스에 문제가 있음
 */
router.get('/detailed', detailedHealthCheck);

export default router; 