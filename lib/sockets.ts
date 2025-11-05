import { io, Socket } from 'socket.io-client';
import { config as appConfig } from '@/lib/config';

class SocketManager {
  private socket: Socket | null = null;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || appConfig.wsUrl;
  }

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.baseURL, {
      auth: {
        token: token || this.getToken(),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
}

export const socketManager = new SocketManager();

// STOMP 메시지를 위한 헬퍼 함수
export const createStompMessage = (
  type: 'ENTER' | 'TALK' | 'LEAVE',
  roomId: string,
  senderId: string | number,
  content: string
) => ({
  type,
  roomId,
  senderId,
  content,
  timestamp: new Date().toISOString(),
});

export default socketManager;

