import { useEffect, useState } from 'react';
import { socketManager, createStompMessage } from '@/lib/sockets';
import type { MessageType } from '@/types/chat';

export function useRoomPresence(roomId: string, senderId: string | number) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    const socket = socketManager.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      
      // ENTER 메시지 전송
      socket.emit('chat', createStompMessage('ENTER', roomId, senderId, '입장했습니다.'));
      
      socket.on('chat', (data: any) => {
        if (data.type === 'ENTER') {
          setParticipants((prev) => new Set([...prev, data.senderId]));
        } else if (data.type === 'LEAVE') {
          setParticipants((prev) => {
            const next = new Set(prev);
            next.delete(data.senderId);
            return next;
          });
        }
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.emit('chat', createStompMessage('LEAVE', roomId, senderId, '나갔습니다.'));
    };
  }, [roomId, senderId]);

  return { isConnected, participants };
}

