import type { ChatMessage, ChatRoom } from '@/types/chat';

export const mockChatRooms: ChatRoom[] = [
  {
    roomId: 'room-123',
    sellerId: 101,
    buyerId: 201,
    productId: 1,
    createdAt: '2024-07-30T09:00:00Z',
    updatedAt: '2024-07-30T10:00:00Z',
    lastMessage: '상태 아주 좋습니다. 거의 새 제품이에요.',
    lastMessageTime: '2024-07-30T09:03:00Z',
  },
  {
    roomId: 'room-456',
    sellerId: 102,
    buyerId: 202,
    productId: 2,
    createdAt: '2024-07-29T13:20:00Z',
    updatedAt: '2024-07-29T14:40:00Z',
    lastMessage: '네, 택배 가능해요. 배송비 포함입니다.',
    lastMessageTime: '2024-07-29T13:27:30Z',
  },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
  'room-123': [
    {
      messageId: 1,
      type: 'ENTER',
      roomId: 'room-123',
      senderId: 201,
      content: 'room-123 입장',
      message: 'room-123 입장',
      timestamp: '2024-07-30T09:01:00Z',
    },
    {
      messageId: 2,
      type: 'TALK',
      roomId: 'room-123',
      senderId: 201,
      content: '안녕하세요! 자켓 상태가 어떤가요?',
      message: '안녕하세요! 자켓 상태가 어떤가요?',
      timestamp: '2024-07-30T09:02:00Z',
    },
    {
      messageId: 3,
      type: 'TALK',
      roomId: 'room-123',
      senderId: 101,
      content: '상태 아주 좋습니다. 거의 새 제품이에요.',
      message: '상태 아주 좋습니다. 거의 새 제품이에요.',
      timestamp: '2024-07-30T09:03:00Z',
    },
  ],
  'room-456': [
    {
      messageId: 11,
      type: 'ENTER',
      roomId: 'room-456',
      senderId: 202,
      content: 'room-456 입장',
      message: 'room-456 입장',
      timestamp: '2024-07-29T13:25:00Z',
    },
    {
      messageId: 12,
      type: 'TALK',
      roomId: 'room-456',
      senderId: 202,
      content: '배송 가능한가요?',
      message: '배송 가능한가요?',
      timestamp: '2024-07-29T13:26:00Z',
    },
    {
      messageId: 13,
      type: 'TALK',
      roomId: 'room-456',
      senderId: 102,
      content: '네, 택배 가능해요. 배송비 포함입니다.',
      message: '네, 택배 가능해요. 배송비 포함입니다.',
      timestamp: '2024-07-29T13:27:30Z',
    },
  ],
};
