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
    ];
  },
};

export default nextConfig;
