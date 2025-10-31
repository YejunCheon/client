export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws',
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
} as const;

