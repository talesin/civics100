import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist',
  images: {
    unoptimized: true
  },
  // Add Tamagui packages to transpilation
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
