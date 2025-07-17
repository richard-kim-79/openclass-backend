import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  getUnreadNotificationCount
} from '../controllers/notificationController';

const router = express.Router();

// 사용자 알림 목록 조회
router.get('/user/:userId', getNotifications);

// 알림 읽음 표시
router.put('/:notificationId/read', markAsRead);

// 모든 알림 읽음 표시
router.put('/user/:userId/read-all', markAllAsRead);

// 알림 삭제
router.delete('/:notificationId', deleteNotificationById);

// 읽지 않은 알림 개수 조회
router.get('/user/:userId/unread-count', getUnreadNotificationCount);

export default router; 