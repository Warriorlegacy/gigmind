import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://gigmind-gamma.vercel.app'),
  title: 'GigMind — Hire Anything. Chat Everything.',
  description: 'AI-powered multi-service marketplace for India. Hire real estate, medical, home repair, security, interior design, HR services and more — just chat with AI.',
  manifest: '/manifest.json',
  themeColor: '#6C47FF',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'GigMind — Hire Anything. Chat Everything.',
    description: 'AI-powered service marketplace for India',
    type: 'website',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'GigMind — Hire Anything. Chat Everything.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-foreground font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
