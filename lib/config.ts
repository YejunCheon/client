// 브라우저 환경에서는 프록시를 통해 같은 도메인으로 요청하므로 상대 경로 사용
// 서버 사이드 렌더링(SSR)에서는 원래 서버 URL 사용
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // 브라우저 환경: 프록시를 통해 같은 도메인으로 요청
    return '';
  }
  // SSR 환경: 원래 서버 URL 사용
  return process.env.NEXT_PUBLIC_API_URL || '';
};

export const config = {
  apiMode: (process.env.NEXT_PUBLIC_API_MODE || 'http') as 'mock' | 'http',
  apiUrl: getApiUrl(),
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || '',
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  verifyStartUrl: process.env.NEXT_PUBLIC_VERIFY_START_URL || '',
  verifyCallbackPath: '/verify/callback',
  verifyTokenTtlSeconds: Math.max(
    1,
    Number.parseInt(process.env.NEXT_PUBLIC_VERIFY_TOKEN_TTL_SECONDS ?? '60', 10)
  ),
} as const;
