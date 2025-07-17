import bcrypt from 'bcryptjs';
import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar_url?: string;
  provider: string;
  provider_id?: string;
  is_active: number;
  is_verified: number;
  email_verification_token?: string;
  email_verification_expires_at?: string;
  password_reset_token?: string;
  password_reset_expires_at?: string;
  last_login_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  avatar_url?: string;
  provider: string;
  provider_id?: string;
}

/**
 * 사용자 목록 조회 (탈퇴하지 않은 사용자만)
 */
export const getUserList = (): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`,
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as User[]);
        }
      }
    );
  });
};

/**
 * 이메일로 사용자 조회 (탈퇴하지 않은 사용자만)
 */
export const getUserByEmail = (email: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User || null);
        }
      }
    );
  });
};

/**
 * ID로 사용자 조회 (탈퇴하지 않은 사용자만)
 */
export const getUserById = (id: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`,
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User || null);
        }
      }
    );
  });
};

/**
 * 소셜 로그인 사용자 조회
 */
export const getUserByProvider = (provider: string, providerId: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE provider = ? AND provider_id = ? AND deleted_at IS NULL`,
      [provider, providerId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User || null);
        }
      }
    );
  });
};

/**
 * 이메일 중복 확인 (탈퇴하지 않은 사용자만)
 */
export const isEmailExists = (email: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 이메일 존재 확인: ${email}`);
    db.get(
      `SELECT COUNT(*) as count FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email],
      (err, row: any) => {
        if (err) {
          console.error('❌ 이메일 존재 확인 오류:', err);
          reject(err);
        } else {
          const count = row.count || 0;
          console.log(`📊 이메일 존재 확인 결과: ${email} -> count: ${count}`);
          resolve(count > 0);
        }
      }
    );
  });
};

/**
 * 사용자 생성
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  return new Promise((resolve, reject) => {
    const { email, password, name, avatar_url, provider, provider_id } = userData;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // 비밀번호 해시화 (local provider인 경우만)
    const processUser = (hashedPassword?: string) => {
      db.run(
        `INSERT INTO users (
          id, email, password, name, avatar_url, provider, provider_id, 
          is_active, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, hashedPassword || null, name, avatar_url || null, 
          provider, provider_id || null, 1, 0, now, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id, email, password: hashedPassword, name, avatar_url,
              provider, provider_id, is_active:1, is_verified: 0,
              created_at: now, updated_at: now
            } as User);
          }
        }
      );
    };

    if (provider === 'local' && password) {
      bcrypt.hash(password, 10).then(processUser).catch(reject);
    } else {
      processUser();
    }
  });
};

/**
 * 비밀번호 검증
 */
export const verifyPassword = async (password: string, hashedPassword?: string): Promise<boolean> => {
  if (!hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 사용자 정보 업데이트
 */
export const updateUser = (id: string, updateData: Partial<User>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), now, id];
    
    db.run(
      `UPDATE users SET ${fields}, updated_at = ? WHERE id = ?`,
      values,
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

/**
 * 마지막 로그인 시간 업데이트
 */
export const updateLastLogin = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      `UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
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

/**
 * 로그인 히스토리 기록
 */
export const logLoginHistory = (userId: string, provider: string, ipAddress?: string, userAgent?: string, success: boolean = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO login_history (id, user_id, provider, ip_address, user_agent, success, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, provider, ipAddress || null, userAgent || null, success ? 1 : 0],
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

/**
 * 이메일 인증 토큰 생성
 */
export const createEmailVerificationToken = (userId: string, email: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간
    
    db.run(
      `UPDATE users SET email_verification_token = ?, email_verification_expires_at = ?, updated_at = ? WHERE id = ?`,
      [token, expiresAt, new Date().toISOString(), userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });
};

/**
 * 이메일 인증 토큰 검증
 */
export const verifyEmailToken = (token: string): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    db.get(
      `SELECT * FROM users WHERE email_verification_token = ? AND email_verification_expires_at > ? AND deleted_at IS NULL`,
      [token, now],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // 인증 완료 처리
          db.run(
            `UPDATE users SET is_verified = 1, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = ? WHERE id = ?`,
            [now, (row as User).id],
            function(updateErr) {
              if (updateErr) {
                reject(updateErr);
              } else {
                resolve(row as User);
              }
            }
          );
        } else {
          resolve(null);
        }
      }
    );
  });
};

/**
 * 비밀번호 재설정 토큰 생성
 */
export const createPasswordResetToken = (email: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간
    
    db.run(
      `UPDATE users SET password_reset_token = ?, password_reset_expires_at = ?, updated_at = ? WHERE email = ? AND deleted_at IS NULL`,
      [token, expiresAt, new Date().toISOString(), email],
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes > 0) {
          resolve(token);
        } else {
          resolve(null);
        }
      }
    );
  });
};

/**
 * 비밀번호 재설정
 */
export const resetPassword = (token: string, newPassword: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    bcrypt.hash(newPassword, 10).then(hashedPassword => {
      db.run(
        `UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = ? 
         WHERE password_reset_token = ? AND password_reset_expires_at > ? AND deleted_at IS NULL`,
        [hashedPassword, now, token, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    }).catch(reject);
  });
};

/**
 * 사용자 탈퇴 (소프트 삭제)
 */
export const deleteUser = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
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

/**
 * 사용자 계정 활성화/비활성화
 */
export const toggleUserActive = (id: string, isActive: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?`,
      [isActive ? 1 : 0],
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