'use client'

/**
 * 404 Page - Page Not Found * Manus Style: Minimal, large whitespace, optimal */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, HelpCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Quick Links - Manus Style

const quickLinks = [{ name: 'Home', href: '/', icon: Home }]

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <SiteHeader />

      {/* Manus StyleBackground */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/20)]" />

        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] opacity-[0.15]"
          style={{
            background: 'radial-gradient(circle, rgba(62,207,142,0.5) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Main Content - Manus Style */}

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* 404 countchar - Minimalist Style */}

          <div
            className={cn(
              'mb-8',

              'transition-all duration-700',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="text-[140px] sm:text-[180px] font-black leading-none text-muted-foreground/10 select-none">
              404
            </div>
          </div>

          {/* Title */}

          <h1
            className={cn(
              'text-2xl sm:text-3xl font-bold text-foreground mb-4',

              'transition-all duration-700 delay-100',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Page not found
          </h1>

          {/* Description */}

          <p
            className={cn(
              'text-muted-foreground mb-10',

              'transition-all duration-700 delay-200',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Sorry, the page you're looking for doesn't exist or has been moved. You can go back
            home, retry, or contact support for help.
          </p>

          {/* Main Actions - Manus StyleButton */}

          <div
            className={cn(
              'flex flex-col sm:flex-row gap-3 justify-center mb-12',

              'transition-all duration-700 delay-300',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Link href="/">
              <Button className="h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full">
                <Home className="mr-2 w-4 h-4" />
                Back to Home
              </Button>
            </Link>

            <Button
              variant="outline"
              className="h-11 px-6 rounded-full border-border hover:border-foreground/20"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Go Back{' '}
            </Button>

            <Button
              variant="outline"
              className="h-11 px-6 rounded-full border-border hover:border-foreground/20"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              Reload
            </Button>
          </div>

          {/* Quick Links - Manus Style */}

          <div
            className={cn(
              'pt-8 border-t border-border',

              'transition-all duration-700 delay-400',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className="text-sm text-muted-foreground mb-6">Or visit the following pages</p>

            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full',

                      'bg-card border border-border',

                      'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',

                      'transition-all duration-200 group'
                    )}
                  >
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />

                    <span className="text-sm font-medium text-foreground">{link.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* HelpTip - Manus Style */}

          <div
            className={cn(
              'mt-12 p-6 rounded-2xl bg-card border border-border',

              'transition-all duration-700 delay-500',

              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">Need Help?</h3>

                <p className="text-xs text-muted-foreground mb-3">
                  If you believe this is an error, our support team is always here to help.{' '}
                </p>

                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-8 px-4 border-border hover:border-primary/30"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
