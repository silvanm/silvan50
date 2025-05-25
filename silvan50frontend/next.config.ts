import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // Disable the development indicators including error overlay
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive, noimageindex, nocache',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
