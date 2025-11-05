export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws',
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  verifyStartUrl:
    process.env.NEXT_PUBLIC_VERIFY_START_URL || '/mock-verify/start',
  verifyCallbackPath: '/verify/callback',
  verifyTokenTtlSeconds: Math.max(
    1,
    Number.parseInt(process.env.NEXT_PUBLIC_VERIFY_TOKEN_TTL_SECONDS ?? '60', 10)
  ),
} as const;
