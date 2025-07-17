import { Database } from 'sqlite3';

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export enum Permission {
  // 강의실 관련
  CREATE_CLASSROOM = 'create_classroom',
  EDIT_CLASSROOM = 'edit_classroom',
  DELETE_CLASSROOM = 'delete_classroom',
  JOIN_CLASSROOM = 'join_classroom',
  LEAVE_CLASSROOM = 'leave_classroom',
  
  // 스레드 관련
  CREATE_THREAD = 'create_thread',
  EDIT_THREAD = 'edit_thread',
  DELETE_THREAD = 'delete_thread',
  
  // 자료 관련
  UPLOAD_MATERIAL = 'upload_material',
  EDIT_MATERIAL = 'edit_material',
  DELETE_MATERIAL = 'delete_material',
  DOWNLOAD_MATERIAL = 'download_material',
  
  // 사용자 관리
  MANAGE_USERS = 'manage_users',
  VIEW_PROFILES = 'view_profiles',
  EDIT_PROFILES = 'edit_profiles',
  
  // 시스템 관리
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_CONTENT = 'manage_content'
}

interface RolePermissions {
  [key: string]: Permission[];
}

export class PermissionService {
  private db: Database;
  private rolePermissions!: RolePermissions;

  constructor(db: Database) {
    this.db = db;
    this.initializeRolePermissions();
  }

  private initializeRolePermissions() {
    this.rolePermissions = {
      [UserRole.STUDENT]: [
        Permission.JOIN_CLASSROOM,
        Permission.LEAVE_CLASSROOM,
        Permission.CREATE_THREAD,
        Permission.EDIT_THREAD,
        Permission.DOWNLOAD_MATERIAL,
        Permission.VIEW_PROFILES,
        Permission.EDIT_PROFILES
      ],
      [UserRole.TEACHER]: [
        Permission.CREATE_CLASSROOM,
        Permission.EDIT_CLASSROOM,
        Permission.DELETE_CLASSROOM,
        Permission.JOIN_CLASSROOM,
        Permission.LEAVE_CLASSROOM,
        Permission.CREATE_THREAD,
        Permission.EDIT_THREAD,
        Permission.DELETE_THREAD,
        Permission.UPLOAD_MATERIAL,
        Permission.EDIT_MATERIAL,
        Permission.DELETE_MATERIAL,
        Permission.DOWNLOAD_MATERIAL,
        Permission.VIEW_PROFILES,
        Permission.EDIT_PROFILES
      ],
      [UserRole.ADMIN]: [
        Permission.CREATE_CLASSROOM,
        Permission.EDIT_CLASSROOM,
        Permission.DELETE_CLASSROOM,
        Permission.JOIN_CLASSROOM,
        Permission.LEAVE_CLASSROOM,
        Permission.CREATE_THREAD,
        Permission.EDIT_THREAD,
        Permission.DELETE_THREAD,
        Permission.UPLOAD_MATERIAL,
        Permission.EDIT_MATERIAL,
        Permission.DELETE_MATERIAL,
        Permission.DOWNLOAD_MATERIAL,
        Permission.MANAGE_USERS,
        Permission.VIEW_PROFILES,
        Permission.EDIT_PROFILES,
        Permission.MANAGE_SYSTEM,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_CONTENT
      ]
    };
  }

