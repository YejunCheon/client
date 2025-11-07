import { useState, useCallback } from 'react';
import type {
  ContractData,
  ContractSearchRequest,
  ContractSearchResponse,
  ContractSignRequest,
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

  // 계약서 상세 정보 가져오기 (/search API 사용)
  const fetchContractDetail = useCallback(async (request: ContractSearchRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response: ContractSearchResponse = await api.contracts.search(request);

      if (response.isSuccess || response.success) {
        // 계약 데이터 로드
        if (response.data) {
          if (typeof response.data === 'string') {
            try {
              // 실제 응답에서는 data가 ContractFormData 형식의 JSON 문자열로 옴
              const formData = JSON.parse(response.data);
              setFormData(formData);
            } catch (err) {
              console.error('계약서 데이터 파싱 실패:', err);
              setError('계약서 데이터 파싱에 실패했습니다.');
              return response;
            }
          } else {
            // 혹시 객체로 오는 경우
            setFormData(response.data as any);
          }
        }

        // 요약 정보 설정 - 실제 응답에서는 summary가 JSON 문자열로 옴
        if (response.summary) {
          if (typeof response.summary === 'string') {
            try {
              const summaryObj = JSON.parse(response.summary);
              setSummary(summaryObj.final_summary || '');
            } catch (err) {
              console.error('요약 데이터 파싱 실패:', err);
              setSummary('');
            }
          } else {
            setSummary((response.summary as any)?.final_summary || '');
          }
        }

        // evidence와 rationale은 /search API에서 제공되지 않으므로 빈 값으로 설정
        setEvidence('');
        setRationale(null);
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

  // 계약 수락 (서명) - /sign API 사용
  const acceptContract = useCallback(async (request: { roomId: string; buyerId: string; deviceInfo?: string }) => {
    if (!signatureImage) {
      setError('서명 이미지를 등록해주세요.');
      throw new Error('서명 이미지를 등록해주세요.');
    }

    setLoading(true);
    setError(null);
    try {
      // formData를 JSON 문자열로 변환
      const contractJson = JSON.stringify(formData);

      // /sign API 호출
      const signRequest: ContractSignRequest = {
        roomId: request.roomId,
        productId: request.buyerId, // buyerId를 productId로 사용
        contract: contractJson,
        deviceInfo: request.deviceInfo,
      };

      const response = await api.contracts.sign(signRequest);

      if (!response.isSuccess) {
        const errorMessage = typeof response.data === 'string' 
          ? response.data 
          : response.message || '계약 체결에 실패했습니다.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // bothSign이 true이면 양측 모두 서명 완료
      if (response.bothSign) {
        console.log('양측 모두 서명 완료 - 계약 체결 완료');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약 체결에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signatureImage, formData]);

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
