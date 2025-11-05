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
  timestamp: string;
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
  productId?: number | string;
  userId: number | string;
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
  timestamp?: string;
}

// ===== 통합 상태 모델 =====

export interface ExtendedChatRoom extends ChatRoom {
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
