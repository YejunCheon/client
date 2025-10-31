export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string | number;
  content: string;
  timestamp: string;
  type?: MessageType;
}

export enum MessageType {
  ENTER = 'ENTER',
  TALK = 'TALK',
  LEAVE = 'LEAVE',
}

export interface ChatRoom {
  roomId: string;
  seller: number;
  buyer: number;
}

export interface ChatRoomListResponse {
  chatRooms: ChatRoom[];
  success: boolean;
  message?: string | null;
}

export interface ChatMessagesResponse {
  roomID: string;
  messages: ChatMessage[];
  isexist: boolean;
}

export interface CreateRoomResponse {
  roomId: string;
  ismake: boolean;
  exception?: string;
}

export interface WebSocketMessage {
  type: MessageType;
  roomId: string;
  senderId: string | number;
  content: string;
  timestamp?: string;
}

