'use client';

import React from 'react';
import { ContractFormField } from './ContractFormField';

interface ContractPreviewSectionProps {
  contractData: {
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
    // escrow.details
    escrow?: string;
  };
  onChange?: (field: keyof ContractPreviewSectionProps['contractData'], value: string) => void;
  isAIGenerated?: boolean;
  readOnly?: boolean;
  rationale?: {
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
}

export function ContractPreviewSection({
  contractData,
  onChange,
  isAIGenerated = false,
  readOnly = false,
  rationale,
}: ContractPreviewSectionProps) {
  const AIBadge = ({ text = "AI가 작성한 초안" }: { text?: string }) => (
    <div className="backdrop-blur-[5px] bg-[rgba(62,160,254,0.1)] rounded-[12px] px-3 py-[10px] flex items-center gap-2">
      <div className="w-4 h-4 flex-shrink-0">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M8 0L10.1631 5.83694L16 8L10.1631 10.1631L8 16L5.83694 10.1631L0 8L5.83694 5.83694L8 0Z"
            fill="url(#starGradient)"
          />
          <defs>
            <linearGradient id="starGradient" x1="0" y1="0" x2="16" y2="0">
              <stop offset="0%" stopColor="#1778d5" />
              <stop offset="100%" stopColor="#11497f" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="text-[14px] font-semibold bg-gradient-to-r from-[#1778d5] to-[#11497f] bg-clip-text text-transparent">
        {text}
      </span>
    </div>
  );
  const handleFieldChange = (field: keyof ContractPreviewSectionProps['contractData'], value: string) => {
    onChange?.(field, value);
  };


  return (
    <div className="bg-[#f9f9f9] rounded-[28px] p-6 pl-8 w-full h-[1194px] flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
          계약서 미리보기
        </h2>
        {isAIGenerated && <AIBadge text="AI가 작성한 초안" />}
      </div>

      {/* Contract Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex flex-col gap-[23px] pb-8 pl-2 pr-4">
          {/* Category */}
          <ContractFormField
            label="카테고리"
            value={contractData.category || ''}
            onChange={(value) => handleFieldChange('category', value)}
            placeholder="예: 카메라, 노트북 등"
            tooltipContent="거래 품목의 카테고리를 명확히 구분하여 분쟁을 예방합니다."
            readOnly={readOnly}
          />

          {/* Product Name / Model */}
          <ContractFormField
            label="거래품목/모델명"
            value={contractData.productName || ''}
            onChange={(value) => handleFieldChange('productName', value)}
            placeholder="예: 리코 GR3, MacBook Pro 등"
            tooltipContent={rationale?.item_details || '정확한 모델명을 기재하여 거래 품목을 명확히 식별할 수 있도록 합니다.'}
            readOnly={readOnly}
          />

          {/* Item Condition */}
          <ContractFormField
            label="품목상태"
            value={contractData.itemCondition || ''}
            onChange={(value) => handleFieldChange('itemCondition', value)}
            placeholder="예: 우측 상단의 작은 기스, 1200 셔터 수, 23년 구입"
            tooltipContent={rationale?.item_details || '품목의 상태를 상세히 기록하여 거래 후 분쟁을 예방합니다.'}
            readOnly={readOnly}
          />

          {/* Price */}
          <ContractFormField
            label="매매금액"
            value={contractData.price || ''}
            onChange={(value) => handleFieldChange('price', value)}
            placeholder="예: 1,000,000원"
            tooltipContent={rationale?.payment || '매매금액을 명확히 기재합니다.'}
            readOnly={readOnly}
          />

          {/* Price Method */}
          <ContractFormField
            label="금액 지불 방법"
            value={contractData.priceMethod || ''}
            onChange={(value) => handleFieldChange('priceMethod', value)}
            placeholder="예: 계약금 300,000원, 잔금 700,000원"
            tooltipContent={rationale?.payment || '계약금과 잔금을 명확히 구분하여 지불 조건을 명시합니다.'}
            readOnly={readOnly}
          />

          {/* Payment Method */}
          <ContractFormField
            label="지불 방법"
            value={contractData.paymentMethod || ''}
            onChange={(value) => handleFieldChange('paymentMethod', value)}
            placeholder="예: 매도인의 계좌(국민은행 0000-1234-5678)로 계좌이체"
            tooltipContent={rationale?.payment || '지불 방법을 명확히 지정합니다.'}
            readOnly={readOnly}
          />

          {/* Payment Schedule */}
          <ContractFormField
            label="지불 시기"
            value={contractData.paymentSchedule || ''}
            onChange={(value) => handleFieldChange('paymentSchedule', value)}
            placeholder="예: 계약금은 계약 체결 시, 잔금은 배송 완료 후 3일 이내"
            tooltipContent={rationale?.payment || '지불 시기를 명확히 하여 분쟁을 예방합니다.'}
            readOnly={readOnly}
          />

          {/* Delivery Method */}
          <ContractFormField
            label="거래 방법"
            value={contractData.deliveryMethod || ''}
            onChange={(value) => handleFieldChange('deliveryMethod', value)}
            placeholder="예: 우체국 택배, 직거래 등"
            tooltipContent={rationale?.delivery || '거래 방법을 명확히 지정합니다.'}
            readOnly={readOnly}
          />

          {/* Delivery Schedule */}
          <ContractFormField
            label="거래 시기"
            value={contractData.deliverySchedule || ''}
            onChange={(value) => handleFieldChange('deliverySchedule', value)}
            placeholder="예: 2일 안에 우체국으로 송부"
            tooltipContent={rationale?.delivery || '거래 시기를 명확히 하여 분쟁을 예방합니다.'}
            readOnly={readOnly}
          />

          {/* Cancellation Policy (청약철회 및 계약해제) */}
          <ContractFormField
            label="청약철회 및 계약해제"
            value={contractData.escrow || ''}
            onChange={(value) => handleFieldChange('escrow', value)}
            multiline
            rows={2}
            placeholder="청약철회 및 계약해제 관련 조건을 입력하세요"
            tooltipContent={rationale?.escrow || '청약철회 및 계약해제 조건을 명확히 규정합니다.'}
            readOnly={readOnly}
          />

          {/* Return Policy */}
          <ContractFormField
            label="반품 및 교환"
            value={contractData.returnPolicy || ''}
            onChange={(value) => handleFieldChange('returnPolicy', value)}
            multiline
            rows={2}
            placeholder="예: 계약내용과 일치하는 한 단순 변심에 의한 반품 및 교환 불가능"
            tooltipContent={rationale?.refund_policy || '반품 및 교환 조건을 명확히 하여 향후 분쟁을 방지합니다.'}
            readOnly={readOnly}
          />

          {/* Dispute Resolution */}
          <ContractFormField
            label="분쟁 발생 시"
            value={contractData.disputeResolution || ''}
            onChange={(value) => handleFieldChange('disputeResolution', value)}
            placeholder="분쟁 발생 시 처리 방법을 입력하세요"
            tooltipContent={rationale?.dispute_resolution || '분쟁 발생 시 해결 절차를 명시하여 신속한 해결을 도모합니다.'}
            readOnly={readOnly}
          />

          {/* Breach of Contract */}
          <ContractFormField
            label="계약의 미이행"
            value={contractData.breachOfContract || ''}
            onChange={(value) => handleFieldChange('breachOfContract', value)}
            multiline
            rows={3}
            placeholder="계약 미이행 시 처리 방법을 입력하세요"
            tooltipContent={rationale?.cancellation_policy || '계약 미이행 시 책임과 보상 방법을 명확히 규정합니다.'}
            readOnly={readOnly}
          />

          {/* Other Terms */}
          <ContractFormField
            label="기타 조건"
            value={contractData.otherTerms || ''}
            onChange={(value) => handleFieldChange('otherTerms', value)}
            placeholder="추가 조건이 있다면 입력하세요"
            tooltipContent={rationale?.other_terms || '기타 특별한 조건이나 약속사항을 명시합니다.'}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
