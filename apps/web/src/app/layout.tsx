import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// Body font: Space Grotesk - Modern typeface
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Code font: IBM Plex Mono - Clear monospace typeface
const ibmPlexMono = IBM_Plex_Mono({
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
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} font-mono antialiased terminal-strong`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
