import { apiClient } from './api-client';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  GetMessagesRequest,
  ChatMessagesResponse,
  GetChatRoomsRequest,
  ChatRoomListResponse,
} from '@/types/chat';

/**
 * 채팅 REST API 호출 함수
 */

// 채팅방 생성
export async function createChatRoom(
  request: CreateRoomRequest
): Promise<CreateRoomResponse> {
  return apiClient.post<CreateRoomResponse>('/api/chat/createroom', request);
}

// 채팅 메시지 조회
export async function getChatMessages(
  request: GetMessagesRequest
): Promise<ChatMessagesResponse> {
  return apiClient.post<ChatMessagesResponse>('/api/chat/getmessages', request);
}

// 채팅방 목록 조회
export async function getChatRooms(
  request: GetChatRoomsRequest
): Promise<ChatRoomListResponse> {
  return apiClient.post<ChatRoomListResponse>('/api/chat/getchatrooms', request);
}

