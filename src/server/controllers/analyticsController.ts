import { Request, Response, NextFunction } from 'express';
import { 
  getAnalytics, 
  getSystemStats, 
  getUserStats, 
  getClassroomStats, 
  getPopularContent,
  getGrowthTrend 
} from '../services/analyticsService';

export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string || req.user?.id;
    const analytics = await getAnalytics(userId);
    return res.json({ success: true, data: analytics });
  } catch (err) {
    return next(err);
  }
};

export const getSystemStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getSystemStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    return next(err);
  }
};

export const getUserStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다' });
    }
    
    const userStats = await getUserStats(userId);
    return res.json({ success: true, data: userStats });
  } catch (err) {
    return next(err);
  }
};

export const getClassroomStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classroomId = req.params.classroomId;
    const stats = await getClassroomStats(classroomId);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return next(err);
  }
};

export const getPopularContentData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popularContent = await getPopularContent(limit);
    return res.json({ success: true, data: popularContent });
  } catch (err) {
    return next(err);
  }
};

export const getGrowthTrendData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const growthTrend = await getGrowthTrend(days);
    return res.json({ success: true, data: growthTrend });
  } catch (err) {
    return next(err);
  }
}; 