'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    onSubmit(reason);
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-bold">계약서 수정 요청</DialogTitle>
          <DialogDescription className="text-[14px] text-gray-600">
            수정이 필요한 사항을 구체적으로 입력해주세요. 판매자에게 전달됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="예: 배송 방법을 직거래로 변경해주세요."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="resize-none text-[15px]"
            disabled={loading}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-[12px] px-5 py-2"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="bg-[#2487f8] text-white hover:bg-[#1e6fc9] rounded-[12px] px-5 py-2"
          >
            {loading ? '전송 중...' : '수정 요청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
