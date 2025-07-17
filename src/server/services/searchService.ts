import { Database } from 'sqlite3';
import { Request } from 'express';

interface SearchFilters {
  type?: 'classroom' | 'thread' | 'material' | 'user';
  dateRange?: {
    start: Date;
    end: Date;
  } | undefined;
  size?: 'small' | 'medium' | 'large';
  category?: string;
  tags?: string[];
}

interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  filters?: SearchFilters;
}

interface SearchResult {
  id: string;
  type: 'classroom' | 'thread' | 'material' | 'user';
  title: string;
  content?: string;
  author?: string;
  date: Date;
  relevance: number;
  tags?: string[];
  metadata?: any;
}

interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  filters: string;
  resultsCount: number;
  timestamp: Date;
}

export class SearchService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // 통합 검색
  async search(query: string, options: SearchOptions = {}): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc',
      filters = {}
    } = options;

    const offset = (page - 1) * limit;
    const results: SearchResult[] = [];

    try {
      // 강의실 검색
      if (!filters.type || filters.type === 'classroom') {
        const classroomResults = await this.searchClassrooms(query, filters);
        results.push(...classroomResults);
      }

      // 스레드 검색
      if (!filters.type || filters.type === 'thread') {
        const threadResults = await this.searchThreads(query, filters);
        results.push(...threadResults);
      }

      // 자료 검색
      if (!filters.type || filters.type === 'material') {
        const materialResults = await this.searchMaterials(query, filters);
        results.push(...materialResults);
      }

      // 사용자 검색
      if (!filters.type || filters.type === 'user') {
        const userResults = await this.searchUsers(query, filters);
        results.push(...userResults);
      }

      // 결과 정렬
      this.sortResults(results, sortBy, sortOrder);

      // 페이지네이션
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedResults = results.slice(offset, offset + limit);

      return {
        results: paginatedResults,
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('검색 실패:', error);
      throw new Error('검색 중 오류가 발생했습니다.');
    }
  }

  // 강의실 검색
  private async searchClassrooms(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          id, title, description, teacher_name, created_at,
          (CASE 
            WHEN title LIKE ? THEN 100
            WHEN title LIKE ? THEN 80
            WHEN description LIKE ? THEN 60
            WHEN description LIKE ? THEN 40
            ELSE 20
          END) as relevance
        FROM classrooms 
        WHERE (title LIKE ? OR description LIKE ?)
      `;

      const params = [
        query, // 정확한 제목 매치
        `%${query}%`, // 제목에 포함
        `%${query}%`, // 설명에 포함
        `%${query}%`, // 설명에 부분 포함
        `%${query}%`, // 제목 검색
        `%${query}%`  // 설명 검색
      ];

      // 필터 적용
      if (filters.dateRange) {
        sql += ` AND created_at BETWEEN ? AND ?`;
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      sql += ` ORDER BY relevance DESC, created_at DESC`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const results: SearchResult[] = rows.map((row: any) => ({
            id: row.id,
            type: 'classroom' as const,
            title: row.title,
            content: row.description,
            author: row.teacher_name,
            date: new Date(row.created_at),
            relevance: row.relevance,
            metadata: {
              teacherName: row.teacher_name,
              studentCount: row.student_count
            }
          }));
          resolve(results);
        }
      });
    });
  }

  // 스레드 검색
  private async searchThreads(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          t.id, t.title, t.content, t.author_name, t.created_at,
          c.title as classroom_title,
          (CASE 
            WHEN t.title LIKE ? THEN 100
            WHEN t.title LIKE ? THEN 80
            WHEN t.content LIKE ? THEN 60
            WHEN t.content LIKE ? THEN 40
            ELSE 20
          END) as relevance
        FROM threads t
        JOIN classrooms c ON t.classroom_id = c.id
        WHERE (t.title LIKE ? OR t.content LIKE ?)
      `;

      const params = [
        query,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      ];

      if (filters.dateRange) {
        sql += ` AND t.created_at BETWEEN ? AND ?`;
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      sql += ` ORDER BY relevance DESC, t.created_at DESC`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const results: SearchResult[] = rows.map((row: any) => ({
            id: row.id,
            type: 'thread' as const,
            title: row.title,
            content: row.content,
            author: row.author_name,
            date: new Date(row.created_at),
            relevance: row.relevance,
            metadata: {
              classroomTitle: row.classroom_title
            }
          }));
          resolve(results);
        }
      });
    });
  }

  // 자료 검색
  private async searchMaterials(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          id, title, description, uploaded_by_name, created_at, file_size,
          (CASE 
            WHEN title LIKE ? THEN 100
            WHEN title LIKE ? THEN 80
            WHEN description LIKE ? THEN 60
            WHEN description LIKE ? THEN 40
            ELSE 20
          END) as relevance
        FROM materials 
        WHERE (title LIKE ? OR description LIKE ?)
      `;

      const params = [
        query,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      ];

      if (filters.dateRange) {
        sql += ` AND created_at BETWEEN ? AND ?`;
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      if (filters.size) {
        const sizeRanges = {
          small: 'file_size < 1024*1024',
          medium: 'file_size BETWEEN 1024*1024 AND 10*1024*1024',
          large: 'file_size > 10*1024*1024'
        };
        sql += ` AND ${sizeRanges[filters.size]}`;
      }

      sql += ` ORDER BY relevance DESC, created_at DESC`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const results: SearchResult[] = rows.map((row: any) => ({
            id: row.id,
            type: 'material' as const,
            title: row.title,
            content: row.description,
            author: row.uploaded_by_name,
            date: new Date(row.created_at),
            relevance: row.relevance,
            metadata: {
              fileSize: row.file_size
            }
          }));
          resolve(results);
        }
      });
    });
  }

  // 사용자 검색
  private async searchUsers(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          id, username, email, created_at,
          (CASE 
            WHEN username LIKE ? THEN 100
            WHEN username LIKE ? THEN 80
            WHEN email LIKE ? THEN 60
            ELSE 20
          END) as relevance
        FROM users 
        WHERE (username LIKE ? OR email LIKE ?)
        ORDER BY relevance DESC, created_at DESC
      `;

      const params = [
        query,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      ];

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const results: SearchResult[] = rows.map((row: any) => ({
            id: row.id,
            type: 'user' as const,
            title: row.username,
            content: row.email,
            author: row.username,
            date: new Date(row.created_at),
            relevance: row.relevance
          }));
          resolve(results);
        }
      });
    });
  }

  // 결과 정렬
  private sortResults(results: SearchResult[], sortBy: string, sortOrder: string) {
    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevance - a.relevance;
          break;
        case 'date':
          comparison = b.date.getTime() - a.date.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'popularity':
          // 인기도는 메타데이터에서 추출 (예: 조회수, 좋아요 수 등)
          comparison = (b.metadata?.views || 0) - (a.metadata?.views || 0);
          break;
        default:
          comparison = b.relevance - a.relevance;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }

  // 검색 히스토리 저장
  async saveSearchHistory(userId: string, query: string, filters: SearchFilters, resultsCount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO search_history (id, user_id, query, filters, results_count, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const filtersJson = JSON.stringify(filters);
      const timestamp = new Date().toISOString();

      this.db.run(sql, [id, userId, query, filtersJson, resultsCount, timestamp], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 검색 히스토리 조회
  async getSearchHistory(userId: string, limit: number = 10): Promise<SearchHistory[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, user_id, query, filters, results_count, timestamp
        FROM search_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(sql, [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const history: SearchHistory[] = rows.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            query: row.query,
            filters: row.filters,
            resultsCount: row.results_count,
            timestamp: new Date(row.timestamp)
          }));
          resolve(history);
        }
      });
    });
  }

  // 인기 검색어 조회
  async getPopularSearches(limit: number = 10): Promise<{ query: string; count: number }[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT query, COUNT(*) as count
        FROM search_history
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY query
        ORDER BY count DESC
        LIMIT ?
      `;

      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const popular = rows.map((row: any) => ({
            query: row.query,
            count: row.count
          }));
          resolve(popular);
        }
      });
    });
  }

  // 검색 제안
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT query
        FROM search_history
        WHERE query LIKE ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(sql, [`%${query}%`, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const suggestions = rows.map((row: any) => row.query);
          resolve(suggestions);
        }
      });
    });
  }

  // 고급 검색
  async advancedSearch(criteria: {
    query?: string;
    type?: string[];
    dateRange?: { start: Date; end: Date };
    author?: string;
    tags?: string[];
    size?: string;
  }, options: SearchOptions = {}): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // 고급 검색 로직 구현
    const filters: SearchFilters = {
      type: criteria.type?.[0] as any,
      dateRange: criteria.dateRange || undefined,
      size: criteria.size as any
    };

    return this.search(criteria.query || '', {
      ...options,
      filters
    });
  }
} 