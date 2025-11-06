// ===== 공용 메시지 타입 =====

export type MessageType =
  | 'ENTER'
  | 'TALK'
  | 'LEAVE'
  | 'SYSTEM'
  | 'READ'
  | 'TYPING';

export interface ChatMessage {
  messageId?: number;
  clientMessageId?: string;
  type: MessageType;
  roomId: string;
  senderId: number | string;
  content: string;
  message?: string;
  timestamp: string | number; // 서버에서 받을 때 number(밀리초) 또는 string 형식 지원
  status?: 'pending' | 'sent' | 'failed';
  meta?: {
    readCount?: number;
    attachments?: {
      type: 'image' | 'file';
      url: string;
    }[];
  };
}

// ===== REST API 타입 =====

export interface ChatRoomRequest {
  seller: number | string;
  buyer: number | string;
  productId: number | string;
}

export interface ChatRoomResponse {
  roomId: string;
  sellerId?: number | string;
  buyerId?: number | string;
  productId?: number | string;
  createdAt?: string;
  isSuccess?: boolean;
  reason?: string;
  created?: boolean;
}

export interface ChatMessagesRequest {
  roomId?: string;
  seller?: number | string;
  buyer?: number | string;
  user: number | string; // 누가 요청하는지
}

export interface ChatMessagesResponse {
  roomId?: string;
  messages: ChatMessage[];
  success?: boolean;
}

export interface ChatRoom {
  roomId: string;
  sellerId: number;
  buyerId: number;
  productId: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface ChatRoomListResponse {
  rooms: ChatRoom[];
  success?: boolean;
  message?: string;
}

export interface ContractRequestRequest {
  roomId: string;
  sellerId: number | string;
  buyerId: number | string;
  productId?: number | string;
}

export interface ContractRequestResponse {
  success: boolean;
  message?: string;
}

// Backward compatible aliases
export type CreateRoomRequest = ChatRoomRequest;
export type CreateRoomResponse = ChatRoomResponse;
export type GetMessagesRequest = ChatMessagesRequest;
export type GetChatRoomsRequest = { userId: number | string };

// ===== WebSocket 타입 =====

export type WsStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface WebSocketMessage {
  type: MessageType;
  roomId: string;
  senderId: number | string;
  message: string;
  clientMessageId?: string;
  timestamp?: number; // 백엔드 LocalDateTime 호환을 위해 밀리초(Long) 타입으로 전송
}

// ===== 통합 상태 모델 =====

export interface ExtendedChatRoom extends Omit<ChatRoom, 'lastMessage'> {
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  isSubscribed?: boolean;
}

export type ChatProgressStatus =
  | 'IN_PROGRESS'
  | 'CONTRACT_PENDING'
  | 'COMPLETED';

export interface ChatPreview {
  roomId: string;
  productName: string;
  productImage: string;
  price: string;
  counterpartName: string;
  counterpartRole: 'buyer' | 'seller';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
  status: ChatProgressStatus;
}
