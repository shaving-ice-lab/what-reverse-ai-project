'use client'

/**
 * SiteHeader - LobeHub StylePageHeaderNavigation
 * Glass, Minimal, Modern
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Menu, X, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggleSimple } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // ScrollDetect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // RoutetimeCloseMenu
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/85 backdrop-blur-2xl saturate-150 border-b border-border/40'
          : 'bg-transparent',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-xl',
                'bg-foreground text-background',
                'transition-all duration-300',
                'group-hover:scale-105'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              ReverseAI
            </span>
          </Link>

          {/* Desktop Navigation — minimal, no marketing pages */}
          <nav className="hidden lg:flex items-center gap-1" />

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleSimple />

            {/* GitHub Star */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px]',
                'text-foreground-light hover:text-foreground transition-all duration-200'
              )}
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">Star</span>
            </a>

            <Link
              href="/login"
              className="text-[13px] text-foreground-light hover:text-foreground transition-all duration-200 hidden sm:block px-3 py-1.5"
            >
              Sign In
            </Link>

            <Link href="/register" className="hidden sm:block">
              <Button
                className={cn(
                  'h-8 px-5',
                  'bg-foreground',
                  'hover:bg-foreground/90',
                  'text-background text-[13px] font-medium rounded-full',
                  'transition-all duration-200'
                )}
              >
                Get Started
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-foreground-light hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-2xl border-t border-border/30 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-6 py-6 space-y-2">
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full rounded-full h-10 border-border/50 text-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  className={cn(
                    'w-full rounded-full h-10',
                    'bg-foreground',
                    'hover:bg-foreground/90',
                    'text-background font-medium'
                  )}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default SiteHeader
