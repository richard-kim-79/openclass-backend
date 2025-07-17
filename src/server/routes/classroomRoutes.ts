import express from 'express';
import { 
  getClassroomList, 
  createClassroom, 
  getClassroom, 
  updateClassroom, 
  deleteClassroom, 
  getMyClassrooms 
} from '../controllers/classroomController';
import { authenticateToken } from '../middleware/auth';
import { cacheOptions } from '../middleware/cacheMiddleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Classroom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 강의실 고유 ID
 *         name:
 *           type: string
 *           description: 강의실 이름
 *         description:
 *           type: string
 *           description: 강의실 설명
 *         teacher_id:
 *           type: string
 *           description: 강사 ID
 *         max_students:
 *           type: integer
 *           description: 최대 학생 수
 *         is_active:
 *           type: boolean
 *           description: 활성화 상태
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 */

/**
 * @swagger
 * /api/classrooms:
 *   get:
 *     summary: 강의실 목록 조회
 *     description: 시스템에 등록된 모든 강의실 목록을 조회합니다.
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 강의실 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 classrooms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classroom'
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
// 강의실 목록 조회 (공개 강의실)
router.get('/', getClassroomList);

// 내 강의실 목록 조회 (인증 필요)
router.get('/my', authenticateToken, getMyClassrooms);

// 강의실 생성 (인증 필요)
router.post('/', authenticateToken, createClassroom);

// 강의실 상세 조회
router.get('/:id', getClassroom);

// 강의실 수정 (인증 필요)
router.put('/:id', authenticateToken, updateClassroom);

// 강의실 삭제 (인증 필요)
router.delete('/:id', authenticateToken, deleteClassroom);

export default router; 