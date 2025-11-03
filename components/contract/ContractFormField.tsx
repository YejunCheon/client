import React from 'react';
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
}: ContractFormFieldProps) {
  const baseInputClass = cn(
    'w-full text-[16px] leading-[24px] text-[#222222] font-normal',
    'border border-[#acacac] rounded-[5px]',
    'px-3 py-2',
    'focus:outline-none focus:ring-2 focus:ring-[#2487f8] focus:ring-offset-1',
    readOnly && 'bg-[#f5f5f5] cursor-not-allowed',
    !readOnly && 'bg-white',
    !showBorder && 'border-transparent',
    className
  );

  return (
    <div className="flex flex-col gap-[23px]">
      <label className="text-[22px] font-bold leading-[30px] text-[#222222]">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={baseInputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={cn(baseInputClass, 'h-[41px]')}
        />
      )}
    </div>
  );
}

