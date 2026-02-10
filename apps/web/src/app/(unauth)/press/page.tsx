'use client'

/**
 * MediacenterPage - LobeHub Style Dark Design
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Newspaper,
  Download,
  ExternalLink,
  Calendar,
  ArrowRight,
  FileText,
  Image,
  Video,
  Mail,
  Building2,
  TrendingUp,
  Award,
  Users,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Press Releases
const pressReleases = [
  {
    id: '1',
    title: 'AgentFlow completes Series B funding at $50M',
    date: '2026-01-15',
    category: 'Funding',
    excerpt:
      'AgentFlow raises $50M in Series B led by Sequoia Capital for team growth and marketplace expansion.',
    featured: true,
  },
  {
    id: '2',
    title: 'AgentFlow Enterprise: serving 500+ enterprises',
    date: '2026-01-10',
    category: 'Product',
    excerpt: 'Enterprise plan with private deploy, SOC 2 compliance and dedicated support.',
    featured: true,
  },
  {
    id: '3',
    title: 'AgentFlow hits 10M users; 300% monthly growth',
    date: '2025-12-20',
    category: 'Milestone',
    excerpt: 'Platform signups pass 10M with 300% monthly active user growth.',
    featured: false,
  },
  {
    id: '4',
    title: 'AgentFlow partnership program',
    date: '2025-12-05',
    category: 'Cooperation',
    excerpt: 'AI infrastructure and model partnerships for enterprise deployment.',
    featured: false,
  },
  {
    id: '5',
    title: 'AgentFlow named top AI tool of 2025',
    date: '2025-11-28',
    category: 'Award',
    excerpt: 'Selected among top AI tools; leading workflow automation platform.',
    featured: false,
  },
  {
    id: '6',
    title: 'AgentFlow open-sources workflow engine; 10K GitHub stars',
    date: '2025-11-15',
    category: 'Open Source',
    excerpt: 'Workflow execution engine open-sourced; exceeded 10,000 GitHub stars in one week.',
    featured: false,
  },
]

// Media Resources
const mediaAssets = [
  {
    title: 'Logo Resource',
    description: 'Logo assets in SVG, PNG and PDF',
    icon: Image,
    size: '4.2 MB',
    format: 'ZIP',
  },
  {
    title: 'Brand guide',
    description: 'Brand usage and visual standards',
    icon: FileText,
    size: '2.8 MB',
    format: 'PDF',
  },
  {
    title: 'Product screenshots',
    description: 'Product screenshots and demos',
    icon: Image,
    size: '18.5 MB',
    format: 'ZIP',
  },
  {
    title: 'Video',
    description: 'Product intro and feature demos',
    icon: Video,
    size: '156 MB',
    format: 'MP4',
  },
]

// Media Coverage
const mediaCoverage = [
  {
    source: '36Kr',
    title: 'AgentFlow: redefining workflow automation with AI',
    date: '2026-01-18',
    logo: '36Kr',
  },
  {
    source: 'TechCrunch',
    title: 'AgentFlow raises $50M to democratize AI automation',
    date: '2026-01-16',
    logo: 'TC',
  },
  {
    source: 'Synced',
    title: 'How AgentFlow implements AI agent scale apps',
    date: '2026-01-12',
    logo: 'Synced',
  },
  {
    source: 'Huxiu',
    title: "10M users: AgentFlow's growth story",
    date: '2025-12-22',
    logo: 'Huxiu',
  },
]

// Company Statistics
const companyStats = [
  { label: 'Users', value: '10M+', icon: Users },
  { label: 'Enterprise customers', value: '5000+', icon: Building2 },
  { label: 'Yearly growth', value: '300%', icon: TrendingUp },
  { label: 'Industries', value: '15+', icon: Award },
]

export default function PressPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    'all',
    'Funding',
    'Product',
    'Milestone',
    'Cooperation',
    'Award',
    'Open Source',
  ]

  const filteredReleases =
    selectedCategory === 'all'
      ? pressReleases
      : pressReleases.filter((r) => r.category === selectedCategory)

  const featuredReleases = pressReleases.filter((r) => r.featured)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-12 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Newspaper className="h-4 w-4" />
            Media center
          </div>
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-semibold text-foreground leading-tight tracking-tight mb-6">
            AgentFlow
            <br />
            <span className="text-brand">News and media</span>
          </h1>
          <p className="text-[15px] text-foreground-light max-w-2xl mx-auto mb-8">
            Latest company news, product updates and media resources
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#press-releases">
              <Button className="h-12 px-8 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90">
                View news
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#media-assets">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border/30">
                <Download className="mr-2 w-4 h-4" />
                Download media resources
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {companyStats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30"
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-brand" />
                </div>
                <div className="text-[22px] font-semibold text-foreground">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured News */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="lobe-section-header mb-8">
            <Sparkles className="w-5 h-5 text-brand" />
            <h2 className="text-[20px]">What's New</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {featuredReleases.map((release) => (
              <Link key={release.id} href={`/press/${release.id}`}>
                <div
                  className={cn(
                    'p-6 rounded-2xl h-full',
                    'bg-surface-100/30 border border-border/30',
                    'hover:border-brand/30',
                    'transition-all duration-300 group'
                  )}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="lobe-badge">{release.category}</span>
                    <span className="text-[12px] text-foreground-lighter flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {release.date}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-foreground mb-3 group-hover:text-brand transition-colors">
                    {release.title}
                  </h3>
                  <p className="text-[13px] text-foreground-light line-clamp-2">
                    {release.excerpt}
                  </p>
                  <div className="mt-4 flex items-center text-brand text-[13px]">
                    Read all
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section id="press-releases" className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-[20px] font-semibold text-foreground">News</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-full text-[13px] font-medium transition-colors',
                    selectedCategory === cat
                      ? 'bg-foreground text-background'
                      : 'bg-surface-100/30 border border-border/30 text-foreground-light hover:text-foreground'
                  )}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredReleases.map((release) => (
              <Link key={release.id} href={`/press/${release.id}`}>
                <div
                  className={cn(
                    'flex items-center gap-6 p-5 rounded-2xl',
                    'bg-surface-100/30 border border-border/30',
                    'hover:border-brand/30',
                    'transition-all duration-300 group'
                  )}
                >
                  <div className="hidden sm:flex items-center justify-center w-16 text-center">
                    <div>
                      <div className="text-[22px] font-semibold text-foreground">
                        {new Date(release.date).getDate()}
                      </div>
                      <div className="text-[11px] text-foreground-lighter">
                        {new Date(release.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-surface-200/50 text-[11px] text-foreground-lighter">
                        {release.category}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-medium text-foreground group-hover:text-brand transition-colors truncate">
                      {release.title}
                    </h3>
                    <p className="text-[12px] text-foreground-light truncate mt-1">
                      {release.excerpt}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground-lighter group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[20px] font-semibold text-foreground mb-8">Media</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediaCoverage.map((item, index) => (
              <a
                key={index}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'p-5 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-brand/30',
                  'transition-all duration-300 group'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-200/50 flex items-center justify-center font-bold text-[11px] text-foreground-lighter">
                    {item.logo}
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-lighter group-hover:text-brand transition-colors" />
                </div>
                <p className="text-[12px] text-foreground-lighter mb-2">{item.source}</p>
                <h4 className="text-[13px] font-medium text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-foreground-lighter mt-2">{item.date}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Media Assets */}
      <section id="media-assets" className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[20px] font-semibold text-foreground">Media resources</h2>
            <Link href="/brand">
              <Button variant="outline" className="rounded-full border-border/30">
                View brand guide
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediaAssets.map((asset) => (
              <div
                key={asset.title}
                className={cn(
                  'p-5 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-brand/30',
                  'transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                  <asset.icon className="w-6 h-6 text-brand" />
                </div>
                <h4 className="text-[14px] font-medium text-foreground mb-1">{asset.title}</h4>
                <p className="text-[12px] text-foreground-light mb-4">{asset.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-lighter">
                    {asset.size} · {asset.format}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-foreground-light hover:text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-2xl bg-surface-100/30 border border-border/30 text-center">
            <Mail className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-[17px] font-semibold text-foreground mb-4">Media Contact</h2>
            <p className="text-[13px] text-foreground-light mb-6 max-w-lg mx-auto">
              For media or more information, contact our team.
            </p>
            <a href="mailto:press@agentflow.ai">
              <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Mail className="mr-2 w-4 h-4" />
                press@agentflow.ai
              </Button>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
