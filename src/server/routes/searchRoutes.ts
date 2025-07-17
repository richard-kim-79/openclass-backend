import express from 'express';
import { 
  searchAll, 
  searchClassrooms, 
  searchMaterials, 
  searchThreads 
} from '../controllers/searchController';

const router = express.Router();

// 통합 검색
router.get('/', searchAll);

// 강의실 검색
router.get('/classrooms', searchClassrooms);

// 자료 검색
router.get('/materials', searchMaterials);

// 스레드 검색
router.get('/threads', searchThreads);

export default router; 