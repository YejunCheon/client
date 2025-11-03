'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ContractSummarySectionProps {
  summary?: string;
  onSummaryChange?: (summary: string) => void;
  className?: string;
}

export function ContractSummarySection({
  summary = '',
  onSummaryChange,
  className,
}: ContractSummarySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localSummary, setLocalSummary] = useState(summary);

  const handleBlur = () => {
    setIsEditing(false);
    onSummaryChange?.(localSummary);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <div
      className={cn(
        'bg-[#f9f9f9] rounded-[28px] px-9 py-[34px] h-[502px] flex flex-col gap-[10px]',
        className
      )}
    >
      <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
        요약
      </h2>
      <div className="flex-1 overflow-y-auto">
        {isEditing || onSummaryChange ? (
          <textarea
            value={localSummary || summary}
            onChange={(e) => {
              setLocalSummary(e.target.value);
              onSummaryChange?.(e.target.value);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="계약서 요약을 입력하거나 AI가 자동 생성한 요약을 확인하세요."
            className="w-full h-full text-[16px] leading-[24px] text-[#222222] bg-transparent border-none outline-none resize-none focus:ring-0 p-0"
          />
        ) : (
          <p className="text-[16px] leading-[24px] text-[#222222] whitespace-pre-wrap">
            {summary || (
              <span className="text-[#767676]">
                계약서 요약이 여기에 표시됩니다.
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
