import { useEffect, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stompClient, createWebSocketMessage } from '@/lib/stomp-client';
import { api } from '@/lib/api';
import type {
  ChatMessage,
  ChatRoom,
  WsStatus,
  MessageType,
  CreateRoomRequest,
  GetMessagesRequest,
  GetChatRoomsRequest,
} from '@/types/chat';

/**
 * 통합 채팅 훅
 * REST API와 WebSocket을 통합하여 채팅 기능을 제공합니다.
 */
export function useChat(userId: string | null) {
  const queryClient = useQueryClient();
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const unsubscribeRef = useRef<Map<string, () => void>>(new Map());
  const messageQueueRef = useRef<Map<string, ChatMessage[]>>(new Map());

  // WebSocket 상태 구독
  useEffect(() => {
    const unsubscribe = stompClient.onStatusChange(setWsStatus);
    return unsubscribe;
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 구독 해제
      unsubscribeRef.current.forEach((unsub) => unsub());
      unsubscribeRef.current.clear();
    };
  }, []);

  /**
   * WebSocket 연결
   * HTTP-only 쿠키를 사용하므로 토큰은 자동으로 전달됩니다.
   */
  const connectWebSocket = useCallback(async () => {
    try {
      // HTTP-only 쿠키가 자동으로 포함되므로 토큰 파라미터 불필요
      await stompClient.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }, []);

  /**
   * WebSocket 연결 해제
   */
  const disconnectWebSocket = useCallback(() => {
    stompClient.disconnect();
  }, []);

  /**
   * 채팅방 생성
   */
  const createRoomMutation = useMutation({
    mutationFn: (request: CreateRoomRequest) => api.chat.createRoom(request),
    onSuccess: (data) => {
      // 채팅방 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['chatRooms', userId] });
      return data;
    },
  });

  /**
   * 채팅방 목록 조회
   */
  const chatRoomsQuery = useQuery({
    queryKey: ['chatRooms', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      const request: GetChatRoomsRequest = { userId };
      return api.chat.getRooms(request);
    },
    enabled: !!userId,
    staleTime: 30000, // 30초 캐시
  });

  /**
   * 특정 채팅방의 메시지 조회
   */
  const messagesQuery = useQuery({
    queryKey: ['chatMessages', currentRoomId],
    queryFn: async () => {
      if (!currentRoomId || !userId) {
        throw new Error('Room ID and User ID are required');
      }

      // 채팅방 정보에서 seller, buyer 찾기
      const rooms = chatRoomsQuery.data?.rooms;
      const room = rooms?.find((r) => r.roomId === currentRoomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      const request: GetMessagesRequest = {
        seller: room.sellerId,
        buyer: room.buyerId,
        userId,
        roomId: room.roomId,
        productId: room.productId,
      };

      const response = await api.chat.getMessages(request);
      
      // 메시지를 타임스탬프 기준으로 정렬
      const sortedMessages = response.messages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return {
        ...response,
        messages: sortedMessages,
      };
    },
    enabled: !!currentRoomId && !!userId && !!chatRoomsQuery.data,
    staleTime: 0, // 메시지는 실시간이므로 캐시하지 않음
  });

  /**
   * 특정 채팅방 구독 및 메시지 수신 설정
   */
  const subscribeToRoom = useCallback(
    (roomId: string) => {
      console.log('[useChat] subscribeToRoom called for room:', roomId);
      // 이미 구독 중이면 스킵
      if (unsubscribeRef.current.has(roomId)) {
        console.log('[useChat] Already subscribed to room:', roomId);
        return;
      }

      if (!stompClient.isConnected()) {
        console.warn('[useChat] WebSocket not connected, cannot subscribe');
        return;
      }

      console.log('[useChat] Subscribing to room:', roomId);
      const unsubscribe = stompClient.subscribe(roomId, (message: ChatMessage) => {
        console.log('[useChat] Received message via subscription:', message);
        // 서버에서 받은 메시지를 UI에 표시
        // (전송한 메시지도 서버에서 브로드캐스트되어 여기서 수신됩니다)
        queryClient.setQueryData<typeof messagesQuery.data>(
          ['chatMessages', roomId],
          (oldData) => {
            console.log('[useChat] Updating query cache. Old data:', oldData);
            
            // oldData가 없으면 초기 데이터 생성
            if (!oldData) {
              console.log('[useChat] No old data, creating new:', { roomId, messages: [message] });
              return {
                roomId,
                messages: [message],
                success: true,
              };
            }

            // 중복 메시지 방지
            const exists = oldData.messages.some(
              (m) =>
                (m.messageId && m.messageId === message.messageId) ||
                (m.clientMessageId && m.clientMessageId === message.clientMessageId)
            );

            if (exists) {
              console.log('[useChat] Message already exists, skipping');
              return oldData;
            }

            const newData = {
              ...oldData,
              messages: [...oldData.messages, message],
            };
            console.log('[useChat] Adding message. New message count:', newData.messages.length);
            return newData;
          }
        );

        // 채팅방 목록의 lastMessage 업데이트
        queryClient.setQueryData<typeof chatRoomsQuery.data>(
          ['chatRooms', userId],
          (oldData) => {
            if (!oldData?.rooms) return oldData;

            return {
              ...oldData,
              rooms: oldData.rooms.map((room) =>
                room.roomId === roomId ? { ...room } : room
              ),
            };
          }
        );
      });

      unsubscribeRef.current.set(roomId, unsubscribe);
    },
    [queryClient, userId]
  );

  /**
   * 특정 채팅방 구독 해제
   */
  const unsubscribeFromRoom = useCallback((roomId: string) => {
    const unsubscribe = unsubscribeRef.current.get(roomId);
    if (unsubscribe) {
      unsubscribe();
      unsubscribeRef.current.delete(roomId);
    }
  }, []);

  /**
   * 메시지 전송
   * 서버 응답을 받은 후에만 UI에 표시됩니다.
   */
  const sendMessage = useCallback(
    async (
      roomId: string,
      content: string,
      type: MessageType = 'TALK'
    ): Promise<void> => {
      console.log('[useChat] sendMessage called:', { roomId, content, userId, type });
      if (!userId) {
        console.error('[useChat] User ID is required');
        throw new Error('User ID is required');
      }

      // 구독이 안 되어 있으면 먼저 구독
      if (!unsubscribeRef.current.has(roomId)) {
        console.log('[useChat] Not subscribed to room, subscribing now:', roomId);
        if (stompClient.isConnected()) {
          subscribeToRoom(roomId);
        } else {
          console.warn('[useChat] WebSocket not connected, cannot subscribe');
          throw new Error('WebSocket not connected');
        }
      }

      // WebSocket으로 메시지 전송
      // 서버에서 메시지를 처리하고 브로드캐스트하면,
      // subscribeToRoom의 구독 핸들러를 통해 수신되어 UI에 표시됩니다.
      try {
        const clientMessageId = crypto.randomUUID();
        const wsMessage = createWebSocketMessage(type, roomId, userId, content, clientMessageId);
        console.log('[useChat] Created WebSocket message:', wsMessage);
        console.log('[useChat] Calling stompClient.sendMessage...');
        stompClient.sendMessage(wsMessage);
        console.log('[useChat] stompClient.sendMessage completed');
        
        // 전송 성공 여부는 서버 응답(구독 메시지)으로 확인됩니다.
        // 에러가 발생하면 여기서 catch하여 처리합니다.
      } catch (error) {
        console.error('[useChat] Failed to send message:', error);
        throw error; // 에러를 상위로 전달하여 UI에서 처리할 수 있도록 함
      }
    },
    [userId, subscribeToRoom]
  );

  /**
   * 채팅방 선택 및 구독
   */
  const selectRoom = useCallback(
    async (roomId: string) => {
      console.log('[useChat] selectRoom called:', roomId, 'wsStatus:', wsStatus);
      // 이전 방 구독 해제
      if (currentRoomId) {
        unsubscribeFromRoom(currentRoomId);
      }

      setCurrentRoomId(roomId);

      // 새 방 구독 (연결 상태 확인)
      if (wsStatus === 'connected') {
        console.log('[useChat] WebSocket connected, subscribing to room:', roomId);
        subscribeToRoom(roomId);
      } else {
        console.log('[useChat] WebSocket not connected yet, status:', wsStatus);
        // 연결 대기 중이면 연결 후 구독하도록 useEffect에서 처리됨
      }
    },
    [currentRoomId, wsStatus, subscribeToRoom, unsubscribeFromRoom]
  );

  // 현재 방이 변경되면 자동 구독
  useEffect(() => {
    if (currentRoomId && wsStatus === 'connected') {
      subscribeToRoom(currentRoomId);
    }

    return () => {
      if (currentRoomId) {
        unsubscribeFromRoom(currentRoomId);
      }
    };
  }, [currentRoomId, wsStatus, subscribeToRoom, unsubscribeFromRoom]);

  // WebSocket 연결 시 현재 방 구독
  useEffect(() => {
    if (wsStatus === 'connected' && currentRoomId) {
      subscribeToRoom(currentRoomId);
    }
  }, [wsStatus, currentRoomId, subscribeToRoom]);

  return {
    // WebSocket 상태
    wsStatus,
    connectWebSocket,
    disconnectWebSocket,
    isWebSocketConnected: stompClient.isConnected(),

    // 채팅방 목록
    chatRooms: chatRoomsQuery.data?.rooms || [],
    isChatRoomsLoading: chatRoomsQuery.isLoading,
    refetchChatRooms: chatRoomsQuery.refetch,

    // 메시지
    messages: messagesQuery.data?.messages || [],
    isMessagesLoading: messagesQuery.isLoading,

    // 현재 선택된 방
    currentRoomId,
    selectRoom,

    // 액션
    createRoom: createRoomMutation.mutateAsync,
    sendMessage,
    subscribeToRoom,
    unsubscribeFromRoom,
  };
}
