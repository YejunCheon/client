import React from 'react';
import { cn } from '@/lib/utils';

interface PriceInputFieldProps {
  deposit?: string;
  balance?: string;
  onDepositChange?: (value: string) => void;
  onBalanceChange?: (value: string) => void;
  placeholder?: string;
}

export function PriceInputField({
  deposit = '',
  balance = '',
  onDepositChange,
  onBalanceChange,
  placeholder = '금액을 입력하세요',
}: PriceInputFieldProps) {
  // 숫자만 입력받고 천단위 콤마 추가
  const formatNumber = (value: string): string => {
    const numValue = value.replace(/[^\d]/g, '');
    if (!numValue) return '';
    return Number(numValue).toLocaleString('ko-KR');
  };

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    onDepositChange?.(formatNumber(value));
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    onBalanceChange?.(formatNumber(value));
  };

  return (
    <div className="flex flex-col gap-[23px]">
      <label className="text-[22px] font-bold leading-[30px] text-[#222222]">
        매매금액
      </label>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col text-[16px] leading-[24px] text-[#222222] min-w-[81px] pt-2">
          <p>계약금</p>
          <p className="mt-4">잔금</p>
        </div>
        <div className="flex-1">
          <div className="border border-[#acacac] rounded-[5px] h-[80px] px-3 py-2 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deposit}
                onChange={handleDepositChange}
                placeholder={placeholder}
                className="flex-1 text-[16px] leading-[24px] text-[#222222] bg-transparent border-none outline-none"
              />
              {deposit && <span className="text-[16px] leading-[24px] text-[#222222] whitespace-nowrap">원 정</span>}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={balance}
                onChange={handleBalanceChange}
                placeholder={placeholder}
                className="flex-1 text-[16px] leading-[24px] text-[#222222] bg-transparent border-none outline-none"
              />
              {balance && <span className="text-[16px] leading-[24px] text-[#222222] whitespace-nowrap">원 정</span>}
            </div>
            {!deposit && !balance && (
              <p className="text-[16px] text-[#acacac]">{placeholder}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

