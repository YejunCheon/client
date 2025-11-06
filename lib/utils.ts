import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { config as appConfig } from "@/lib/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 상품 이미지 URL을 정규화합니다.
 * 상대 경로인 경우 절대 URL로 변환하고, 이미 절대 URL인 경우 그대로 반환합니다.
 */
export function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/assets/mock_product_img.png';
  }

  // 이미 절대 URL인 경우 (http:// 또는 https://로 시작)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 로컬 경로인 경우 (/assets/ 등)
  if (imageUrl.startsWith('/assets/')) {
    return imageUrl;
  }

  // 클라이언트 사이드에서는 항상 절대 URL 사용
  if (typeof window !== 'undefined') {
    // API 서버 URL 가져오기 (환경 변수 또는 기본값)
    const apiServer = process.env.NEXT_PUBLIC_API_URL || 'http://dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com';
    
    // 이미 상대 경로로 시작하는 경우 (/로 시작)
    if (imageUrl.startsWith('/')) {
      // /uploads/로 시작하는 경우 API 서버 URL과 결합
      if (imageUrl.startsWith('/uploads/')) {
        return `${apiServer}${imageUrl}`;
      }
      return imageUrl;
    }

    // 상대 경로인 경우 (uploads/products/...)
    // API 서버 URL과 결합하여 절대 URL 생성
    const path = imageUrl.startsWith('uploads/') ? `/${imageUrl}` : `/uploads/${imageUrl}`;
    return `${apiServer}${path}`;
  }

  // 서버 사이드: 프록시 경로 사용
  // 이미 상대 경로로 시작하는 경우 (/로 시작)
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // 상대 경로인 경우 (uploads/products/...)
  const path = imageUrl.startsWith('uploads/') ? `/${imageUrl}` : `/uploads/${imageUrl}`;
  return path;
}

export function sanitizeHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(html);
  }
  return html;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

