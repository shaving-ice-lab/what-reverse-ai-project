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
  title: 'AgentFlow - AI Workflow Platform',
  description: 'Local-first, code-customizable, community-driven AI Agent Workflow Platform',
  keywords: ['AI', 'Agent', 'Workflow', 'Automation', 'Workflow'],
  authors: [{ name: 'AgentFlow Team' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
