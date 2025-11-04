import { useRef, useState, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

export function useSignPad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  const getPoint = useCallback((
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    rect: DOMRect
  ): Point => {
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const point = getPoint(event, rect);
    lastPointRef.current = point;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [getPoint]);

  const draw = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentPoint = getPoint(event, rect);

    // 컨텍스트 스타일 확인 및 재설정
    if (ctx.strokeStyle !== '#000000') {
      ctx.strokeStyle = '#000000';
    }
    if (ctx.lineWidth !== 3) {
      ctx.lineWidth = 3;
    }
    if (ctx.lineCap !== 'round') {
      ctx.lineCap = 'round';
    }
    if (ctx.lineJoin !== 'round') {
      ctx.lineJoin = 'round';
    }

    // 이전 점이 있으면 이전 점에서 현재 점까지 선 그리기
    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }

    lastPointRef.current = currentPoint;
    setHasSignature(true);
  }, [isDrawing, getPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    lastPointRef.current = null;
  }, []);

  const toDataURL = useCallback((format: 'image/png' | 'image/jpeg' = 'image/png'): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    return canvas.toDataURL(format);
  }, []);

  const toBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }

      canvas.toBlob(resolve, 'image/png');
    });
  }, []);

  const setCanvasSize = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 실제 크기 설정
    canvas.width = width;
    canvas.height = height;
    
    // 스타일 설정 (화면 표시 크기)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 컨텍스트 스타일 설정
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }, []);

  return {
    canvasRef,
    isDrawing,
    hasSignature,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    toDataURL,
    toBlob,
    setCanvasSize,
  };
}
