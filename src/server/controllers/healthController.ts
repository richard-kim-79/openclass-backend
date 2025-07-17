import { Request, Response } from 'express';
import db from '../config/database';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // 데이터베이스 연결 확인
    const dbCheck = new Promise((resolve, reject) => {
      db.get('SELECT 1 as test', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    await dbCheck;

    // 메모리 사용량 확인
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0-beta.1'
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('헬스체크 실패:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '서비스가 정상적으로 동작하지 않습니다.'
    });
  }
};

export const detailedHealthCheck = async (req: Request, res: Response) => {
  try {
    const checks = {
      database: false,
      memory: true,
      disk: true
    };

    // 데이터베이스 연결 확인
    try {
      await new Promise((resolve, reject) => {
        db.get('SELECT 1 as test', (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
      checks.database = true;
    } catch (error) {
      console.error('데이터베이스 연결 실패:', error);
    }

    // 메모리 사용량 확인
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // 메모리 사용량이 너무 높으면 경고
    if (memUsageMB.heapUsed > 500) { // 500MB 이상
      checks.memory = false;
    }

    const allHealthy = Object.values(checks).every(check => check);

    const detailedStatus = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      memory: memUsageMB,
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0-beta.1'
    };

    res.status(allHealthy ? 200 : 503).json(detailedStatus);
  } catch (error) {
    console.error('상세 헬스체크 실패:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '서비스가 정상적으로 동작하지 않습니다.'
    });
  }
}; 