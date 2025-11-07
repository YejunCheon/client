'use client';

import React, { useEffect, useState } from 'react';
import { ContractPreviewSection } from '@/components/contract/ContractPreviewSection';
import { ContractSummarySection } from '@/components/contract/ContractSummarySection';
import { ContractSignSection } from '@/components/contract/ContractSignSection';
import { Button } from '@/components/ui/button';
import { useContractCreate } from '@/hooks/use-contract-create';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Send } from 'lucide-react';
import { useIsClient } from '@/hooks/use-is-client';
import { useRouter } from 'next/navigation';

export default function ContractEditPage() {
  const isClient = useIsClient();
  const { isAuthenticated } = useAuthGuard();
  const router = useRouter();
  const { user } = useAuthStore();
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
    loadAIGeneratedContract,
    validateForm,
  } = useContractCreate();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!isClient || !isAuthenticated || !user) return;
    if (hasInitialized) return;

    const loadExistingContract = async () => {
      try {
        setIsInitialLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const buyerId = urlParams.get('buyerId') || '';
        const roomId = urlParams.get('roomId') || '';
        const sellerId = urlParams.get('sellerId') || user.id;

        if (!buyerId || !roomId) {
          console.error('필수 파라미터가 없습니다:', { buyerId, roomId });
          alert('필수 파라미터가 없습니다.');
          router.push('/contracts/list');
          return;
        }

        console.log('계약서 조회 API 호출 시작:', { sellerId, buyerId, roomId });

        // /search API를 사용해서 기존 계약서 불러오기
        let searchResponse;
        try {
          searchResponse = await api.contracts.search({
            sellerId,
            buyerId,
            roomId,
            deviceInfo: navigator.userAgent,
          });
        } catch (error: any) {
          // 403 오류 처리
          if (error?.response?.status === 403) {
            const errorMessage = 
              error?.response?.data?.message || 
              '해당 계약서를 수정할 권한이 없습니다. 판매자만 계약서를 수정할 수 있습니다.';
            alert(errorMessage);
            router.push('/contracts/list');
            return;
          }
          throw error;
        }

        if (!searchResponse.isSuccess) {
          throw new Error(searchResponse.message || '계약서를 불러오는데 실패했습니다.');
        }

        // 계약서 데이터가 있으면 폼에 로드
        if (searchResponse.data) {
          let parsedData;
          
          // data가 문자열인 경우 파싱
          if (typeof searchResponse.data === 'string') {
            try {
              parsedData = JSON.parse(searchResponse.data);
            } catch {
              parsedData = searchResponse.data;
            }
          } else {
            parsedData = searchResponse.data;
          }

          // ContractData 형식인지 확인하고 로드
          if (parsedData && typeof parsedData === 'object') {
            let contractData: any;
            
            // 응답이 { contract: {...} } 형식인 경우
            if ('contract' in parsedData && parsedData.contract) {
              contractData = parsedData.contract;
            }
            // 응답이 직접 ContractData 형식인 경우
            else if ('item_details' in parsedData || 'parties' in parsedData) {
              contractData = parsedData;
            }

            // ContractData 형식인지 확인하고 로드
            if (contractData && ('item_details' in contractData || 'parties' in contractData)) {
              loadAIGeneratedContract(contractData as any);
            }
          }
        }

        // 요약 정보가 있으면 설정
        if (searchResponse.summary) {
          // summary가 객체인 경우 final_summary 추출
          const summaryText = typeof searchResponse.summary === 'string' 
            ? searchResponse.summary 
            : (searchResponse.summary as any)?.final_summary || '';
          // summary는 useContractCreate hook에서 관리하므로 여기서는 로드만
        }

        console.log('계약서 조회 API 호출 완료');
        setHasInitialized(true);
      } catch (err: any) {
        console.error('계약서 조회 실패:', err);
        
        // 403 오류는 이미 처리됨
        if (err?.response?.status === 403) {
          setIsInitialLoading(false);
          return;
        }
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : err?.response?.data?.message || '계약서를 불러오는데 실패했습니다.';
        alert(errorMessage);
        router.push('/contracts/list');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadExistingContract();
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
          <p className="text-lg font-semibold text-gray-700">계약서를 불러오는 중...</p>
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
      const sellerId = urlParams.get('sellerId') || user?.id || '';

      if (!buyerId || !roomId) {
        alert('필수 파라미터가 없습니다.');
        return;
      }

      // 1단계: 계약서 수정 (edit API)
      await api.contracts.edit({
        sellerId,
        buyerId,
        roomId,
        deviceInfo: navigator.userAgent,
        editjson: JSON.stringify(formData),
      });

      // 2단계: 판매자 서명 등록
      const signResponse = await api.contracts.sign({
        roomId,
        productId: user?.id || '',
        deviceInfo: navigator.userAgent,
        contract: formData as any,
      });

      if (!signResponse.isSuccess) {
        throw new Error(signResponse.message || '판매자 서명 등록에 실패했습니다.');
      }

      // 3단계: 매수자에게 계약서 전달 및 상태 변경
      const sendResponse = await api.contracts.send({
        sellerId,
        buyerId,
        roomId,
        deviceInfo: navigator.userAgent,
      });

      if (!sendResponse.isSuccess) {
        throw new Error(sendResponse.message || '계약서 전달에 실패했습니다.');
      }

      alert('매수자에게 계약서가 전달되었습니다.');
      router.push('/contracts/list');
    } catch (err: any) {
      console.error('계약서 수정 실패:', err);
      
      // 403 오류 처리
      if (err?.response?.status === 403) {
        const errorMessage = 
          err?.response?.data?.message || 
          '계약서를 수정할 권한이 없습니다. 판매자만 계약서를 수정할 수 있습니다.';
        alert(errorMessage);
        router.push('/contracts/list');
        return;
      }
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : err?.response?.data?.message || '계약서 수정에 실패했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">계약서 수정</h1>
          <p className="mt-2 text-gray-600">계약서 내용을 수정하고 매수자에게 전달하세요.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <ContractPreviewSection
            contractData={formData}
            onChange={updateField}
            isAIGenerated={isAIGenerated}
            rationale={rationale || undefined}
          />

          <ContractSummarySection summary={summary} isLoading={loading} />

          <ContractSignSection
            signatureImage={signatureImage}
            onSignatureUpload={handleSignatureUpload}
            onSignatureRemove={handleSignatureRemove}
            finalSignDate={getFinalSignDate()}
          />

          <div className="flex gap-4">
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              임시 저장
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              매수자에게 전달
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

