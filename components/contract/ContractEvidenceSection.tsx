'use client';

import React from 'react';

interface ContractEvidenceSectionProps {
  evidence?: string;
  isLoading?: boolean;
}

export function ContractEvidenceSection({
  evidence,
  isLoading = false,
}: ContractEvidenceSectionProps) {
  return (
    <div className="bg-[#f9f9f9] rounded-[28px] p-6 w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
          법적 근거
        </h2>
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
            AI 생성
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : evidence ? (
          <div className="bg-white rounded-[18px] p-5 text-[15px] leading-[24px] text-[#333333] whitespace-pre-wrap">
            {evidence}
          </div>
        ) : (
          <div className="bg-white rounded-[18px] p-5 text-[15px] leading-[24px] text-[#999999] text-center">
            법적 근거를 불러오는 중입니다...
          </div>
        )}
      </div>
    </div>
  );
}
