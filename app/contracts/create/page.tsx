'use client';

import React, { useEffect, useState } from 'react';
import { ContractPreviewSection } from '@/components/contract/ContractPreviewSection';
import { ContractSummarySection } from '@/components/contract/ContractSummarySection';
import { ContractSignSection } from '@/components/contract/ContractSignSection';
import { Button } from '@/components/ui/button';
import { useContractCreate } from '@/hooks/use-contract-create';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/store/auth';
import { Send } from 'lucide-react';
import { useIsClient } from '@/hooks/use-is-client';

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
    rationale,
    updateField,
    handleSignatureUpload,
    handleSignatureRemove,
    saveDraft,
    loadDraft,
    createContractDraft,
    submitContract,
    validateForm,
  } = useContractCreate();
  const { user } = useAuthStore();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 페이지 로드 시 계약서 자동 생성
  useEffect(() => {
    if (!isClient || !isAuthenticated || !user) return;
    if (hasInitialized) return;

    const initializeContract = async () => {
      try {
        setIsInitialLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const buyerId = urlParams.get('buyerId') || '';
        const roomId = urlParams.get('roomId') || '';

        if (!buyerId || !roomId) {
          console.error('필수 파라미터가 없습니다:', { buyerId, roomId });
          setIsInitialLoading(false);
          return;
        }

        console.log('계약서 생성 API 호출 시작:', { sellerId: user.id, buyerId, roomId });

        // 계약서 생성 API 호출 (검증 없이)
        await createContractDraft({
          sellerId: user.id,
          buyerId,
          roomId,
          deviceInfo: navigator.userAgent,
        });

        console.log('계약서 생성 API 호출 완료');
        setHasInitialized(true);
      } catch (err) {
        console.error('계약서 생성 실패:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, isAuthenticated, user?.id]);

  if (!isClient || !isAuthenticated) {
    return null; // 리다이렉트 중
  }

  // 초기 로딩 화면
  if (isInitialLoading || loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-semibold text-gray-700">AI가 계약서를 생성하고 있습니다...</p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
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

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const buyerId = urlParams.get('buyerId') || '';
      const roomId = urlParams.get('roomId') || '';
      const productId = urlParams.get('productId') || '';

      if (!buyerId || !roomId) {
        alert('필수 파라미터가 없습니다.');
        return;
      }

      const { api } = await import('@/lib/api');

      // 1단계: 계약서 DB 업데이트
      await api.contracts.edit({
        roomId,
        contract: formData,
        deviceInfo: navigator.userAgent,
      });

      // 2단계: 판매자 서명 등록
      const signResponse = await api.contracts.sign({
        roomId,
        productId: productId || user?.id || '',
        deviceInfo: navigator.userAgent,
        contract: formData,
      });

      if (!signResponse.isSuccess) {
        throw new Error(signResponse.message || '판매자 서명 등록에 실패했습니다.');
      }

      // 3단계: 매수자에게 계약서 전달 및 상태 변경
      const sendResponse = await api.contracts.send({
        sellerId: user?.id ?? '',
        buyerId,
        roomId,
        deviceInfo: navigator.userAgent,
      });

      if (!sendResponse.isSuccess) {
        throw new Error(sendResponse.message || '계약서 전달에 실패했습니다.');
      }

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
              rationale={rationale || undefined}
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
                disabled={loading || !signatureImage}
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
