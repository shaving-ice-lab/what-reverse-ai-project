import type { Metadata } from 'next'
import { Inter, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// Body font: Inter – Supabase's primary typeface
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Code font: Source Code Pro – Supabase's monospace typeface
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'ReverseAI - AI-Powered App Platform',
  description:
    'Build full web applications with AI. Describe your app, and the AI Agent creates the database, UI, and delivers a live app.',
  keywords: ['AI', 'App Platform', 'No-Code', 'Database', 'Web App'],
  authors: [{ name: 'ReverseAI Team' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
