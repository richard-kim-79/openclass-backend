export type UserRole = 'admin' | 'instructor' | 'student';

export type Permission = 
  | 'create_classroom'
  | 'edit_classroom'
  | 'delete_classroom'
  | 'invite_users'
  | 'remove_users'
  | 'upload_materials'
  | 'delete_materials'
  | 'create_threads'
  | 'edit_threads'
  | 'delete_threads'
  | 'view_analytics'
  | 'manage_permissions';

export interface UserPermission {
  user_id: string;
  classroom_id: string;
  role: UserRole;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserPermissionData {
  user_id: string;
  classroom_id: string;
  role: UserRole;
  permissions?: Permission[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'create_classroom',
    'edit_classroom',
    'delete_classroom',
    'invite_users',
    'remove_users',
    'upload_materials',
    'delete_materials',
    'create_threads',
    'edit_threads',
    'delete_threads',
    'view_analytics',
    'manage_permissions'
  ],
  instructor: [
    'edit_classroom',
    'invite_users',
    'remove_users',
    'upload_materials',
    'delete_materials',
    'create_threads',
    'edit_threads',
    'delete_threads',
    'view_analytics'
  ],
  student: [
    'create_threads',
    'edit_threads'
  ]
}; 