import { Request, Response, NextFunction } from 'express';
import { advancedSearch, saveSearchHistory, getUserSearchHistory, getPopularSearches } from '../services/advancedSearchService';
import { SearchFilters } from '../types/search';
import '../types/user'; // User 타입 확장을 위해 import

export const performAdvancedSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: SearchFilters = {
      query: req.query.query as string || '',
      type: req.query.type as any || 'all',
      author: req.query.author as string,
      classroomId: req.query.classroomId as string,
      fileType: req.query.fileType ? (req.query.fileType as string).split(',') : [],
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      sortBy: req.query.sortBy as any || 'recent',
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0
    };

    const result = await advancedSearch(filters);

    // 검색 히스토리 저장 (사용자가 로그인한 경우)
    if (req.user && filters.query.trim()) {
      try {
        await saveSearchHistory(req.user.id, filters.query, filters);
      } catch (error) {
        console.error('검색 히스토리 저장 실패:', error);
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getSearchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다' });
    }

    const history = await getUserSearchHistory(userId, limit);
    return res.json({ success: true, data: history });
  } catch (err) {
    return next(err);
  }
};

export const getPopularSearchTerms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popularSearches = await getPopularSearches(limit);
    res.json({ success: true, data: popularSearches });
  } catch (err) {
    next(err);
  }
};

export const getSearchSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.query as string || '';
    const userId = req.user?.id;

    const suggestions = [];

    // 최근 검색어 (사용자별)
    if (userId) {
      try {
        const userHistory = await getUserSearchHistory(userId, 5);
        suggestions.push(...userHistory.map(h => ({
          query: h.query,
          count: 1,
          type: 'recent' as const
        })));
      } catch (error) {
        console.error('사용자 검색 히스토리 조회 실패:', error);
      }
    }

    // 인기 검색어
    try {
      const popularSearches = await getPopularSearches(5);
      suggestions.push(...popularSearches);
    } catch (error) {
      console.error('인기 검색어 조회 실패:', error);
    }

    // 검색어 자동완성 제안
    if (query.trim()) {
      const autoCompleteSuggestions = [
        `${query} 강의`,
        `${query} 자료`,
        `${query} 스레드`,
        `${query} 예제`
      ];
      
      autoCompleteSuggestions.forEach((suggestion, index) => {
        suggestions.push({
          query: suggestion,
          count: 5 - index,
          type: 'suggestion' as const
        });
      });
    }

    res.json({ success: true, data: suggestions });
  } catch (err) {
    next(err);
  }
}; 