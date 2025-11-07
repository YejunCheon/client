import { useState, useCallback } from 'react';
import type {
  ContractData,
  BuyerContractDetailRequest,
  BuyerContractDetailResponse,
  BuyerContractAcceptRequest,
  BuyerContractRejectRequest,
  ContractRationale,
} from '@/types/contract';
import { api } from '@/lib/api';
import type { ContractFormData } from './use-contract-create';

export function useBuyerContractSign() {
  const [formData, setFormData] = useState<ContractFormData>({});
  const [summary, setSummary] = useState<string>('');
  const [evidence, setEvidence] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState<ContractRationale | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  // ContractData를 폼 데이터로 변환
  const loadContractData = useCallback((contract: ContractData) => {
    setFormData({
      category: contract.other_terms?.technical_specs || '',
      productName: contract.item_details?.name || '',
      price: contract.payment?.price || '',
      priceMethod: contract.payment?.price_method || '',
      paymentMethod: contract.payment?.payment_method || '',
      paymentSchedule: contract.payment?.payment_schedule || '',
      deliveryMethod: contract.delivery?.method || '',
      deliverySchedule: contract.delivery?.schedule || '',
      itemCondition: contract.item_details?.condition_and_info || '',
      returnPolicy: contract.refund_policy?.details || '',
      disputeResolution: contract.dispute_resolution?.details || '',
      breachOfContract: contract.cancellation_policy?.details || '',
      otherTerms: contract.other_terms?.general_terms || '',
      escrow: contract.escrow?.details || '',
    });
    setContractData(contract);
  }, []);

  // 계약서 상세 정보 가져오기 (GET)
  const fetchContractDetail = useCallback(async (request: BuyerContractDetailRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response: BuyerContractDetailResponse = await api.contracts.buyerDetail(request);

      if (response.isSuccess) {
        // 계약 데이터 로드
        if (response.contractResponseDto?.contract) {
          loadContractData(response.contractResponseDto.contract);
        }

        // 요약 정보 설정
        if (response.summary?.final_summary) {
          setSummary(response.summary.final_summary);
        }

        // 근거 정보 설정
        if (response.evidence) {
          setEvidence(response.evidence);
        }

        // Rationale 설정
        if (response.rationaleResponseDto?.rational) {
          setRationale(response.rationaleResponseDto.rational);
        }
      } else {
        setError(response.message || '계약서를 불러오는데 실패했습니다.');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약서를 불러오는데 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContractData]);

  // 서명 이미지 업로드
  const handleSignatureUpload = useCallback((file: File) => {
    setSignatureImage(file);
  }, []);

  // 서명 이미지 제거
  const handleSignatureRemove = useCallback(() => {
    setSignatureImage(null);
  }, []);

  // 계약 수락 (서명)
  const acceptContract = useCallback(async (request: Omit<BuyerContractAcceptRequest, 'signatureImage'>) => {
    if (!signatureImage) {
      setError('서명 이미지를 등록해주세요.');
      throw new Error('서명 이미지를 등록해주세요.');
    }

    setLoading(true);
    setError(null);
    try {
      // 서명 이미지를 base64로 변환 (선택사항)
      const signatureImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(signatureImage);
      });

      const response = await api.contracts.buyerAccept({
        ...request,
        signatureImage: signatureImageBase64,
      });

      if (!response.isSuccess) {
        setError(response.message || '계약 체결에 실패했습니다.');
        throw new Error(response.message || '계약 체결에 실패했습니다.');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약 체결에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signatureImage]);

  // 계약 거절 (수정 요청)
  const rejectContract = useCallback(async (request: BuyerContractRejectRequest) => {
    if (!request.reason?.trim()) {
      setError('거절 사유를 입력해주세요.');
      throw new Error('거절 사유를 입력해주세요.');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.contracts.buyerReject(request);

      if (!response.isSuccess) {
        setError(response.message || '계약 거절에 실패했습니다.');
        throw new Error(response.message || '계약 거절에 실패했습니다.');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약 거절에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    formData,
    summary,
    evidence,
    signatureImage,
    loading,
    error,
    rationale,
    contractData,
    fetchContractDetail,
    handleSignatureUpload,
    handleSignatureRemove,
    acceptContract,
    rejectContract,
  };
}
