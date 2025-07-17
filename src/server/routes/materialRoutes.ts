import express from 'express';
import { 
  getMaterialList, 
  createMaterial, 
  getMaterial, 
  updateMaterial, 
  deleteMaterial, 
  downloadMaterial 
} from '../controllers/materialController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// 자료 목록 조회
router.get('/classrooms/:classroomId/materials', getMaterialList);

// 자료 생성 (업로드) - 인증 필요
router.post('/classrooms/:classroomId/materials', authenticateToken, upload.single('file'), createMaterial);

// 자료 상세 조회
router.get('/classrooms/:classroomId/materials/:materialId', getMaterial);

// 자료 수정 - 인증 필요
router.put('/classrooms/:classroomId/materials/:materialId', authenticateToken, updateMaterial);

// 자료 삭제 - 인증 필요
router.delete('/classrooms/:classroomId/materials/:materialId', authenticateToken, deleteMaterial);

// 자료 다운로드
router.get('/materials/:materialId/download', downloadMaterial);

export default router; 