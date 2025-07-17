import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Permission } from '../types/permission';

// 임시 권한 확인 함수
const hasPermission = async (userId: string, classroomId: string, permission: Permission): Promise<boolean> => {
  // 실제 구현에서는 DB에서 사용자 권한을 확인
  // 현재는 임시로 true 반환
  return true;
};

// JWT 토큰 인증 미들웨어
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: '액세스 토큰이 필요합니다' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: '사용자',
      avatar_url: null,
      provider: 'local',
      provider_id: decoded.userId,
      is_active: 1,
      is_verified: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return next();
  } catch (error) {
    return res.status(403).json({ success: false, error: '유효하지 않은 토큰입니다' });
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: '인증이 필요합니다' });
  }
  return next();
};

export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: '인증이 필요합니다' });
      }

      const classroomId = req.params.classroomId || req.body.classroomId;
      if (!classroomId) {
        return res.status(400).json({ success: false, error: '강의실 ID가 필요합니다' });
      }

      const hasAccess = await hasPermission(req.user.id, classroomId, permission);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: '권한이 없습니다' });
      }

      return next();
    } catch (error) {
      console.error('권한 확인 오류:', error);
      return res.status(500).json({ success: false, error: '권한 확인 중 오류가 발생했습니다' });
    }
  };
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '인증이 필요합니다' });
    }

    // 실제 구현에서는 사용자 역할 확인 로직 필요
    // 현재는 임시로 통과
    return next();
  };
}; 