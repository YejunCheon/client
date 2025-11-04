"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { login, register } from "@/lib/auth-api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, UserCircle, FileImage } from "lucide-react";

interface AuthScreenProps {
  initialMode?: "login" | "signup";
  returnUrl?: string;
}

export default function AuthScreen({ initialMode = "login", returnUrl }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    signatureImage: null as File | null,
  });

  const { login: setAuth } = useAuthStore();
  const router = useRouter();

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignupData((prev) => ({ ...prev, signatureImage: file }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        // 로그인
        if (!loginData.username || !loginData.password) {
          setError("아이디와 비밀번호를 입력해주세요.");
          setIsLoading(false);
          return;
        }

        const response = await login({
          username: loginData.username,
          password: loginData.password,
        });

        if (response.success) {
          // 임시 토큰 생성 (실제로는 서버에서 받아와야 함)
          const token = `temp_token_${Date.now()}`;
          // 유저 정보 생성
          const user = {
            id: response.memberId.toString(),
            name: response.name,
            verified: false,
          };
          setAuth(user, token);
          // returnUrl이 있으면 원래 페이지로, 없으면 홈으로
          router.push(returnUrl || "/");
        } else {
          setError(response.message || "로그인에 실패했습니다.");
        }
      } else {
        // 회원가입
        if (!signupData.username || !signupData.password || !signupData.confirmPassword || !signupData.name) {
          setError("모든 필드를 입력해주세요.");
          setIsLoading(false);
          return;
        }

        if (signupData.password !== signupData.confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          setIsLoading(false);
          return;
        }

        if (!signupData.signatureImage) {
          setError("서명 이미지를 업로드해주세요.");
          setIsLoading(false);
          return;
        }

        const response = await register({
          username: signupData.username,
          password: signupData.password,
          name: signupData.name,
          signatureImage: signupData.signatureImage,
        });

        if (response.success) {
          // 회원가입 성공 후 자동 로그인
          const token = `temp_token_${Date.now()}`;
          const user = {
            id: response.memberId.toString(),
            name: response.name,
            verified: false,
          };
          setAuth(user, token);
          // returnUrl이 있으면 원래 페이지로, 없으면 홈으로
          router.push(returnUrl || "/");
        } else {
          setError(response.message || "회원가입에 실패했습니다.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-16">
      <div className="mx-auto w-full max-w-[448px] rounded-[14px] bg-white">
        <div className="h-[69.98px] relative shrink-0 w-full px-6 pt-6">
          <div className="h-[16.005px] mb-2">
            <p className="font-medium leading-[16px] text-[16px] text-neutral-950">
              환영합니다
            </p>
          </div>
          <div className="h-[24.001px]">
            <p className="font-normal leading-[24px] text-[#717182] text-[16px]">
              계정에 로그인하거나 새 계정을 만드세요
            </p>
          </div>
        </div>
        
        <div className="box-border content-stretch flex flex-col gap-[19.997px] pb-6 pt-[19.997px] px-6 relative shrink-0 w-full">
          {/* 탭 전환 */}
          <div className="border-[#e0e0e0] border-b relative shrink-0 w-full">
            <div className="flex">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`h-[35.991px] flex-1 text-center relative ${
                  mode === "login" ? "text-[#030213]" : "text-[#717182]"
                }`}
              >
                <p className="font-medium leading-[20px] text-[14px] py-2">
                  로그인
                </p>
                {mode === "login" && (
                  <div className="absolute bg-[#030213] h-[1.991px] left-0 bottom-0 w-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`h-[35.991px] flex-1 text-center relative ${
                  mode === "signup" ? "text-[#030213]" : "text-[#717182]"
                }`}
              >
                <p className="font-medium leading-[20px] text-[14px] py-2">
                  회원가입
                </p>
                {mode === "signup" && (
                  <div className="absolute bg-[#030213] h-[1.991px] left-0 bottom-0 w-full" />
                )}
              </button>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <>
                {/* 로그인 폼 */}
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    아이디
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="username"
                      type="text"
                      value={loginData.username}
                      onChange={handleLoginInputChange}
                      placeholder="아이디를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      placeholder="비밀번호를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 회원가입 폼 */}
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    아이디
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="username"
                      type="text"
                      value={signupData.username}
                      onChange={handleSignupInputChange}
                      placeholder="아이디를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="password"
                      type="password"
                      value={signupData.password}
                      onChange={handleSignupInputChange}
                      placeholder="비밀번호를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={handleSignupInputChange}
                      placeholder="비밀번호를 다시 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    이름
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="name"
                      type="text"
                      value={signupData.name}
                      onChange={handleSignupInputChange}
                      placeholder="이름을 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    서명 이미지
                  </label>
                  <div className="relative">
                    <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182] pointer-events-none" />
                    <Input
                      name="signatureImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9 cursor-pointer"
                    />
                  </div>
                  {signupData.signatureImage && (
                    <p className="text-xs text-[#717182]">
                      선택된 파일: {signupData.signatureImage.name}
                    </p>
                  )}
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#030213] text-white hover:bg-[#030213]/90 h-9 mt-2"
            >
              {isLoading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
