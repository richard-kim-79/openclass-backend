import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Database } from 'sqlite3';
import jwt from 'jsonwebtoken';

interface User {
  id: number;
  username: string;
  email: string;
}

interface ChatMessage {
  id: string;
  classroomId: number;
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
}

interface Notification {
  id: string;
  userId: number;
  type: 'message' | 'classroom_update' | 'material_upload';
  title: string;
  content: string;
  isRead: boolean;
  timestamp: Date;
}

export class RealtimeService {
  private io: SocketIOServer;
  private db: Database;
  private connectedUsers: Map<string, User> = new Map();

  constructor(server: HTTPServer, db: Database) {
    this.db = db;
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    console.log('✅ 실시간 서비스가 초기화되었습니다.');
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('인증 토큰이 필요합니다.'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        const user = await this.getUserById(decoded.userId);
        
        if (!user) {
          return next(new Error('사용자를 찾을 수 없습니다.'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('인증에 실패했습니다.'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      this.connectedUsers.set(socket.id, user);
      
      console.log(`🔗 사용자 연결: ${user.username} (${socket.id})`);

      // 강의실 참여
      socket.on('join_classroom', (classroomId: number) => {
        socket.join(`classroom_${classroomId}`);
        console.log(`📚 ${user.username}이 강의실 ${classroomId}에 참여했습니다.`);
      });

      // 강의실 나가기
      socket.on('leave_classroom', (classroomId: number) => {
        socket.leave(`classroom_${classroomId}`);
        console.log(`👋 ${user.username}이 강의실 ${classroomId}에서 나갔습니다.`);
      });

      // 채팅 메시지 전송
      socket.on('send_message', async (data: { classroomId: number; message: string }) => {
        try {
          const chatMessage: ChatMessage = {
            id: this.generateId(),
            classroomId: data.classroomId,
            userId: user.id,
            username: user.username,
            message: data.message,
            timestamp: new Date()
          };

          // 데이터베이스에 메시지 저장
          await this.saveChatMessage(chatMessage);

          // 강의실의 모든 사용자에게 메시지 전송
          this.io.to(`classroom_${data.classroomId}`).emit('new_message', chatMessage);

          // 강의실 멤버들에게 알림 전송
          await this.sendNotificationToClassroomMembers(
            data.classroomId,
            user.id,
            'message',
            '새로운 메시지',
            `${user.username}: ${data.message}`
          );

          console.log(`💬 ${user.username}이 강의실 ${data.classroomId}에 메시지를 보냈습니다.`);
        } catch (error) {
          console.error('메시지 전송 오류:', error);
          socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
        }
      });

      // 알림 읽음 처리
      socket.on('mark_notification_read', async (notificationId: string) => {
        try {
          await this.markNotificationAsRead(notificationId);
          socket.emit('notification_updated', { id: notificationId, isRead: true });
        } catch (error) {
          console.error('알림 읽음 처리 오류:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log(`🔌 사용자 연결 해제: ${user.username} (${socket.id})`);
      });
    });
  }

  // 강의실 멤버들에게 알림 전송
  async sendNotificationToClassroomMembers(
    classroomId: number,
    senderId: number,
    type: Notification['type'],
    title: string,
    content: string
  ) {
    try {
      // 강의실 멤버 조회 (교사 제외)
      const members = await this.getClassroomMembers(classroomId);
      
      for (const member of members) {
        if (member.id !== senderId) {
          const notification: Notification = {
            id: this.generateId(),
            userId: member.id,
            type,
            title,
            content,
            isRead: false,
            timestamp: new Date()
          };

          // 데이터베이스에 알림 저장
          await this.saveNotification(notification);

          // 해당 사용자에게 실시간 알림 전송
          this.io.to(`user_${member.id}`).emit('new_notification', notification);
        }
      }
    } catch (error) {
      console.error('알림 전송 오류:', error);
    }
  }

  // 강의실 업데이트 알림
  async notifyClassroomUpdate(classroomId: number, updateType: string, updatedBy: string) {
    try {
      const members = await this.getClassroomMembers(classroomId);
      
      for (const member of members) {
        const notification: Notification = {
          id: this.generateId(),
          userId: member.id,
          type: 'classroom_update',
          title: '강의실 업데이트',
          content: `${updatedBy}님이 강의실을 ${updateType}했습니다.`,
          isRead: false,
          timestamp: new Date()
        };

        await this.saveNotification(notification);
        this.io.to(`user_${member.id}`).emit('new_notification', notification);
      }
    } catch (error) {
      console.error('강의실 업데이트 알림 오류:', error);
    }
  }

  // 자료 업로드 알림
  async notifyMaterialUpload(classroomId: number, materialName: string, uploadedBy: string) {
    try {
      const members = await this.getClassroomMembers(classroomId);
      
      for (const member of members) {
        const notification: Notification = {
          id: this.generateId(),
          userId: member.id,
          type: 'material_upload',
          title: '새로운 자료',
          content: `${uploadedBy}님이 "${materialName}" 자료를 업로드했습니다.`,
          isRead: false,
          timestamp: new Date()
        };

        await this.saveNotification(notification);
        this.io.to(`user_${member.id}`).emit('new_notification', notification);
      }
    } catch (error) {
      console.error('자료 업로드 알림 오류:', error);
    }
  }

  // 데이터베이스 메서드들
  private async getUserById(userId: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, username, email FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as User || null);
        }
      );
    });
  }

  private async saveChatMessage(message: ChatMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO chat_messages (id, classroom_id, user_id, username, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [message.id, message.classroomId, message.userId, message.username, message.message, message.timestamp.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private async saveNotification(notification: Notification): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO notifications (id, user_id, type, title, content, is_read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notification.id, notification.userId, notification.type, notification.title, notification.content, notification.isRead ? 1 : 0, notification.timestamp.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private async markNotificationAsRead(notificationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private async getClassroomMembers(classroomId: number): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT DISTINCT u.id, u.username, u.email FROM users u JOIN classroom_members cm ON u.id = cm.user_id WHERE cm.classroom_id = ?',
        [classroomId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as User[]);
        }
      );
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 서비스 인스턴스 반환
  getIO(): SocketIOServer {
    return this.io;
  }
} 