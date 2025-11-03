import React from 'react';

interface WarningTooltipProps {
  messages: string[];
  position?: 'top-right' | 'bottom-right';
}

export function WarningTooltip({ messages, position = 'top-right' }: WarningTooltipProps) {
  return (
    <div
      className={`absolute ${position === 'top-right' ? 'top-[362px]' : 'top-[775px]'} right-[-160px] flex flex-col items-end z-10`}
    >
      <div className="bg-[#f2f2f2] rounded-[15px] px-[11px] py-[11px] max-w-[149px] relative shadow-lg">
        <div className="flex flex-col gap-[10px]">
          {messages.map((message, index) => (
            <p
              key={index}
              className="text-[12px] leading-[16px] text-[#2487f8] font-bold"
            >
              {message}
            </p>
          ))}
        </div>
        <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#f2f2f2] transform rotate-45"></div>
      </div>
    </div>
  );
}

