"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { api } from "@/lib/api";

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 * 로그인 후 원래 페이지로 돌아올 수 있도록 returnUrl 쿼리 파라미터 추가
 * 
 * HttpOnly 쿠키가 있는 경우 localStorage의 사용자 정보로 프로필 API를 호출하여 인증 상태를 검증하고 복원
 */
export function useAuthGuard() {
  const { isAuthenticated, user, setUser, isVerifying, setVerifying } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // localStorage에서 사용자 정보 복원 후 프로필 검증
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('auth_user');
      if (userStr && !isAuthenticated) {
        setVerifying(true);
        try {
          const parsed = JSON.parse(userStr) as Partial<typeof user>;
          if (parsed?.id) {
            const userId = typeof parsed.id === 'string' ? parseInt(parsed.id, 10) : parsed.id;
            if (!isNaN(userId)) {
              // 프로필 API로 인증 상태 검증
              api.members.getProfile(userId)
                .then((response) => {
                  if (response.success && response.member) {
                    // 인증 성공 - 사용자 정보 업데이트
                    setUser({
                      id: String(response.member.memberId),
                      userId: response.member.id,
                      name: response.member.name,
                      ci: response.member.ci,
                      signatureImage: response.member.signatureImage ?? null,
                      verified: true,
                    });
                  } else {
                    // 인증 실패 - localStorage 정리
                    localStorage.removeItem('auth_user');
                  }
                })
                .catch(() => {
                  // API 호출 실패 - localStorage 정리하지 않음 (네트워크 오류일 수 있음)
                  // 대신 검증만 완료로 표시
                })
                .finally(() => {
                  setVerifying(false);
                });
              return; // 검증 중이므로 리다이렉트 방지
            }
          }
        } catch {
          localStorage.removeItem('auth_user');
        }
        setVerifying(false);
      } else {
        // localStorage에 사용자 정보가 없으면 검증 완료
        setVerifying(false);
      }
    }
  }, [isAuthenticated, user, setUser, setVerifying]);

  useEffect(() => {
    // 인증 검증이 완료되고 인증되지 않은 경우에만 리다이렉트
    if (!isAuthenticated && !isVerifying) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/auth?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isVerifying, router, pathname]);

  return { isAuthenticated: isAuthenticated || isVerifying };
}

