import {
  mockChatMessages,
  mockChatRooms,
} from '@/mocks/data/chat';
import type {
  ChatMessagesRequest,
  ChatMessagesResponse,
  ChatRoom,
  ChatRoomListResponse,
  ChatRoomRequest,
  ChatRoomResponse,
  ContractRequestRequest,
  ContractRequestResponse,
} from '@/types/chat';
import type { ChatApi } from '../types';
import { generateId, respond } from './utils';

function findRoomByParticipants(
  sellerId: number,
  buyerId: number,
  productId?: number
): ChatRoom | undefined {
  return mockChatRooms.find(
    (room) =>
      room.sellerId === sellerId &&
      room.buyerId === buyerId &&
      (productId == null || room.productId === productId)
  );
}

function resolveRoomId(request: ChatMessagesRequest): string | undefined {
  if (request.roomId) {
    return request.roomId;
  }

  if (request.seller != null && request.buyer != null) {
    const room = findRoomByParticipants(
      request.seller,
      request.buyer,
      request.productId
    );
    return room?.roomId;
  }

  return undefined;
}

function toNumber(value: number | string): number | null {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function createMockChatApi(): ChatApi {
  return {
    async createRoom(payload: ChatRoomRequest): Promise<ChatRoomResponse> {
      const existing = findRoomByParticipants(
        payload.seller,
        payload.buyer,
        payload.productId
      );

      if (existing) {
        return respond({
          roomId: existing.roomId,
          isSuccess: true,
          created: false,
          reason: '이미 존재하는 채팅방입니다.',
        });
      }

      const newRoomId = generateId('room');
      const newRoom: ChatRoom = {
        roomId: newRoomId,
        sellerId: payload.seller,
        buyerId: payload.buyer,
        productId: payload.productId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockChatRooms.push(newRoom);
      mockChatMessages[newRoomId] = [];

      return respond({
        roomId: newRoomId,
        isSuccess: true,
        created: true,
      });
    },

    async getMessages(
      payload: ChatMessagesRequest
    ): Promise<ChatMessagesResponse> {
      const roomId =
        payload.roomId ?? resolveRoomId(payload);

      if (!roomId) {
        return respond({
          roomId: '',
          messages: [],
          success: false,
        });
      }

      const messages = mockChatMessages[roomId] ?? [];
      const sorted = [...messages].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );

      return respond({
        roomId,
        messages: sorted,
        success: true,
      });
    },

    async getRooms({ userId }): Promise<ChatRoomListResponse> {
      const numericUserId = toNumber(userId);
      const rooms = mockChatRooms.filter(
        (room) =>
          (numericUserId != null && (room.sellerId === numericUserId || room.buyerId === numericUserId)) ||
          String(room.sellerId) === String(userId) ||
          String(room.buyerId) === String(userId)
      );

      const ordered = [...rooms].sort(
        (a, b) =>
          new Date(b.updatedAt ?? '').getTime() -
          new Date(a.updatedAt ?? '').getTime()
      );

      return respond({
        rooms: ordered,
        success: true,
      });
    },

    async requestContractCreation(
      payload: ContractRequestRequest
    ): Promise<ContractRequestResponse> {
      // Mock: 구매자가 판매자에게 계약서 작성 요청 알람 전송
      console.log('[Mock] Contract creation request:', payload);
      return respond({
        success: true,
        message: '판매자에게 계약서 작성 요청이 전송되었습니다.',
      });
    },
  };
}
