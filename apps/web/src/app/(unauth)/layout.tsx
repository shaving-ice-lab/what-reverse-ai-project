'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export default function UnauthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Runtime pages use an independent layout without navigation
  if (pathname.startsWith('/runtime')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth relative">
      {/* LobeHub-style background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        {/* Top main halo - LobeHub-style purple glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3"
          style={{
            width: '140%',
            height: '800px',
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45, 65, 180, 0.12) 0%, rgba(100, 50, 180, 0.04) 40%, transparent 70%)',
          }}
        />
        {/* Right side auxiliary halo */}
        <div
          className="absolute top-[20%] right-0"
          style={{
            width: '600px',
            height: '600px',
            background:
              'radial-gradient(circle at 80% 30%, rgba(80, 40, 160, 0.04) 0%, transparent 60%)',
          }}
        />
        {/* Footer */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: '100%',
            height: '400px',
            background:
              'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(30, 50, 120, 0.05) 0%, transparent 60%)',
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>
      <main className="flex-1 relative">{children}</main>
    </div>
  )
}
