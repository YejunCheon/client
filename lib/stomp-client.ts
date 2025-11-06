import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  WebSocketMessage,
  WsStatus,
  ChatMessage,
  MessageType,
} from '@/types/chat';
import { useMockApi } from '@/lib/api';
import { config as appConfig } from '@/lib/config';
import { mockChatMessages } from '@/mocks/data/chat';

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
    this.baseURL = baseURL || appConfig.wsUrl;
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

      // Mock 환경에서는 즉시 연결 성공 처리
      if (useMockApi()) {
        console.log('[STOMP] Mock mode: Connected');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.processPendingMessages();
        resolve();
        return;
      }

      this.setStatus('connecting');
      console.log('[STOMP] Attempting to connect to:', this.baseURL);

      // 쿠키에서 토큰 가져오기 시도
      const tokenToUse = token || this.getTokenFromCookie();
      const connectHeaders: Record<string, string> = {};

      if (tokenToUse) {
        console.log('[STOMP] Using token for authorization (source:', token ? 'parameter' : 'cookie', ')');
        connectHeaders['Authorization'] = `Bearer ${tokenToUse}`;
      } else {
        console.warn('[STOMP] No token found in parameter or cookie');
      }

      this.client = new Client({
        webSocketFactory: () => {
          console.log('[STOMP] Creating SockJS connection...');
          // SockJS 옵션 설정
          const sockjs = new SockJS(this.baseURL, null, {
            transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
            timeout: 10000,
          });

          // SockJS 이벤트 리스너 추가 (디버깅용)
          sockjs.onopen = () => {
            console.log('[STOMP] SockJS connection opened');
          };

          return sockjs as any;
        },
        connectHeaders,
        reconnectDelay: 0, // 수동 재연결 관리
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[STOMP Debug]', str);
          }
        },
        onConnect: (frame) => {
          console.log('[STOMP] Successfully connected', frame);
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.processPendingMessages();
          resolve();
        },
        onStompError: (frame) => {
          const errorMessage = frame.headers['message'] || frame.body || 'STOMP connection error';
          console.error('[STOMP] STOMP Error Frame:', {
            command: frame.command,
            headers: frame.headers,
            body: frame.body,
          });

          // 401 에러 (인증 실패)
          if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication')) {
            console.error('[STOMP] Authentication failed');
            this.handleTokenExpired();
            reject(new Error('Authentication failed'));
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
    // Mock 환경에서는 클라이언트 연결 없이도 구독 가능
    if (!useMockApi() && !this.client?.connected) {
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

    // Mock 환경에서는 핸들러만 등록 (실제 WebSocket 구독 없음)
    if (useMockApi()) {
      const handlers = this.messageHandlers.get(roomId) || new Set();
      handlers.add(onMessage);
      this.messageHandlers.set(roomId, handlers);

      // Mock 구독 객체 생성 (실제 subscription은 아니지만 인터페이스 호환)
      const mockSubscription = {
        unsubscribe: () => {
          this.subscriptions.delete(roomId);
        },
      } as StompSubscription;

      this.subscriptions.set(roomId, mockSubscription);
      console.log(`[STOMP] Mock: Subscribed to room: ${roomId}`);

      return () => {
        handlers.delete(onMessage);
        if (handlers.size === 0) {
          this.unsubscribe(roomId);
        }
      };
    }

    // 실제 WebSocket 환경
    const subscription = this.client!.subscribe(
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
    console.log('[STOMP] sendMessage called:', { roomId: message.roomId, content: message.message, isMock: useMockApi() });
    
    // Mock 환경에서는 mock 데이터에 추가하고 구독 핸들러 호출
    if (useMockApi()) {
      const chatMessage: ChatMessage = {
        messageId: Date.now(), // 임시 ID
        clientMessageId: message.clientMessageId,
        type: message.type,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.message,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
      };

      console.log('[STOMP] Mock: Creating message:', chatMessage);

      // Mock 데이터에 메시지 추가
      if (!mockChatMessages[message.roomId]) {
        mockChatMessages[message.roomId] = [];
      }
      mockChatMessages[message.roomId].push(chatMessage);
      console.log('[STOMP] Mock: Message added to mockChatMessages. Room:', message.roomId, 'Total messages:', mockChatMessages[message.roomId].length);

      // 구독 핸들러들에게 메시지 브로드캐스트 (약간의 지연을 두어 실제 서버 응답 시뮬레이션)
      setTimeout(() => {
        const handlers = this.messageHandlers.get(message.roomId) || new Set();
        console.log('[STOMP] Mock: Broadcasting to handlers. Room:', message.roomId, 'Handlers count:', handlers.size);
        handlers.forEach((handler) => {
          console.log('[STOMP] Mock: Calling handler with message:', chatMessage);
          handler(chatMessage);
        });
        console.log(`[STOMP] Mock: Message sent and broadcasted to room ${message.roomId}`);
      }, 100); // 100ms 지연으로 실제 서버 응답 시뮬레이션

      return;
    }

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
    // Mock 환경에서는 연결된 상태로 간주
    if (useMockApi()) {
      return this.status === 'connected';
    }
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
   * 특정 방의 구독 핸들러들에게 메시지 브로드캐스트 (Mock 환경에서 사용)
   */
  broadcastMessage(roomId: string, message: ChatMessage): void {
    const handlers = this.messageHandlers.get(roomId) || new Set();
    console.log(`[STOMP] Broadcasting message to room ${roomId}, handlers count: ${handlers.size}`);
    handlers.forEach((handler) => {
      handler(message);
    });
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
   * 쿠키에서 JWT 토큰 가져오기
   * HTTP-only 쿠키는 JavaScript로 접근 불가능하므로
   * 일반 쿠키에 저장된 토큰을 읽습니다.
   */
  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    // 쿠키 파싱
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // 가능한 토큰 쿠키 이름들을 시도
    const tokenCookieNames = ['accessToken', 'token', 'jwt', 'auth_token', 'Authorization'];

    for (const cookieName of tokenCookieNames) {
      if (cookies[cookieName]) {
        console.log(`[STOMP] Found token in cookie: ${cookieName}`);
        return decodeURIComponent(cookies[cookieName]);
      }
    }

    console.warn('[STOMP] No token found in any cookie');
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

