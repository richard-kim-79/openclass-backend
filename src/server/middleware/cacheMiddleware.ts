import { Request, Response, NextFunction } from 'express';
import { CacheService, cacheKeys } from '../services/cacheService';

interface CacheOptions {
  ttl?: number; // 캐시 유지 시간 (밀리초)
  key?: string; // 커스텀 캐시 키
  condition?: (req: Request) => boolean; // 캐싱 조건
}

export class CacheMiddleware {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * GET 요청에 대한 캐싱 미들웨어
   */
  cache(options: CacheOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // GET 요청만 캐싱
      if (req.method !== 'GET') {
        return next();
      }

      // 캐싱 조건 확인
      if (options.condition && !options.condition(req)) {
        return next();
      }

      // 캐시 키 생성
      const cacheKey = options.key || this.generateCacheKey(req);
      
      try {
        // 캐시에서 데이터 조회
        const cachedData = await this.cacheService.get(cacheKey);
        
        if (cachedData) {
          return res.json({
            success: true,
            data: cachedData,
            cached: true
          });
        }

        // 원본 응답 메서드 저장
        const originalSend = res.json;
        
        // 응답을 가로채서 캐시에 저장
        res.json = function(this: any, data: any) {
          if (data.success && data.data) {
            this.cacheService.set(cacheKey, data.data, options.ttl);
          }
          return originalSend.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        console.error('캐시 미들웨어 오류:', error);
        next();
      }
    };
  }

  /**
   * 캐시 무효화 미들웨어
   */
  invalidateCache(patterns: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // POST, PUT, DELETE 요청 시 관련 캐시 무효화
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
          for (const pattern of patterns) {
            await this.cacheService.deletePattern(pattern);
          }
        }
        next();
      } catch (error) {
        console.error('캐시 무효화 오류:', error);
        next();
      }
    };
  }

  /**
   * 강의실 관련 캐시 무효화
   */
  invalidateClassroomCache() {
    return this.invalidateCache(['classroom:', 'classrooms:', 'threads:', 'materials:']);
  }

  /**
   * 사용자 관련 캐시 무효화
   */
  invalidateUserCache() {
    return this.invalidateCache(['user:', 'notifications:', 'dashboard:']);
  }

  /**
   * 검색 관련 캐시 무효화
   */
  invalidateSearchCache() {
    return this.invalidateCache(['search:', 'stats:']);
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    const params = JSON.stringify(req.params);
    
    return `api:${req.method}:${url}:${query}:${params}`;
  }

  /**
   * 캐시 통계 엔드포인트
   */
  getCacheStats() {
    return async (req: Request, res: Response) => {
      try {
        const stats = await this.cacheService.getStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '캐시 통계 조회 실패'
        });
      }
    };
  }

  /**
   * 캐시 전체 삭제 엔드포인트
   */
  clearCache() {
    return async (req: Request, res: Response) => {
      try {
        await this.cacheService.clear();
        res.json({
          success: true,
          message: '캐시가 성공적으로 삭제되었습니다.'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: '캐시 삭제 실패'
        });
      }
    };
  }
}

// 캐싱 옵션 프리셋
export const cacheOptions = {
  // 강의실 목록 캐싱 (1분)
  classroomList: { ttl: 60 * 1000 },
  
  // 강의실 상세 캐싱 (5분)
  classroomDetail: { ttl: 5 * 60 * 1000 },
  
  // 스레드 목록 캐싱 (30초)
  threadList: { ttl: 30 * 1000 },
  
  // 자료 목록 캐싱 (2분)
  materialList: { ttl: 2 * 60 * 1000 },
  
  // 사용자 프로필 캐싱 (10분)
  userProfile: { ttl: 10 * 60 * 1000 },
  
  // 검색 결과 캐싱 (1분)
  searchResults: { ttl: 60 * 1000 },
  
  // 인기 검색어 캐싱 (30분)
  popularSearches: { ttl: 30 * 60 * 1000 },
  
  // 통계 데이터 캐싱 (5분)
  statistics: { ttl: 5 * 60 * 1000 }
}; 