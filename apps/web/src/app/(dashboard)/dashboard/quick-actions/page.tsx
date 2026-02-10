'use client'

/**
 * Quick Actions Center Page - Supabase Style
 * Common Actions and Shortcut Entries
 */

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-layout'
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronRight,
  Code,
  Command,
  ExternalLink,
  FileText,
  FolderOpen,
  History,
  MessageSquare,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react'

const actionFilters = [
  { id: 'all', label: 'All' },
  { id: 'create', label: 'Create' },
  { id: 'generate', label: 'Generate' },
  { id: 'manage', label: 'Manage' },
  { id: 'settings', label: 'Settings' },
]

const featuredActions = [
  {
    title: 'New Conversation',
    description: 'Start a new conversation',
    icon: MessageSquare,
    href: '/dashboard/conversations',
    badge: 'Shortcut',
    badgeVariant: 'secondary',
    iconBg: 'bg-brand-200/60',
    iconColor: 'text-brand-500',
  },
  {
    title: 'New Workflow',
    description: 'Use templates to build automation',
    icon: Zap,
    href: '/dashboard/workflows/new',
    badge: 'Recommended',
    badgeVariant: 'primary',
    iconBg: 'bg-brand-200/60',
    iconColor: 'text-brand-500',
  },
  {
    title: 'Generate Content',
    description: 'Text, image, and code generation',
    icon: Sparkles,
    href: '/dashboard/creative/generate',
    badge: 'AI',
    badgeVariant: 'primary',
    iconBg: 'bg-surface-200',
    iconColor: 'text-foreground',
  },
  {
    title: 'Upload File',
    description: 'Organize your knowledge base',
    icon: Upload,
    href: '/dashboard/files',
    badge: 'Utility',
    badgeVariant: 'secondary',
    iconBg: 'bg-surface-200',
    iconColor: 'text-foreground',
  },
]

const quickStats = [
  {
    label: "Today's Conversations",
    value: '12',
    icon: MessageSquare,
    trend: '+5',
    hint: 'today',
    trendVariant: 'primary',
  },
  {
    label: 'Workflow Executions',
    value: '48',
    icon: Zap,
    trend: '+12',
    hint: 'today',
    trendVariant: 'primary',
  },
  {
    label: 'Agent Calls',
    value: '156',
    icon: Bot,
    trend: '+23',
    hint: 'this week',
    trendVariant: 'primary',
  },
  {
    label: 'Files Uploaded',
    value: '8',
    icon: Upload,
    trend: '+2',
    hint: 'this week',
    trendVariant: 'secondary',
  },
]

