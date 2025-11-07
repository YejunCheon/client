'use client';

import React, { useEffect, useState } from 'react';
import { ContractPreviewSection } from '@/components/contract/ContractPreviewSection';
import { ContractSummarySection } from '@/components/contract/ContractSummarySection';
import { ContractEvidenceSection } from '@/components/contract/ContractEvidenceSection';
import { ContractSignSection } from '@/components/contract/ContractSignSection';
import { RejectReasonDialog } from '@/components/contract/RejectReasonDialog';
import { Button } from '@/components/ui/button';
import { useBuyerContractSign } from '@/hooks/use-buyer-contract-sign';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/store/auth';
import { Check, X } from 'lucide-react';
import { useIsClient } from '@/hooks/use-is-client';
import { useRouter } from 'next/navigation';

export default function BuyerContractSignPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const {
    formData,
    summary,
    evidence,
    signatureImage,
    loading,
    error,
    rationale,
    fetchContractDetail,
    handleSignatureUpload,
    handleSignatureRemove,
    acceptContract,
    rejectContract,
  } = useBuyerContractSign();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>('');

  // 페이지 로드 시 계약서 상세 정보 가져오기
  useEffect(() => {
    if (!isClient || !isAuthenticated || !user) return;
    if (hasInitialized) return;

    const initializeContract = async () => {
      try {
        setIsInitialLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const roomIdParam = urlParams.get('roomId') || '';

        if (!roomIdParam) {
          console.error('필수 파라미터가 없습니다: roomId');
          alert('잘못된 접근입니다. roomId가 필요합니다.');
          setIsInitialLoading(false);
          return;
        }

        setRoomId(roomIdParam);

        console.log('계약서 상세 정보 조회 시작:', { buyerId: user.id, roomId: roomIdParam });

        // 계약서 상세 정보 가져오기
        await fetchContractDetail({
          buyerId: user.id,
          roomId: roomIdParam,
          deviceInfo: navigator.userAgent,
        });

        console.log('계약서 상세 정보 조회 완료');
        setHasInitialized(true);
      } catch (err) {
        console.error('계약서 상세 정보 조회 실패:', err);
        alert('계약서를 불러오는데 실패했습니다.');
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
          <p className="text-lg font-semibold text-gray-700">계약서를 불러오는 중입니다...</p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // 계약 수락 처리
  const handleAccept = async () => {
    if (!signatureImage) {
      alert('서명을 등록해주세요.');
      return;
    }

    const confirmed = confirm('계약을 체결하시겠습니까? 서명 후에는 취소할 수 없습니다.');
    if (!confirmed) return;

    try {
      await acceptContract({
        buyerId: user?.id ?? '',
        roomId,
        deviceInfo: navigator.userAgent,
      });

      alert('계약이 체결되었습니다.');
      router.push('/contracts/list');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약 체결에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // 계약 거절 처리
  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    try {
      await rejectContract({
        buyerId: user?.id ?? '',
        roomId,
        reason,
        deviceInfo: navigator.userAgent,
      });

      alert('수정 요청이 판매자에게 전달되었습니다.');
      setIsRejectDialogOpen(false);
      router.push('/contracts/list');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '수정 요청에 실패했습니다.';
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
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-[32px] font-bold text-[#222222]">계약서 검토 및 서명</h1>
          <p className="text-[16px] text-[#666666] mt-2">
            계약 내용을 꼼꼼히 확인하신 후 서명해주세요. 수정이 필요한 경우 수정 요청을 보낼 수 있습니다.
          </p>
        </div>

        <div className="flex items-start justify-between gap-10">
          {/* Left: Contract Preview (Read-only) */}
          <div className="flex-shrink-0 w-[706px]">
            <ContractPreviewSection
              contractData={formData}
              // onChange를 전달하지 않아 읽기 전용으로 동작
              isAIGenerated={true}
              rationale={rationale || undefined}
            />
          </div>

          {/* Right: Summary, Evidence, and Sign */}
          <div className="flex-shrink-0 w-[706px] flex flex-col gap-[58px]">
            {/* Summary Section */}
            <ContractSummarySection summary={summary} isLoading={loading} />

            {/* Evidence Section */}
            <ContractEvidenceSection evidence={evidence} isLoading={loading} />

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
                variant="outline"
                onClick={handleReject}
                disabled={loading}
                className="border-[#e74c3c] text-[#e74c3c] hover:bg-[#e74c3c] hover:text-white rounded-[15px] px-5 py-[11px] text-[18px] font-bold flex items-center gap-2"
              >
                <X className="w-6 h-6" />
                수정 요청
              </Button>
              <Button
                onClick={handleAccept}
                disabled={loading || !signatureImage}
                className="bg-[#27ae60] text-white hover:bg-[#229954] rounded-[15px] px-5 py-[11px] text-[18px] font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-6 h-6" />
                계약 체결
              </Button>
            </div>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
        </div>
      </div>

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onSubmit={handleRejectSubmit}
        loading={loading}
      />
    </div>
  );
}
