import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  transpilePackages: ['civics2json', 'questionnaire'],
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
