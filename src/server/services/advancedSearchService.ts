import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { SearchFilters, SearchResult, SearchHistory, SearchSuggestion, AdvancedSearchResponse } from '../types/search';

export const advancedSearch = async (filters: SearchFilters): Promise<AdvancedSearchResponse> => {
  return new Promise((resolve, reject) => {
    try {
      const {
        query,
        type = 'all',
        author,
        classroomId,
        fileType,
        dateFrom,
        dateTo,
        sortBy = 'recent',
        limit = 20,
        offset = 0
      } = filters;

      let sql = '';
      let params: any[] = [];
      let conditions: string[] = [];

      // 기본 검색 조건
      if (query.trim()) {
        conditions.push('search_index MATCH ?');
        params.push(query);
      }

      // 타입 필터
      if (type !== 'all') {
        conditions.push('type = ?');
        params.push(type);
      }

      // 작성자 필터
      if (author) {
        conditions.push('author_name LIKE ?');
        params.push(`%${author}%`);
      }

      // 강의실 필터
      if (classroomId) {
        conditions.push('classroom_id = ?');
        params.push(classroomId);
      }

      // 날짜 범위 필터
      if (dateFrom) {
        conditions.push('created_at >= ?');
        params.push(dateFrom);
      }
      if (dateTo) {
        conditions.push('created_at <= ?');
        params.push(dateTo);
      }

      // 정렬 조건
      let orderBy = '';
      switch (sortBy) {
        case 'recent':
          orderBy = 'created_at DESC';
          break;
        case 'popular':
          orderBy = 'download_count DESC, created_at DESC';
          break;
        case 'title':
          orderBy = 'title ASC';
          break;
        case 'relevance':
          orderBy = 'rank';
          break;
        default:
          orderBy = 'created_at DESC';
      }

      // SQL 쿼리 구성
      if (conditions.length > 0) {
        sql = `
          SELECT 
            id, type, title, content, classroom_id, classroom_name, 
            author_name, created_at, updated_at, download_count, file_type,
            rank
          FROM search_index 
          WHERE ${conditions.join(' AND ')}
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?
        `;
      } else {
        sql = `
          SELECT 
            id, type, title, content, classroom_id, classroom_name, 
            author_name, created_at, updated_at, download_count, file_type,
            rank
          FROM search_index 
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?
        `;
      }

      params.push(limit, offset);

      // 검색 실행
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // 결과 변환
        const results: SearchResult[] = rows.map((row: any) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          content: row.content,
          classroom_id: row.classroom_id,
          classroom_name: row.classroom_name,
          author_name: row.author_name,
          created_at: row.created_at,
          updated_at: row.updated_at,
          relevance_score: row.rank,
          download_count: row.download_count,
          file_type: row.file_type
        }));

        // 파일 타입 필터링 (클라이언트 사이드)
        const filteredResults = fileType && fileType.length > 0
          ? results.filter(result => result.file_type && fileType.includes(result.file_type))
          : results;

        // 전체 개수 조회
        getSearchCount(filters).then(total => {
          // 검색 제안 생성
          getSearchSuggestions(query).then(suggestions => {
            resolve({
              results: filteredResults,
              total,
              suggestions,
              filters
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// 검색 결과 개수 조회
const getSearchCount = async (filters: SearchFilters): Promise<number> => {
  return new Promise((resolve, reject) => {
    const { query, type = 'all', author, classroomId, dateFrom, dateTo } = filters;
    
    let conditions: string[] = [];
    let params: any[] = [];

    if (query.trim()) {
      conditions.push('search_index MATCH ?');
      params.push(query);
    }

    if (type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (author) {
      conditions.push('author_name LIKE ?');
      params.push(`%${author}%`);
    }

    if (classroomId) {
      conditions.push('classroom_id = ?');
      params.push(classroomId);
    }

    if (dateFrom) {
      conditions.push('created_at >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('created_at <= ?');
      params.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM search_index ${whereClause}`;

    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve((row as any).count);
      }
    });
  });
};

// 검색 제안 생성
const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  return new Promise((resolve, reject) => {
    const suggestions: SearchSuggestion[] = [];

    // 최근 검색어 (실제로는 사용자별로 저장된 검색어 사용)
    if (query.trim()) {
      suggestions.push({
        query: query,
        count: 1,
        type: 'recent'
      });
    }

    // 인기 검색어 (실제로는 통계에서 가져옴)
    const popularQueries = ['강의', '자료', '스레드', '프로그래밍', '수학'];
    popularQueries.forEach((q, index) => {
      suggestions.push({
        query: q,
        count: 10 - index,
        type: 'popular'
      });
    });

    resolve(suggestions);
  });
};

// 검색 히스토리 저장
export const saveSearchHistory = async (userId: string, query: string, filters: Partial<SearchFilters>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const historyId = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO search_history (id, user_id, query, filters, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [historyId, userId, query, JSON.stringify(filters), now],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

// 사용자 검색 히스토리 조회
export const getUserSearchHistory = (userId: string, limit: number = 10): Promise<SearchHistory[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, user_id, query, filters, created_at
       FROM search_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as SearchHistory[]);
        }
      }
    );
  });
};

// 인기 검색어 조회
export const getPopularSearches = (limit: number = 10): Promise<SearchSuggestion[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT query, COUNT(*) as count
       FROM search_history
       GROUP BY query
       ORDER BY count DESC
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const suggestions: SearchSuggestion[] = rows.map((row: any) => ({
            query: row.query,
            count: row.count,
            type: 'popular'
          }));
          resolve(suggestions);
        }
      }
    );
  });
}; 