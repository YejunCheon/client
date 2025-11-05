"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { config } from "@/lib/config";
import { issueMockVerifyToken } from "@/mocks/verify-tokens";

function createMockCi(residentNumber: string): string {
  const digits = residentNumber.replace(/[^0-9]/g, "");
  if (!digits) return `MOCK-CI-${Date.now()}`;
  const hashInput = `${digits}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i += 1) {
    hash = (hash * 31 + hashInput.charCodeAt(i)) & 0xffffffff;
  }
  return `MOCK-CI-${digits.slice(0, 6)}-${Math.abs(hash)}`;
}

export default function MockVerifyStartPage() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");
  const verifyTtlSeconds = config.verifyTokenTtlSeconds;

  const [name, setName] = useState("");
  const [residentNumber, setResidentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReady = useMemo(() => Boolean(redirectUri && state), [redirectUri, state]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isReady) {
      setError("요청 정보가 올바르지 않습니다. 다시 시도해주세요.");
      return;
    }

    if (!name.trim() || !residentNumber.trim()) {
      setError("이름과 주민등록번호를 모두 입력해주세요.");
      return;
    }

    const normalizedResidentNumber = residentNumber.replace(/[^0-9]/g, "");

    if (normalizedResidentNumber.length < 13) {
      setError("주민등록번호를 정확히 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ci = createMockCi(normalizedResidentNumber);
      const record = issueMockVerifyToken({
        name: name.trim(),
        ci,
        ttlSeconds: verifyTtlSeconds,
      });

      let target: URL;
      try {
        target = new URL(redirectUri!);
      } catch {
        target = new URL(redirectUri!, window.location.origin);
      }

      target.searchParams.set("token", record.token);
      target.searchParams.set("state", state!);

      window.location.href = target.toString();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "토큰 발급 중 오류가 발생했습니다.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Mock 본인인증
          </h1>
          <p className="text-sm text-neutral-600">
            입력된 정보는 실제로 저장되지 않으며, 데모 환경에서만 사용됩니다.
          </p>
          <p className="text-xs text-neutral-400">
            발급된 토큰은 {verifyTtlSeconds}초 동안만 유효하며 1회성입니다.
          </p>
        </div>

        {!isReady && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            redirect_uri 또는 state 파라미터가 누락되었습니다.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-900">이름</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              required
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-900">
              주민등록번호
            </label>
            <Input
              value={residentNumber}
              onChange={(event) => setResidentNumber(event.target.value)}
              placeholder="900101-1234567"
              required
              className="h-10"
            />
            <p className="text-xs text-neutral-500">
              입력한 정보는 토큰 발급에만 사용되며 DealChain 서비스로 전달되지 않습니다.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isReady || isSubmitting}
            className="h-10 bg-[#030213] text-white hover:bg-[#030213]/90"
          >
            {isSubmitting ? "본인인증 처리 중..." : "본인인증 완료"}
          </Button>
        </form>
      </div>
    </div>
  );
}
