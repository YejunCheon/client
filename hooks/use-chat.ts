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
   */
  const connectWebSocket = useCallback(async (token?: string) => {
    try {
      await stompClient.connect(token);
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
      // 이미 구독 중이면 스킵
      if (unsubscribeRef.current.has(roomId)) {
        return;
      }

      if (!stompClient.isConnected()) {
        console.warn('WebSocket not connected, cannot subscribe');
        return;
      }

      const unsubscribe = stompClient.subscribe(roomId, (message: ChatMessage) => {
        // 쿼리 캐시에 메시지 추가 (낙관적 업데이트)
        queryClient.setQueryData<typeof messagesQuery.data>(
          ['chatMessages', roomId],
          (oldData) => {
            if (!oldData) return oldData;

            // 중복 메시지 방지
            const exists = oldData.messages.some(
              (m) =>
                (m.messageId && m.messageId === message.messageId) ||
                (m.clientMessageId && m.clientMessageId === message.clientMessageId)
            );

            if (exists) return oldData;

            return {
              ...oldData,
              messages: [...oldData.messages, message],
            };
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
   */
  const sendMessage = useCallback(
    async (
      roomId: string,
      content: string,
      type: MessageType = 'TALK'
    ): Promise<void> => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // 낙관적 업데이트: 즉시 UI에 표시
      const clientMessageId = crypto.randomUUID();
      const optimisticMessage: ChatMessage = {
        clientMessageId,
        type,
        roomId,
        senderId: userId,
        content,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      queryClient.setQueryData<typeof messagesQuery.data>(
        ['chatMessages', roomId],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            messages: [...oldData.messages, optimisticMessage],
          };
        }
      );

      // WebSocket으로 메시지 전송
      try {
        const wsMessage = createWebSocketMessage(type, roomId, userId, content, clientMessageId);
        stompClient.sendMessage(wsMessage);

        // 전송 성공으로 상태 업데이트
        queryClient.setQueryData<typeof messagesQuery.data>(
          ['chatMessages', roomId],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              messages: oldData.messages.map((msg) =>
                msg.clientMessageId === clientMessageId
                  ? { ...msg, status: 'sent' as const }
                  : msg
              ),
            };
          }
        );
      } catch (error) {
        console.error('Failed to send message:', error);

        // 전송 실패로 상태 업데이트
        queryClient.setQueryData<typeof messagesQuery.data>(
          ['chatMessages', roomId],
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              messages: oldData.messages.map((msg) =>
                msg.clientMessageId === clientMessageId
                  ? { ...msg, status: 'failed' as const }
                  : msg
              ),
            };
          }
        );
      }
    },
    [userId, queryClient]
  );

  /**
   * 채팅방 선택 및 구독
   */
  const selectRoom = useCallback(
    async (roomId: string) => {
      // 이전 방 구독 해제
      if (currentRoomId) {
        unsubscribeFromRoom(currentRoomId);
      }

      setCurrentRoomId(roomId);

      // 새 방 구독
      if (wsStatus === 'connected') {
        subscribeToRoom(roomId);
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
