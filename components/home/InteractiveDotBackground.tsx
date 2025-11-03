"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Dot {
  x: number;
  y: number;
  baseOpacity: number;
}

interface InteractiveDotBackgroundProps {
  dotSize?: number;
  spacing?: number;
  maxDistance?: number;
  baseOpacity?: number;
  maxOpacity?: number;
}

export default function InteractiveDotBackground({
  dotSize = 2,
  spacing = 40,
  maxDistance = 200,
  baseOpacity = 0.2,
  maxOpacity = 0.8,
}: InteractiveDotBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const dotsRef = useRef<Dot[]>([]);
  const animationFrameRef = useRef<number>();

  // 도트 그리드 생성
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDots = () => {
      const width = window.innerWidth;
      // 뷰포트 전체 높이 사용 (스크롤 포함)
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.clientHeight,
        window.innerHeight
      );
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);

      dotsRef.current = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dotsRef.current.push({
            x: col * spacing,
            y: row * spacing,
            baseOpacity,
          });
        }
      }

      canvas.width = width;
      canvas.height = height;
    };

    // 초기 로드 및 리사이즈 시 업데이트
    updateDots();
    
    // 리사이즈와 스크롤 시 업데이트
    const handleResize = () => {
      updateDots();
    };
    
    const handleScroll = () => {
      updateDots();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [spacing, baseOpacity]);

  // 마우스 위치 추적 (window 레벨에서 추적)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      // canvas는 absolute positioned이므로 스크롤 오프셋 고려 필요
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top + window.scrollY,
      });
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // 애니메이션 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((dot) => {
        let opacity = dot.baseOpacity;

        if (isHovering) {
          const dx = dot.x - mousePos.x;
          const dy = dot.y - mousePos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            // 거리에 반비례하여 밝기 증가 (가까울수록 밝음)
            // cubic 함수를 사용하여 더 강한 효과
            const influence = 1 - distance / maxDistance;
            const cubicInfluence = influence * influence * influence;
            opacity = baseOpacity + (maxOpacity - baseOpacity) * cubicInfluence;
          }
        }

        ctx.fillStyle = `rgba(36, 135, 248, ${opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, isHovering, dotSize, maxDistance, baseOpacity, maxOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