  // 사용자 역할 조회
  async getUserRole(userId: string): Promise<UserRole> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT role FROM users WHERE id = ?',
        [userId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(row.role as UserRole);
          } else {
            resolve(UserRole.STUDENT); // 기본값
          }
        }
      );
    });
  }

  // 사용자 권한 확인
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      const permissions = this.rolePermissions[userRole] || [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('권한 확인 실패:', error);
      return false;
    }
  }

  // 여러 권한 확인
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  // 모든 권한 확인
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  // 강의실 소유자 확인
  async isClassroomOwner(userId: string, classroomId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT teacher_id FROM classrooms WHERE id = ?',
        [classroomId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row && row.teacher_id === userId);
          }
        }
      );
    });
  }

  // 강의실 멤버 확인
  async isClassroomMember(userId: string, classroomId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT 1 FROM classroom_members WHERE classroom_id = ? AND user_id = ?',
        [classroomId, userId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  // 스레드 작성자 확인
  async isThreadAuthor(userId: string, threadId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT author_id FROM threads WHERE id = ?',
        [threadId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row && row.author_id === userId);
          }
        }
      );
    });
  }

  // 자료 업로더 확인
  async isMaterialUploader(userId: string, materialId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT uploaded_by FROM materials WHERE id = ?',
        [materialId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row && row.uploaded_by === userId);
          }
        }
      );
    });
  }

  // 강의실 수정 권한 확인
  async canEditClassroom(userId: string, classroomId: string): Promise<boolean> {
    const isOwner = await this.isClassroomOwner(userId, classroomId);
    const hasPermission = await this.hasPermission(userId, Permission.EDIT_CLASSROOM);
    return isOwner || hasPermission;
  }

  // 강의실 삭제 권한 확인
  async canDeleteClassroom(userId: string, classroomId: string): Promise<boolean> {
    const isOwner = await this.isClassroomOwner(userId, classroomId);
    const hasPermission = await this.hasPermission(userId, Permission.DELETE_CLASSROOM);
    return isOwner || hasPermission;
  }

  // 스레드 수정 권한 확인
  async canEditThread(userId: string, threadId: string): Promise<boolean> {
    const isAuthor = await this.isThreadAuthor(userId, threadId);
    const hasPermission = await this.hasPermission(userId, Permission.EDIT_THREAD);
    return isAuthor || hasPermission;
  }

  // 스레드 삭제 권한 확인
  async canDeleteThread(userId: string, threadId: string): Promise<boolean> {
    const isAuthor = await this.isThreadAuthor(userId, threadId);
    const hasPermission = await this.hasPermission(userId, Permission.DELETE_THREAD);
    return isAuthor || hasPermission;
  }

  // 자료 수정 권한 확인
  async canEditMaterial(userId: string, materialId: string): Promise<boolean> {
    const isUploader = await this.isMaterialUploader(userId, materialId);
    const hasPermission = await this.hasPermission(userId, Permission.EDIT_MATERIAL);
    return isUploader || hasPermission;
  }

  // 자료 삭제 권한 확인
  async canDeleteMaterial(userId: string, materialId: string): Promise<boolean> {
    const isUploader = await this.isMaterialUploader(userId, materialId);
    const hasPermission = await this.hasPermission(userId, Permission.DELETE_MATERIAL);
    return isUploader || hasPermission;
  }

  // 사용자 역할 변경
  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [newRole, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // 사용자 권한 목록 조회
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const userRole = await this.getUserRole(userId);
      return this.rolePermissions[userRole] || [];
    } catch (error) {
      console.error('사용자 권한 조회 실패:', error);
      return [];
    }
  }

  // 역할별 권한 목록 조회
  getRolePermissions(role: UserRole): Permission[] {
    return this.rolePermissions[role] || [];
  }

  // 모든 역할 조회
  getAllRoles(): UserRole[] {
    return Object.values(UserRole);
  }

  // 모든 권한 조회
  getAllPermissions(): Permission[] {
    return Object.values(Permission);
  }

  // 권한 검증 미들웨어 생성
  createPermissionMiddleware(permission: Permission) {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: '인증이 필요합니다.' });
        }

        const hasPermission = await this.hasPermission(userId, permission);
        if (!hasPermission) {
          return res.status(403).json({ error: '권한이 없습니다.' });
        }

        next();
      } catch (error) {
        console.error('권한 검증 실패:', error);
        res.status(500).json({ error: '권한 검증 중 오류가 발생했습니다.' });
      }
    };
  }

  // 소유권 검증 미들웨어 생성
  createOwnershipMiddleware(resourceType: 'classroom' | 'thread' | 'material') {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id;
        const resourceId = req.params.id;

        if (!userId) {
          return res.status(401).json({ error: '인증이 필요합니다.' });
        }

        let isOwner = false;

        switch (resourceType) {
          case 'classroom':
            isOwner = await this.isClassroomOwner(userId, resourceId);
            break;
          case 'thread':
            isOwner = await this.isThreadAuthor(userId, resourceId);
            break;
          case 'material':
            isOwner = await this.isMaterialUploader(userId, resourceId);
            break;
        }

        if (!isOwner) {
          return res.status(403).json({ error: '소유권이 없습니다.' });
        }

        next();
      } catch (error) {
        console.error('소유권 검증 실패:', error);
        res.status(500).json({ error: '소유권 검증 중 오류가 발생했습니다.' });
      }
    };
  }
} 