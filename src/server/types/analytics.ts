export interface UserActivity {
  user_id: string;
  login_count: number;
  total_time: number; // 분 단위
  thread_count: number;
  reply_count: number;
  material_upload_count: number;
  material_download_count: number;
  created_at: string;
}

export interface ClassroomStats {
  classroom_id: string;
  classroom_name: string;
  member_count: number;
  thread_count: number;
  material_count: number;
  total_downloads: number;
  active_days: number;
  created_at: string;
  last_activity: string;
}

export interface PopularContent {
  id: string;
  type: 'thread' | 'material';
  title: string;
  classroom_name: string;
  author_name: string;
  view_count: number;
  download_count?: number;
  created_at: string;
}

export interface GrowthTrend {
  date: string;
  new_users: number;
  new_classrooms: number;
  new_threads: number;
  new_materials: number;
  total_activity: number;
}

export interface SystemStats {
  total_users: number;
  total_classrooms: number;
  total_threads: number;
  total_materials: number;
  total_downloads: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
}

export interface UserStats {
  user_id: string;
  user_name: string;
  email: string;
  join_date: string;
  activity_stats: UserActivity;
  classroom_participation: ClassroomStats[];
  popular_content: PopularContent[];
}

export interface AnalyticsResponse {
  system_stats: SystemStats;
  user_stats?: UserStats;
  classroom_stats?: ClassroomStats[];
  popular_content: PopularContent[];
  growth_trend: GrowthTrend[];
  recent_activity: any[];
} 