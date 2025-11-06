import type {
  ChatMessage,
  ChatMessagesRequest,
  ChatMessagesResponse,
  ChatRoom,
  ChatRoomListResponse,
  ChatRoomRequest,
  ChatRoomResponse,
  ContractRequestRequest,
} from '@/types/chat';
import type { AuthHttpClient } from './http-client';
import { httpClient as defaultClient } from './http-client';
import type { ChatApi } from './types';

function toNumeric(value: string | number | undefined) {
  if (value == null) return value;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function normalizeRoomPayload(payload: ChatRoomRequest) {
  return {
    seller: toNumeric(payload.seller),
    buyer: toNumeric(payload.buyer),
    productId: toNumeric(payload.productId),
  };
}

function normalizeMessagesPayload(payload: ChatMessagesRequest) {
  return {
    ...payload,
    seller: toNumeric(payload.seller),
    buyer: toNumeric(payload.buyer),
    productId: toNumeric(payload.productId),
    userId: toNumeric(payload.userId),
  };
}

function normalizeRoomsPayload(payload: { userId: number | string }) {
  return {
    userId: toNumeric(payload.userId),
  };
}

function normalizeContractRequestPayload(payload: ContractRequestRequest) {
  return {
    roomId: payload.roomId,
    sellerId: toNumeric(payload.sellerId),
    buyerId: toNumeric(payload.buyerId),
    productId: payload.productId ? toNumeric(payload.productId) : undefined,
  };
}

function normalizeChatRoom(room: Partial<ChatRoom> & {
  seller?: number | string;
  buyer?: number | string;
  proudctId?: number | string; // 백엔드 오타 대응
}): ChatRoom {
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (value == null) return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  // 백엔드 응답 필드명 대응: seller/buyer -> sellerId/buyerId
  const sellerId = room.sellerId ?? room.seller;
  const buyerId = room.buyerId ?? room.buyer;
  const productId = room.productId ?? room.proudctId; // 백엔드 오타 대응

  return {
    roomId: room.roomId ?? '',
    sellerId: toNumber(sellerId),
    buyerId: toNumber(buyerId),
    productId: toNumber(productId),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt ?? room.lastMessageTime,
    lastMessage: room.lastMessage,
    lastMessageTime: room.lastMessageTime ?? room.updatedAt,
  };
}

function normalizeMessagesResponse(
  payload: ChatMessagesRequest,
  response: Partial<ChatMessagesResponse> & {
    roomID?: string | null; // 백엔드 응답 필드명 (대소문자)
    isexist?: boolean; // 백엔드 응답 필드
  }
): ChatMessagesResponse {
  const messages: ChatMessage[] = Array.isArray(response.messages)
    ? response.messages
    : [];

  // 백엔드 응답 필드명 대응: roomID -> roomId
  const roomId = response.roomId ?? response.roomID ?? payload.roomId ?? '';

  // isexist가 false이거나 메시지가 없는 경우 처리
  const success = response.success ?? (response.isexist !== false && messages.length >= 0);

  return {
    roomId: roomId || '',
    messages,
    success,
  };
}

function normalizeRoomsResponse(response: Partial<ChatRoomListResponse> & {
  chatRooms?: Partial<ChatRoom>[];
}): ChatRoomListResponse {
  const rawRooms = Array.isArray(response.rooms)
    ? response.rooms
    : Array.isArray(response.chatRooms)
    ? response.chatRooms
    : [];

  return {
    rooms: rawRooms.map(normalizeChatRoom),
    success: response.success ?? true,
    message: response.message,
  };
}

function normalizeCreateRoomResponse(
  response: Partial<ChatRoomResponse>
): ChatRoomResponse {
  return {
    roomId: response.roomId ?? '',
    sellerId: response.sellerId,
    buyerId: response.buyerId,
    productId: response.productId,
    createdAt: response.createdAt,
    created: response.created ?? true,
    isSuccess: response.isSuccess ?? true,
    reason: response.reason,
  };
}

export function createChatApi(client: AuthHttpClient = defaultClient): ChatApi {
  return {
    async createRoom(payload) {
      const response = await client.post<Partial<ChatRoomResponse>>(
        '/api/chat/createroom',
        normalizeRoomPayload(payload)
      );
      return normalizeCreateRoomResponse(response);
    },

    async getMessages(payload) {
      const response = await client.post<Partial<ChatMessagesResponse>>(
        '/api/chat/getmessages',
        normalizeMessagesPayload(payload)
      );
      return normalizeMessagesResponse(payload, response);
    },

    async getRooms(payload) {
      try {
        const normalizedPayload = normalizeRoomsPayload(payload);
        const response = await client.post<
          Partial<ChatRoomListResponse> & { chatRooms?: Partial<ChatRoom>[] }
        >('/api/chat/getchatrooms', normalizedPayload);
        return normalizeRoomsResponse(response);
      } catch (error) {
        console.error('[chatApi.getRooms] Error:', error);
        throw error;
      }
    },

    requestContractCreation(payload) {
      return client.post('/api/chat/request-contract', normalizeContractRequestPayload(payload));
    },
  };
}

export const chatApi = createChatApi();
