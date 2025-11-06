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
import { AUTH_TOKEN_STORAGE_KEY } from '@/lib/store/auth';

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
  private authToken: string | null = null;
  private status: WsStatus = 'disconnected';
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 초기 1초
  private pendingMessages: Array<{ message: WebSocketMessage; roomId: string }> = [];
  private pendingSubscriptions: Set<string> = new Set();

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
        this.processPendingSubscriptions();
        resolve();
        return;
      }

      this.setStatus('connecting');
      console.log('[STOMP] Attempting to connect to:', this.baseURL);

      const connectHeaders: Record<string, string> = {};

      let tokenSource: 'parameter' | 'cache' | 'localStorage' | 'cookie' | null = null;
      let tokenToUse: string | null = null;

      if (token) {
        tokenToUse = token;
        tokenSource = 'parameter';
      } else if (this.authToken) {
        tokenToUse = this.authToken;
        tokenSource = 'cache';
      } else {
        tokenToUse = this.getTokenFromLocalStorage();
        if (tokenToUse) {
          tokenSource = 'localStorage';
        } else {
          tokenToUse = this.getTokenFromCookie();
          if (tokenToUse) {
            tokenSource = 'cookie';
          }
        }
      }

      if (tokenToUse) {
        this.authToken = tokenToUse;
        console.log('[STOMP] Using token for authorization (source:', tokenSource, ')');
        connectHeaders['Authorization'] = `Bearer ${tokenToUse}`;
      } else {
        console.warn('[STOMP] No token found in parameter, cache, localStorage, or cookie');
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
            console.log('[STOMP] SockJS readyState:', sockjs.readyState);
            console.log('[STOMP] SockJS protocol:', (sockjs as any).protocol);
            console.log('[STOMP] SockJS transport:', (sockjs as any).transport);
          };

          sockjs.onmessage = (event) => {
            console.log('[STOMP] SockJS message received:', event.data?.substring(0, 100));
          };

          sockjs.onerror = (error) => {
            console.error('[STOMP] SockJS error:', error);
          };

          sockjs.onclose = (event) => {
            console.log('[STOMP] SockJS connection closed:', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
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
          this.processPendingSubscriptions();
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
    this.pendingSubscriptions.clear();

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
    const handlers = this.messageHandlers.get(roomId) || new Set<MessageHandler>();
    handlers.add(onMessage);
    this.messageHandlers.set(roomId, handlers);

    if (this.subscriptions.has(roomId)) {
      return () => {
        const savedHandlers = this.messageHandlers.get(roomId);
        savedHandlers?.delete(onMessage);
        if (!savedHandlers || savedHandlers.size === 0) {
          this.unsubscribe(roomId);
        }
      };
    }

    if (useMockApi()) {
      const mockSubscription = {
        unsubscribe: () => {
          this.subscriptions.delete(roomId);
        },
      } as StompSubscription;
      this.subscriptions.set(roomId, mockSubscription);
      console.log(`[STOMP] Mock: Subscribed to room: ${roomId}`);

      return () => {
        const savedHandlers = this.messageHandlers.get(roomId);
        savedHandlers?.delete(onMessage);
        if (!savedHandlers || savedHandlers.size === 0) {
          this.unsubscribe(roomId);
        }
      };
    }

    if (!this.client?.connected || this.status !== 'connected') {
      console.warn(`[STOMP] Client not connected. Queueing subscription for room: ${roomId}`);
      this.pendingSubscriptions.add(roomId);

      return () => {
        const savedHandlers = this.messageHandlers.get(roomId);
        savedHandlers?.delete(onMessage);
        if (!savedHandlers || savedHandlers.size === 0) {
          this.pendingSubscriptions.delete(roomId);
          this.unsubscribe(roomId);
        }
      };
    }

    this.registerSubscription(roomId);

    return () => {
      const savedHandlers = this.messageHandlers.get(roomId);
      savedHandlers?.delete(onMessage);
      if (!savedHandlers || savedHandlers.size === 0) {
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
      console.log(`[STOMP] Unsubscribed from room: ${roomId}`);
    }
    this.pendingSubscriptions.delete(roomId);
    this.messageHandlers.delete(roomId);
  }

  private registerSubscription(roomId: string): void {
    if (!this.client || !this.client.connected) {
      console.warn(`[STOMP] registerSubscription called without active client. Queueing room: ${roomId}`);
      this.pendingSubscriptions.add(roomId);
      return;
    }

    const handlers = this.messageHandlers.get(roomId);
    if (!handlers || handlers.size === 0) {
      console.log(`[STOMP] Skipping subscription for room ${roomId}: no handlers registered`);
      return;
    }

    const subscriptionPath = `/sub/chat/room/${roomId}`;
    console.log(`[STOMP] Attempting to subscribe to: ${subscriptionPath}`);
    
    const subscription = this.client.subscribe(
      subscriptionPath,
      (message: IMessage) => {
        console.log(`[STOMP] ✅ Message received from server on ${subscriptionPath}:`, {
          destination: message.headers.destination,
          bodyLength: message.body?.length,
          bodyPreview: message.body?.substring(0, 200),
        });
        try {
          const payload: ChatMessage = JSON.parse(message.body);
          console.log(`[STOMP] Parsed message payload:`, payload);
          const registeredHandlers = this.messageHandlers.get(roomId) || new Set<MessageHandler>();
          console.log(`[STOMP] Calling ${registeredHandlers.size} handler(s) for room ${roomId}`);
          registeredHandlers.forEach((handler) => {
            console.log(`[STOMP] Calling handler with message:`, payload);
            handler(payload);
          });
        } catch (error) {
          console.error('[STOMP] Failed to parse message:', error, 'Raw body:', message.body);
          this.handleError('Failed to parse incoming message');
        }
      },
      {
        id: `sub-${roomId}-${Date.now()}`,
      }
    );

    this.subscriptions.set(roomId, subscription);
    console.log(`[STOMP] ✅ Successfully subscribed to room: ${roomId} at ${subscriptionPath}`);
    console.log(`[STOMP] Active subscriptions count: ${this.subscriptions.size}`);
  }

  private processPendingSubscriptions(): void {
    if (useMockApi()) {
      this.pendingSubscriptions.clear();
      return;
    }

    if (!this.client?.connected) {
      return;
    }

    const rooms = Array.from(this.pendingSubscriptions);
    this.pendingSubscriptions.clear();

    rooms.forEach((roomId) => {
      if (this.subscriptions.has(roomId)) {
        return;
      }

      const handlers = this.messageHandlers.get(roomId);
      if (!handlers || handlers.size === 0) {
        return;
      }

      this.registerSubscription(roomId);
    });
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
        timestamp: message.timestamp || Date.now(), // 밀리초 기반 숫자로 통일
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

    // 실제 연결 상태 확인
    const isActuallyConnected = this.client?.connected === true;
    const statusCheck = this.status === 'connected';
    
    console.log('[STOMP] Connection check:', {
      clientExists: !!this.client,
      clientConnected: this.client?.connected,
      status: this.status,
      isActuallyConnected,
      statusCheck,
    });

    if (!isActuallyConnected || !statusCheck) {
      // 연결되지 않은 경우 대기열에 추가
      this.pendingMessages.push({ message, roomId: message.roomId });
      console.warn('[STOMP] Not connected, message queued. Client connected:', this.client?.connected, 'Status:', this.status);
      return;
    }

    try {
      const body = JSON.stringify({
        type: message.type,
        roomId: message.roomId,
        senderId: message.senderId,
        message: message.message,
        timestamp: Date.now(), // 백엔드 LocalDateTime 호환을 위해 밀리초 기반 숫자로 전송
        clientMessageId: message.clientMessageId,
      });

      console.log('[STOMP] Publishing message:', {
        destination: '/pub/chat/message',
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200),
        clientConnected: this.client.connected,
        clientState: this.client.state,
      });

      // STOMP publish 호출 전 최종 확인
      if (!this.client.connected) {
        console.error('[STOMP] Client not connected at publish time!');
        throw new Error('STOMP client is not connected');
      }

      // 구독 상태 확인
      const isSubscribed = this.subscriptions.has(message.roomId);
      const subscriptionPath = `/sub/chat/room/${message.roomId}`;
      console.log(`[STOMP] Subscription check before publish:`, {
        roomId: message.roomId,
        isSubscribed,
        subscriptionPath,
        activeSubscriptions: Array.from(this.subscriptions.keys()),
      });

      // STOMP publish 호출
      try {
        this.client.publish({
          destination: '/pub/chat/message',
          body,
        });
        console.log(`[STOMP] ✅ Message published to /pub/chat/message for room ${message.roomId}`);
        console.log(`[STOMP] Waiting for server response on ${subscriptionPath}...`);
      } catch (publishError) {
        console.error('[STOMP] ❌ Error during publish:', publishError);
        throw publishError;
      }
      
      // 실제로 전송되었는지 확인 (다음 틱에서)
      setTimeout(() => {
        if (!this.client?.connected) {
          console.error('[STOMP] Connection lost after publish attempt');
        } else {
          console.log('[STOMP] Connection still active after publish');
        }
      }, 100);
    } catch (error) {
      console.error('[STOMP] Failed to send message:', error);
      this.handleError(error as Error);
      throw error; // 에러를 상위로 전달
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
    if (this.status === 'connected') {
      return true;
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
    this.authToken = null;
    // TODO: 토큰 갱신 로직 또는 로그아웃 처리
    if (typeof window !== 'undefined') {
      // 임시: 로그인 페이지로 리다이렉트
      window.location.href = '/auth';
    }
  }

  private getTokenFromLocalStorage(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      return token && token.length > 0 ? token : null;
    } catch (error) {
      console.error('[STOMP] Failed to read token from localStorage:', error);
      return null;
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
    timestamp: Date.now(), // 백엔드 LocalDateTime 호환을 위해 밀리초 기반 숫자로 전송
  };
}
