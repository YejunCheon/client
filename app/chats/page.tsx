"use client";

import React, { useMemo, useState } from "react";
import { ChatProgressStatus } from "@/types";
import { ChatListCard } from "@/components/chat/ChatListCard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/lib/store/auth";
import { useChatPreviews } from "@/hooks/use-chat-previews";
import { useIsClient } from "@/hooks/use-is-client";

const filters = [
  { id: "IN_PROGRESS" satisfies ChatProgressStatus, label: "거래 진행중" },
  { id: "CONTRACT_PENDING" satisfies ChatProgressStatus, label: "계약 대기" },
  { id: "COMPLETED" satisfies ChatProgressStatus, label: "거래 완료" },
  { id: "all", label: "전체" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export default function ChatsPage() {
  const isClient = useIsClient();
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const viewerId = user?.id ?? null;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>(filters[0].id);

  const { previews, previewsQuery } = useChatPreviews(viewerId);

  const filteredChats = useMemo(() => {
    const normalizedKeyword = searchTerm.trim().toLowerCase();

    return previews.filter((chat) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 ||
        `${chat.productName} ${chat.counterpartName} ${chat.lastMessage}`
          .toLowerCase()
          .includes(normalizedKeyword);

      const chatStatus = chat.status ?? "IN_PROGRESS";
      const matchesFilter = activeFilter === "all" || chatStatus === activeFilter;

      return matchesKeyword && matchesFilter;
    });
  }, [activeFilter, previews, searchTerm]);

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
      items: filteredChats.filter((chat) => (chat.status ?? "IN_PROGRESS") === status),
    }));
  }, [filteredChats]);

  const activeCount = filteredChats.length;
  const totalCount = previews.length;

  if (!isClient || !isAuthenticated) {
    return null; // 리다이렉트 중
  }

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

        {previewsQuery.isLoading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dbdbdb] bg-[#fafafa]">
            <p className="text-[18px] font-semibold text-[#444]">채팅 정보를 불러오는 중입니다.</p>
            <p className="text-[14px] text-[#8c8c8c]">잠시만 기다려주세요.</p>
          </div>
        ) : previewsQuery.isError ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#ffc5c5] bg-[#fff6f6]">
            <p className="text-[18px] font-semibold text-[#d73939]">채팅 정보를 불러오지 못했습니다.</p>
            <p className="text-[14px] text-[#d46b6b]">
              네트워크 상태를 확인한 뒤 새로고침 해주세요.
            </p>
          </div>
        ) : filteredChats.length > 0 ? (
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
            <p className="text-[18px] font-semibold text-[#444]">
              {previews.length === 0
                ? "진행중인 채팅이 없습니다."
                : "표시할 채팅이 없습니다."}
            </p>
            <p className="text-[14px] text-[#8c8c8c]">
              {previews.length === 0
                ? "상품을 보고 관심 있는 상대에게 먼저 말을 걸어보세요."
                : "다른 조건을 선택하거나 검색어를 확인해주세요."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
