import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiServer =
      process.env.NEXT_PUBLIC_API_URL ||
      'http://dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com';

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
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com',
      },
      {
        protocol: 'https',
        hostname: 'dealchain-env.eba-tpa3rca3.ap-northeast-2.elasticbeanstalk.com',
      },
    ],
    unoptimized: true, // 외부 이미지 최적화 비활성화
  },
};

export default nextConfig;
