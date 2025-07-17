import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  userId?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
  endpoint?: string | undefined;
  method?: string | undefined;
  statusCode?: number | undefined;
  responseTime?: number | undefined;
  error?: any | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface LogStats {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  averageResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topErrors: Array<{ error: string; count: number }>;
  hourlyDistribution: Record<string, number>;
}

export class LoggingService {
  private logDir: string;
  private logFile: string;
  private errorLogFile: string;
  private accessLogFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'application.log');
    this.errorLogFile = path.join(this.logDir, 'error.log');
    this.accessLogFile = path.join(this.logDir, 'access.log');
    
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    const metadata = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : '';
    const user = entry.userId ? ` | User: ${entry.userId}` : '';
    const ip = entry.ip ? ` | IP: ${entry.ip}` : '';
    const endpoint = entry.endpoint ? ` | Endpoint: ${entry.method} ${entry.endpoint}` : '';
    const status = entry.statusCode ? ` | Status: ${entry.statusCode}` : '';
    const responseTime = entry.responseTime ? ` | ResponseTime: ${entry.responseTime}ms` : '';
    const error = entry.error ? ` | Error: ${JSON.stringify(entry.error)}` : '';

    return `${base}${metadata}${user}${ip}${endpoint}${status}${responseTime}${error}\n`;
  }

  private writeLog(entry: LogEntry, filePath: string): void {
    try {
      const logEntry = this.formatLogEntry(entry);
      fs.appendFileSync(filePath, logEntry);
      
      // 로그 파일 크기 체크 및 로테이션
      this.rotateLogFile(filePath);
    } catch (error) {
      console.error('로그 작성 실패:', error);
    }
  }

  private rotateLogFile(filePath: string): void {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxLogSize) {
        // 기존 로그 파일들을 백업
        for (let i = this.maxLogFiles - 1; i > 0; i--) {
          const oldFile = `${filePath}.${i}`;
          const newFile = `${filePath}.${i + 1}`;
          if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, newFile);
          }
        }
        
        // 현재 로그 파일을 .1로 백업
        fs.renameSync(filePath, `${filePath}.1`);
        
        // 새로운 로그 파일 생성
        fs.writeFileSync(filePath, '');
      }
    } catch (error) {
      console.error('로그 파일 로테이션 실패:', error);
    }
  }

  public info(message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      metadata
    };
    this.writeLog(entry, this.logFile);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      metadata
    };
    this.writeLog(entry, this.logFile);
    this.writeLog(entry, this.errorLogFile);
  }

  public error(message: string, error?: any, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error,
      metadata
    };
    this.writeLog(entry, this.logFile);
    this.writeLog(entry, this.errorLogFile);
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        metadata
      };
      this.writeLog(entry, this.logFile);
    }
  }

  public logRequest(req: Request, res: Response, responseTime: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'HTTP Request',
      userId: (req as any).user?.id,
      ip: req.ip || req.connection.remoteAddress || undefined,
      userAgent: req.get('User-Agent') || undefined,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      metadata: {
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      }
    };
    this.writeLog(entry, this.accessLogFile);
  }

  public logError(error: Error, req?: Request): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      error: {
        name: error.name,
        stack: error.stack,
        message: error.message
      },
      userId: req ? (req as any).user?.id : undefined,
      ip: req ? (req.ip || req.connection.remoteAddress) : undefined,
      endpoint: req ? req.path : undefined,
      method: req ? req.method : undefined
    };
    this.writeLog(entry, this.errorLogFile);
  }

  public getLogStats(): LogStats {
    const stats: LogStats = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      averageResponseTime: 0,
      topEndpoints: [],
      topErrors: [],
      hourlyDistribution: {}
    };

    try {
      // 액세스 로그 분석
      if (fs.existsSync(this.accessLogFile)) {
        const accessLogs = fs.readFileSync(this.accessLogFile, 'utf8').split('\n').filter(line => line.trim());
        
        const endpointCounts: Record<string, number> = {};
        const responseTimes: number[] = [];
        const hourlyCounts: Record<string, number> = {};

        accessLogs.forEach(line => {
          const match = line.match(/\[(.*?)\]/);
          if (match && match[1]) {
            const timestamp = new Date(match[1]);
            const hour = timestamp.getHours().toString().padStart(2, '0');
            hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
          }

          // 엔드포인트 추출
          const endpointMatch = line.match(/Endpoint: (\w+) (\/[^\s|]+)/);
          if (endpointMatch && endpointMatch[1] && endpointMatch[2]) {
            const endpoint = `${endpointMatch[1]} ${endpointMatch[2]}`;
            endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
          }

          // 응답 시간 추출
          const responseTimeMatch = line.match(/ResponseTime: (\d+)ms/);
          if (responseTimeMatch && responseTimeMatch[1]) {
            responseTimes.push(parseInt(responseTimeMatch[1]));
          }
        });

        stats.topEndpoints = Object.entries(endpointCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([endpoint, count]) => ({ endpoint, count }));

        stats.averageResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;

        stats.hourlyDistribution = hourlyCounts;
      }

      // 에러 로그 분석
      if (fs.existsSync(this.errorLogFile)) {
        const errorLogs = fs.readFileSync(this.errorLogFile, 'utf8').split('\n').filter(line => line.trim());
        
        const errorCounts: Record<string, number> = {};

        errorLogs.forEach(line => {
          const errorMatch = line.match(/Error: (.*?)(?:\s|$)/);
          if (errorMatch && errorMatch[1]) {
            const error = errorMatch[1];
            errorCounts[error] = (errorCounts[error] || 0) + 1;
          }
        });

        stats.topErrors = Object.entries(errorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([error, count]) => ({ error, count }));
      }

      // 전체 로그 수 계산
      const allLogs = fs.readFileSync(this.logFile, 'utf8').split('\n').filter(line => line.trim());
      stats.totalLogs = allLogs.length;

      allLogs.forEach(line => {
        if (line.includes('[ERROR]')) stats.errorCount++;
        else if (line.includes('[WARN]')) stats.warningCount++;
        else if (line.includes('[INFO]')) stats.infoCount++;
      });

    } catch (error) {
      console.error('로그 통계 생성 실패:', error);
    }

    return stats;
  }

  public clearOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`오래된 로그 파일 삭제: ${file}`);
        }
      });
    } catch (error) {
      console.error('오래된 로그 정리 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const loggingService = new LoggingService(); 