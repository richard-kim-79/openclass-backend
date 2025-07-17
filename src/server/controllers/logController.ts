import { Request, Response } from 'express';
import { loggingService } from '../services/loggingService';

export const getLogStats = async (req: Request, res: Response) => {
  try {
    const stats = loggingService.getLogStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '로그 통계 조회 실패'
    });
  }
};

export const clearOldLogs = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysToKeep = parseInt(days as string) || 30;
    
    loggingService.clearOldLogs(daysToKeep);
    
    res.status(200).json({
      success: true,
      message: `${daysToKeep}일 이전의 로그가 정리되었습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '로그 정리 실패'
    });
  }
};

export const getLogFile = async (req: Request, res: Response) => {
  try {
    const { type = 'application' } = req.query;
    const logType = type as string;
    
    let logFilePath: string;
    
    switch (logType) {
      case 'error':
        logFilePath = './logs/error.log';
        break;
      case 'access':
        logFilePath = './logs/access.log';
        break;
      case 'application':
      default:
        logFilePath = './logs/application.log';
        break;
    }
    
    const fs = require('fs');
    
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).json({
        success: false,
        error: '로그 파일을 찾을 수 없습니다.'
      });
    }
    
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = logContent.split('\n').filter((line: string) => line.trim());
    
    // 최근 1000줄만 반환
    const recentLines = lines.slice(-1000);
    
    return res.status(200).json({
      success: true,
      data: {
        type: logType,
        totalLines: lines.length,
        recentLines: recentLines,
        fileSize: fs.statSync(logFilePath).size
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '로그 파일 조회 실패'
    });
  }
}; 