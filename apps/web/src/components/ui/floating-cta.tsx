'use client'

/**
 * FloatingCTA - Floating quick action button
 *
 * Floats at the bottom-right of the page, providing quick action entry points
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, X, HelpCircle, FileText, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  icon: React.ElementType
  label: string
  description: string
  href: string
  color: string
}

const quickActions: QuickAction[] = [
  {
    icon: Sparkles,
    label: 'Try Free',
    description: 'Get started now',
    href: '/register',
    color: 'bg-primary text-primary-foreground',
  },
  {
    icon: HelpCircle,
    label: 'Help Center',
    description: 'View FAQ',
    href: '/docs',
    color: 'bg-blue-500 text-white',
  },
  {
    icon: FileText,
    label: 'Product Demo',
    description: 'Book a product demo',
    href: '/contact?type=demo',
    color: 'bg-purple-500 text-white',
  },
  {
    icon: Mail,
    label: 'Contact Us',
    description: 'Get more help',
    href: '/contact',
    color: 'bg-orange-500 text-white',
  },
]

export function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show floating button after scrolling past 300px
      if (window.scrollY > 300) {
        setHasScrolled(true)
        setIsVisible(true)
      } else {
        setHasScrolled(false)
        // If the menu is open, keep it visible
        if (!isOpen) {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  // Always display on homepage, but with initial delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3',
        'transition-all duration-500',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      )}
    >
      {/* Expanded Quick Actions Menu */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {quickActions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-card/95 backdrop-blur-xl border border-border',
              'shadow-lg shadow-black/10',
              'hover:border-primary/30 hover:shadow-xl',
              'transition-all duration-200 group'
            )}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: isOpen ? 'slideInRight 200ms ease-out both' : 'none',
            }}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                action.color
              )}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center',
          'bg-primary text-primary-foreground',
          'shadow-lg shadow-primary/30',
          'hover:shadow-xl hover:shadow-primary/40 hover:scale-105',
          'transition-all duration-300',
          isOpen && 'rotate-180 bg-card text-foreground border border-border shadow-black/10'
        )}
        aria-label={isOpen ? 'Close shortcut menu' : 'Open shortcut menu'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}

        {/* Pulse animation effect */}
        {!isOpen && <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />}
      </button>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export default FloatingCTA
