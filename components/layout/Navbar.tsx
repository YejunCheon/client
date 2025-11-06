"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

  const handleLogout = async () => {
    await logout();
    router.push("/");
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
