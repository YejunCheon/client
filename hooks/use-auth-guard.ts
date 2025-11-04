"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 * 로그인 후 원래 페이지로 돌아올 수 있도록 returnUrl 쿼리 파라미터 추가
 */
export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/auth?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, router, pathname]);

  return { isAuthenticated };
}

