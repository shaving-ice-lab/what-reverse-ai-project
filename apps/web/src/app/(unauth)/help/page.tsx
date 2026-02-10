'use client'

/**
 * Help Center Page - LobeHub Style
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  Zap,
  Users,
  Settings,
  Shield,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Mail,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Help Categories
const categories = [
  {
    icon: Zap,
    title: 'Getting Started Guide',
    description: 'Quick start with AgentFlow',
    href: '/docs/getting-started',
    articles: 12,
  },
  {
    icon: BookOpen,
    title: 'Workflow Management',
    description: 'Create, edit, and run workflows',
    href: '/docs/guide/workflows',
    articles: 25,
  },
  {
    icon: Settings,
    title: 'Integrations & Connections',
    description: 'Connect third-party services and APIs',
    href: '/docs/integrations',
    articles: 45,
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Manage team members and permissions',
    href: '/docs/guide/team',
    articles: 8,
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Billing, invoices, and subscriptions',
    href: '/docs/billing',
    articles: 10,
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    description: 'Account security and data protection',
    href: '/docs/security',
    articles: 15,
  },
]

// Help Center Directory
const helpDirectory = [
  {
    title: 'Getting Started & Overview',
    description: 'From zero to one: core concepts',
    links: [
      { title: 'Quick Start', href: '/docs/getting-started' },
      { title: 'Features Overview', href: '/docs' },
      { title: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Troubleshooting',
    description: 'Runtime and integration issues',
    links: [
      { title: 'Troubleshooting Guide', href: '/help/troubleshooting' },
      { title: 'Runtime Overview', href: '/docs' },
      { title: 'Access Policy and Rate Limiting', href: '/docs' },
    ],
  },
  {
    title: 'Support & Collaboration',
    description: 'Support and team collaboration',
    links: [
      { title: 'Submit a Ticket', href: '/support' },
      { title: 'Contact Us', href: '/contact' },
      { title: 'Community Discussion', href: '/community' },
    ],
  },
  {
    title: 'Security & Compliance',
    description: 'Security, privacy, and operations',
    links: [
      { title: 'Security Center', href: '/security' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
    ],
  },
]

// Popular Articles
const popularArticles = [
  { title: 'How to create your first workflow', views: 12500, href: '/docs/guide/first-workflow' },
  { title: 'Connect Slack and send notifications', views: 8900, href: '/docs/integrations/slack' },
  { title: 'Scheduled Triggers', views: 7600, href: '/docs/guide/triggers' },
  { title: 'Invite Team Members', views: 5400, href: '/docs/guide/team' },
  { title: 'Setting Up Webhook Triggers', views: 4800, href: '/docs/integrations/webhook' },
  { title: 'Troubleshooting Guide', views: 4200, href: '/help/troubleshooting' },
]

// Contact Methods
const contactMethods = [
  {
    icon: LifeBuoy,
    title: 'Submit a Ticket',
    description: 'SLA tracking and progress visibility',
    action: 'Submit a Ticket',
    href: '/support',
  },
  {
    icon: Mail,
    title: 'Send Email',
    description: 'support@agentflow.ai',
    action: 'Send Email',
    href: 'mailto:support@agentflow.ai',
  },
  {
    icon: Users,
    title: 'Community Forum',
    description: 'Exchange with other users',
    action: 'Visit Community',
    href: '/community',
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help Center</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            Help Center
          </h1>
          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Search FAQs or browse by category below
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>Help Categories</h2>
            <p>Quick help by topic</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className={cn(
                  'p-6 rounded-2xl group',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <category.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                  {category.title}
                </h3>
                <p className="text-[13px] text-foreground-lighter mb-2 leading-relaxed">
                  {category.description}
                </p>
                <span className="text-[12px] text-brand-500">{category.articles} Articles</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>Help Center</h2>
            <p>Browse complete help materials by topic</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {helpDirectory.map((section) => (
              <div
                key={section.title}
                className={cn('p-6 rounded-2xl', 'bg-surface-100/30 border border-border/30')}
              >
                <h3 className="text-[15px] font-semibold text-foreground mb-1">{section.title}</h3>
                <p className="text-[12px] text-foreground-lighter mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>Popular Articles</h2>
            <p>Most popular help articles</p>
          </div>

          <div className="space-y-2">
            {popularArticles.map((article) => (
              <Link
                key={article.title}
                href={article.href}
                className={cn(
                  'block p-5 rounded-xl group',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
                    {article.title}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-foreground-lighter">
                      {article.views.toLocaleString()} views
                    </span>
                    <ArrowRight className="w-4 h-4 text-foreground-lighter group-hover:text-foreground-light transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>Quick Links</h2>
            <p>Useful resource links</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'API Documentation', href: '/docs/api', icon: '📚' },
              { title: 'Video Tutorials', href: '/docs/tutorials', icon: '🎬' },
              { title: 'FAQ', href: '/faq', icon: '❓' },
              { title: 'Changelog', href: '/whats-new', icon: '📝' },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  'p-5 rounded-2xl text-center group',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <span className="text-2xl mb-3 block">{link.icon}</span>
                <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            Can't find an answer?
          </h2>
          <p className="text-foreground-light mb-10">Contact our support team for help</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className={cn(
                  'p-6 rounded-2xl text-center group',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                  <method.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">{method.title}</h3>
                <p className="text-[12px] text-foreground-lighter mb-3">{method.description}</p>
                <span className="text-[13px] text-brand-500 font-medium">{method.action} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
