"use client";

import ChatRoom from "@/components/chat/ChatRoom";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useAuthStore } from "@/lib/store/auth";
import { useProduct } from "@/hooks/use-products";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { normalizeImageUrl } from "@/lib/utils";
import { useIsClient } from "@/hooks/use-is-client";

export default function ChatRoomPage() {
  const isClient = useIsClient();
  const { isAuthenticated } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const roomId = params.roomId as string;
  
  const { 
    chatRooms, 
    currentRoomId, 
    selectRoom, 
    messages, 
    sendMessage, 
    connectWebSocket,
    isWebSocketConnected 
  } = useChat(user?.id?.toString() || null);

  // 현재 채팅방 정보 찾기
  const currentRoom = useMemo(() => {
    return chatRooms.find((room) => room.roomId === roomId);
  }, [chatRooms, roomId]);

  // 상품 정보 가져오기
  const productId = currentRoom?.productId;
  const { data: productData } = useProduct(productId ?? null, {
    enabled: !!productId,
  });

  // 채팅방 선택 및 WebSocket 연결
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const initializeChat = async () => {
      if (!isWebSocketConnected) {
        try {
          // HTTP-only 쿠키가 자동으로 전달되므로 토큰 파라미터 불필요
          await connectWebSocket();
        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          return;
        }
      }

      if (roomId !== currentRoomId) {
        selectRoom(roomId);
      }
    };

    initializeChat();
  }, [roomId, user?.id, currentRoomId, selectRoom, connectWebSocket, isWebSocketConnected]);

  // 메시지 형식 변환
  const formattedMessages = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.messageId?.toString() || msg.clientMessageId || Date.now().toString(),
      text: msg.content || msg.message || "",
      senderId: msg.senderId.toString(),
      isOwn: msg.senderId.toString() === user?.id?.toString(),
      timestamp: msg.timestamp ? formatTimestamp(msg.timestamp) : "",
    }));
  }, [messages, user?.id]);

  // 사용자가 판매자인지 구매자인지 확인
  const isSeller = useMemo(() => {
    if (!currentRoom || !user?.id) return false;
    return user.id.toString() === currentRoom.sellerId.toString();
  }, [currentRoom, user?.id]);

  // 메시지 전송 핸들러
  const handleSendMessage = (text: string) => {
    if (roomId) {
      sendMessage(roomId, text);
    }
  };

  // 판매자: 계약서 초안 작성하기 (기존 로직)
  const handleCreateContract = () => {
    if (!currentRoom || !user?.id) return;
    
    const buyerId = user.id.toString() === currentRoom.sellerId.toString() 
      ? currentRoom.buyerId.toString() 
      : currentRoom.sellerId.toString();
    
    router.push(`/contracts/create?roomId=${roomId}&buyerId=${buyerId}&productId=${productId}`);
  };

  // 구매자: 계약서 작성 제안하기
  const handleRequestContractCreation = async () => {
    if (!currentRoom || !user?.id || !productId) return;
    
    try {
      const { api } = await import('@/lib/api');
      await api.chat.requestContractCreation({
        roomId,
        sellerId: currentRoom.sellerId,
        buyerId: currentRoom.buyerId,
        productId,
      });
      alert('판매자에게 계약서 작성 요청이 전송되었습니다.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '요청 전송에 실패했습니다.';
      alert(errorMessage);
    }
  };

  if (!isClient || !isAuthenticated) {
    return null; // 리다이렉트 중
  }

  const product = productData?.product;
  const numericPrice = product?.price ? Number(product.price) : null;
  const formattedPrice = numericPrice && !Number.isNaN(numericPrice)
    ? numericPrice.toLocaleString()
    : product?.price || "";

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6">
      <div className="mx-auto max-w-[1400px] w-full px-5 flex-1 flex flex-col min-h-0">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* 왼쪽 영역: 상품 정보 */}
          <div className="flex-shrink-0 w-[380px]">
            {product ? (
              <div className="bg-white rounded-[27px] p-6 shadow-sm">
                {/* 상품 이미지 */}
                <div className="relative h-[240px] w-full mb-5 overflow-hidden rounded-lg">
                  <Image
                    src={normalizeImageUrl(product.productImage)}
                    alt={product.productName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* 상품 정보 */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#222] mb-2 line-clamp-2">
                      {product.productName}
                    </h2>
                    <div className="flex items-end gap-1">
                      <span className="text-[24px] font-bold text-[#222]">
                        {formattedPrice}
                      </span>
                      <span className="text-[18px] font-bold text-[#222] mb-[2px]">
                        원
                      </span>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="h-px bg-[#dedede] w-full" />

                  {/* 계약서 작성하기 설명 */}
                  <div className="bg-[#f9f9f9] rounded-[15px] p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-[#2487f8] shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[14px] font-bold text-[#222]">
                          계약서 작성하기
                        </h3>
                        <p className="text-[12px] leading-[18px] text-[#767676]">
                          채팅 내용을 바탕으로 AI가 계약서 초안을 자동 생성합니다. 
                          간편한 전자서명으로 법적 효력이 있는 계약서를 완성하세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 계약서 작성하기 버튼 */}
                  {isSeller ? (
                    <button
                      onClick={handleCreateContract}
                      className="bg-[#2487f8] rounded-[15px] px-5 py-[11px] flex items-center justify-center gap-2 text-white hover:bg-[#1e6fd8] transition-colors w-full"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[16px] font-bold leading-[26px]">
                        계약서 초안 작성하기
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestContractCreation}
                      className="bg-[#2487f8] rounded-[15px] px-5 py-[11px] flex items-center justify-center gap-2 text-white hover:bg-[#1e6fd8] transition-colors w-full"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[16px] font-bold leading-[26px]">
                        계약서 작성 제안하기
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[27px] p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-[240px] bg-slate-200 rounded-lg" />
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                  <div className="h-px bg-slate-200" />
                  <div className="h-12 bg-slate-200 rounded-[15px]" />
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 영역: 채팅 */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <ChatRoom 
              messages={formattedMessages} 
              onSend={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 타임스탬프 포맷팅 함수
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  } catch {
    return "";
  }
}
