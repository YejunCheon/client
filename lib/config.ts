// API URL 설정
// http 모드: 실제 백엔드 서버 URL 사용
// mock 모드: 빈 문자열 (MSW가 상대 경로로 요청을 가로챔)
const getApiUrl = () => {
  const apiMode = (process.env.NEXT_PUBLIC_API_MODE || 'http') as 'mock' | 'http';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Mock 모드일 때는 빈 문자열 반환 (MSW가 처리)
  if (apiMode === 'mock') {
    return '';
  }
  
  // HTTP 모드일 때는 실제 백엔드 URL 사용
  return apiUrl;
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
