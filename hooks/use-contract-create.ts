import { useState, useCallback } from 'react';
import type { ContractData, CreateContractRequest, CreateContractResponse } from '@/types/contract';
import { apiClient } from '@/lib/api-client';

export interface ContractFormData {
  category?: string;
  productName?: string;
  modelName?: string;
  deposit?: string;
  balance?: string;
  paymentMethod?: string;
  deliveryInfo?: string;
  itemCondition?: string;
  returnPolicy?: string;
  disputeResolution?: string;
  breachOfContract?: string;
  otherTerms?: string;
}

// 필수 필드 검증
const REQUIRED_FIELDS: (keyof ContractFormData)[] = [
  'category',
  'productName',
  'deposit',
  'paymentMethod',
  'deliveryInfo',
];

export function useContractCreate() {
  const [formData, setFormData] = useState<ContractFormData>({});
  const [summary, setSummary] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadAIGeneratedContract = useCallback((contractData: ContractData) => {
    setFormData({
      category: contractData.item?.name || '',
      productName: contractData.item?.name || '',
      deposit: contractData.payment?.price || '',
      paymentMethod: contractData.payment?.method || '',
      deliveryInfo: contractData.delivery?.location || contractData.delivery?.method || '',
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
          deposit: '계약금',
          paymentMethod: '지불 방법 및 시기',
          deliveryInfo: '거래 시기 및 장소',
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
      // await apiClient.post('/api/contracts/draft', draftData);
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

      // TODO: 실제 API 호출
      // FormData로 서명 이미지와 함께 전송
      // const formData = new FormData();
      // formData.append('contract', JSON.stringify(contractData));
      // formData.append('signature', signatureImage);
      // formData.append('sellerId', request.sellerId);
      // formData.append('buyerId', request.buyerId);
      // if (request.roomId) formData.append('roomId', request.roomId);
      // if (request.deviceInfo) formData.append('deviceInfo', request.deviceInfo);
      
      // const response = await apiClient.postMultipart<CreateContractResponse>(
      //   '/api/contracts/create',
      //   formData
      // );

      console.log('계약서 제출:', { contractData, request });
      
      // 성공 시 로컬 스토리지 초기화
      localStorage.removeItem('contract_draft');
      
      // return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '계약서 제출에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [formData, summary, signatureImage, validateForm]);

  return {
    formData,
    summary,
    signatureImage,
    isAIGenerated,
    loading,
    error,
    updateField,
    setSummary: handleSummaryChange,
    handleSignatureUpload,
    handleSignatureRemove,
    loadAIGeneratedContract,
    saveDraft,
    loadDraft,
    submitContract,
    validateForm,
  };
}

