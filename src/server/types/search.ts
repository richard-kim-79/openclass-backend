export interface SearchFilters {
  query: string;
  type?: 'all' | 'classroom' | 'thread' | 'material';
  author?: string;
  classroomId?: string;
  fileType?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'recent' | 'popular' | 'title' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: 'classroom' | 'thread' | 'material';
  title: string;
  content?: string;
  classroom_id?: string;
  classroom_name?: string;
  author_name?: string;
  created_at?: string;
  updated_at?: string;
  relevance_score?: number;
  download_count?: number;
  file_type?: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  filters: Partial<SearchFilters>;
  created_at: string;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  type: 'recent' | 'popular' | 'suggestion';
}

export interface AdvancedSearchResponse {
  results: SearchResult[];
  total: number;
  suggestions: SearchSuggestion[];
  filters: SearchFilters;
} 