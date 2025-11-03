'use client';

import React from 'react';
import { ContractFormField } from './ContractFormField';
import { PriceInputField } from './PriceInputField';
import { WarningTooltip } from './WarningTooltip';

interface ContractPreviewSectionProps {
  contractData: {
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
  };
  onChange?: (field: string, value: string) => void;
  isAIGenerated?: boolean;
}

export function ContractPreviewSection({
  contractData,
  onChange,
  isAIGenerated = false,
}: ContractPreviewSectionProps) {
  const handleFieldChange = (field: string, value: string) => {
    onChange?.(field, value);
  };

  const handleDepositChange = (value: string) => {
    onChange?.('deposit', value);
  };

  const handleBalanceChange = (value: string) => {
    onChange?.('balance', value);
  };

  return (
    <div className="bg-[#f9f9f9] rounded-[28px] p-6 pl-8 w-full h-[1194px] flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
          계약서 미리보기
        </h2>
        {isAIGenerated && (
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
              AI가 작성한 초안
            </span>
          </div>
        )}
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
          />

          {/* Product Name / Model */}
          <ContractFormField
            label="거래품목/모델명"
            value={contractData.productName || contractData.modelName || ''}
            onChange={(value) => handleFieldChange('productName', value)}
            placeholder="예: 리코 GR3, MacBook Pro 등"
          />

          {/* Price */}
          <PriceInputField
            deposit={contractData.deposit || ''}
            balance={contractData.balance || ''}
            onDepositChange={handleDepositChange}
            onBalanceChange={handleBalanceChange}
          />

          {/* Payment Method */}
          <ContractFormField
            label="지불 방법 및 시기"
            value={contractData.paymentMethod || ''}
            onChange={(value) => handleFieldChange('paymentMethod', value)}
            placeholder="예: 매도인의 계좌(국민은행 0000-1234-5678)로 계좌이체"
          />

          {/* Delivery Info */}
          <ContractFormField
            label="언제 어디서 거래하실 건가요"
            value={contractData.deliveryInfo || ''}
            onChange={(value) => handleFieldChange('deliveryInfo', value)}
            placeholder="예: 2일 안에 우체국으로 송부"
          />

          {/* Item Condition */}
          <ContractFormField
            label="품목상태"
            value={contractData.itemCondition || ''}
            onChange={(value) => handleFieldChange('itemCondition', value)}
            placeholder="예: 우측 상단의 작은 기스, 1200 셔터 수, 23년 구입"
          />

          {/* Return Policy */}
          <ContractFormField
            label="반품 및 교환"
            value={contractData.returnPolicy || ''}
            onChange={(value) => handleFieldChange('returnPolicy', value)}
            multiline
            rows={2}
            placeholder="예: 계약내용과 일치하는 한 단순 변심에 의한 반품 및 교환 불가능"
          />

          {/* Dispute Resolution */}
          <ContractFormField
            label="분쟁 발생 시"
            value={contractData.disputeResolution || ''}
            onChange={(value) => handleFieldChange('disputeResolution', value)}
            placeholder="분쟁 발생 시 처리 방법을 입력하세요"
          />

          {/* Breach of Contract */}
          <ContractFormField
            label="계약의 미이행"
            value={contractData.breachOfContract || ''}
            onChange={(value) => handleFieldChange('breachOfContract', value)}
            multiline
            rows={3}
            placeholder="계약 미이행 시 처리 방법을 입력하세요"
          />

          {/* Other Terms */}
          <ContractFormField
            label="기타 조건"
            value={contractData.otherTerms || ''}
            onChange={(value) => handleFieldChange('otherTerms', value)}
            placeholder="추가 조건이 있다면 입력하세요"
          />
        </div>

        {/* Warning Tooltips */}
        <WarningTooltip
          messages={['계좌이체 주소를', '한번 더 확인하세요!']}
          position="top-right"
        />
        <WarningTooltip
          messages={['3일 안에 미발송시', '매수인에게 계약금을', '환불해줘야해요']}
          position="bottom-right"
        />
      </div>
    </div>
  );
}
