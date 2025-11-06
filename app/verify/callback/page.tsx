"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { useIsClient } from "@/hooks/use-is-client";

const VERIFY_TOKEN_STORAGE_KEY = "dealchain:verify_token";
const VERIFY_STATE_STORAGE_KEY = "dealchain:verify_state";

type CallbackStatus = "loading" | "success" | "error";

export default function VerifyCallbackPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const verifyTtlSeconds = config.verifyTokenTtlSeconds;

  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState<string>("본인인증 결과를 확인하는 중입니다.");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearState = () => {
      window.sessionStorage.removeItem(VERIFY_STATE_STORAGE_KEY);
      window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
    };

    const replaceHistory = () => {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", config.verifyCallbackPath);
      }
    };

    const updateResult = (nextStatus: CallbackStatus, nextMessage: string) => {
      startTransition(() => {
        setStatus(nextStatus);
        setMessage(nextMessage);
      });
    };

    let redirectTimer: number | null = null;

    const storedTokenRaw = window.sessionStorage.getItem(VERIFY_TOKEN_STORAGE_KEY);

    const showSuccessFromStoredToken = () => {
      if (!storedTokenRaw) return false;
      try {
        const storedToken = JSON.parse(storedTokenRaw) as {
          token?: string;
          issuedAt?: number;
        };
        if (!storedToken?.token) {
          return false;
        }
        updateResult(
          "success",
          `본인인증이 완료되었습니다. ${verifyTtlSeconds}초 이내에 회원가입을 완료해주세요.`
        );
        redirectTimer = window.setTimeout(() => {
          router.replace("/auth?mode=signup");
        }, 1200);
        return true;
      } catch {
        window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
        return false;
      }
    };

    if (errorParam) {
      clearState();
      replaceHistory();
      updateResult("error", "본인인증이 취소되었거나 실패했습니다. 다시 시도해주세요.");
      return;
    }

    if (!token || !state) {
      if (showSuccessFromStoredToken()) {
        return;
      }
      clearState();
      replaceHistory();
      updateResult("error", "필수 파라미터가 누락되었습니다. 본인인증을 다시 진행해주세요.");
      return;
    }

    const storedStateRaw = window.sessionStorage.getItem(VERIFY_STATE_STORAGE_KEY);

    if (!storedStateRaw) {
      if (showSuccessFromStoredToken()) {
        replaceHistory();
        return;
      }
      clearState();
      replaceHistory();
      updateResult("error", "State 정보가 만료되었거나 존재하지 않습니다. 다시 인증해주세요.");
      return;
    }

    try {
      const storedState = JSON.parse(storedStateRaw) as {
        value: string;
        createdAt: number;
      };

      if (storedState.value !== state) {
        clearState();
        replaceHistory();
        updateResult("error", "State 값이 일치하지 않습니다. 요청을 다시 시작해주세요.");
        return;
      }

      window.sessionStorage.setItem(
        VERIFY_TOKEN_STORAGE_KEY,
        JSON.stringify({
          token,
          issuedAt: Date.now(),
        })
      );

      window.sessionStorage.removeItem(VERIFY_STATE_STORAGE_KEY);
      replaceHistory();

      updateResult(
        "success",
        `본인인증이 완료되었습니다. ${verifyTtlSeconds}초 이내에 회원가입을 완료해주세요.`
      );

      redirectTimer = window.setTimeout(() => {
        router.replace("/auth?mode=signup");
      }, 1200);
    } catch {
      clearState();
      replaceHistory();
      updateResult("error", "본인인증 정보를 확인하는 중 오류가 발생했습니다. 다시 시도해주세요.");
    }

    return () => {
      if (redirectTimer !== null) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [errorParam, router, state, token, verifyTtlSeconds]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold text-neutral-900">본인인증</h1>
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-[#4a4a5a]"
          }`}
        >
          {message}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => router.replace("/auth?mode=signup")}
          className="h-9 bg-[#030213] text-sm text-white hover:bg-[#030213]/90"
        >
          회원가입으로 이동
        </Button>
        <Button
          variant="outline"
          onClick={() => router.replace("/auth?mode=login")}
          className="h-9 border-[#d9d9e3] text-sm"
        >
          로그인 페이지
        </Button>
      </div>
    </div>
  );
}
