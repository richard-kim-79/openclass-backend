import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createNotification, getUnreadCount } from '../services/notificationService';

export class NotificationHandler {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('클라이언트 연결:', socket.id);

      // 사용자 인증
      socket.on('authenticate', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        console.log(`사용자 ${userId} 인증됨`);
        
        // 읽지 않은 알림 개수 전송
        this.sendUnreadCount(userId);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        const userId = this.getUserIdBySocketId(socket.id);
        if (userId) {
          this.userSockets.delete(userId);
          console.log(`사용자 ${userId} 연결 해제`);
        }
      });

      // 알림 읽음 표시
      socket.on('mark-as-read', async (notificationId: string) => {
        try {
          await this.markNotificationAsRead(notificationId);
          socket.emit('notification-updated', { notificationId, isRead: true });
        } catch (error) {
          socket.emit('error', { message: '알림 업데이트 실패' });
        }
      });

      // 모든 알림 읽음 표시
      socket.on('mark-all-as-read', async (userId: string) => {
        try {
          await this.markAllNotificationsAsRead(userId);
          socket.emit('all-notifications-read');
        } catch (error) {
          socket.emit('error', { message: '알림 업데이트 실패' });
        }
      });
    });
  }

  // 새 알림 전송
  public async sendNotification(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new-notification', notification);
      await this.updateUnreadCount(userId);
    }
  }

  // 읽지 않은 알림 개수 전송
  private async sendUnreadCount(userId: string) {
    try {
      const count = await getUnreadCount(userId);
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('unread-count', { count });
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
    }
  }

  // 읽지 않은 알림 개수 업데이트
  private async updateUnreadCount(userId: string) {
    await this.sendUnreadCount(userId);
  }

  // Socket ID로 사용자 ID 찾기
  private getUserIdBySocketId(socketId: string): string | undefined {
    for (const [userId, id] of this.userSockets.entries()) {
      if (id === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  // 알림 읽음 표시
  private async markNotificationAsRead(notificationId: string) {
    // 실제 구현에서는 notificationService 사용
    console.log(`알림 ${notificationId} 읽음 표시`);
  }

  // 모든 알림 읽음 표시
  private async markAllNotificationsAsRead(userId: string) {
    // 실제 구현에서는 notificationService 사용
    console.log(`사용자 ${userId}의 모든 알림 읽음 표시`);
  }

  // 강의실 알림 전송
  public async sendClassroomNotification(classroomId: string, notification: any) {
    // 강의실의 모든 사용자에게 알림 전송
    // 실제로는 강의실 구독 시스템이 필요
    console.log(`강의실 ${classroomId} 알림 전송:`, notification);
  }

  // 시스템 알림 전송
  public async sendSystemNotification(userIds: string[], notification: any) {
    for (const userId of userIds) {
      await this.sendNotification(userId, notification);
    }
  }
} 