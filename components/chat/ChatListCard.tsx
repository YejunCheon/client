"use client";

import Image from "next/image";
import Link from "next/link";
import { ChatPreview } from "@/types";

interface ChatListCardProps {
  chat: ChatPreview;
}

const counterpartRoleLabel: Record<ChatPreview["counterpartRole"], string> = {
  buyer: "구매자",
  seller: "판매자",
};

export function ChatListCard({ chat }: ChatListCardProps) {
  const unreadBadge =
    typeof chat.unreadCount === "number" && chat.unreadCount > 0
      ? chat.unreadCount > 99
        ? "99+"
        : chat.unreadCount.toString()
      : null;

  return (
    <Link
      href={`/chat/${chat.roomId}`}
      className="group block rounded-2xl border border-[#eaeaea] bg-white p-5 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start gap-5">
        <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-xl bg-[#f3f3f3]">
          <Image
            alt={chat.productName}
            src={chat.productImage}
            width={78}
            height={78}
            className="size-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[18px] font-semibold text-[#222]">{chat.productName}</p>
              <p className="text-[15px] font-medium text-[#5a5a5a]">{chat.price}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-[13px] text-[#a3a3a3]">{chat.lastMessageAt}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f6f6] px-3 py-1">
              <span className="text-[12px] font-medium text-[#565656]">
                {counterpartRoleLabel[chat.counterpartRole]}
              </span>
              <span className="text-[14px] font-semibold text-[#222]">{chat.counterpartName}</span>
            </div>
            {unreadBadge ? (
              <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#ff5a5a] px-2 text-[13px] font-semibold text-white">
                {unreadBadge}
              </span>
            ) : null}
          </div>

          <p
            className="text-[15px] leading-relaxed text-[#444]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {chat.lastMessage}
          </p>
        </div>
      </div>
    </Link>
  );
}
