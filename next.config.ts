import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiServer = process.env.NEXT_PUBLIC_API_URL || '';
    const apiMode = process.env.NEXT_PUBLIC_API_MODE || 'http';

    // Mock 모드일 때는 프록시를 설정하지 않음
    if (apiMode === 'mock' || !apiServer) {
      console.log('[Next.js Config] API Mode:', apiMode, '- Skipping proxy setup');
      return [];
    }

    console.log('[Next.js Config] Setting up proxy to:', apiServer);
    console.log('[Next.js Config] API Mode:', apiMode);

    return [
      {
        source: '/api/:path*',
        destination: `${apiServer}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiServer}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: (() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (!apiUrl) return [];

      try {
        const url = new URL(apiUrl);
        const hostname = url.hostname;

        return [
          {
            protocol: 'http',
            hostname: hostname,
          },
          {
            protocol: 'https',
            hostname: hostname,
          },
        ];
      } catch {
        return [];
      }
    })(),
    unoptimized: true, // 외부 이미지 최적화 비활성화
  },
};

export default nextConfig;
