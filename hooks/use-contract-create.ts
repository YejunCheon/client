import { useState, useCallback } from 'react';
import type { 
  ContractData, 
  ContractDataLegacy,
  ContractCreateResponse,
  CreateContractRequest, 
} from '@/types/contract';
import { api } from '@/lib/api';

// UI 폼 데이터 구조 (새로운 API 구조와 매핑)
export interface ContractFormData {
  // other_terms.technical_specs
  category?: string;
  // item_details.name
  productName?: string;
  // payment.price
  price?: string;
  // payment.price_method
  priceMethod?: string;
  // payment.payment_method, payment.payment_schedule
  paymentMethod?: string;
  paymentSchedule?: string;
  // delivery.method, delivery.schedule
  deliveryMethod?: string;
  deliverySchedule?: string;
  // item_details.condition_and_info
  itemCondition?: string;
  // refund_policy.details
  returnPolicy?: string;
  // dispute_resolution.details
  disputeResolution?: string;
  // cancellation_policy.details
  breachOfContract?: string;
  // other_terms.general_terms
  otherTerms?: string;
  // escrow.details (청약철회 및 계약해제)
  escrow?: string;
}

// 필수 필드 검증
const REQUIRED_FIELDS: (keyof ContractFormData)[] = [
  'category',
  'productName',
  'price',
  'paymentMethod',
  'deliveryMethod',
];

export function useContractCreate() {
  const [formData, setFormData] = useState<ContractFormData>({});
  const [summary, setSummary] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rationale, setRationale] = useState<{
    reason: {
      item_details?: string;
      payment?: string;
      delivery?: string;
      cancellation_policy?: string;
      contract_date?: string;
      dispute_resolution?: string;
      escrow?: string;
      other_terms?: string;
      parties?: string;
      refund_policy?: string;
    };
  } | null>(null);

  const updateField = useCallback((field: keyof ContractFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null); // 필드 변경 시 에러 초기화
  }, []);

  const handleSummaryChange = useCallback((value: string) => {
    setSummary(value);
  }, []);

  const handleSignatureUpload = useCallback((file: File) => {
    setSignatureImage(file);
  }, []);

  const handleSignatureRemove = useCallback(() => {
    setSignatureImage(null);
  }, []);

  // 새로운 API 구조의 ContractData를 폼 데이터로 변환
  const loadAIGeneratedContract = useCallback((contract: ContractData) => {
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
    setIsAIGenerated(true);
  }, []);

  // 기존 ContractDataLegacy 구조 지원 (하위 호환성)
  const loadAIGeneratedContractLegacy = useCallback((contractData: ContractDataLegacy) => {
    setFormData({
      category: contractData.item?.name || '',
      productName: contractData.item?.name || '',
      price: contractData.payment?.price || '',
      paymentMethod: contractData.payment?.method || '',
      deliveryMethod: contractData.delivery?.location || contractData.delivery?.method || '',
      itemCondition: contractData.item?.condition || '',
      returnPolicy: '계약내용과 일치하는 한 단순 변심에 의한 반품 및 교환 불가능',
      breachOfContract: '3일 안에 미발송시 매수인에게 계약금을 환불해줘야해요',
    });
    setIsAIGenerated(true);
  }, []);

  // 필수 필드 검증
  const validateForm = useCallback((): string | null => {
    for (const field of REQUIRED_FIELDS) {
      if (!formData[field]?.trim()) {
        const fieldNames: Record<string, string> = {
          category: '카테고리',
          productName: '거래품목/모델명',
          price: '매매금액',
          paymentMethod: '지불 방법',
          deliveryMethod: '거래 방법',
        };
        return `${fieldNames[field]}를 입력해주세요.`;
      }
    }
    if (!signatureImage) {
      return '서명 이미지를 등록해주세요.';
    }
    return null;
  }, [formData, signatureImage]);

  const saveDraft = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 로컬 스토리지에 임시 저장
      const draftData = {
        formData,
        summary,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('contract_draft', JSON.stringify(draftData));
      
      // TODO: 서버에 임시 저장할 경우
      // await api.contracts.saveDraft?.(draftData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '임시 저장에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formData, summary]);

  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem('contract_draft');
      if (saved) {
        const draftData = JSON.parse(saved);
        setFormData(draftData.formData || {});
        setSummary(draftData.summary || '');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const submitContract = useCallback(async (request: CreateContractRequest) => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      throw new Error(validationError);
    }

    setLoading(true);
    setError(null);
    try {
      // 계약서 데이터 구성
      const contractData = {
        ...formData,
        summary,
      };

      const response = await api.contracts.create({
        ...request,
        roomId: request.roomId ?? '',
      });

      // 새로운 API 응답 구조 처리
      if (response && 'contract' in response) {
        loadAIGeneratedContract(response.contract);
        if (response.summary?.final_summary) {
          setSummary(response.summary.final_summary);
        }
        if (response.rationale) {
          setRationale(response.rationale);
        }
      }
      // 기존 API 응답 구조 처리 (하위 호환성)
      else if (response && 'isSuccess' in response && response.isSuccess && typeof response.data === 'object') {
        loadAIGeneratedContractLegacy(response.data as ContractDataLegacy);
        if (response.summary) {
          setSummary(response.summary);
        }
      }

      console.log('계약서 제출:', { contractData, request, response });

      // 성공 시 로컬 스토리지 초기화
      localStorage.removeItem('contract_draft');
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약서 제출에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formData, summary, validateForm, loadAIGeneratedContract]);

  return {
    formData,
    summary,
    signatureImage,
    isAIGenerated,
    loading,
    error,
    rationale,
    updateField,
    setSummary: handleSummaryChange,
    handleSignatureUpload,
    handleSignatureRemove,
    loadAIGeneratedContract,
    loadAIGeneratedContractLegacy,
    saveDraft,
    loadDraft,
    submitContract,
    validateForm,
  };
}
