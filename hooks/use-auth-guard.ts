"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";

interface AuthGuardResult {
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * 인증이 필요한 클라이언트 컴포넌트에서 사용하는 훅
 * 전역 인증 스토어를 초기화하고, 인증되지 않은 경우 로그인 페이지로 이동시킨다.
 */
export function useAuthGuard(): AuthGuardResult {
  const router = useRouter();
  const pathname = usePathname();

  const { status, initialize } = useAuthStore((state) => ({
    status: state.status,
    initialize: state.initialize,
  }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const search = new URLSearchParams();
    if (pathname) {
      search.set("returnUrl", pathname);
    }
    const query = search.toString();
    router.push(query.length > 0 ? `/auth?${query}` : "/auth");
  }, [pathname, router, status]);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "idle" || status === "loading";

  return { isAuthenticated, isLoading };
}
