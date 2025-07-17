import { Request, Response, NextFunction } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다' });
    }
    
    const notifications = await getUserNotifications(userId, limit);
    return res.json({ success: true, data: notifications });
  } catch (err) {
    return next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.notificationId;
    
    if (!notificationId) {
      return res.status(400).json({ success: false, error: '알림 ID가 필요합니다' });
    }
    
    await markNotificationAsRead(notificationId);
    return res.json({ success: true, message: '알림을 읽음으로 표시했습니다' });
  } catch (err) {
    return next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다' });
    }
    
    await markAllNotificationsAsRead(userId);
    return res.json({ success: true, message: '모든 알림을 읽음으로 표시했습니다' });
  } catch (err) {
    return next(err);
  }
};

export const deleteNotificationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.notificationId;
    
    if (!notificationId) {
      return res.status(400).json({ success: false, error: '알림 ID가 필요합니다' });
    }
    
    await deleteNotification(notificationId);
    return res.json({ success: true, message: '알림을 삭제했습니다' });
  } catch (err) {
    return next(err);
  }
};

export const getUnreadNotificationCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다' });
    }
    
    const count = await getUnreadCount(userId);
    return res.json({ success: true, data: { count } });
  } catch (err) {
    return next(err);
  }
}; 