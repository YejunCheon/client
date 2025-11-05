import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import type { ChatPreview, ChatMessage } from "@/types/chat";
import type { ProductResponse } from "@/types/product";

function toDisplayPrice(price?: string) {
  if (!price) {
    return "가격 정보 없음";
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return `${numericPrice.toLocaleString()}원`;
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "방금 전";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "방금 전";
  }
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes}분 전`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}시간 전`;
  }

  return date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function toNumber(value: number | string | undefined): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function resolveChatPreview(room: {
  roomId: string;
  sellerId: number | string;
  buyerId: number | string;
  productId: number | string;
  updatedAt?: string;
}, viewerId: string): Promise<ChatPreview> {
  const numericProductId = toNumber(room.productId);

  const [productRes, messagesRes] = await Promise.all([
    numericProductId != null
      ? api.products.get(numericProductId)
      : Promise.resolve({
          success: false,
          product: undefined,
        } as ProductResponse),
    api.chat.getMessages({
      roomId: room.roomId,
      userId: viewerId,
      seller: room.sellerId,
      buyer: room.buyerId,
      productId: room.productId,
    }),
  ]);

  const product = productRes.success ? productRes.product : undefined;
  const messages = messagesRes.success ? messagesRes.messages : [];

  const lastMessage: ChatMessage | undefined =
    [...messages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

  const counterpartRole =
    String(room.sellerId) === viewerId ? "buyer" : "seller" as ChatPreview["counterpartRole"];

  const counterpartId =
    counterpartRole === "buyer" ? room.buyerId : room.sellerId;

  let counterpartName = counterpartRole === "buyer" ? "구매자" : "판매자";
  const numericCounterpartId = toNumber(counterpartId);

  if (numericCounterpartId != null) {
    try {
      const memberRes = await api.members.getProfile(numericCounterpartId);
      if (memberRes.success) {
        counterpartName = memberRes.member.name;
      }
    } catch {
      counterpartName =
        counterpartRole === "buyer"
          ? `구매자 #${String(counterpartId)}`
          : `판매자 #${String(counterpartId)}`;
    }
  } else {
    counterpartName =
      counterpartRole === "buyer"
        ? `구매자 #${String(counterpartId)}`
        : `판매자 #${String(counterpartId)}`;
  }

  return {
    roomId: room.roomId,
    productName: product?.productName ?? `상품 #${String(room.productId)}`,
    productImage: product?.productImage ?? "/assets/mock_product_img.png",
    price: toDisplayPrice(product?.price),
    counterpartName,
    counterpartRole,
    lastMessage: lastMessage?.content ?? "최근 메시지가 없습니다.",
    lastMessageAt: formatTimestamp(lastMessage?.timestamp ?? room.updatedAt),
    unreadCount: 0,
    status: "IN_PROGRESS",
  };
}

export function useChatPreviews(userId: string | null) {
  const chatRoomsQuery = useQuery({
    queryKey: ["chatRooms", userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      const response = await api.chat.getRooms({ userId });
      return response.rooms ?? [];
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const previewsQuery = useQuery({
    queryKey: [
      "chatRoomPreviews",
      userId,
      chatRoomsQuery.data?.map((room) => room.roomId) ?? [],
    ],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      const rooms = chatRoomsQuery.data ?? [];
      return Promise.all(
        rooms.map((room) => resolveChatPreview(room, userId))
      );
    },
    enabled: Boolean(userId) && Boolean(chatRoomsQuery.data?.length),
    staleTime: 30 * 1000,
  });

  const previews = useMemo(
    () => previewsQuery.data ?? [],
    [previewsQuery.data]
  );

  return {
    rooms: chatRoomsQuery.data ?? [],
    isRoomsLoading: chatRoomsQuery.isLoading,
    isRoomsFetching: chatRoomsQuery.isFetching,
    previews,
    previewsQuery,
  };
}
