"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileImage,
  Lock,
  PenTool,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePadModal } from "@/components/signature/SignaturePadModal";
import { SignaturePreview } from "@/components/signature/SignaturePreview";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { useAuthStore } from "@/lib/store/auth";

interface AuthScreenProps {
  initialMode?: "login" | "signup";
  returnUrl?: string;
}

const VERIFY_TOKEN_STORAGE_KEY = "dealchain:verify_token";
const VERIFY_STATE_STORAGE_KEY = "dealchain:verify_state";

interface StoredVerifyToken {
  token: string;
  issuedAt: number;
}

interface StoredVerifyState {
  value: string;
  createdAt: number;
}

function createNonce(bytes = 24): string {
  const buffer = new Uint8Array(bytes);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < buffer.length; i += 1) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function AuthScreen({
  initialMode = "login",
  returnUrl,
}: AuthScreenProps) {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();
  const verifyTtlSeconds = config.verifyTokenTtlSeconds;
  const verifyTtlMs = config.verifyTokenTtlSeconds * 1000;

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [loginData, setLoginData] = useState({
    userId: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
    name: "",
    signatureImage: null as File | null,
  });

  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verifyIssuedAt, setVerifyIssuedAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const hasVerifyToken = Boolean(verifyToken);
  const verifySecondsRemaining = hasVerifyToken
    ? Math.max(0, Math.ceil(timeRemaining / 1000))
    : 0;

  const clearVerifyToken = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
    }
    setVerifyToken(null);
    setVerifyIssuedAt(null);
    setTimeRemaining(0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem(VERIFY_TOKEN_STORAGE_KEY);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredVerifyToken;
      if (!stored.token || typeof stored.issuedAt !== "number") {
        window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
        return;
      }

      const elapsed = Date.now() - stored.issuedAt;
      if (elapsed >= verifyTtlMs) {
        window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
        return;
      }

      setVerifyToken(stored.token);
      setVerifyIssuedAt(stored.issuedAt);
      setTimeRemaining(verifyTtlMs - elapsed);
    } catch {
      window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
    }
  }, [verifyTtlMs]);

  useEffect(() => {
    if (!verifyToken || !verifyIssuedAt) {
      return;
    }

    const tick = () => {
      const remaining = verifyTtlMs - (Date.now() - verifyIssuedAt);
      if (remaining <= 0) {
        clearVerifyToken();
        setError((prev) =>
          prev ?? "본인인증 토큰이 만료되었습니다. 다시 인증해주세요."
        );
        return;
      }
      setTimeRemaining(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [verifyToken, verifyIssuedAt, verifyTtlMs, clearVerifyToken]);

  const handleLoginInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSignupInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSignupData((prev) => ({ ...prev, signatureImage: file }));
    setError(null);
  };

  const handleSignatureFromModal = (file: File) => {
    setSignupData((prev) => ({ ...prev, signatureImage: file }));
    setError(null);
  };

  const handleStartVerification = useCallback(() => {
    if (typeof window === "undefined") return;

    clearVerifyToken();

    const state = createNonce(24);
    const statePayload: StoredVerifyState = {
      value: state,
      createdAt: Date.now(),
    };

    window.sessionStorage.setItem(
      VERIFY_STATE_STORAGE_KEY,
      JSON.stringify(statePayload)
    );

    const callbackUrl = new URL(config.verifyCallbackPath, window.location.origin);
    const verifyUrl = new URL(config.verifyStartUrl, window.location.origin);

    verifyUrl.searchParams.set("redirect_uri", callbackUrl.toString());
    verifyUrl.searchParams.set("state", state);

    window.location.href = verifyUrl.toString();
  }, [clearVerifyToken]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    let shouldClearVerifyToken = false;

    try {
      if (mode === "login") {
        if (!loginData.userId || !loginData.password) {
          setError("아이디와 비밀번호를 모두 입력해주세요.");
          return;
        }

        const response = await api.members.login({
          userId: loginData.userId.trim(),
          password: loginData.password,
        });

        if (response.success && response.memberId && response.userId) {
          const user = {
            id: response.memberId.toString(),
            userId: response.userId,
            name: response.name ?? "",
            ci: response.ci,
            signatureImage: response.signatureImage ?? null,
            verified: true,
          };
          setAuth(user, response.token ?? "");
          router.push(returnUrl || "/");
        } else {
          setError(response.message || "로그인에 실패했습니다.");
        }
      } else {
        if (
          !signupData.userId ||
          !signupData.password ||
          !signupData.confirmPassword ||
          !signupData.name
        ) {
          setError("필수 정보를 모두 입력해주세요.");
          return;
        }

        if (signupData.password !== signupData.confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          return;
        }

        if (!signupData.signatureImage) {
          setError("서명 이미지를 업로드하거나 직접 서명해주세요.");
          return;
        }

        if (!verifyToken) {
          setError("본인인증을 완료한 후 회원가입을 진행해주세요.");
          return;
        }

        shouldClearVerifyToken = true;

        const response = await api.members.register({
          userId: signupData.userId.trim(),
          password: signupData.password,
          name: signupData.name.trim(),
          token: verifyToken,
          signatureImage: signupData.signatureImage,
        });

        if (response.success && response.memberId && response.userId && response.name) {
          const user = {
            id: response.memberId.toString(),
            userId: response.userId,
            name: response.name,
            ci: response.ci,
            signatureImage: response.signatureImage ?? null,
            verified: true,
          };
          setAuth(user, "");
          setSignupData({
            userId: "",
            password: "",
            confirmPassword: "",
            name: "",
            signatureImage: null,
          });
          router.push(returnUrl || "/");
        } else {
          setError(
            `${response.message || "회원가입에 실패했습니다."} 본인인증 토큰은 재사용할 수 없습니다. 다시 인증해주세요.`
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      if (shouldClearVerifyToken) {
        clearVerifyToken();
      }
    }
  };

  return (
    <div className="w-full py-16">
      <div className="mx-auto w-full max-w-[448px] rounded-[14px] bg-white">
        <div className="relative h-[69.98px] w-full shrink-0 px-6 pt-6">
          <div className="mb-2 h-[16.005px]">
            <p className="text-[16px] font-medium leading-[16px] text-neutral-950">
              환영합니다
            </p>
          </div>
          <div className="h-[24.001px]">
            <p className="text-[16px] font-normal leading-[24px] text-[#717182]">
              계정에 로그인하거나 새 계정을 만드세요
            </p>
          </div>
        </div>

        <div className="relative flex w-full shrink-0 flex-col gap-[19.997px] px-6 pb-6 pt-[19.997px]">
          <div className="relative w-full shrink-0 border-b border-[#e0e0e0]">
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`relative h-[35.991px] flex-1 text-center ${
                  mode === "login" ? "text-[#030213]" : "text-[#717182]"
                }`}
              >
                <p className="py-2 text-[14px] font-medium leading-[20px]">
                  로그인
                </p>
                {mode === "login" && (
                  <div className="absolute bottom-0 left-0 h-[1.991px] w-full bg-[#030213]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`relative h-[35.991px] flex-1 text-center ${
                  mode === "signup" ? "text-[#030213]" : "text-[#717182]"
                }`}
              >
                <p className="py-2 text-[14px] font-medium leading-[20px]">
                  회원가입
                </p>
                {mode === "signup" && (
                  <div className="absolute bottom-0 left-0 h-[1.991px] w-full bg-[#030213]" />
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    아이디
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="userId"
                      type="text"
                      value={loginData.userId}
                      onChange={handleLoginInputChange}
                      placeholder="아이디를 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      placeholder="비밀번호를 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    아이디
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="userId"
                      type="text"
                      value={signupData.userId}
                      onChange={handleSignupInputChange}
                      placeholder="아이디를 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="password"
                      type="password"
                      value={signupData.password}
                      onChange={handleSignupInputChange}
                      placeholder="비밀번호를 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={handleSignupInputChange}
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    이름
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                    <Input
                      name="name"
                      type="text"
                      value={signupData.name}
                      onChange={handleSignupInputChange}
                      placeholder="이름을 입력하세요"
                      required
                      className="h-9 border-0 bg-[#f3f3f5] pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    본인인증
                  </label>
                  <div className="flex flex-col gap-2 rounded-md border border-[#d9d9e3] bg-[#f7f7fb] p-3">
                    <div className="flex items-center gap-2">
                      {hasVerifyToken ? (
                        <>
                          <ShieldCheck className="size-5 text-emerald-600" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-950">
                              본인인증 완료
                            </span>
                            <span className="text-xs text-[#4a9079]">
                              남은 시간 {verifySecondsRemaining}초 · 토큰은 1회성입니다.
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="size-5 text-[#f59e0b]" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-950">
                              본인인증이 필요합니다
                            </span>
                            <span className="text-xs text-[#717182]">
                              인증 후 {verifyTtlSeconds}초 이내에 회원가입을 완료해주세요.
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        onClick={handleStartVerification}
                        variant="outline"
                        className="h-9 w-fit border-[#d9d9e3] px-4 text-sm"
                      >
                        {hasVerifyToken ? "다시 본인인증하기" : "본인인증하기"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-950">
                    서명 이미지
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileImage className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
                      <Input
                        name="signatureImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="h-9 cursor-pointer border-0 bg-[#f3f3f5] pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      variant="outline"
                      className="flex h-9 items-center gap-2 whitespace-nowrap px-4"
                    >
                      <PenTool className="size-4" />
                      직접 서명하기
                    </Button>
                  </div>
                  {signupData.signatureImage && (
                    <div className="mt-2">
                      <p className="mb-2 text-xs text-[#717182]">
                        선택된 파일: {signupData.signatureImage.name}
                      </p>
                      <SignaturePreview
                        signatureImage={signupData.signatureImage}
                        onRemove={() => {
                          setSignupData((prev) => ({
                            ...prev,
                            signatureImage: null,
                          }));
                          setError(null);
                        }}
                        width="100%"
                        height={200}
                        className="border border-[#dedede]"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-9 bg-[#030213] text-white hover:bg-[#030213]/90"
            >
              {isLoading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </form>
        </div>
      </div>

      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureFromModal}
        title="서명하기"
      />
    </div>
  );
}
