'use client';

import React, { useRef, useState, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { SignaturePadModal } from '@/components/signature/SignaturePadModal';
import { SignaturePreview } from '@/components/signature/SignaturePreview';
import { PenTool, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

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

    onSignatureUpload?.(file);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onSignatureRemove?.();
  };

  const handleSignatureFromModal = (file: File) => {
    onSignatureUpload?.(file);
  };

  return (
    <div
      className={cn(
        'bg-[#f9f9f9] rounded-[28px] px-9 py-[34px] flex flex-col gap-6',
        className
      )}
    >
      <h2 className="text-[28px] font-bold leading-[36px] text-[#222222]">
        서명하기
      </h2>

      {/* 서명 이미지 섹션 */}
      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-medium text-neutral-950">
          서명 이미지
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FileImage className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#717182]" />
            <input
              ref={fileInputRef}
              name="signatureImage"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="h-9 w-full cursor-pointer rounded-md border-0 bg-[#f3f3f5] pl-10 text-sm file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>
          <Button
            type="button"
            onClick={() => setIsSignatureModalOpen(true)}
            variant="outline"
            className="flex h-9 items-center gap-2 whitespace-nowrap px-4"
          >
            <PenTool className="size-4" />
            직접 서명하기
          </Button>
        </div>
        {signatureImage && (
          <div className="mt-2">
            <SignaturePreview
              signatureImage={signatureImage}
              onRemove={onSignatureRemove ? handleRemove : undefined}
              width="100%"
              height={200}
              className="border border-[#dedede]"
            />
          </div>
        )}
      </div>

      {/* 최종 서명일 */}
      {finalSignDate && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#e0e0e0]">
          <label className="text-[14px] font-medium text-neutral-950">
            최종서명일
          </label>
          <p className="text-[14px] text-[#717182]">
            {finalSignDate}
          </p>
        </div>
      )}

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

