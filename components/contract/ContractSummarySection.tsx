'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';

interface ContractSummarySectionProps {
  summary?: string;
  isLoading?: boolean;
  className?: string;
}

export function ContractSummarySection({
  summary = '',
  isLoading = false,
  className,
}: ContractSummarySectionProps) {
  return (
    <div
      className={cn(
        'relative bg-gradient-to-br from-[#f8f9ff] via-[#fefeff] to-[#f5f8ff] rounded-[28px] px-9 py-[34px] h-[502px] flex flex-col gap-[10px] border border-[#e8ecff] shadow-sm',
        className
      )}
    >
      {/* AI Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
          요약
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white">AI 생성</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
            <p className="text-[14px] text-[#767676]">AI가 계약서를 분석하고 있습니다...</p>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="relative">
              {/* Animated gradient line */}
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6366f1] via-[#8b5cf6] to-transparent rounded-full opacity-60" />

              {/* Summary content */}
              <div className="text-[16px] leading-[28px] text-[#222222] whitespace-pre-wrap pl-2">
                {summary}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#6366f1]" />
            </div>
            <p className="text-[14px] text-[#767676]">
              계약서가 작성되면 AI가 자동으로<br />
              요약을 생성합니다
            </p>
          </div>
        )}
      </div>

      {/* Bottom info */}
      {summary && !isLoading && (
        <div className="pt-3 border-t border-[#e8ecff]">
          <p className="text-[12px] text-[#999999] text-center">
            AI가 생성한 요약은 참고용이며, 실제 계약 내용을 반드시 확인해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
