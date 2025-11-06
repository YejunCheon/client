import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PriceInputFieldProps {
  deposit?: string;
  balance?: string;
  onDepositChange?: (value: string) => void;
  onBalanceChange?: (value: string) => void;
  placeholder?: string;
  tooltipContent?: string | string[];
}

export function PriceInputField({
  deposit = '',
  balance = '',
  onDepositChange,
  onBalanceChange,
  placeholder = '금액을 입력하세요',
  tooltipContent,
}: PriceInputFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="text-[22px] font-bold leading-[30px] text-[#222222]">
          매매금액
        </label>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex gap-3 flex-1 max-w-[calc(100%-48px)]">
          <div className="flex flex-col text-[16px] leading-[24px] text-[#222222] min-w-[81px] pt-2.5">
            <p>계약금</p>
            <p className="mt-4">잔금</p>
          </div>
          <div className="flex-1">
            <div className="border border-[#d1d5db] rounded-[8px] h-[88px] px-4 py-2.5 flex flex-col justify-center gap-2.5 bg-white hover:border-[#9ca3af] transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#2487f8] focus-within:ring-offset-0 focus-within:border-[#2487f8]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={deposit}
                  onChange={handleDepositChange}
                  placeholder={placeholder}
                  className="flex-1 text-[16px] leading-[24px] text-[#222222] bg-transparent border-none outline-none placeholder:text-[#9ca3af]"
                />
                {deposit && <span className="text-[16px] leading-[24px] text-[#222222] whitespace-nowrap">원</span>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={balance}
                  onChange={handleBalanceChange}
                  placeholder={placeholder}
                  className="flex-1 text-[16px] leading-[24px] text-[#222222] bg-transparent border-none outline-none placeholder:text-[#9ca3af]"
                />
                {balance && <span className="text-[16px] leading-[24px] text-[#222222] whitespace-nowrap">원</span>}
              </div>
              {!deposit && !balance && (
                <p className="text-[16px] text-[#9ca3af]">{placeholder}</p>
              )}
            </div>
          </div>
        </div>
        {tooltipContent && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2487f8] focus:ring-offset-1"
              aria-label="도움말"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#2487f8]"
              >
                <path
                  d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-4H8v-2h2v6zm0-7H9V6h2v2z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {showTooltip && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTooltip(false)}
                />
                <div className="absolute right-0 top-12 z-50 bg-white rounded-[12px] shadow-lg border border-[#e5e7eb] p-4 min-w-[200px] max-w-[280px]">
                  <div className="flex flex-col gap-2">
                    {Array.isArray(tooltipContent) ? (
                      tooltipContent.map((message, index) => (
                        <p
                          key={index}
                          className="text-[13px] leading-[18px] text-[#374151] font-medium"
                        >
                          {message}
                        </p>
                      ))
                    ) : (
                      <p className="text-[13px] leading-[18px] text-[#374151] font-medium">
                        {tooltipContent}
                      </p>
                    )}
                  </div>
                  <div className="absolute -top-1 right-4 w-3 h-3 bg-white border-l border-t border-[#e5e7eb] transform rotate-45"></div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

