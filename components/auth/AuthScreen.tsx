"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { login, register } from "@/lib/auth-api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, UserCircle, FileImage, Phone, PenTool } from "lucide-react";
import { SignaturePadModal } from "@/components/signature/SignaturePadModal";

interface AuthScreenProps {
  initialMode?: "login" | "signup";
  returnUrl?: string;
}

export default function AuthScreen({ initialMode = "login", returnUrl }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  
  const [loginData, setLoginData] = useState({
    name: "",
    residentNumber: "",
    phoneNumber: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    residentNumber: "",
    phoneNumber: "",
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

  const handleSignatureFromModal = (file: File) => {
    setSignupData((prev) => ({ ...prev, signatureImage: file }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        // 로그인
        if (!loginData.name || !loginData.residentNumber || !loginData.phoneNumber) {
          setError("모든 필드를 입력해주세요.");
          setIsLoading(false);
          return;
        }

        const response = await login({
          name: loginData.name,
          residentNumber: loginData.residentNumber,
          phoneNumber: loginData.phoneNumber,
        });

        if (response.success) {
          // JWT는 HttpOnly 쿠키로 설정되므로 클라이언트에서 직접 저장하지 않음
          // 유저 정보만 저장
          const user = {
            id: response.memberId.toString(),
            name: response.name,
            verified: false,
          };
          // 토큰은 서버에서 HttpOnly 쿠키로 설정되므로 빈 문자열이나 더미 값 사용
          setAuth(user, "");
          // returnUrl이 있으면 원래 페이지로, 없으면 홈으로
          router.push(returnUrl || "/");
        } else {
          setError(response.message || "로그인에 실패했습니다.");
        }
      } else {
        // 회원가입
        if (!signupData.name || !signupData.residentNumber || !signupData.phoneNumber) {
          setError("모든 필드를 입력해주세요.");
          setIsLoading(false);
          return;
        }

        if (!signupData.signatureImage) {
          setError("서명 이미지를 업로드하거나 직접 서명해주세요.");
          setIsLoading(false);
          return;
        }

        const response = await register({
          name: signupData.name,
          residentNumber: signupData.residentNumber,
          phoneNumber: signupData.phoneNumber,
          signatureImage: signupData.signatureImage,
        });

        if (response.success) {
          // 회원가입 성공 후 자동 로그인
          const user = {
            id: response.memberId.toString(),
            name: response.name,
            verified: false,
          };
          // 회원가입 후 자동 로그인 처리 (서버에서 쿠키 설정)
          setAuth(user, "");
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
                    이름
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="name"
                      type="text"
                      value={loginData.name}
                      onChange={handleLoginInputChange}
                      placeholder="이름을 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    주민등록번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="residentNumber"
                      type="text"
                      value={loginData.residentNumber}
                      onChange={handleLoginInputChange}
                      placeholder="주민등록번호를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="phoneNumber"
                      type="tel"
                      value={loginData.phoneNumber}
                      onChange={handleLoginInputChange}
                      placeholder="전화번호를 입력하세요"
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
                    주민등록번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="residentNumber"
                      type="text"
                      value={signupData.residentNumber}
                      onChange={handleSignupInputChange}
                      placeholder="주민등록번호를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
                    <Input
                      name="phoneNumber"
                      type="tel"
                      value={signupData.phoneNumber}
                      onChange={handleSignupInputChange}
                      placeholder="전화번호를 입력하세요"
                      required
                      className="pl-10 bg-[#f3f3f5] border-0 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[14px] text-neutral-950">
                    서명 이미지
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182] pointer-events-none" />
                      <Input
                        name="signatureImage"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="pl-10 bg-[#f3f3f5] border-0 h-9 cursor-pointer"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      variant="outline"
                      className="h-9 px-4 flex items-center gap-2 whitespace-nowrap"
                    >
                      <PenTool className="size-4" />
                      직접 서명하기
                    </Button>
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

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureFromModal}
        title="서명하기"
      />
    </div>
  );
}