const quickActionCategories = [
  {
    id: 'create',
    title: 'Create',
    description: 'Start building a new workflow or content',
    icon: Plus,
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/60',
    actions: [
      {
        title: 'New Conversation',
        description: 'Start a new AI conversation',
        icon: MessageSquare,
        href: '/dashboard/conversations',
        shortcut: '⌘ N',
        badge: 'Shortcut',
        badgeVariant: 'primary',
      },
      {
        title: 'New Workflow',
        description: 'Create automation workflow',
        icon: Zap,
        href: '/dashboard/workflows/new',
        shortcut: '⌘ W',
      },
      {
        title: 'Create Agent',
        description: 'Create a custom AI assistant',
        icon: Bot,
        href: '/dashboard/my-agents/new',
        badge: 'Beta',
        badgeVariant: 'secondary',
      },
      {
        title: 'New Document',
        description: 'Create creative document',
        icon: FileText,
        href: '/dashboard/creative/documents',
      },
    ],
  },
  {
    id: 'generate',
    title: 'Generate',
    description: 'Use AI to generate text, images, and code',
    icon: Sparkles,
    color: 'text-foreground-light',
    bgColor: 'bg-surface-200',
    actions: [
      {
        title: 'Generate Text',
        description: 'AI text generation',
        icon: FileText,
        href: '/dashboard/creative/generate?type=text',
        badge: 'AI',
        badgeVariant: 'primary',
      },
      {
        title: 'Generate Image',
        description: 'AI image generation',
        icon: Palette,
        href: '/dashboard/creative/generate?type=image',
        badge: 'AI',
        badgeVariant: 'primary',
      },
      {
        title: 'Generate Code',
        description: 'AI code generation',
        icon: Code,
        href: '/dashboard/creative/generate?type=code',
        badge: 'AI',
        badgeVariant: 'primary',
      },
    ],
  },
  {
    id: 'manage',
    title: 'Manage',
    description: 'Manage your resources and automations',
    icon: FolderOpen,
    color: 'text-foreground-light',
    bgColor: 'bg-surface-200',
    actions: [
      {
        title: 'My workflows',
        description: 'Manage all workflows',
        icon: Zap,
        href: '/dashboard/workflows',
      },
      {
        title: 'My Agents',
        description: 'Manage AI assistants',
        icon: Bot,
        href: '/dashboard/my-agents',
        badge: 'Utility',
        badgeVariant: 'secondary',
      },
      {
        title: 'Files',
        description: 'Manage uploaded files',
        icon: Upload,
        href: '/dashboard/files',
        badge: 'Resource',
        badgeVariant: 'secondary',
      },
      {
        title: 'Favorite',
        description: 'Favorite content',
        icon: Star,
        href: '/dashboard/favorites',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Account, security, and team settings',
    icon: Settings,
    color: 'text-foreground-light',
    bgColor: 'bg-surface-200',
    actions: [
      {
        title: 'Account Settings',
        description: 'Manage account info',
        icon: Settings,
        href: '/dashboard/settings',
        shortcut: '⌘ ,',
      },
      {
        title: 'API Key',
        description: 'Manage API Config',
        icon: Shield,
        href: '/dashboard/settings/api-keys',
        badge: 'Sensitive',
        badgeVariant: 'warning',
      },
      {
        title: 'Notification Settings',
        description: 'Notification preferences',
        icon: Bell,
        href: '/dashboard/settings/notifications',
      },
      {
        title: 'Team Management',
        description: 'Manage team members',
        icon: Users,
        href: '/dashboard/team',
      },
    ],
  },
]

const recentActions = [
  {
    title: 'Customer feedback workflow',
    type: 'Workflow',
    icon: Zap,
    href: '/dashboard/workflows/1',
    time: '10 min ago',
  },
  {
    title: 'Writing Assistant Agent',
    type: 'Agent',
    icon: Bot,
    href: '/dashboard/my-agents/1',
    time: '30 min ago',
  },
  {
    title: 'SEO Blog Template',
    type: 'Template',
    icon: FileText,
    href: '/dashboard/creative/templates',
    time: '1 hour ago',
  },
  {
    title: 'Product requirements discussion',
    type: 'Conversation',
    icon: MessageSquare,
    href: '/dashboard/chat/1',
    time: '2 hours ago',
  },
]

const keyboardShortcuts = [
  { keys: ['⌘', 'K'], description: 'Open command panel' },
  { keys: ['⌘', 'N'], description: 'New conversation' },
  { keys: ['⌘', 'W'], description: 'New workflow' },
  { keys: ['⌘', ','], description: 'Open settings' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['?'], description: 'Shortcut help' },
]

const helpLinks = [
  {
    title: 'Help Center',
    description: 'Product and features guide',
    href: '/help',
  },
  {
    title: 'Learning Center',
    description: 'Best practices and templates',
    href: '/dashboard/learn',
  },
  {
    title: 'Feedback & Suggestions',
    description: 'Tell us what you need',
    href: '/dashboard/feedback',
  },
]

export default function QuickActionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredCategories = quickActionCategories
    .filter((category) => activeFilter === 'all' || category.id === activeFilter)
    .map((category) => ({
      ...category,
      actions: category.actions.filter((action) => {
        if (!normalizedQuery) return true
        return (
          action.title.toLowerCase().includes(normalizedQuery) ||
          action.description.toLowerCase().includes(normalizedQuery)
        )
      }),
    }))
    .filter((category) => category.actions.length > 0)

  const filteredFeaturedActions = featuredActions.filter((action) => {
    if (!normalizedQuery) return true
    return (
      action.title.toLowerCase().includes(normalizedQuery) ||
      action.description.toLowerCase().includes(normalizedQuery)
    )
  })

  return (
    <div className="min-h-full bg-background-studio">
      {/* PageHeader */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
          <PageHeader
            eyebrow="Operations"
            title="Quick Actions Center"
            description="Quick access to features, templates, and system settings"
            icon={<Command className="w-4 h-4 text-brand-500" />}
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />}>
                  Customize Panel
                </Button>
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  New Action
                </Button>
              </div>
            }
          />

          <div className="page-grid lg:grid-cols-[minmax(0,1fr)_auto] gap-3 lg:gap-3 lg:items-center">
            <Input
              variant="search"
              inputSize="lg"
              placeholder="Search actions, features or pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted">
                    K
                  </kbd>
                </div>
              }
              className="w-full"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {actionFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                  className="h-8 px-3 text-[12px]"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Shortcut Launch */}
        {filteredFeaturedActions.length > 0 && (
          <section className="page-panel">
            <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span className="page-panel-title">Shortcut launch</span>
                  <Badge variant="secondary" size="sm">
                    Recommended
                  </Badge>
                </div>
                <p className="page-panel-description">Quick entry by scenario</p>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-foreground-light hover:text-foreground"
              >
                <Link href="/dashboard/shortcuts">Manage shortcuts</Link>
              </Button>
            </div>
            <div className="p-4 page-grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3">
              {filteredFeaturedActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-md border border-border bg-surface-100 p-4 hover:border-border-strong hover:bg-surface-75/80 transition-supabase"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-md flex items-center justify-center border border-transparent',
                          action.iconBg
                        )}
                      >
                        <Icon className={cn('w-4 h-4', action.iconColor)} />
                      </div>
                      {action.badge && (
                        <Badge variant={action.badgeVariant} size="xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-3 text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-foreground-muted">{action.description}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Today's Overview */}
        <section className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">Today's overview</span>
              </div>
              <p className="page-panel-description">Past 24h activity trend</p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-foreground-light hover:text-foreground"
            >
              <Link href="/dashboard/analytics">View report</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Icon className="w-4 h-4" />
                      <span>{stat.label}</span>
                    </div>
                    <Badge variant={stat.trendVariant} size="xs" className="tabular-nums">
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-stat-number text-foreground">{stat.value}</p>
                    <span className="text-[11px] text-foreground-muted">{stat.hint}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-8">
          {/* Left Side - Action Categories */}
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="page-panel">
                <div className="p-6 text-center">
                  <p className="text-sm text-foreground">No matching actions</p>
                  <p className="text-xs text-foreground-muted">
                    Try adjusting your keywords or filter criteria
                  </p>
                </div>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const CategoryIcon = category.icon
                return (
                  <section key={category.id} className="page-panel">
                    <div className="page-panel-header flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-md flex items-center justify-center border border-transparent',
                            category.bgColor
                          )}
                        >
                          <CategoryIcon className={cn('w-4 h-4', category.color)} />
                        </div>
                        <div>
                          <span className="page-panel-title">{category.title}</span>
                          <p className="page-panel-description">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" size="xs">
                        {category.actions.length} actions
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2">
                      {category.actions.map((action) => {
                        const Icon = action.icon
                        return (
                          <Link
                            key={action.title}
                            href={action.href}
                            className="group flex items-center gap-3 rounded-md border border-transparent bg-surface-100/60 px-3 py-2.5 hover:border-border-strong hover:bg-surface-75/80 transition-supabase"
                          >
                            <div
                              className={cn(
                                'w-9 h-9 rounded-md flex items-center justify-center border border-border',
                                category.bgColor
                              )}
                            >
                              <Icon className={cn('w-4 h-4', category.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                                  {action.title}
                                </span>
                                {action.badge && (
                                  <Badge variant={action.badgeVariant ?? 'secondary'} size="xs">
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-foreground-muted">{action.description}</p>
                            </div>
                            {action.shortcut ? (
                              <kbd className="px-2 py-1 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted shrink-0">
                                {action.shortcut}
                              </kbd>
                            ) : (
                              <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                )
              })
            )}
          </div>

          {/* Right Side - Recent Usage and Keyboard Shortcuts */}
          <aside className="space-y-6">
            {/* Recent Usage */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-foreground-muted" />
                  <span className="page-panel-title">Recent usage</span>
                </div>
                <Badge variant="secondary" size="xs">
                  {recentActions.length} items
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                {recentActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={index}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-75 transition-supabase"
                    >
                      <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-foreground-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] text-foreground truncate group-hover:text-brand-500 transition-colors">
                            {action.title}
                          </p>
                          <Badge variant="secondary" size="xs">
                            {action.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted">{action.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
                    </Link>
                  )
                })}
              </div>
              <div className="px-4 pb-4">
                <Link
                  href="/dashboard/activity"
                  className="block text-[12px] text-brand-500 hover:underline text-center"
                >
                  View all activity
                </Link>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center gap-2">
                <Command className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">Keyboard Shortcuts</span>
              </div>
              <div className="p-4 space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-[13px] text-foreground-light">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <kbd
                          key={idx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-surface-200 border border-border text-foreground-muted min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Link
                  href="/dashboard/shortcuts"
                  className="block text-[12px] text-brand-500 hover:underline text-center"
                >
                  View all shortcuts
                </Link>
              </div>
            </div>

            {/* Support and Feedback */}
            <div className="page-panel border-brand-400/30 bg-brand-200/10">
              <div className="page-panel-header bg-transparent border-border/60">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-brand-500" />
                  <span className="page-panel-title">Support and feedback</span>
                </div>
                <p className="page-panel-description">Get help or share what you need</p>
              </div>
              <div className="p-4 space-y-3">
                {helpLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="group flex items-start gap-3 rounded-md border border-border/60 bg-surface-100/60 p-3 hover:border-border-strong hover:bg-surface-100 transition-supabase"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                        {link.title}
                      </p>
                      <p className="text-xs text-foreground-muted">{link.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
