import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  // Dev-only: hosts allowed to open the dev server's HMR socket. Without this,
  // a LAN origin never hydrates (Next 16 feeds React's debug channel over that
  // socket and waits for it before hydrateRoot).
  allowedDevOrigins: ['192.168.*.*'],
  transpilePackages: [
    'app',
    'civics2json',
    'questionnaire',
    'tamagui',
    '@tamagui/core',
    '@tamagui/animations-css',
  ]
}

export default nextConfig
