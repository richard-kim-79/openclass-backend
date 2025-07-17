import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Database } from 'sqlite3';

export interface VideoRoom {
  id: string;
  classroomId: string;
  title: string;
  participants: VideoParticipant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoParticipant {
  id: string;
  userId: string;
  userName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  joinedAt: Date;
}

export interface VideoMessage {
  type: 'join' | 'leave' | 'mute' | 'unmute' | 'video-on' | 'video-off' | 'chat' | 'screen-share';
  participantId: string;
  data?: any;
  timestamp: Date;
}

export class VideoConferenceService {
  private io: SocketIOServer;
  private db: Database;
  private rooms: Map<string, VideoRoom> = new Map();
  private participants: Map<string, VideoParticipant> = new Map();

  constructor(server: HTTPServer, db: Database) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.db = db;
    this.setupVideoHandlers();
  }

  private setupVideoHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🎥 화상 회의 클라이언트 연결: ${socket.id}`);

      // 방 참여
      socket.on('join-video-room', async (data: {
        roomId: string;
        userId: string;
        userName: string;
        classroomId?: string;
        isHost?: boolean;
      }) => {
        try {
          const { roomId, userId, userName, classroomId, isHost = false } = data;
          
          // 방이 없으면 생성
          if (!this.rooms.has(roomId)) {
            await this.createRoom(roomId, classroomId || roomId, `화상 회의 - ${roomId}`);
          }

          const room = this.rooms.get(roomId)!;
          const participant: VideoParticipant = {
            id: socket.id,
            userId,
            userName,
            isHost,
            isMuted: false,
            isVideoEnabled: true,
            joinedAt: new Date()
          };

          room.participants.push(participant);
          this.participants.set(socket.id, participant);

          // 방에 참여
          socket.join(roomId);

          // 기존 참가자들에게 새 참가자 알림
          socket.to(roomId).emit('participant-joined', {
            participant,
            roomId
          });

          // 새 참가자에게 기존 참가자 목록 전송
          socket.emit('room-info', {
            room,
            participants: room.participants.filter(p => p.id !== socket.id)
          });

          console.log(`🎥 사용자 ${userName}이 방 ${roomId}에 참여했습니다.`);
        } catch (error) {
          console.error('화상 회의 방 참여 실패:', error);
          socket.emit('video-error', { message: '방 참여에 실패했습니다.' });
        }
      });

      // 방 퇴장
      socket.on('leave-video-room', (data: { roomId: string }) => {
        const { roomId } = data;
        const participant = this.participants.get(socket.id);

        if (participant && this.rooms.has(roomId)) {
          const room = this.rooms.get(roomId)!;
          room.participants = room.participants.filter(p => p.id !== socket.id);

          // 다른 참가자들에게 퇴장 알림
          socket.to(roomId).emit('participant-left', {
            participantId: socket.id,
            roomId
          });

          // 참가자 목록에서 제거
          this.participants.delete(socket.id);

          // 방이 비어있으면 방 비활성화
          if (room.participants.length === 0) {
            room.isActive = false;
            room.updatedAt = new Date();
          }

          socket.leave(roomId);
          console.log(`🎥 사용자 ${participant.userName}이 방 ${roomId}에서 퇴장했습니다.`);
        }
      });

      // 음소거 토글
      socket.on('toggle-mute', (data: { roomId: string; isMuted: boolean }) => {
        const { roomId, isMuted } = data;
        const participant = this.participants.get(socket.id);

        if (participant && this.rooms.has(roomId)) {
          participant.isMuted = isMuted;
          
          socket.to(roomId).emit('participant-mute-changed', {
            participantId: socket.id,
            isMuted
          });
        }
      });

      // 비디오 토글
      socket.on('toggle-video', (data: { roomId: string; isVideoEnabled: boolean }) => {
        const { roomId, isVideoEnabled } = data;
        const participant = this.participants.get(socket.id);

        if (participant && this.rooms.has(roomId)) {
          participant.isVideoEnabled = isVideoEnabled;
          
          socket.to(roomId).emit('participant-video-changed', {
            participantId: socket.id,
            isVideoEnabled
          });
        }
      });

      // 화면 공유 시작/중지
      socket.on('screen-share', (data: { roomId: string; isSharing: boolean }) => {
        const { roomId, isSharing } = data;
        
        socket.to(roomId).emit('screen-share-changed', {
          participantId: socket.id,
          isSharing
        });
      });

      // 채팅 메시지
      socket.on('video-chat-message', (data: {
        roomId: string;
        message: string;
      }) => {
        const { roomId, message } = data;
        const participant = this.participants.get(socket.id);

        if (participant) {
          const chatMessage: VideoMessage = {
            type: 'chat',
            participantId: socket.id,
            data: { message },
            timestamp: new Date()
          };

          // 방의 모든 참가자에게 메시지 전송
          this.io.to(roomId).emit('video-chat-message', {
            ...chatMessage,
            participant
          });
        }
      });

      // WebRTC 시그널링
      socket.on('webrtc-signal', (data: {
        roomId: string;
        targetId: string;
        signal: any;
      }) => {
        const { roomId, targetId, signal } = data;
        
        // 특정 참가자에게 시그널 전송
        socket.to(targetId).emit('webrtc-signal', {
          fromId: socket.id,
          signal
        });
      });

      // 연결 해제
      socket.on('disconnect', () => {
        const participant = this.participants.get(socket.id);
        
        if (participant) {
          // 참가자가 속한 모든 방에서 제거
          this.rooms.forEach((room, roomId) => {
            const participantIndex = room.participants.findIndex(p => p.id === socket.id);
            if (participantIndex !== -1) {
              room.participants.splice(participantIndex, 1);
              
              // 다른 참가자들에게 퇴장 알림
              socket.to(roomId).emit('participant-left', {
                participantId: socket.id,
                roomId
              });

              // 방이 비어있으면 방 비활성화
              if (room.participants.length === 0) {
                room.isActive = false;
                room.updatedAt = new Date();
              }
            }
          });

          this.participants.delete(socket.id);
          console.log(`🎥 사용자 ${participant.userName}의 연결이 해제되었습니다.`);
        }
      });
    });
  }

  private async createRoom(roomId: string, classroomId: string, title: string): Promise<void> {
    const room: VideoRoom = {
      id: roomId,
      classroomId,
      title,
      participants: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rooms.set(roomId, room);

    // 데이터베이스에 방 정보 저장
    await this.saveRoomToDatabase(room);
  }

  private async saveRoomToDatabase(room: VideoRoom): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO video_rooms (id, classroom_id, title, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        room.id,
        room.classroomId,
        room.title,
        room.isActive ? 1 : 0,
        room.createdAt.toISOString(),
        room.updatedAt.toISOString()
      ], (err) => {
        if (err) {
          console.error('화상 회의 방 저장 실패:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public getRoomInfo(roomId: string): VideoRoom | null {
    return this.rooms.get(roomId) || null;
  }

  public getActiveRooms(): VideoRoom[] {
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  public getRoomParticipants(roomId: string): VideoParticipant[] {
    const room = this.rooms.get(roomId);
    return room ? room.participants : [];
  }

  public async endRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.isActive = false;
      room.updatedAt = new Date();
      
      // 모든 참가자에게 방 종료 알림
      this.io.to(roomId).emit('room-ended', { roomId });
      
      // 참가자들을 방에서 제거
      room.participants.forEach(participant => {
        this.participants.delete(participant.id);
      });
      room.participants = [];
      
      await this.saveRoomToDatabase(room);
    }
  }
} 