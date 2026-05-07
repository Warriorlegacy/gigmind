import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'GigMind — Hire Anything. Chat Everything.',
  description: 'AI-powered multi-service marketplace for India. Hire real estate, medical, home repair, security, interior design, HR services and more — just chat with AI.',
  manifest: '/manifest.json',
  themeColor: '#6C47FF',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'GigMind — Hire Anything. Chat Everything.',
    description: 'AI-powered service marketplace for India',
    type: 'website',
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
