import { useEffect, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stompClient, createWebSocketMessage } from '@/lib/stomp-client';
import { api } from '@/lib/api';
import type {
  ChatMessage,
  WsStatus,
  MessageType,
  CreateRoomRequest,
  GetMessagesRequest,
  GetChatRoomsRequest,
} from '@/types/chat';

/**
 * 통합 채팅 훅
 * REST API(채팅방 목록 등)와 WebSocket을 조합하여 메시지를 실시간으로 관리합니다.
 */
export function useChat(userId: string | null) {
  const queryClient = useQueryClient();
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const unsubscribeRef = useRef<Map<string, () => void>>(new Map());
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const loadedRoomsRef = useRef<Set<string>>(new Set());

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
   * 토큰을 직접 전달하거나 내부에서 자동으로 조회합니다.
   */
  const connectWebSocket = useCallback(async (authToken?: string | null) => {
    try {
      // 필요한 경우 토큰을 직접 전달하고, 없으면 내부에서 저장소/쿠키를 확인
      await stompClient.connect(authToken ?? undefined);
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

  const loadInitialMessages = useCallback(
    async (roomId: string) => {
      if (!userId) {
        return;
      }
      if (loadedRoomsRef.current.has(roomId)) {
        return;
      }

      const rooms = chatRoomsQuery.data?.rooms;
      const room = rooms?.find((r) => r.roomId === roomId);
      if (!room) {
        return;
      }

      const request: GetMessagesRequest = {
        roomId: room.roomId,
        seller: room.sellerId,
        buyer: room.buyerId,
        user: userId,
      };

      try {
        const response = await api.chat.getMessages(request);
        const sortedMessages = response.messages
          .slice()
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: sortedMessages,
        }));
        loadedRoomsRef.current.add(roomId);
      } catch (error) {
        console.error('[useChat] Failed to load initial messages:', error);
      }
    },
    [userId, chatRoomsQuery.data]
  );

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

      console.log('[useChat] Subscribing to room:', roomId);
      const unsubscribe = stompClient.subscribe(roomId, (message: ChatMessage) => {
        console.log('[useChat] ✅ Received message via subscription:', message);
        console.log('[useChat] Message details:', {
          messageId: message.messageId,
          clientMessageId: message.clientMessageId,
          roomId: message.roomId,
          senderId: message.senderId,
          content: message.content || message.message,
        });

        // 서버에서 받은 메시지를 UI 상태에 반영
        setMessagesByRoom((prev) => {
          const previousMessages = prev[roomId] ?? [];
          const exists = previousMessages.some(
            (m) =>
              (m.messageId && m.messageId === message.messageId) ||
              (m.clientMessageId && m.clientMessageId === message.clientMessageId)
          );

          if (exists) {
            console.log('[useChat] Message already exists in state, skipping');
            return prev;
          }

          return {
            ...prev,
            [roomId]: [...previousMessages, message],
          };
        });

        // 채팅방 목록의 lastMessage 업데이트
        queryClient.setQueryData<typeof chatRoomsQuery.data>(
          ['chatRooms', userId],
          (oldData) => {
            if (!oldData?.rooms) return oldData;

            return {
              ...oldData,
              rooms: oldData.rooms.map((room) =>
                room.roomId === roomId
                  ? {
                      ...room,
                      lastMessage: message.content || message.message || room.lastMessage,
                      lastMessageTime: String(message.timestamp || room.lastMessageTime || ''),
                    }
                  : room
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
          console.warn('[useChat] WebSocket not connected yet. Subscription will be attempted when connection is established.');
        }
      }

      // WebSocket 연결 상태 확인
      const isConnected = stompClient.isConnected();
      console.log('[useChat] WebSocket connection status:', {
        isConnected,
        wsStatus,
        currentRoomId,
      });

      if (!isConnected) {
        console.error('[useChat] Cannot send message: WebSocket is not connected');
        throw new Error('WebSocket is not connected');
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
    [userId, subscribeToRoom, wsStatus, currentRoomId]
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
      setMessagesByRoom((prev) => {
        if (prev[roomId]) {
          return prev;
        }
        return {
          ...prev,
          [roomId]: [],
        };
      });

      void loadInitialMessages(roomId);

      // 새 방 구독 (연결 상태 확인)
      if (wsStatus === 'connected') {
        console.log('[useChat] WebSocket connected, subscribing to room:', roomId);
        subscribeToRoom(roomId);
      } else {
        console.log('[useChat] WebSocket not connected yet, status:', wsStatus);
        // 연결 대기 중이면 연결 후 구독하도록 useEffect에서 처리됨
      }
    },
    [currentRoomId, wsStatus, subscribeToRoom, unsubscribeFromRoom, loadInitialMessages]
  );

  // 현재 방이 변경되면 자동 구독
  useEffect(() => {
    if (currentRoomId && wsStatus === 'connected') {
      subscribeToRoom(currentRoomId);
    }

    if (currentRoomId && userId) {
      void loadInitialMessages(currentRoomId);
    }

    return () => {
      if (currentRoomId) {
        unsubscribeFromRoom(currentRoomId);
      }
    };
  }, [currentRoomId, wsStatus, subscribeToRoom, unsubscribeFromRoom, userId, loadInitialMessages]);

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
    messages: currentRoomId ? messagesByRoom[currentRoomId] ?? [] : [],

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
