'use client'

/**
 * SiteHeader - LobeHub StylePageHeaderNavigation
 * Glass, Minimal, Modern
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Workflow,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Target,
  BookOpen,
  ShoppingCart,
  CreditCard,
  Building2,
  FileText,
  Code2,
  Newspaper,
  Calendar,
  Award,
  Users,
  Handshake,
  Gift,
  LifeBuoy,
  HelpCircle,
  Shield,
  Mail,
  Github,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggleSimple } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

// ===== mainNavigation =====
const mainNavItems = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Document', href: '/docs' },
]

// ===== Dropdown MenuGroup =====
const dropdownMenus = [
  {
    label: 'Product',
    items: [
      { label: 'Features', href: '/features', icon: Sparkles, desc: 'Explore features' },
      { label: 'Use cases', href: '/use-cases', icon: Target, desc: 'Industry scenarios' },
      {
        label: 'Template Gallery',
        href: '/templates',
        icon: BookOpen,
        desc: 'Browse workflow templates',
      },
      {
        label: 'App Store',
        href: '/store',
        icon: ShoppingCart,
        desc: 'Discover more integrations',
      },
      { label: 'Pricing', href: '/pricing', icon: CreditCard, desc: 'View plans and pricing' },
      { label: 'Enterprise', href: '/enterprise', icon: Building2, desc: 'Enterprise solutions' },
    ],
  },
  {
    label: 'Resource',
    items: [
      {
        label: 'Document Center',
        href: '/docs',
        icon: FileText,
        desc: 'Quick getting started guide',
      },
      { label: 'Developers', href: '/developers', icon: Code2, desc: 'API and SDK' },
      { label: 'Blog', href: '/blog', icon: Newspaper, desc: "What's new and tutorials" },
      {
        label: 'Activity & Live',
        href: '/events',
        icon: Calendar,
        desc: 'Live and online activity',
      },
      { label: 'Case Studies', href: '/case-studies', icon: Award, desc: 'Customer success' },
      { label: 'Learn', href: '/learn/courses', icon: BookOpen, desc: 'System learning tutorials' },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        label: 'Community',
        href: '/community',
        icon: Users,
        desc: 'Join the developers community',
      },
      { label: 'Partners', href: '/partners', icon: Handshake, desc: 'Partners plan' },
      {
        label: 'Referral Program',
        href: '/referral-program',
        icon: Gift,
        desc: 'Recommended rewards',
      },
      {
        label: 'Support & tickets',
        href: '/support',
        icon: LifeBuoy,
        desc: 'Get technical support',
      },
      { label: 'Help Center', href: '/help', icon: HelpCircle, desc: 'FAQ and resolve' },
      { label: 'Contact Us', href: '/contact', icon: Mail, desc: 'Contact the sales team' },
    ],
  },
]

// ===== Mobile Full Menu =====
const mobileMenuSections = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/features' },
      { label: 'Use cases', href: '/use-cases' },
      { label: 'Template Gallery', href: '/templates' },
      { label: 'App Store', href: '/store' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Enterprise', href: '/enterprise' },
    ],
  },
  {
    title: 'Resource',
    items: [
      { label: 'Document Center', href: '/docs' },
      { label: 'Developers', href: '/developers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Activity & Live', href: '/events' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Learn courses', href: '/learn/courses' },
    ],
  },
  {
    title: 'Community & Support',
    items: [
      { label: 'Community', href: '/community' },
      { label: 'Partners', href: '/partners' },
      { label: 'Referral Program', href: '/referral-program' },
      { label: 'Support & tickets', href: '/support' },
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
]

interface SiteHeaderProps {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isDropdownActive = (items: { href: string }[]) => items.some((item) => isActive(item.href))

  // ScrollDetect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ClickoutsidesectionCloseDropdown Menu
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown]
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null)
        }
      }
    },
    [openDropdown]
  )

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // RoutetimeCloseMenu
  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
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
              <Workflow className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              AgentFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* mainLink */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200',
                  isActive(item.href)
                    ? 'text-foreground'
                    : 'text-foreground-light hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* CategoryDropdown Menu */}
            {dropdownMenus.map((menu) => (
              <div
                key={menu.label}
                className="relative"
                ref={(el) => {
                  dropdownRefs.current[menu.label] = el
                }}
              >
                <button
                  onClick={() => setOpenDropdown(openDropdown === menu.label ? null : menu.label)}
                  className={cn(
                    'px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200 flex items-center gap-1',
                    openDropdown === menu.label || isDropdownActive(menu.items)
                      ? 'text-foreground'
                      : 'text-foreground-light hover:text-foreground'
                  )}
                >
                  {menu.label}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      openDropdown === menu.label && 'rotate-180'
                    )}
                  />
                </button>

                {openDropdown === menu.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 py-2 rounded-2xl bg-surface-100/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/40 z-50">
                    {menu.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 transition-all duration-200 mx-1 rounded-xl',
                            isActive(item.href)
                              ? 'text-foreground bg-surface-200/80'
                              : 'text-foreground-light hover:text-foreground hover:bg-surface-200/50'
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-surface-300/50 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{item.label}</div>
                            <div className="text-[11px] text-foreground-lighter mt-0.5">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleSimple />

            {/* GitHub Star */}
            <a
              href="https://github.com/agentflow"
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
            {mobileMenuSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 py-2 text-[11px] text-foreground-lighter font-medium uppercase tracking-widest">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-3 py-2.5 text-[14px] rounded-xl transition-all duration-200',
                      isActive(item.href)
                        ? 'text-foreground bg-surface-200/50'
                        : 'text-foreground-light hover:text-foreground hover:bg-surface-100/50'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 border-t border-border/20" />
              </div>
            ))}

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
