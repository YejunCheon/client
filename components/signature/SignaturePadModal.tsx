'use client';

import React, { useEffect, useRef } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignPad } from '@/hooks/use-sign-pad';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  title?: string;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = '서명하기',
}: SignaturePadModalProps) {
  const {
    canvasRef,
    hasSignature,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    toBlob,
    setCanvasSize,
  } = useSignPad();

  const containerRef = useRef<HTMLDivElement>(null);

  // 캔버스 크기 설정
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      
      // 모바일: 화면의 80% 너비, 데스크톱: 600px
      const isMobile = window.innerWidth < 768;
      const width = isMobile ? Math.min(window.innerWidth * 0.9, 500) : 600;
      const height = isMobile ? 300 : 400;

      setCanvasSize(width, height);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isOpen, setCanvasSize]);

  // 모달 열릴 때 캔버스 초기화
  useEffect(() => {
    if (!isOpen) return;
    clear();
  }, [isOpen, clear]);

  const handleSave = async () => {
    if (!hasSignature) {
      alert('서명을 먼저 작성해주세요.');
      return;
    }

    const blob = await toBlob();
    if (!blob) {
      alert('서명을 저장할 수 없습니다.');
      return;
    }

    // Blob을 File로 변환
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    onSave(file);
    handleClose();
  };

  const handleClose = () => {
    clear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={containerRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-[700px] mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#222]">{title}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Container */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-gray-50">
          <div className="bg-white border-2 border-gray-300 rounded-lg shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              className="block cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                startDrawing(e);
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                draw(e);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopDrawing();
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            마우스(또는 터치)로 서명을 그려주세요
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t gap-3">
          <Button
            variant="outline"
            onClick={clear}
            disabled={!hasSignature}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            다시 그리기
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasSignature}
              className="bg-[#2487f8] text-white hover:bg-[#1e6fd8] flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              저장하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

