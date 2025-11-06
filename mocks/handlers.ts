import { http, HttpResponse } from 'msw';
import { mockContracts } from './data/contracts';
import { mockProducts } from './data/products';
import { mockChatRooms, mockChatMessages } from './data/chat';

export const handlers = [
  // 계약서 관련 API
  http.get('*/api/contracts/contractLists', ({ request }) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const contracts = roomId
      ? mockContracts.filter((contract) => contract.roomId === roomId)
      : mockContracts;

    return HttpResponse.json({
      contracts,
      success: true,
      count: contracts.length,
    });
  }),

  // 상품 관련 API
  http.get('*/api/products/list', () => {
    return HttpResponse.json({
      products: mockProducts,
      success: true,
      count: mockProducts.length,
    });
  }),
  http.get('*/api/products/:productId', ({ params }) => {
    const { productId } = params;
    const product = mockProducts.find((p) => p.id === Number(productId));

    if (product) {
      return HttpResponse.json({
        product,
        success: true,
      });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  // 채팅 관련 API
  http.post('*/api/chat/getchatrooms', async ({ request }) => {
    const body = await request.json() as { userId: number | string };
    const userId = Number(body.userId);

    // 해당 유저가 속한 채팅방 필터링 (seller 또는 buyer로 참여한 방)
    const userRooms = mockChatRooms.filter(
      (room) => room.sellerId === userId || room.buyerId === userId
    );

    return HttpResponse.json({
      rooms: userRooms,
      success: true,
    });
  }),

  http.post('*/api/chat/getmessages', async ({ request }) => {
    const body = await request.json() as {
      roomId: string;
      seller: number;
      buyer: number;
      userId: number;
      productId: number;
    };

    const messages = mockChatMessages[body.roomId] || [];

    return HttpResponse.json({
      roomId: body.roomId,
      messages,
      success: true,
    });
  }),

  http.post('*/api/chat/createroom', async ({ request }) => {
    const body = await request.json() as {
      seller: number;
      buyer: number;
      productId: number;
    };

    // 기존 채팅방이 있는지 확인
    const existingRoom = mockChatRooms.find(
      (room) =>
        room.sellerId === body.seller &&
        room.buyerId === body.buyer &&
        room.productId === body.productId
    );

    if (existingRoom) {
      return HttpResponse.json({
        roomId: existingRoom.roomId,
        sellerId: existingRoom.sellerId,
        buyerId: existingRoom.buyerId,
        productId: existingRoom.productId,
        createdAt: existingRoom.createdAt,
        created: false,
        isSuccess: true,
      });
    }

    // 새 채팅방 생성
    const newRoomId = `room-${Date.now()}`;
    const now = new Date().toISOString();
    return HttpResponse.json({
      roomId: newRoomId,
      sellerId: body.seller,
      buyerId: body.buyer,
      productId: body.productId,
      createdAt: now,
      created: true,
      isSuccess: true,
    });
  }),

  http.post('*/api/chat/request-contract', async ({ request }) => {
    const body = await request.json() as {
      roomId: string;
      sellerId: number;
      buyerId: number;
      productId?: number;
    };

    return HttpResponse.json({
      success: true,
      message: '계약서 작성 요청이 전송되었습니다.',
    });
  }),
];
