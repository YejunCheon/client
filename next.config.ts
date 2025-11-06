import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiServer = process.env.NEXT_PUBLIC_API_URL || '';

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
