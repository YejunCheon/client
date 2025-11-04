'use client';

import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SignaturePadModal } from '@/components/signature/SignaturePadModal';
import { PenTool } from 'lucide-react';

interface ContractSignSectionProps {
  signatureImage?: string | File | null;
  onSignatureUpload?: (file: File) => void;
  onSignatureRemove?: () => void;
  finalSignDate?: string;
  className?: string;
}

export function ContractSignSection({
  signatureImage,
  onSignatureUpload,
  onSignatureRemove,
  finalSignDate,
  className,
}: ContractSignSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof signatureImage === 'string' ? signatureImage : null
  );
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    if (signatureImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(signatureImage);
    } else if (typeof signatureImage === 'string') {
      setPreview(signatureImage);
    }
  }, [signatureImage]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 검증
    if (!file.type.match(/^image\/(png|jpg|jpeg)$/)) {
      alert('PNG 또는 JPG 파일만 업로드 가능합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onSignatureUpload?.(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onSignatureRemove?.();
  };

  const handleSignatureFromModal = (file: File) => {
    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onSignatureUpload?.(file);
  };

  const displayImage = preview || (typeof signatureImage === 'string' ? signatureImage : null);

  return (
    <div
      className={cn(
        'bg-[#f9f9f9] rounded-[28px] px-4 py-10 flex flex-col gap-[10px] h-[502px]',
        className
      )}
    >
      <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
        서명하기
      </h2>

      <div className="flex-1 flex gap-[11px] items-start">
        {/* Signature Image Preview */}
        <div className="w-[299px] h-[349px] relative flex-shrink-0 bg-white rounded-lg overflow-hidden border border-[#dedede]">
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt="서명 이미지"
                className="w-full h-full object-contain"
              />
              {onSignatureRemove && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  type="button"
                >
                  ×
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#767676] text-sm">
              서명 이미지 미리보기
            </div>
          )}
        </div>

        {/* Signature Upload Form */}
        <div className="flex-1 flex flex-col gap-[42px]">
          {/* Final Sign Date */}
          {finalSignDate && (
            <div className="flex flex-col gap-3">
              <p className="text-[18px] font-bold leading-[26px] text-[#222222]">
                최종서명일
              </p>
              <p className="text-[15px] font-normal leading-[22px] text-[#222222]">
                {finalSignDate}
              </p>
            </div>
          )}

          {/* Signature Upload */}
          <div className="flex flex-col gap-3">
            <p className="text-[18px] font-bold leading-[26px] text-[#222222]">
              자필 서명 등록
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="signature-upload"
                />
                <label
                  htmlFor="signature-upload"
                  className={cn(
                    'bg-[#f2f2f2] border border-[#dedede] rounded-[16px]',
                    'px-[26px] py-[27px]',
                    'flex flex-col gap-[10px] items-center justify-center',
                    'cursor-pointer hover:bg-[#e8e8e8] transition-colors',
                    'min-h-[103px]'
                  )}
                >
                  <div className="flex flex-col gap-[5px] items-center justify-center">
                    {/* Image Icon */}
                    <svg
                      width="27"
                      height="27"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#767676]"
                    >
                      <path
                        d="M9 2C7.89 2 7 2.89 7 4V20C7 21.11 7.89 22 9 22H15C16.11 22 17 21.11 17 20V4C17 2.89 16.11 2 15 2H9ZM9 4H15V20H9V4ZM11 6V8H13V6H11ZM11 10V12H13V10H11ZM11 14V16H13V14H11Z"
                        fill="currentColor"
                      />
                    </svg>
                    <p className="text-[12px] leading-[16px] text-[#767676] text-center">
                      5mb 이내 .png .jpg
                    </p>
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className={cn(
                  'bg-white border border-[#2487f8] rounded-[16px]',
                  'px-4 py-3',
                  'flex items-center justify-center gap-2',
                  'cursor-pointer hover:bg-[#f0f7ff] transition-colors',
                  'text-[#2487f8] font-semibold'
                )}
              >
                <PenTool className="w-5 h-5" />
                <span>직접 서명하기</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureFromModal}
        title="서명하기"
      />
    </div>
  );
}

