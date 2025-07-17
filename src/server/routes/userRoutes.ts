import express from 'express';
import { 
  getUserList, 
  register, 
  login, 
  getProfile, 
  updateProfile 
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 사용자 고유 ID
 *         username:
 *           type: string
 *           description: 사용자명
 *         email:
 *           type: string
 *           description: 이메일 주소
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *           description: 사용자 역할
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 사용자 목록 조회
 *     description: 시스템에 등록된 모든 사용자 목록을 조회합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.get('/', getUserList);

// 사용자 목록 조회 (관리자만)
router.get('/list', authenticateToken, getUserList);

// 회원가입
router.post('/register', register);

// 로그인
router.post('/login', login);

// 프로필 조회 (인증 필요)
router.get('/profile', authenticateToken, getProfile);

// 프로필 수정 (인증 필요)
router.put('/profile', authenticateToken, updateProfile);

export default router; 