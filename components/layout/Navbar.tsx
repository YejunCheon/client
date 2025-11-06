"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import NotificationCenter from "@/components/notification/NotificationCenter";
import { useNotification } from "@/hooks/use-notification";
import type { Notification } from "@/types/notification";

const imgLogo = "/assets/2bef342664b11de04b2130dfa1c435984d5241b1.svg";
const imgVectorStroke = "/assets/c76b9efec1aaf6868b3f07b078748d9f98bef3d9.svg";
const imgVectorStroke1 = "/assets/b0adf90a52df30c2883ca7ed591c1058a437da47.svg";

function IconSearch({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="absolute inset-[9.38%_23.01%_23.01%_9.38%]">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke} />
      </div>
      <div className="absolute inset-[62.95%_9.38%_9.38%_62.95%]">
        <img alt="" className="block max-w-none size-full" src={imgVectorStroke1} />
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, status, logout } = useAuthStore((state) => ({
    user: state.user,
    status: state.status,
    logout: state.logout,
  }));
  const shouldShowUser = !!user && status !== "unauthenticated";
  const router = useRouter();

  // 알림센터 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userId = user?.id || null;

  // 알림 훅
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotification(userId);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleNotificationClick = (notification: Notification) => {
    // 알림 타입에 따라 적절한 페이지로 이동
    if (notification.metadata?.roomId) {
      router.push(`/chat/${notification.metadata.roomId}`);
    } else if (notification.metadata?.contractId) {
      router.push(`/contracts/${notification.metadata.contractId}`);
    }
    setIsNotificationOpen(false);
  };

  return (
    <header className="w-full border-b border-blue-500/40">
      <div className="mx-auto w-full max-w-[1512px] flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 px-5 py-4">
        {/* 첫 번째 줄: 로고 + 네비게이션 (모바일) / 로고 (데스크탑) */}
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6">
          <Link href="/" className="h-[65px] w-[115px] flex-shrink-0">
            <img alt="DealChain" className="h-[65px] w-[115px]" src={imgLogo} />
          </Link>
          {/* 모바일 네비게이션 */}
          <nav className="flex items-center gap-4 md:hidden text-[16px] md:text-[18px] text-[#222]">
            <Link href="/" className="hover:font-bold transition-all cursor-pointer whitespace-nowrap">Home</Link>
            <Link href="/contracts/list" className="hover:font-bold transition-all cursor-pointer whitespace-nowrap">내 계약서</Link>
            <Link href="/chats" className="hover:font-bold transition-all cursor-pointer whitespace-nowrap">진행중인 거래</Link>
          </nav>
        </div>
        
        {/* 검색바: 모바일에서는 두 번째 줄, 데스크탑에서는 중앙 */}
        <div className="relative w-full md:w-full md:max-w-[601px] order-3 md:order-2">
          <input
            type="text"
            placeholder="기계식 키보드"
            className="h-[50px] w-full rounded-md border border-[#2487f8] pl-[15px] pr-[45px] text-[16px] md:text-[18px] leading-[26px] text-[#222] placeholder:text-[#767676] outline-none"
          />
          <IconSearch className="pointer-events-none absolute right-[13px] top-[13px] size-[24px]" />
        </div>
        
        {/* 데스크탑 네비게이션 + 인증 상태 */}
        <div className="hidden md:flex items-center gap-6 text-[18px] text-[#222] order-2 md:order-3">
          <nav className="flex items-center gap-8">
            <Link href="/" className="hover:font-bold transition-all cursor-pointer">Home</Link>
            <Link href="/contracts/list" className="hover:font-bold transition-all cursor-pointer">내 계약서</Link>
            <Link href="/chats" className="hover:font-bold transition-all cursor-pointer">진행중인 거래</Link>
          </nav>
          
          {/* 인증 상태에 따른 UI */}
          {shouldShowUser ? (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#e0e0e0]">
              {/* 알림 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="알림"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-[#222]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* 알림센터 모달 */}
                <NotificationCenter
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onNotificationClick={handleNotificationClick}
                />
              </div>

              <span className="text-[16px] font-medium text-[#222]">{user?.name}님</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-[14px] cursor-pointer"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center ml-4 pl-4 border-l border-[#e0e0e0]">
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push("/auth")}
                className="text-[14px] bg-[#030213] text-white hover:bg-[#030213]/90 cursor-pointer"
              >
                로그인/회원가입
              </Button>
            </div>
          )}
        </div>
        
        {/* 모바일 인증 상태 */}
        <div className="flex md:hidden items-center gap-3 order-4">
          {shouldShowUser ? (
            <>
              {/* 모바일 알림 버튼 */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="알림"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-[#222]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[14px] font-medium text-[#222]">{user?.name}님</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-[12px] cursor-pointer"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/auth")}
              className="text-[12px] bg-[#030213] text-white hover:bg-[#030213]/90 cursor-pointer"
            >
              로그인/회원가입
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
