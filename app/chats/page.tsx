"use client";

import React, { useMemo, useState } from "react";
import { ChatPreview, ChatProgressStatus } from "@/types";
import { ChatListCard } from "@/components/chat/ChatListCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const mockChatRooms: ChatPreview[] = [
  {
    roomId: "A1001",
    productName: "Keychron K4 V2 기계식 키보드",
    productImage: "/assets/mock_product_img.png",
    price: "120,000원",
    counterpartName: "김민수",
    counterpartRole: "buyer",
    lastMessage: "오늘 저녁 8시에 경기대 입구에서 만나는 일정 괜찮으신가요?",
    lastMessageAt: "오늘 오후 2:33",
    unreadCount: 2,
    status: "IN_PROGRESS",
  },
  {
    roomId: "A1002",
    productName: "2022 맥북 에어 M2 16GB",
    productImage: "/assets/mock_product_img.png",
    price: "1,200,000원",
    counterpartName: "이서연",
    counterpartRole: "seller",
    lastMessage: "계약서 초안 확인했습니다. 서명 후 바로 전달드릴게요!",
    lastMessageAt: "오늘 오전 11:12",
    unreadCount: 0,
    status: "CONTRACT_PENDING",
  },
  {
    roomId: "A1003",
    productName: "아이폰 14 프로 256GB",
    productImage: "/assets/mock_product_img.png",
    price: "1,350,000원",
    counterpartName: "박재현",
    counterpartRole: "buyer",
    lastMessage: "입금 완료했습니다. 확인되면 계약 마무리해주세요.",
    lastMessageAt: "어제 오후 6:20",
    unreadCount: 5,
    status: "IN_PROGRESS",
  },
  {
    roomId: "A1004",
    productName: "LG UltraFine 5K 모니터",
    productImage: "/assets/mock_product_img.png",
    price: "800,000원",
    counterpartName: "정지윤",
    counterpartRole: "seller",
    lastMessage: "물건 잘 받았습니다. 다음에 또 거래해요!",
    lastMessageAt: "3일 전",
    unreadCount: 0,
    status: "COMPLETED",
  },
];

const filters = [
  { id: "IN_PROGRESS" satisfies ChatProgressStatus, label: "거래 진행중" },
  { id: "CONTRACT_PENDING" satisfies ChatProgressStatus, label: "계약 대기" },
  { id: "COMPLETED" satisfies ChatProgressStatus, label: "거래 완료" },
  { id: "all", label: "전체" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export default function ChatsPage() {
  const { isAuthenticated } = useAuthGuard();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>(filters[0].id);

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  const filteredChats = useMemo(() => {
    const normalizedKeyword = searchTerm.trim().toLowerCase();

    return mockChatRooms.filter((chat) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        `${chat.productName} ${chat.counterpartName} ${chat.lastMessage}`
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesFilter = activeFilter === "all" || chat.status === activeFilter;

      return matchesKeyword && matchesFilter;
    });
  }, [activeFilter, searchTerm]);

  const groupedChats = useMemo(() => {
    const groupOrder: ChatProgressStatus[] = ["IN_PROGRESS", "CONTRACT_PENDING", "COMPLETED"];

    return groupOrder.map((status) => ({
      status,
      title:
        status === "IN_PROGRESS"
          ? "거래 진행중"
          : status === "CONTRACT_PENDING"
          ? "계약 대기"
          : "거래 완료",
      items: filteredChats.filter((chat) => chat.status === status),
    }));
  }, [filteredChats]);

  const activeCount = filteredChats.length;
  const totalCount = mockChatRooms.length;

  return (
    <div className="w-full py-10">
      <div className="mx-auto w-full max-w-[1100px] px-5">
        <div className="mb-8 flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold leading-tight text-[#222]">진행중인 거래</h1>
              <p className="mt-2 text-[15px] text-[#787878]">
                {activeFilter === "all"
                  ? `총 ${totalCount}건 중 ${activeCount}건이 검색 조건과 일치합니다.`
                  : `총 ${totalCount}건 중 ${activeCount}건의 채팅이 선택한 조건에 해당합니다.`}
              </p>
            </div>
            <div className="w-full max-w-[320px]">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="채팅방, 상품명 또는 상대를 검색하세요"
                className="h-11 rounded-xl border-[#e0e0e0] text-[14px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[14px] font-medium transition-all",
                  activeFilter === filter.id
                    ? "border-[#222] bg-[#222] text-white shadow-sm"
                    : "border-[#dfdfdf] bg-white text-[#5d5d5d] hover:border-[#222] hover:text-[#222]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filteredChats.length > 0 ? (
          activeFilter === "all" ? (
            <div className="flex flex-col gap-10">
              {groupedChats.map((group) => {
                if (group.items.length === 0) return null;

                return (
                  <section key={group.status} className="flex flex-col gap-4">
                    <h2 className="text-[20px] font-semibold text-[#333]">{group.title}</h2>
                    <div className="grid gap-4">
                      {group.items.map((chat) => (
                        <ChatListCard key={chat.roomId} chat={chat} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredChats.map((chat) => (
                <ChatListCard key={chat.roomId} chat={chat} />
              ))}
            </div>
          )
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dbdbdb] bg-[#fafafa]">
            <p className="text-[18px] font-semibold text-[#444]">표시할 채팅이 없습니다.</p>
            <p className="text-[14px] text-[#8c8c8c]">다른 조건을 선택하거나 검색어를 확인해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
