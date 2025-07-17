import { Request, Response, NextFunction } from 'express';
import { loggingService } from '../services/loggingService';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 응답 완료 후 로깅
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    loggingService.logRequest(req, res, responseTime);
  });

  // 에러 발생 시 로깅
  res.on('error', (error) => {
    loggingService.logError(error as Error, req);
  });

  next();
};

export const errorLoggingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  loggingService.logError(error, req);
  next(error);
}; 