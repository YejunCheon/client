"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function ContractsPage() {
  const { isAuthenticated } = useAuthGuard();

  if (!isAuthenticated) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-[1512px] px-5">
        <h1 className="text-[32px] font-bold text-[#222] mb-8">나의 계약서</h1>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-[18px] text-[#767676]">계약서 목록이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}

