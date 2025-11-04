"use client";

import ChatRoom from "@/components/chat/ChatRoom";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function ChatRoomPage() {
  const { isAuthenticated } = useAuthGuard();

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-[725px] h-[963px]">
        <ChatRoom />
      </div>
    </div>
  );
}

