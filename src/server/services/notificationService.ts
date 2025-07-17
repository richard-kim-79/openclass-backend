import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Notification, CreateNotificationData, NotificationType } from '../types/notification';

export const createNotification = (data: CreateNotificationData): Promise<Notification> => {
  return new Promise((resolve, reject) => {
    const notificationId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notificationId,
        data.user_id,
        data.type,
        data.title,
        data.message,
        data.data ? JSON.stringify(data.data) : null,
        false,
        now
      ],
      function(err) {
        if (err) {
          reject(err);
        } else {
          // 생성된 알림 조회
          db.get(
            `SELECT id, user_id, type, title, message, data, is_read, created_at
             FROM notifications
             WHERE id = ?`,
            [notificationId],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row as Notification);
              }
            }
          );
        }
      }
    );
  });
};

export const getUserNotifications = (userId: string, limit: number = 20): Promise<Notification[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, user_id, type, title, message, data, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as Notification[]);
        }
      }
    );
  });
};

export const markNotificationAsRead = (notificationId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notifications SET is_read = true WHERE id = ?`,
      [notificationId],
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

export const markAllNotificationsAsRead = (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notifications SET is_read = true WHERE user_id = ?`,
      [userId],
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

export const deleteNotification = (notificationId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM notifications WHERE id = ?`,
      [notificationId],
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

export const getUnreadCount = (userId: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false`,
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row as any).count);
        }
      }
    );
  });
};

// 알림 생성 헬퍼 함수들
export const createThreadNotification = async (
  classroomId: string, 
  threadId: string, 
  authorName: string,
  classroomName: string
) => {
  // 강의실의 모든 사용자에게 알림 (실제로는 구독 시스템 필요)
  const users = await getClassroomUsers(classroomId);
  
  for (const user of users) {
    if (user.id !== authorName) { // 작성자 제외
      await createNotification({
        user_id: user.id,
        type: 'new_thread',
        title: '새 스레드가 작성되었습니다',
        message: `${authorName}님이 "${classroomName}" 강의실에 새 스레드를 작성했습니다.`,
        data: {
          classroom_id: classroomId,
          thread_id: threadId,
          author_name: authorName,
          classroom_name: classroomName
        }
      });
    }
  }
};

export const createMaterialNotification = async (
  classroomId: string,
  materialId: string,
  authorName: string,
  materialTitle: string,
  classroomName: string
) => {
  const users = await getClassroomUsers(classroomId);
  
  for (const user of users) {
    if (user.id !== authorName) {
      await createNotification({
        user_id: user.id,
        type: 'new_material',
        title: '새 자료가 업로드되었습니다',
        message: `${authorName}님이 "${classroomName}" 강의실에 "${materialTitle}" 자료를 업로드했습니다.`,
        data: {
          classroom_id: classroomId,
          material_id: materialId,
          author_name: authorName,
          classroom_name: classroomName
        }
      });
    }
  }
};

// 임시 함수 (실제로는 사용자-강의실 관계 테이블 필요)
const getClassroomUsers = async (classroomId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT u.id, u.name FROM users u
       JOIN threads t ON t.author_name = u.name
       WHERE t.classroom_id = ?
       UNION
       SELECT DISTINCT u.id, u.name FROM users u
       JOIN materials m ON m.author_name = u.name
       WHERE m.classroom_id = ?`,
      [classroomId, classroomId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}; 