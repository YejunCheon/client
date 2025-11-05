# 채팅 API 사용 가이드

## 필요한 패키지 설치

```bash
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

## 사용 예시

### 1. 기본 사용 (useChat 훅)

```tsx
import { useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';

function ChatComponent() {
  const userId = 'user123'; // 실제로는 auth store에서 가져옴
  const {
    wsStatus,
    connectWebSocket,
    disconnectWebSocket,
    chatRooms,
    messages,
    currentRoomId,
    selectRoom,
    sendMessage,
    createRoom,
  } = useChat(userId);

  // 컴포넌트 마운트 시 WebSocket 연결
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // 채팅방 생성
  const handleCreateRoom = async () => {
    try {
      const result = await createRoom({
        seller: 'seller123',
        buyer: 'buyer456',
        productId: 'product789',
      });
      console.log('Room created:', result.roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!currentRoomId) return;
    
    await sendMessage(currentRoomId, '안녕하세요!', 'TALK');
  };

  return (
    <div>
      <div>WebSocket 상태: {wsStatus}</div>
      
      {/* 채팅방 목록 */}
      <div>
        <h2>채팅방 목록</h2>
        {chatRooms.map((room) => (
          <div key={room.roomId} onClick={() => selectRoom(room.roomId)}>
            방 ID: {room.roomId}
          </div>
        ))}
      </div>

      {/* 메시지 목록 */}
      {currentRoomId && (
        <div>
          <h2>메시지</h2>
          {messages.map((msg) => (
            <div key={msg.messageId || msg.clientMessageId}>
              [{msg.type}] {msg.senderId}: {msg.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. 직접 API 호출

```tsx
import { api } from '@/lib/api';

// 채팅방 생성
const room = await api.chat.createRoom({
  seller: 'seller123',
  buyer: 'buyer456',
  productId: 'product789',
});

// 메시지 조회
const messages = await api.chat.getMessages({
  seller: 'seller123',
  buyer: 'buyer456',
  userId: 'user123',
});

// 채팅방 목록 조회
const rooms = await api.chat.getRooms({
  userId: 'user123',
});
```

### 3. STOMP 클라이언트 직접 사용

```tsx
import { stompClient, createWebSocketMessage } from '@/lib/stomp-client';

// 연결
await stompClient.connect();

// 상태 구독
const unsubscribeStatus = stompClient.onStatusChange((status) => {
  console.log('WebSocket 상태:', status);
});

// 메시지 수신 구독
const unsubscribeMessage = stompClient.subscribe('room-id', (message) => {
  console.log('메시지 수신:', message);
});

// 메시지 전송
const wsMessage = createWebSocketMessage(
  'TALK',
  'room-id',
  'user123',
  '안녕하세요!'
);
stompClient.sendMessage(wsMessage);

// 정리
unsubscribeStatus();
unsubscribeMessage();
stompClient.disconnect();
```

## 주요 기능

### REST API
- `createChatRoom`: 채팅방 생성
- `getChatMessages`: 채팅 메시지 조회 (이력)
- `getChatRooms`: 채팅방 목록 조회

### WebSocket (STOMP)
- 자동 재연결 (exponential backoff)
- 토큰 기반 인증
- 구독 관리 (자동 해제)
- 메시지 큐 (연결 실패 시 대기)
- 낙관적 UI 업데이트 지원

### useChat 훅
- REST + WebSocket 통합 관리
- React Query 캐싱
- 자동 구독/해제
- 낙관적 업데이트
- 메시지 정렬 및 중복 방지
