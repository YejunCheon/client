import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ContractFormFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  onChange?: (value: string) => void;
  className?: string;
  readOnly?: boolean;
  showBorder?: boolean;
  tooltipContent?: string | string[];
}

export function ContractFormField({
  label,
  value = '',
  placeholder,
  multiline = false,
  rows = 3,
  onChange,
  className,
  readOnly = false,
  showBorder = true,
  tooltipContent,
}: ContractFormFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const baseInputClass = cn(
    'text-[16px] leading-[24px] text-[#222222] font-normal',
    'border border-[#d1d5db] rounded-[8px]',
    'px-4 py-2.5',
    'focus:outline-none focus:ring-2 focus:ring-[#2487f8] focus:ring-offset-0 focus:border-[#2487f8]',
    'transition-all duration-200',
    'placeholder:text-[#9ca3af]',
    readOnly && 'bg-[#f5f5f5] cursor-not-allowed',
    !readOnly && 'bg-white hover:border-[#9ca3af]',
    !showBorder && 'border-transparent',
    className
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[22px] font-bold leading-[30px] text-[#222222]">
        {label}
      </label>
      <div className="flex items-start gap-3">
        <div className="flex-1 max-w-[calc(100%-48px)]">
          {multiline ? (
            <textarea
              value={value}
              placeholder={placeholder}
              rows={rows}
              onChange={(e) => onChange?.(e.target.value)}
              readOnly={readOnly}
              className={cn(baseInputClass, 'w-full resize-none')}
            />
          ) : (
            <input
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange?.(e.target.value)}
              readOnly={readOnly}
              className={cn(baseInputClass, 'h-[44px] w-full')}
            />
          )}
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

