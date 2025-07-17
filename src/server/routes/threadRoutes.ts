import express from 'express';
import { 
  getThreads, 
  createThread, 
  getThread, 
  updateThread, 
  deleteThread 
} from '../controllers/threadController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 스레드 목록 조회
router.get('/classrooms/:classroomId/threads', getThreads);

// 스레드 생성 (인증 필요)
router.post('/classrooms/:classroomId/threads', authenticateToken, createThread);

// 스레드 상세 조회
router.get('/classrooms/:classroomId/threads/:threadId', getThread);

// 스레드 수정 (인증 필요)
router.put('/classrooms/:classroomId/threads/:threadId', authenticateToken, updateThread);

// 스레드 삭제 (인증 필요)
router.delete('/classrooms/:classroomId/threads/:threadId', authenticateToken, deleteThread);

export default router; 