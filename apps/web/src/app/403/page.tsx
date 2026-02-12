'use client'

/**
 * 403 Forbidden Page - Insufficient permissions
 * Manus Style: Minimal, large whitespace, optimal
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, Home, LogIn, HelpCircle, ArrowLeft, Settings, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// QuickLink - Manus Style
const quickLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Sign In', href: '/login', icon: LogIn },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// Common Reason Tips
const commonReasons = [
  { icon: Shield, text: "Your account doesn't have sufficient permissions" },
  { icon: Users, text: 'This resource is restricted to specific user groups' },
  { icon: Lock, text: 'Your sign-in session may have expired' },
]

export default function ForbiddenPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <SiteHeader />

      {/* Manus Style Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/20)]" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] opacity-[0.15]"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Main Content - Manus Style */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* 403 Number - Minimalist Style */}
          <div
            className={cn(
              'mb-8',
              'transition-all duration-700',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="text-[140px] sm:text-[180px] font-black leading-none text-warning/10 select-none">
              403
            </div>
          </div>

          {/* Icon */}
          <div
            className={cn(
              'w-14 h-14 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-6',
              'transition-all duration-700 delay-75',
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            )}
          >
            <Lock className="w-7 h-7 text-warning" />
          </div>

          {/* Title */}
          <h1
            className={cn(
              'text-2xl sm:text-3xl font-bold text-foreground mb-4',
              'transition-all duration-700 delay-100',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Access Denied
          </h1>

          {/* Description */}
          <p
            className={cn(
              'text-muted-foreground mb-10',
              'transition-all duration-700 delay-200',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Sorry, you don&apos;t have permission to access this page. Please try signing in again,
            switching accounts, or contacting an admin to request access.
          </p>

          {/* Main Actions - Manus Style Buttons */}
          <div
            className={cn(
              'flex flex-col sm:flex-row gap-3 justify-center mb-12',
              'transition-all duration-700 delay-300',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Link href="/login">
              <Button className="h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full">
                <LogIn className="mr-2 w-4 h-4" />
                Sign In Again
              </Button>
            </Link>
            <Button
              variant="outline"
              className="h-11 px-6 rounded-full border-border hover:border-foreground/20"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Go Back
            </Button>
          </div>

          {/* Common Reason Tips */}
          <div
            className={cn(
              'mb-8 p-5 rounded-2xl bg-card border border-border text-left',
              'transition-all duration-700 delay-350',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Possible Reasons</h3>
            <ul className="space-y-2">
              {commonReasons.map((reason, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <reason.icon className="w-4 h-4 text-warning/70 shrink-0" />
                  <span>{reason.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* QuickLink - Manus Style */}
          <div
            className={cn(
              'pt-8 border-t border-border',
              'transition-all duration-700 delay-400',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <p className="text-sm text-muted-foreground mb-6">Or visit these pages</p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full',
                      'bg-card border border-border',
                      'hover:border-warning/30 hover:shadow-lg hover:shadow-warning/5',
                      'transition-all duration-200 group'
                    )}
                  >
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-warning transition-colors" />
                    <span className="text-sm font-medium text-foreground">{link.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Tip - Manus Style */}
          <div
            className={cn(
              'mt-12 p-6 rounded-2xl bg-card border border-border',
              'transition-all duration-700 delay-500',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">Need Help?</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  If you believe this is an error or need access permissions, our support team is
                  always here to help.
                </p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-8 px-4 border-border hover:border-warning/30"
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
