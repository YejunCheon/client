export const config = {
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com',
  wsUrl:
    process.env.NEXT_PUBLIC_WS_URL ||
    'http://dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com/ws',
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  verifyStartUrl:
    process.env.NEXT_PUBLIC_VERIFY_START_URL ||
    'http://mockapi-env.eba-mpd9wfbe.ap-northeast-2.elasticbeanstalk.com/mock-verify/start',
  verifyCallbackPath: '/verify/callback',
  verifyTokenTtlSeconds: Math.max(
    1,
    Number.parseInt(process.env.NEXT_PUBLIC_VERIFY_TOKEN_TTL_SECONDS ?? '60', 10)
  ),
} as const;
