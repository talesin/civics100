import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { TamaguiProvider } from '@/components/TamaguiProvider'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { InstallPrompt } from '@/components/InstallPrompt'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export const metadata: Metadata = {
  title: 'US Civics Test - Practice for Your Citizenship Exam',
  description: 'Interactive practice test for the US Citizenship Civics Exam. Study official USCIS questions with adaptive learning and progress tracking.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-180.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Civics 100'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TamaguiProvider>
          <OfflineIndicator />
          {children}
          <InstallPrompt />
        </TamaguiProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
