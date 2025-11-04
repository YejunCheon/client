'use client';

import React, { useEffect } from 'react';
import { ContractPreviewSection } from '@/components/contract/ContractPreviewSection';
import { ContractSummarySection } from '@/components/contract/ContractSummarySection';
import { ContractSignSection } from '@/components/contract/ContractSignSection';
import { Button } from '@/components/ui/button';
import { useContractCreate } from '@/hooks/use-contract-create';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Send } from 'lucide-react';

export default function ContractCreatePage() {
  const { isAuthenticated } = useAuthGuard();
  const {
    formData,
    summary,
    signatureImage,
    isAIGenerated,
    loading,
    error,
    updateField,
    setSummary,
    handleSignatureUpload,
    handleSignatureRemove,
    saveDraft,
    loadDraft,
    submitContract,
    validateForm,
  } = useContractCreate();

  // 페이지 로드 시 임시 저장된 데이터 불러오기
  useEffect(() => {
    if (!isAuthenticated) return;
    const hasDraft = loadDraft();
    if (hasDraft) {
      // 사용자에게 불러올지 물어볼 수도 있음
    }
  }, [loadDraft, isAuthenticated]);

  if (!isAuthenticated) {
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

    try {
      // TODO: URL 파라미터나 쿼리에서 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const buyerId = urlParams.get('buyerId') || '';
      const roomId = urlParams.get('roomId') || '';
      
      await submitContract({
        sellerId: '', // TODO: 현재 사용자 ID (인증 스토어에서 가져오기)
        buyerId,
        roomId: roomId || undefined,
        deviceInfo: navigator.userAgent,
      });
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
    <div className="w-full min-h-screen bg-white py-[136px] px-10">
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
              onSummaryChange={setSummary}
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
                className="bg-[#2487f8] text-white hover:bg-[#1e6fc9] rounded-[15px] px-5 py-[11px] text-[18px] font-bold flex items-center gap-2"
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

