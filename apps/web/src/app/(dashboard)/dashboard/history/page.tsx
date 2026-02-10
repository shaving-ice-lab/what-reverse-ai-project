'use client'

/**
 * Conversation History Page
 * Browse and manage all historical conversation records
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
  History,
  Search,
  MessageSquare,
  Bot,
  Trash2,
  Archive,
  Star,
  StarOff,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  Download,
  Share2,
  Copy,
  Eye,
  Sparkles,
  Code,
  Image,
  RefreshCw,
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

// Conversation Type Config
const typeConfig = {
  chat: {
    label: 'Conversation',
    variant: 'primary',
    icon: MessageSquare,
    iconColor: 'text-brand-500',
  },
  agent: {
    label: 'Agent',
    variant: 'secondary',
    icon: Bot,
    iconColor: 'text-foreground-light',
  },
  creative: {
    label: 'Creative',
    variant: 'warning',
    icon: Sparkles,
    iconColor: 'text-warning',
  },
  code: {
    label: 'Code',
    variant: 'outline',
    icon: Code,
    iconColor: 'text-brand-500',
  },
  image: {
    label: 'Image',
    variant: 'secondary',
    icon: Image,
    iconColor: 'text-foreground-light',
  },
} as const

// Mock Conversation History Data
const mockConversations = [
  {
    id: 'conv-1',
    title: 'Discussion About React Optimization',
    preview: 'How to use useMemo and useCallback to optimize component rendering...',
    type: 'chat' as const,
    model: 'GPT-4',
    messageCount: 24,
    starred: true,
    archived: false,
    createdAt: '2026-01-31T10:30:00',
    updatedAt: '2026-01-31T14:20:00',
  },
  {
    id: 'conv-2',
    title: 'Product Marketing Copy Generation',
    preview: 'Write compelling marketing copy for a new product launch...',
    type: 'creative' as const,
    model: 'Claude 3',
    messageCount: 12,
    starred: false,
    archived: false,
    createdAt: '2026-01-30T16:45:00',
    updatedAt: '2026-01-30T17:30:00',
  },
  {
    id: 'conv-3',
    title: 'Python Data Analytics Script',
    preview: 'Write an automated data cleaning and analytics Python script...',
    type: 'code' as const,
    model: 'GPT-4',
    messageCount: 18,
    starred: true,
    archived: false,
    createdAt: '2026-01-30T09:15:00',
    updatedAt: '2026-01-30T11:45:00',
  },
  {
    id: 'conv-4',
    title: 'Support Assistant Agent Conversation',
    preview: 'Testing the newly configured support agent responses...',
    type: 'agent' as const,
    model: 'Custom Agent',
    messageCount: 35,
    starred: false,
    archived: false,
    createdAt: '2026-01-29T14:00:00',
    updatedAt: '2026-01-29T15:30:00',
  },
  {
    id: 'conv-5',
    title: 'Website Banner Design',
    preview: 'Generate a set of banners for an e-commerce website homepage...',
    type: 'image' as const,
    model: 'DALL-E 3',
    messageCount: 8,
    starred: false,
    archived: false,
    createdAt: '2026-01-29T10:00:00',
    updatedAt: '2026-01-29T10:45:00',
  },
  {
    id: 'conv-6',
    title: 'API Documentation Writing',
    preview: 'Write detailed technical documentation for REST API endpoints...',
    type: 'creative' as const,
    model: 'Claude 3',
    messageCount: 15,
    starred: true,
    archived: false,
    createdAt: '2026-01-28T11:30:00',
    updatedAt: '2026-01-28T13:00:00',
  },
  {
    id: 'conv-7',
    title: 'Vue.js Component Refactoring',
    preview: 'Migrate Options API components to Composition API...',
    type: 'code' as const,
    model: 'GPT-4',
    messageCount: 28,
    starred: false,
    archived: true,
    createdAt: '2026-01-27T09:00:00',
    updatedAt: '2026-01-27T12:30:00',
  },
  {
    id: 'conv-8',
    title: 'User Survey Design',
    preview: 'Design a user survey for product experience feedback...',
    type: 'chat' as const,
    model: 'GPT-4',
    messageCount: 10,
    starred: false,
    archived: true,
    createdAt: '2026-01-26T15:00:00',
    updatedAt: '2026-01-26T16:00:00',
  },
]

// Time Range Options
const timeRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Recent 7 days' },
  { value: 'month', label: 'Recent 30 days' },
  { value: 'quarter', label: 'Recent 3 months' },
]

type SortKey = 'updated' | 'created' | 'messages' | 'title'
type ViewMode = 'all' | 'starred' | 'archived'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Created At' },
  { value: 'messages', label: 'Message Count' },
  { value: 'title', label: 'Title' },
]

// Format Time
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Today ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('updated')
  const [showArchived, setShowArchived] = useState(false)
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [conversations, setConversations] = useState(mockConversations)

  const activeView: ViewMode = showArchived ? 'archived' : showStarredOnly ? 'starred' : 'all'

  const setView = (view: ViewMode) => {
    if (view === 'all') {
      setShowArchived(false)
      setShowStarredOnly(false)
      return
    }
    if (view === 'starred') {
      setShowStarredOnly(true)
      setShowArchived(false)
      return
    }
    setShowArchived(true)
    setShowStarredOnly(false)
  }

  // Filter and Sort Conversations
  const visibleConversations = useMemo(() => {
    const filtered = conversations.filter((conv) => {
      // SearchFilter
      const matchesSearch =
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase())

      // TypeFilter
      const matchesType = selectedType === 'all' || conv.type === selectedType

      // ViewFilter
      const matchesArchived = activeView === 'archived' ? conv.archived : true
      const matchesStarred = activeView === 'starred' ? conv.starred : true

      // TimeRangeFilter
      let matchesTime = true
      if (timeRange !== 'all') {
        const convDate = new Date(conv.createdAt)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (timeRange) {
          case 'today':
            matchesTime = diffDays === 0
            break
          case 'week':
            matchesTime = diffDays <= 7
            break
          case 'month':
            matchesTime = diffDays <= 30
            break
          case 'quarter':
            matchesTime = diffDays <= 90
            break
        }
      }

      return matchesSearch && matchesType && matchesArchived && matchesStarred && matchesTime
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'messages':
          return b.messageCount - a.messageCount
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN')
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    return sorted
  }, [conversations, searchQuery, selectedType, activeView, timeRange, sortBy])

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

  // Select All / Deselect All
  const toggleSelectAll = () => {
    if (visibleConversations.length === 0) {
      return
    }
    if (selectedItems.size === visibleConversations.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(visibleConversations.map((c) => c.id)))
    }
  }

  // Toggle Favorite
  const toggleStar = (id: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, starred: !conv.starred } : conv))
    )
  }

  // Delete Conversation
  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    selectedItems.delete(id)
    setSelectedItems(new Set(selectedItems))
  }

  // Archive Conversation
  const archiveConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, archived: !conv.archived } : conv))
    )
  }

  // Batch Actions
  const bulkDelete = () => {
    setConversations((prev) => prev.filter((conv) => !selectedItems.has(conv.id)))
    setSelectedItems(new Set())
  }

  const bulkArchive = () => {
    setConversations((prev) =>
      prev.map((conv) => (selectedItems.has(conv.id) ? { ...conv, archived: true } : conv))
    )
    setSelectedItems(new Set())
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setTimeRange('all')
    setSortBy('updated')
    setShowArchived(false)
    setShowStarredOnly(false)
  }

  // Statistics Data
  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => !c.archived).length,
    starred: conversations.filter((c) => c.starred).length,
    archived: conversations.filter((c) => c.archived).length,
    today: conversations.filter((c) => {
      const diffDays = Math.floor(
        (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return diffDays === 0
    }).length,
  }

  const sortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ?? 'Recently Updated'

  const statCards = [
    {
      label: 'Active Conversations',
      value: stats.active,
      helper: 'Not archived',
      icon: MessageSquare,
      iconClassName: 'bg-brand-200/60 border-brand-400/40 text-brand-500',
    },
    {
      label: 'Starred Conversations',
      value: stats.starred,
      helper: 'Marked as favorite',
      icon: Star,
      iconClassName: 'bg-warning-200/60 border-warning/30 text-warning',
    },
    {
      label: "Today's Conversations",
      value: stats.today,
      helper: 'Past 24 h',
      icon: Clock,
      iconClassName: 'bg-surface-200 border-border text-foreground-light',
    },
    {
      label: 'Archived',
      value: stats.archived,
      helper: 'Historical records',
      icon: Archive,
      iconClassName: 'bg-surface-200 border-border text-foreground-light',
    },
  ]

  const viewTabs = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'starred', label: 'Favorite', count: stats.starred },
    { value: 'archived', label: 'Archive', count: stats.archived },
  ] as const

  const latestUpdate = useMemo(() => {
    if (conversations.length === 0) return null

    return conversations.reduce((latest, conv) => {
      return new Date(conv.updatedAt).getTime() > new Date(latest).getTime()
        ? conv.updatedAt
        : latest
    }, conversations[0].updatedAt)
  }, [conversations])

  const hasSelection = selectedItems.size > 0

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="page-caption">Conversations</p>
          <PageHeader
            title="Conversation History"
            description="Browse and manage all your conversation history"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
                <Link href="/">
                  <Button size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    New Conversation
                  </Button>
                </Link>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {latestUpdate ? `Last updated ${formatDate(latestUpdate)}` : 'No records'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                Favorite {stats.starred}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                Archive {stats.archived}
              </span>
            </div>
          </PageHeader>
        </div>

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

        <section className="page-panel p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <Input
                variant="dark"
                placeholder="Search conversation title or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Conversation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chat">Conversation</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
              <SelectTrigger className="w-[150px] h-9 bg-surface-200 border-border text-[12px] text-foreground">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-foreground-muted" />
                  <SelectValue placeholder="Sort by" />
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

            <ButtonGroup attached className="flex-wrap">
              {viewTabs.map((view) => (
                <Button
                  key={view.value}
                  variant={activeView === view.value ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setView(view.value)}
                  className={cn(activeView === view.value && 'bg-surface-200 border-border-strong')}
                >
                  {view.label}
                  <span className="ml-1 text-[11px] text-foreground-muted tabular-nums">
                    {view.count}
                  </span>
                </Button>
              ))}
            </ButtonGroup>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>
              Display {visibleConversations.length} / {conversations.length}
            </span>
            {searchQuery && (
              <Badge variant="outline" size="xs">
                Keywords: {searchQuery}
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge variant="outline" size="xs">
                Type: {typeConfig[selectedType as keyof typeof typeConfig]?.label}
              </Badge>
            )}
            {timeRange !== 'all' && (
              <Badge variant="outline" size="xs">
                {timeRanges.find((range) => range.value === timeRange)?.label}
              </Badge>
            )}
            {sortBy !== 'updated' && (
              <Badge variant="outline" size="xs">
                Sort: {sortLabel}
              </Badge>
            )}
            {activeView === 'starred' && (
              <Badge variant="warning" size="xs">
                Starred Only
              </Badge>
            )}
            {activeView === 'archived' && (
              <Badge variant="secondary" size="xs">
                Archived Only
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
                {selectedItems.size} conversations selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={bulkArchive}>
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
                <Button variant="destructive" size="sm" onClick={bulkDelete}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Deselect
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ConversationList */}
        <section className="page-panel overflow-hidden">
          <div className="page-panel-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="page-panel-title">Conversation List</p>
              <p className="page-panel-description">{visibleConversations.length} Conversations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export
              </Button>
            </div>
          </div>

          <div className="border-t border-border">
            <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface-75/80 text-table-header grid-cols-[24px_minmax(0,1fr)_72px] md:grid-cols-[24px_minmax(0,1fr)_110px_120px_72px] lg:grid-cols-[24px_minmax(0,1fr)_110px_90px_120px_72px]">
              <Checkbox
                checked={
                  selectedItems.size === visibleConversations.length &&
                  visibleConversations.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="flex-1 text-left">Conversation</span>
              <span className="hidden md:block text-center">Type</span>
              <span className="hidden lg:block text-center">Message</span>
              <span className="hidden md:block text-center">Updated At</span>
              <span className="text-right">Action</span>
            </div>

            {visibleConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-md bg-surface-200 border border-border flex items-center justify-center mb-4">
                  <History className="w-6 h-6 text-foreground-muted" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-2">
                  No Conversations Found
                </h3>
                <p className="text-[13px] text-foreground-light mb-4 max-w-sm">
                  {searchQuery ? 'Try different search keywords' : 'Start a new conversation'}
                </p>
                <Link href="/">
                  <Button size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    New Conversation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleConversations.map((conv) => {
                  const config = typeConfig[conv.type]
                  const TypeIcon = config.icon
                  const isSelected = selectedItems.has(conv.id)

                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        'grid items-center gap-4 px-4 py-4 transition-supabase grid-cols-[24px_minmax(0,1fr)_72px] md:grid-cols-[24px_minmax(0,1fr)_110px_120px_72px] lg:grid-cols-[24px_minmax(0,1fr)_110px_90px_120px_72px]',
                        isSelected ? 'bg-brand-200/20' : 'hover:bg-surface-75/60'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(conv.id)}
                      />

                      <div className="min-w-0 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center">
                          <TypeIcon className={cn('w-4 h-4', config.iconColor)} />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/chat/${conv.id}`} className="group block min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                                {conv.title}
                              </h3>
                              <Badge variant="outline" size="xs" className="hidden md:inline-flex">
                                {conv.model}
                              </Badge>
                              {conv.starred && (
                                <Star className="w-4 h-4 text-warning fill-current shrink-0" />
                              )}
                              {conv.archived && (
                                <Badge variant="outline" size="xs">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="text-[13px] text-foreground-light truncate">
                              {conv.preview}
                            </p>
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted md:hidden">
                            <Badge variant="outline" size="xs">
                              {conv.model}
                            </Badge>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {conv.messageCount} messages
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(conv.updatedAt)}
                            </span>
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

                      <div className="hidden lg:flex justify-center">
                        <span className="text-[13px] text-foreground-light tabular-nums">
                          {conv.messageCount}
                        </span>
                      </div>

                      <div className="hidden md:flex justify-center">
                        <span className="text-[13px] text-foreground-light">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => toggleStar(conv.id)}
                          className={cn(conv.starred ? 'text-warning' : 'text-foreground-muted')}
                        >
                          {conv.starred ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
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
                            className="w-52 rounded-lg bg-surface-100 border-border shadow-2xl"
                          >
                            <DropdownMenuItem
                              asChild
                              className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                            >
                              <Link href={`/chat/${conv.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Conversation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200">
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => archiveConversation(conv.id)}
                              className="text-[13px] text-foreground-light focus:text-foreground focus:bg-surface-200"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              {conv.archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[13px] text-destructive-400 focus:text-destructive focus:bg-destructive-200"
                              onClick={() => deleteConversation(conv.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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
        </section>
      </div>
    </PageContainer>
  )
}
