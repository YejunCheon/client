'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ContractPreviewSection } from '@/components/contract/ContractPreviewSection';
import { ContractSummarySection } from '@/components/contract/ContractSummarySection';
import { ContractSignSection } from '@/components/contract/ContractSignSection';
import { Button } from '@/components/ui/button';
import { useContractCreate } from '@/hooks/use-contract-create';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/store/auth';
import { Send } from 'lucide-react';
import { useIsClient } from '@/hooks/use-is-client';
import { config } from '@/lib/config';

const VERIFY_TOKEN_STORAGE_KEY = 'dealchain:verify_token';
const VERIFY_STATE_STORAGE_KEY = 'dealchain:verify_state';

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
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < buffer.length; i += 1) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function ContractCreatePage() {
  const isClient = useIsClient();
  const { isAuthenticated } = useAuthGuard();
  const {
    formData,
    summary,
    signatureImage,
    isAIGenerated,
    loading,
    error,
    updateField,
    handleSignatureUpload,
    handleSignatureRemove,
    saveDraft,
    loadDraft,
    submitContract,
    validateForm,
  } = useContractCreate();
  const { user } = useAuthStore();

  const verifyTtlSeconds = config.verifyTokenTtlSeconds;
  const verifyTtlMs = config.verifyTokenTtlSeconds * 1000;

  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verifyIssuedAt, setVerifyIssuedAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const hasVerifyToken = Boolean(verifyToken);
  const verifySecondsRemaining = hasVerifyToken
    ? Math.max(0, Math.ceil(timeRemaining / 1000))
    : 0;

  const clearVerifyToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(VERIFY_TOKEN_STORAGE_KEY);
    }
    setVerifyToken(null);
    setVerifyIssuedAt(null);
    setTimeRemaining(0);
  }, []);

  // 본인인증 토큰 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const raw = window.sessionStorage.getItem(VERIFY_TOKEN_STORAGE_KEY);
    if (!raw) return;

    try {
      const stored = JSON.parse(raw) as StoredVerifyToken;
      if (!stored.token || typeof stored.issuedAt !== 'number') {
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

  // 본인인증 타이머
  useEffect(() => {
    if (!verifyToken || !verifyIssuedAt) {
      return;
    }

    const tick = () => {
      const remaining = verifyTtlMs - (Date.now() - verifyIssuedAt);
      if (remaining <= 0) {
        clearVerifyToken();
        alert('본인인증 토큰이 만료되었습니다. 다시 인증해주세요.');
        return;
      }
      setTimeRemaining(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [verifyToken, verifyIssuedAt, verifyTtlMs, clearVerifyToken]);

  // 본인인증 시작 핸들러
  const handleStartVerification = useCallback(() => {
    if (typeof window === 'undefined') return;

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

    verifyUrl.searchParams.set('redirect_uri', callbackUrl.toString());
    verifyUrl.searchParams.set('state', state);

    window.location.href = verifyUrl.toString();
  }, [clearVerifyToken]);

  // 페이지 로드 시 임시 저장된 데이터 불러오기
  useEffect(() => {
    if (!isAuthenticated) return;
    const hasDraft = loadDraft();
    if (hasDraft) {
      // 사용자에게 불러올지 물어볼 수도 있음
    }
  }, [loadDraft, isAuthenticated]);

  if (!isClient || !isAuthenticated) {
    return null; // 리다이렉트 중
  }

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      alert('임시 저장되었습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '임시 저장에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!hasVerifyToken) {
      alert('본인인증을 완료한 후 계약서를 전달해주세요.');
      return;
    }

    try {
      // TODO: URL 파라미터나 쿼리에서 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const buyerId = urlParams.get('buyerId') || '';
      const roomId = urlParams.get('roomId') || '';

      await submitContract({
        sellerId: user?.id ?? '',
        buyerId,
        roomId: roomId || undefined,
        deviceInfo: navigator.userAgent,
      });

      clearVerifyToken(); // 계약서 전달 후 토큰 삭제
      alert('매수자에게 계약서가 전달되었습니다.');
      // 성공 시 리다이렉트 또는 모달 표시
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약서 전달에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // 최종 서명일 포맷팅 (예: 2025.10.17 09:32:32 mac os 카카오인증)
  const getFinalSignDate = (): string | undefined => {
    if (!signatureImage) return undefined;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const os = navigator.platform.includes('Mac') ? 'mac os' : 'windows';
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds} ${os} 카카오인증`;
  };

  const finalSignDate = getFinalSignDate();

  return (
    <div className="w-full min-h-screen bg-white pt-10 pb-10 px-10">
      <div className="mx-auto max-w-[1512px]">
        <div className="flex items-start justify-between gap-10">
          {/* Left: Contract Preview */}
          <div className="flex-shrink-0 w-[706px]">
            <ContractPreviewSection
              contractData={formData}
              onChange={updateField}
              isAIGenerated={isAIGenerated}
            />
          </div>

          {/* Right: Summary and Sign */}
          <div className="flex-shrink-0 w-[706px] flex flex-col gap-[58px]">
            {/* Summary Section */}
            <ContractSummarySection
              summary={summary}
              isLoading={loading}
            />

            {/* Sign Section */}
            <ContractSignSection
              signatureImage={signatureImage}
              onSignatureUpload={handleSignatureUpload}
              onSignatureRemove={handleSignatureRemove}
              finalSignDate={finalSignDate}
              hasVerifyToken={hasVerifyToken}
              verifySecondsRemaining={verifySecondsRemaining}
              onVerify={handleStartVerification}
            />

            {/* Action Buttons */}
            <div className="flex gap-[19px] items-center">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={loading}
                className="bg-[#767676] text-white hover:bg-[#666666] rounded-[15px] px-5 py-[11px] text-[18px] font-bold"
              >
                임시 저장
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !signatureImage || !hasVerifyToken}
                className="bg-[#2487f8] text-white hover:bg-[#1e6fc9] rounded-[15px] px-5 py-[11px] text-[18px] font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                매수자에게 계약서 전달
                <Send className="w-6 h-6" />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
