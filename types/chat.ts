// ===== 메시지 타입 =====

export type MessageType = 'ENTER' | 'TALK' | 'LEAVE' | 'SYSTEM' | 'READ' | 'TYPING';

// 채팅 메시지 (REST API 응답 + WebSocket 수신 공통)
export interface ChatMessage {
  messageId?: number; // REST API 응답용 (Long 타입)
  clientMessageId?: string; // 낙관적 UI 업데이트용 UUID
  type: MessageType;
  roomId: string;
  senderId: string | number;
  content: string;
  message?: string; // WebSocket 전송용 (content와 동일)
  timestamp: string; // ISO 8601 문자열
  status?: 'pending' | 'sent' | 'failed'; // 전송 상태
  meta?: {
    readCount?: number;
    attachments?: {
      type: 'image' | 'file';
      url: string;
    }[];
  };
}

// ===== REST API 타입 =====

// 채팅방 생성 요청 (POST /createroom)
export interface CreateRoomRequest {
  seller: string; // 로그인한 판매자 ID
  buyer: string; // 구매자 ID
  productId: string; // 상품 DB에 저장된 고유 번호
}

// 채팅방 생성 응답 (POST /createroom)
export interface CreateRoomResponse {
  roomId: string; // uuid 형식
  ismake: boolean; // 새로 생성되면 true
  exception?: string; // 오류 또는 상태 메시지
}

// 채팅 메시지 조회 요청 (POST /getmessages)
export interface GetMessagesRequest {
  seller: string; // 판매자 ID
  buyer: string; // 구매자 ID
  user: string; // 요청자 ID (seller 또는 buyer)
}

// 채팅 메시지 조회 응답 (POST /getmessages)
export interface ChatMessagesResponse {
  roomID: string;
  messages: ChatMessage[];
  isexist: boolean;
}

// 채팅방 목록 조회 요청 (POST /getchatrooms)
export interface GetChatRoomsRequest {
  userId: string; // 요청한 사람의 ID
}

// 채팅방 정보 (REST API 응답)
export interface ChatRoom {
  roomId: string;
  seller: number; // Long 타입
  buyer: number; // Long 타입
}

// 채팅방 목록 조회 응답 (POST /getchatrooms)
export interface ChatRoomListResponse {
  chatRooms: ChatRoom[] | null; // 채팅방이 없으면 null
  success: boolean;
  message: string | null; // 채팅방이 없으면 "No chat rooms"
}

// ===== WebSocket 타입 =====

// WebSocket 연결 상태
export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// WebSocket 메시지 전송 구조 (STOMP)
export interface WebSocketMessage {
  type: MessageType;
  roomId: string;
  senderId: string | number;
  message: string; // content 대신 message 사용
  clientMessageId?: string;
  timestamp?: string;
}

// ===== 통합 상태 모델 (프론트엔드 전역 상태) =====

// 확장된 채팅방 정보 (메시지 포함)
export interface ExtendedChatRoom {
  roomId: string;
  seller: number;
  buyer: number;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  isSubscribed?: boolean;
}

// ===== UI용 확장 타입 =====

// 채팅방 진행 상태 (프론트엔드에서 사용)
export type ChatProgressStatus = 'IN_PROGRESS' | 'CONTRACT_PENDING' | 'COMPLETED';

// 채팅방 미리보기 (프론트엔드에서 사용 - API 응답과 별개)
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
