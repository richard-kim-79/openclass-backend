export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export type NotificationType = 
  | 'new_thread'
  | 'new_reply'
  | 'new_material'
  | 'classroom_invite'
  | 'classroom_update'
  | 'system_message';

export interface NotificationData {
  classroom_id?: string;
  thread_id?: string;
  material_id?: string;
  author_name?: string;
  classroom_name?: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
} 