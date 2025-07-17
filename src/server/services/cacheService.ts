import { Database } from 'sqlite3';

interface CacheItem {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private db: Database;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분
  private readonly MAX_CACHE_SIZE = 1000; // 최대 캐시 아이템 수

  constructor(db: Database) {
    this.db = db;
    this.initCacheTable();
    this.startCleanupInterval();
  }

  private async initCacheTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cache_store (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 캐시에 데이터 저장
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const timestamp = Date.now();
    const cacheItem: CacheItem = {
      key,
      value,
      timestamp,
      ttl
    };

    // 메모리 캐시에 저장
    this.cache.set(key, cacheItem);

    // 데이터베이스에 저장
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO cache_store (key, value, timestamp, ttl) VALUES (?, ?, ?, ?)',
        [key, JSON.stringify(value), timestamp, ttl],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * 캐시에서 데이터 조회
   */
  async get(key: string): Promise<any | null> {
    // 메모리 캐시에서 먼저 확인
    const memoryItem = this.cache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.value;
    }

    // 데이터베이스에서 확인
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM cache_store WHERE key = ?',
        [key],
        (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          const cacheItem: CacheItem = {
            key: row.key,
            value: JSON.parse(row.value),
            timestamp: row.timestamp,
            ttl: row.ttl
          };

          if (this.isExpired(cacheItem)) {
            this.delete(key);
            resolve(null);
            return;
          }

          // 메모리 캐시에 저장
          this.cache.set(key, cacheItem);
          resolve(cacheItem.value);
        }
      );
    });
  }

  /**
   * 캐시에서 데이터 삭제
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cache_store WHERE key = ?', [key], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 캐시 전체 삭제
   */
  async clear(): Promise<void> {
    this.cache.clear();

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM cache_store', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * 캐시 아이템 만료 여부 확인
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  /**
   * 만료된 캐시 정리
   */
  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // 메모리 캐시 정리
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key);
      }
    }

    // 만료된 아이템 삭제
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    // 데이터베이스에서 만료된 아이템 삭제
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM cache_store WHERE timestamp + ttl < ?',
        [now],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * 캐시 크기 제한 확인
   */
  private enforceCacheSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      for (const [key] of toDelete) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 정기적인 캐시 정리 시작
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
      this.enforceCacheSize();
    }, 60 * 1000); // 1분마다 실행
  }

  /**
   * 캐시 통계 정보
   */
  async getStats(): Promise<{
    memorySize: number;
    dbSize: number;
    hitRate: number;
  }> {
    const memorySize = this.cache.size;
    
    const dbSize = await new Promise<number>((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM cache_store', (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    return {
      memorySize,
      dbSize,
      hitRate: 0 // TODO: 히트율 계산 로직 추가
    };
  }

  /**
   * 패턴 기반 캐시 삭제
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );

    for (const key of keys) {
      await this.delete(key);
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM cache_store WHERE key LIKE ?',
        [`%${pattern}%`],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

// 캐시 키 생성 헬퍼 함수들
export const cacheKeys = {
  // 강의실 관련
  classroom: (id: string) => `classroom:${id}`,
  classroomList: (filters: any) => `classrooms:${JSON.stringify(filters)}`,
  classroomThreads: (classroomId: string) => `classroom:${classroomId}:threads`,
  
  // 스레드 관련
  thread: (id: string) => `thread:${id}`,
  threadList: (classroomId: string) => `threads:${classroomId}`,
  
  // 자료 관련
  material: (id: string) => `material:${id}`,
  materialList: (classroomId: string) => `materials:${classroomId}`,
  
  // 사용자 관련
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  
  // 검색 관련
  search: (query: string, filters: any) => `search:${query}:${JSON.stringify(filters)}`,
  searchPopular: () => 'search:popular',
  searchSuggestions: (query: string) => `search:suggestions:${query}`,
  
  // 알림 관련
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:${userId}:count`,
  
  // 채팅 관련
  chatMessages: (classroomId: string) => `chat:${classroomId}:messages`,
  
  // 통계 관련
  stats: (type: string) => `stats:${type}`,
  dashboard: (userId: string) => `dashboard:${userId}`
}; 