'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePreviewProps {
  /**
   * 서명 이미지 (File 객체 또는 URL 문자열)
   */
  signatureImage?: File | string | null;
  
  /**
   * 서명 삭제 핸들러
   */
  onRemove?: () => void;
  
  /**
   * 미리보기 영역의 너비
   */
  width?: number | string;
  
  /**
   * 미리보기 영역의 높이
   */
  height?: number | string;
  
  /**
   * 추가 클래스명
   */
  className?: string;
  
  /**
   * 미리보기가 없을 때 표시할 메시지
   */
  emptyMessage?: string;
  
  /**
   * 삭제 버튼 표시 여부
   */
  showRemoveButton?: boolean;
}

export function SignaturePreview({
  signatureImage,
  onRemove,
  width = 299,
  height = 349,
  className,
  emptyMessage = '서명 이미지 미리보기',
  showRemoveButton = true,
}: SignaturePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!signatureImage) {
      setPreview(null);
      return;
    }

    // 문자열인 경우 (URL) 그대로 사용
    if (typeof signatureImage === 'string') {
      setPreview(signatureImage);
      return;
    }

    // File 객체인 경우 Data URL로 변환
    if (signatureImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.onerror = () => {
        setPreview(null);
      };
      reader.readAsDataURL(signatureImage);
    }
  }, [signatureImage]);

  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg overflow-hidden border border-[#dedede] flex items-center justify-center',
        className
      )}
      style={{ width: widthValue, height: heightValue }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="서명 이미지"
            className="w-full h-full object-contain"
          />
          {showRemoveButton && onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
              type="button"
              aria-label="서명 삭제"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#767676] text-sm px-4 text-center">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

