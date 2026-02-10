'use client'

/**
 * TemplateMarketplacePage - LobeHub Style Design
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Star,
  Download,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Code,
  MessageSquare,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Categories
const categories = [
  { id: 'all', name: 'All', icon: Sparkles },
  { id: 'automation', name: 'Automation', icon: Zap },
  { id: 'ai', name: 'AI Assistant', icon: Bot },
  { id: 'data', name: 'Data Processing', icon: BarChart3 },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'development', name: 'Development', icon: Code },
]

// Template Data
const templates = [
  {
    id: '1',
    name: 'Smart Support Bot',
    description: '24/7 automated customer responses with multi-channel support',
    category: 'ai',
    author: 'AgentFlow',
    rating: 4.9,
    downloads: 12500,
    icon: '🤖',
    tags: ['Support', 'AI', 'Automation'],
    featured: true,
  },
  {
    id: '2',
    name: 'GitHub PR Auto-Review',
    description: 'Automatically review pull requests, check code quality and standards',
    category: 'development',
    author: 'DevTools',
    rating: 4.8,
    downloads: 8900,
    icon: '🔍',
    tags: ['GitHub', 'Code Review', 'CI/CD'],
    featured: true,
  },
  {
    id: '3',
    name: 'Social Media Content Publisher',
    description: 'Publish content to multiple social media platforms with one click',
    category: 'automation',
    author: 'ContentAI',
    rating: 4.7,
    downloads: 6700,
    icon: '📱',
    tags: ['Social Media', 'Content', 'Automation'],
    featured: false,
  },
  {
    id: '4',
    name: 'Sales Lead Scoring',
    description: 'Automatically evaluate sales leads and prioritize high-value customers',
    category: 'data',
    author: 'SalesBot',
    rating: 4.6,
    downloads: 5400,
    icon: '📊',
    tags: ['Sales', 'CRM', 'Data Analytics'],
    featured: false,
  },
  {
    id: '5',
    name: 'Email Auto-Reply',
    description: 'Intelligently categorize emails and send automated replies',
    category: 'communication',
    author: 'MailBot',
    rating: 4.8,
    downloads: 7800,
    icon: '📧',
    tags: ['Email', 'Automation', 'Productivity'],
    featured: true,
  },
  {
    id: '6',
    name: 'Data Report Generator',
    description: 'Automatically aggregate data and generate visual reports',
    category: 'data',
    author: 'DataViz',
    rating: 4.7,
    downloads: 6100,
    icon: '📈',
    tags: ['Data', 'Report', 'Visualization'],
    featured: false,
  },
  {
    id: '7',
    name: 'Meeting Notes Generator',
    description: 'Convert meeting recordings into structured meeting notes',
    category: 'ai',
    author: 'MeetingAI',
    rating: 4.9,
    downloads: 9200,
    icon: '📝',
    tags: ['Meetings', 'AI', 'Transcription'],
    featured: true,
  },
  {
    id: '8',
    name: 'Bug Triage Bot',
    description: 'Automatically categorize and assign bugs to the right developers',
    category: 'development',
    author: 'BugBot',
    rating: 4.5,
    downloads: 4300,
    icon: '🐛',
    tags: ['Bug', 'Project Management', 'Automation'],
    featured: false,
  },
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const featuredTemplates = templates.filter((t) => t.featured)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Sparkles className="h-4 w-4" />
            120+ Featured Templates
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Template Marketplace
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-8">
            Start with curated templates to quickly build your automation workflows
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full bg-surface-100/30 border-border/30"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all',
                  activeCategory === category.id
                    ? 'bg-foreground text-background'
                    : 'bg-surface-100/30 text-foreground-lighter hover:text-foreground'
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {activeCategory === 'all' && searchQuery === '' && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="lobe-section-header mb-6">Featured Recommendations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={cn(
                    'group p-5 rounded-2xl',
                    'bg-surface-100/30 border border-border/30',
                    'hover:border-[#4e8fff]/30 hover:shadow-lg',
                    'transition-all duration-300'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-100/50 flex items-center justify-center text-2xl mb-4">
                    {template.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#4e8fff] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-[13px] text-foreground-light mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {template.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      {(template.downloads / 1000).toFixed(1)}k
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Templates */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="lobe-section-header">
              {activeCategory === 'all'
                ? 'All Templates'
                : categories.find((c) => c.id === activeCategory)?.name}
            </h2>
            <span className="text-[12px] text-foreground-lighter">
              {filteredTemplates.length} Templates
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-foreground-lighter mx-auto mb-4" />
              <h3 className="text-[15px] font-medium text-foreground mb-2">
                No matching templates found
              </h3>
              <p className="text-[13px] text-foreground-light mb-6">
                Try adjusting your filter or search keywords
              </p>
              <Button
                variant="outline"
                className="rounded-full border-border/50 text-foreground-light"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className={cn(
                    'group p-5 rounded-2xl',
                    'bg-surface-100/30 border border-border/30',
                    'hover:border-[#4e8fff]/30 hover:shadow-lg',
                    'transition-all duration-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-100/50 flex items-center justify-center text-2xl">
                      {template.icon}
                    </div>
                    {template.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[11px] font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#4e8fff] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-[13px] text-foreground-light mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-surface-100/50 text-[11px] text-foreground-lighter"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <span className="text-[11px] text-foreground-lighter">
                      by {template.author}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {template.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {(template.downloads / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">
            Can't Find the Right Template?
          </h2>
          <p className="text-[13px] text-foreground-light mb-6">
            Create your own custom workflow from scratch
          </p>
          <Link href="/dashboard/workflows/new">
            <Button
              size="lg"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Create Workflow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
