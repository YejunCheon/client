import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

  // 이미 상대 경로로 시작하는 경우 (/로 시작)
  if (imageUrl.startsWith('/')) {
    // /uploads/로 시작하는 경우 프록시를 통해 처리
    if (imageUrl.startsWith('/uploads/')) {
      return imageUrl; // 프록시가 처리함
    }
    // /assets/ 같은 로컬 경로는 그대로 반환
    return imageUrl;
  }

  // 상대 경로인 경우 (uploads/products/...)
  // 프록시를 통해 같은 도메인으로 요청
  return `/uploads/${imageUrl}`;
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

