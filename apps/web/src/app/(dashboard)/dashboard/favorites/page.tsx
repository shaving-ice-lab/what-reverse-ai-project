'use client'

/**
 * Favorite Page
 * Manages user's favorite workflows, agents, templates, and other content
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button, ButtonGroup } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import {
  Star,
  Search,
  Zap,
  Bot,
  FileText,
  FolderOpen,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  Trash2,
  StarOff,
  ExternalLink,
  Copy,
  RefreshCw,
  LayoutGrid,
  List,
  Heart,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Favorite Type Config
const typeConfig = {
  workflow: {
    label: 'Workflow',
    variant: 'primary' as const,
    icon: Zap,
    color: 'text-brand-500',
    bgColor: 'bg-brand-200/60',
    borderColor: 'border-brand-400/40',
  },
  agent: {
    label: 'Agent',
    variant: 'secondary' as const,
    icon: Bot,
    color: 'text-foreground-light',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
  },
  template: {
    label: 'Template',
    variant: 'warning' as const,
    icon: BookOpen,
    color: 'text-warning',
    bgColor: 'bg-warning-200/60',
    borderColor: 'border-warning/30',
  },
  document: {
    label: 'Document',
    variant: 'outline' as const,
    icon: FileText,
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
  },
  folder: {
    label: 'Folder',
    variant: 'outline' as const,
    icon: FolderOpen,
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    borderColor: 'border-border',
  },
}

type FavoriteType = keyof typeof typeConfig

// Mock Favorite Data
const mockFavorites = [
  {
    id: 'fav-1',
    name: 'Daily data sync workflow',
    description: 'Auto-sync data to your main database',
    type: 'workflow' as FavoriteType,
    href: '/dashboard/workflows/wf-1',
    createdAt: '2026-01-15T10:00:00',
    favoritedAt: '2026-02-01T14:30:00',
    author: 'System',
    usageCount: 156,
  },
  {
    id: 'fav-2',
    name: 'Support smart assistant',
    description: 'GPT-4 powered support agent with multi-conversation support',
    type: 'agent' as FavoriteType,
    href: '/dashboard/my-agents/agent-1',
    createdAt: '2026-01-20T09:00:00',
    favoritedAt: '2026-02-02T10:15:00',
    author: 'AI Team',
    usageCount: 89,
  },
  {
    id: 'fav-3',
    name: 'Marketing copy template',
    description: 'Generate product marketing copy in multiple styles',
    type: 'template' as FavoriteType,
    href: '/dashboard/template-gallery/tpl-1',
    createdAt: '2026-01-10T14:00:00',
    favoritedAt: '2026-01-28T16:45:00',
    author: 'Content Team',
    usageCount: 234,
  },
  {
    id: 'fav-4',
    name: 'API Development Document',
    description: 'Complete REST API documentation and usage guide',
    type: 'document' as FavoriteType,
    href: '/docs/api',
    createdAt: '2026-01-05T08:00:00',
    favoritedAt: '2026-01-25T11:20:00',
    author: 'Development Team',
    usageCount: 567,
  },
  {
    id: 'fav-5',
    name: 'User sign-up notifications flow',
    description: 'Send welcome email and SMS when a new user signs up',
    type: 'workflow' as FavoriteType,
    href: '/dashboard/workflows/wf-2',
    createdAt: '2026-01-18T13:00:00',
    favoritedAt: '2026-02-03T09:00:00',
    author: 'Operations Team',
    usageCount: 78,
  },
  {
    id: 'fav-6',
    name: 'Data Analytics Agent',
    description: 'Smart analytics assistant with natural language queries',
    type: 'agent' as FavoriteType,
    href: '/dashboard/my-agents/agent-2',
    createdAt: '2026-01-22T11:00:00',
    favoritedAt: '2026-01-30T15:30:00',
    author: 'Data Team',
    usageCount: 45,
  },
  {
    id: 'fav-7',
    name: 'Item resource folder',
    description: 'Related images, documents, and config files',
    type: 'folder' as FavoriteType,
    href: '/dashboard/files/folder-1',
    createdAt: '2026-01-08T10:00:00',
    favoritedAt: '2026-01-20T14:00:00',
    author: 'I',
    usageCount: 23,
  },
  {
    id: 'fav-8',
    name: 'E-commerce order processing template',
    description: 'Auto-update order status and sync inventory',
    type: 'template' as FavoriteType,
    href: '/dashboard/template-gallery/tpl-2',
    createdAt: '2026-01-12T16:00:00',
    favoritedAt: '2026-02-01T08:45:00',
    author: 'E-commerce Team',
    usageCount: 112,
  },
]

type SortKey = 'favoritedAt' | 'name' | 'usageCount' | 'createdAt'
type ViewMode = 'grid' | 'list'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'favoritedAt', label: 'Favorite time' },
  { value: 'name', label: 'Name' },
  { value: 'usageCount', label: 'Usage count' },
  { value: 'createdAt', label: 'Created At' },
]

// Format Time
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('favoritedAt')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState(mockFavorites)

  // Filter and Sort
  const visibleFavorites = useMemo(() => {
    const filtered = favorites.filter((fav) => {
      const matchesSearch =
        fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === 'all' || fav.type === selectedType
      return matchesSearch && matchesType
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN')
        case 'usageCount':
          return b.usageCount - a.usageCount
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'favoritedAt':
        default:
          return new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime()
      }
    })
  }, [favorites, searchQuery, selectedType, sortBy])

  // Toggle Selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  // Select All
  const toggleSelectAll = () => {
    if (selectedItems.size === visibleFavorites.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(visibleFavorites.map((f) => f.id)))
    }
  }

  // Unfavorite
  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id))
    selectedItems.delete(id)
    setSelectedItems(new Set(selectedItems))
  }

  // Batch Unfavorite
  const bulkRemove = () => {
    setFavorites((prev) => prev.filter((fav) => !selectedItems.has(fav.id)))
    setSelectedItems(new Set())
  }

  // Statistics Data
  const stats = {
    total: favorites.length,
    workflows: favorites.filter((f) => f.type === 'workflow').length,
    agents: favorites.filter((f) => f.type === 'agent').length,
    templates: favorites.filter((f) => f.type === 'template').length,
    documents: favorites.filter((f) => f.type === 'document').length,
    folders: favorites.filter((f) => f.type === 'folder').length,
  }

  const hasSelection = selectedItems.size > 0

  const statCards = [
    {
      label: 'All Favorites',
      value: stats.total,
      helper: 'Favorite items',
      icon: Star,
      iconClassName: 'bg-warning-200/60 border-warning/30 text-warning',
    },
    {
      label: 'Workflow',
      value: stats.workflows,
      helper: 'Automation flow',
      icon: Zap,
      iconClassName: 'bg-brand-200/60 border-brand-400/40 text-brand-500',
    },
    {
      label: 'Agent',
      value: stats.agents,
      helper: 'Smart assistant',
      icon: Bot,
      iconClassName: 'bg-surface-200 border-border text-foreground-light',
    },
    {
      label: 'Template',
      value: stats.templates,
      helper: 'Preset template',
      icon: BookOpen,
      iconClassName: 'bg-warning-200/60 border-warning/30 text-warning',
    },
  ]

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-3">
          <p className="page-caption">Favorites</p>
          <PageHeader
            title="Favorite"
            description="Manage your favorite workflows, agents, templates, and documents"
            actions={
              <div className="flex items-center gap-2">
                <ButtonGroup attached>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </ButtonGroup>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                {stats.total} Favorite
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {stats.workflows} Workflow
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                {stats.agents} Agent
              </span>
            </div>
          </PageHeader>
        </div>

        {/* Statistics Cards */}
        <section className="page-section">
          <div className="page-grid grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const StatIcon = stat.icon
              return (
                <Card
                  key={stat.label}
                  variant="stats"
                  hover="border"
                  padding="sm"
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-foreground-muted">{stat.label}</p>
                    <p className="text-stat-number text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-foreground-muted">{stat.helper}</p>
                  </div>
                  <div
                    className={cn(
                      'h-9 w-9 rounded-md border flex items-center justify-center',
                      stat.iconClassName
                    )}
                  >
                    <StatIcon className="w-4 h-4" />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Filter */}
        <section className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                variant="dark"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="folder">Folder</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
              <SelectTrigger className="w-[140px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>
              Display {visibleFavorites.length} / {favorites.length}
            </span>
            {selectedType !== 'all' && (
              <Badge variant="outline" size="xs">
                Type: {typeConfig[selectedType as FavoriteType]?.label}
              </Badge>
            )}
          </div>
        </section>

        {/* Batch Actions */}
        {hasSelection && (
          <section className="page-panel border-brand-400/40 bg-brand-200/20">
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-foreground">
                <Badge variant="primary" size="sm">
                  {selectedItems.size}
                </Badge>
                Selected {selectedItems.size} {selectedItems.size === 1 ? 'favorite' : 'favorites'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkRemove}
                  leftIcon={<StarOff className="w-4 h-4" />}
                >
                  Unfavorite
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Deselect
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Favorites List */}
        <section className="page-panel overflow-hidden">
          <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="page-panel-title">Favorites list</p>
              <p className="page-panel-description"> {visibleFavorites.length} Favorite</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                Refresh
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="border-t border-border">
              <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px]">
                <Checkbox
                  checked={
                    selectedItems.size === visibleFavorites.length && visibleFavorites.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-left">Name</span>
                <span className="hidden md:block text-center">Type</span>
                <span className="hidden md:block text-center">Favorite time</span>
                <span className="text-right">Action</span>
              </div>

              {visibleFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-foreground-muted" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">No favorites</h3>
                  <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                    {searchQuery
                      ? 'Try other search conditions'
                      : 'Favorited workflows, agents or templates will appear here'}
                  </p>
                  <Link href="/dashboard/workflows">
                    <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                      Browse Workflows
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleFavorites.map((fav) => {
                    const config = typeConfig[fav.type]
                    const TypeIcon = config.icon
                    const isSelected = selectedItems.has(fav.id)

                    return (
                      <div
                        key={fav.id}
                        className={cn(
                          'grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_80px] md:grid-cols-[24px_minmax(0,1fr)_100px_100px_80px]',
                          isSelected ? 'bg-brand-200/20' : 'hover:bg-surface-75/60'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(fav.id)}
                        />

                        <div className="min-w-0 flex items-start gap-3">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-md border flex items-center justify-center shrink-0',
                              config.bgColor,
                              config.borderColor
                            )}
                          >
                            <TypeIcon className={cn('w-4 h-4', config.color)} />
                          </div>
                          <div className="min-w-0">
                            <Link href={fav.href} className="group">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {fav.name}
                              </h3>
                            </Link>
                            <p className="text-[12px] text-foreground-light truncate">
                              {fav.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted mt-1">
                              <span>user: {fav.author}</span>
                              <span>·</span>
                              <span>{fav.usageCount} uses</span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:flex justify-center">
                          <Badge
                            variant={config.variant}
                            size="sm"
                            icon={<TypeIcon className="w-3 h-3" />}
                          >
                            {config.label}
                          </Badge>
                        </div>

                        <div className="hidden md:flex justify-center">
                          <span className="text-[13px] text-foreground-light">
                            {formatDate(fav.favoritedAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeFavorite(fav.id)}
                            className="text-warning"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-foreground-muted"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-lg bg-surface-100 border-border shadow-2xl"
                            >
                              <DropdownMenuItem
                                asChild
                                className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                              >
                                <Link href={fav.href}>
                                  <ExternalLink className="w-4 h-4" />
                                  Open
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                                <Copy className="w-4 h-4" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem
                                className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
                                onClick={() => removeFavorite(fav.id)}
                              >
                                <StarOff className="w-4 h-4" />
                                Unfavorite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border-t border-border">
              {visibleFavorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-foreground-muted" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">No favorites</h3>
                  <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                    {searchQuery
                      ? 'Try other search conditions'
                      : 'Favorited workflows, agents or templates will appear here'}
                  </p>
                  <Link href="/dashboard/workflows">
                    <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                      Browse Workflows
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleFavorites.map((fav) => {
                    const config = typeConfig[fav.type]
                    const TypeIcon = config.icon

                    return (
                      <Card
                        key={fav.id}
                        variant="default"
                        hover="border"
                        padding="sm"
                        className="group relative"
                      >
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeFavorite(fav.id)}
                            className="text-warning opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </Button>
                        </div>

                        <Link href={fav.href} className="block">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-md border flex items-center justify-center shrink-0',
                                config.bgColor,
                                config.borderColor
                              )}
                            >
                              <TypeIcon className={cn('w-5 h-5', config.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {fav.name}
                              </h3>
                              <Badge variant={config.variant} size="xs" className="mt-1">
                                {config.label}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-[12px] text-foreground-light line-clamp-2 mb-3">
                            {fav.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                            <span>{fav.author}</span>
                            <span>{fav.usageCount} uses</span>
                          </div>
                        </Link>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
