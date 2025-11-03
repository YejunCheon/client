import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  WebSocketMessage,
  WsStatus,
  ChatMessage,
  MessageType,
} from '@/types/chat';

type MessageHandler = (message: ChatMessage) => void;
type StatusHandler = (status: WsStatus) => void;
type ErrorHandler = (error: Error | string) => void;

/**
 * STOMP WebSocket 클라이언트 매니저
 * 연결, 구독, 메시지 송수신을 관리합니다.
 */
class StompClientManager {
  private client: Client | null = null;
  private baseURL: string;
  private status: WsStatus = 'disconnected';
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 초기 1초
  private pendingMessages: Array<{ message: WebSocketMessage; roomId: string }> = [];

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';
  }

  /**
   * WebSocket 연결
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve();
        return;
      }

      this.setStatus('connecting');

      const tokenToUse = token || this.getToken();
      if (!tokenToUse) {
        const error = new Error('No authentication token found');
        this.handleError(error);
        reject(error);
        return;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(this.baseURL) as any,
        connectHeaders: {
          Authorization: `Bearer ${tokenToUse}`,
        },
        reconnectDelay: 0, // 수동 재연결 관리
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[STOMP]', str);
          }
        },
        onConnect: () => {
          console.log('[STOMP] Connected');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.processPendingMessages();
          resolve();
        },
        onStompError: (frame) => {
          const errorMessage = frame.headers['message'] || 'STOMP connection error';
          console.error('[STOMP] Error:', errorMessage);
          
          // 401 에러 (인증 실패)
          if (frame.headers['message']?.includes('401') || frame.headers['message']?.includes('Unauthorized')) {
            this.handleTokenExpired();
            return;
          }

          const error = new Error(errorMessage);
          this.handleError(error);
          this.setStatus('error');
          reject(error);
        },
        onWebSocketError: (event) => {
          console.error('[STOMP] WebSocket error:', event);
          const error = new Error('WebSocket connection failed');
          this.handleError(error);
          this.setStatus('error');
          this.attemptReconnect();
        },
        onDisconnect: () => {
          console.log('[STOMP] Disconnected');
          this.setStatus('disconnected');
          this.subscriptions.clear();
          // 네트워크 단절 시 자동 재연결 시도
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        },
      });

      try {
        this.client.activate();
      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    // 모든 구독 해제
    this.subscriptions.forEach((subscription, roomId) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.client?.connected) {
      this.client.deactivate();
    }
    this.client = null;
    this.setStatus('disconnected');
  }

  /**
   * 특정 채팅방 구독
   */
  subscribe(roomId: string, onMessage: MessageHandler): () => void {
    if (!this.client?.connected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    // 이미 구독 중이면 기존 핸들러만 추가
    if (this.subscriptions.has(roomId)) {
      const handlers = this.messageHandlers.get(roomId) || new Set();
      handlers.add(onMessage);
      this.messageHandlers.set(roomId, handlers);
      
      return () => {
        handlers.delete(onMessage);
        if (handlers.size === 0) {
          this.unsubscribe(roomId);
        }
      };
    }

    const subscription = this.client.subscribe(
      `/sub/chat/room/${roomId}`,
      (message: IMessage) => {
        try {
          const payload: ChatMessage = JSON.parse(message.body);
          // 핸들러들에게 메시지 전달
          const handlers = this.messageHandlers.get(roomId) || new Set();
          handlers.forEach((handler) => handler(payload));
        } catch (error) {
          console.error('[STOMP] Failed to parse message:', error);
          this.handleError('Failed to parse incoming message');
        }
      },
      {
        id: `sub-${roomId}-${Date.now()}`,
      }
    );

    this.subscriptions.set(roomId, subscription);
    
    // 핸들러 저장
    const handlers = this.messageHandlers.get(roomId) || new Set();
    handlers.add(onMessage);
    this.messageHandlers.set(roomId, handlers);

    console.log(`[STOMP] Subscribed to room: ${roomId}`);

    // 구독 해제 함수 반환
    return () => {
      handlers.delete(onMessage);
      if (handlers.size === 0) {
        this.unsubscribe(roomId);
      }
    };
  }

  /**
   * 특정 채팅방 구독 해제
   */
  unsubscribe(roomId: string): void {
    const subscription = this.subscriptions.get(roomId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(roomId);
      this.messageHandlers.delete(roomId);
      console.log(`[STOMP] Unsubscribed from room: ${roomId}`);
    }
  }

  /**
   * 메시지 전송
   */
  sendMessage(message: WebSocketMessage): void {
    if (!this.client?.connected) {
      // 연결되지 않은 경우 대기열에 추가
      this.pendingMessages.push({ message, roomId: message.roomId });
      console.warn('[STOMP] Not connected, message queued');
      return;
    }

    try {
      const body = JSON.stringify({
        type: message.type,
        roomId: message.roomId,
        senderId: message.senderId,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
      });

      this.client.publish({
        destination: '/pub/chat/message',
        body,
      });

      console.log(`[STOMP] Message sent to room ${message.roomId}`);
    } catch (error) {
      console.error('[STOMP] Failed to send message:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * 연결 상태 구독
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    // 현재 상태 즉시 전달
    handler(this.status);

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * 에러 핸들러 등록
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * 현재 연결 상태
   */
  getStatus(): WsStatus {
    return this.status;
  }

  /**
   * 연결 여부
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * 대기 중인 메시지 전송
   */
  private processPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const { message } = this.pendingMessages.shift()!;
      this.sendMessage(message);
    }
  }

  /**
   * 재연결 시도 (exponential backoff)
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[STOMP] Max reconnect attempts reached');
      this.setStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.setStatus('reconnecting');
    console.log(`[STOMP] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

    setTimeout(() => {
      if (!this.client?.connected) {
        this.connect().catch((error) => {
          console.error('[STOMP] Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * 상태 변경 및 핸들러 호출
   */
  private setStatus(status: WsStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach((handler) => handler(status));
    }
  }

  /**
   * 에러 처리
   */
  private handleError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.errorHandlers.forEach((handler) => handler(errorMessage));
  }

  /**
   * 토큰 만료 처리
   */
  private handleTokenExpired(): void {
    console.error('[STOMP] Token expired');
    this.disconnect();
    // TODO: 토큰 갱신 로직 또는 로그아웃 처리
    if (typeof window !== 'undefined') {
      // 임시: 로그인 페이지로 리다이렉트
      window.location.href = '/auth';
    }
  }

  /**
   * LocalStorage에서 토큰 가져오기
   */
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
}

// 싱글톤 인스턴스
export const stompClient = new StompClientManager();

// 유틸리티 함수들
export function createWebSocketMessage(
  type: MessageType,
  roomId: string,
  senderId: string | number,
  message: string,
  clientMessageId?: string
): WebSocketMessage {
  return {
    type,
    roomId,
    senderId,
    message,
    clientMessageId: clientMessageId || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

