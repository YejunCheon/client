import type {
  ChatMessagesRequest,
  ChatRoomRequest,
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

export function createChatApi(client: AuthHttpClient = defaultClient): ChatApi {
  return {
    createRoom(payload) {
      return client.post('/api/chat/createroom', normalizeRoomPayload(payload));
    },

    getMessages(payload) {
      return client.post('/api/chat/getmessages', normalizeMessagesPayload(payload));
    },

    getRooms(payload) {
      return client.post('/api/chat/getchatrooms', normalizeRoomsPayload(payload));
    },

    requestContractCreation(payload) {
      return client.post('/api/chat/request-contract', normalizeContractRequestPayload(payload));
    },
  };
}

export const chatApi = createChatApi();
