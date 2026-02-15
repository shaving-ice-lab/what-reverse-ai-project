'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  LayoutDashboard,
  FileText,
  Settings,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  Home,
  Mail,
  Calendar,
  Globe,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Star,
  Layers,
  Table2,
  FormInput,
  PieChart,
  Image,
  Type,
  Shield,
  Upload,
  Minus,
  Search,
  Lock,
  Palette,
  PanelLeft,
  PanelTop,
  Columns3,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { AppPage, AppBlock, AppBlockType } from '@/components/app-renderer/types'

const ICON_OPTIONS = [
  { name: 'LayoutDashboard', icon: LayoutDashboard },
  { name: 'FileText', icon: FileText },
  { name: 'Users', icon: Users },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Truck', icon: Truck },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'Home', icon: Home },
  { name: 'Mail', icon: Mail },
  { name: 'Calendar', icon: Calendar },
  { name: 'Settings', icon: Settings },
  { name: 'Globe', icon: Globe },
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'Layers', icon: Layers },
]

const BLOCK_TYPE_META: Record<AppBlockType, { label: string; icon: React.ElementType; color: string }> = {
  stats_card: { label: 'Stats Card', icon: BarChart3, color: 'text-blue-500' },
  data_table: { label: 'Data Table', icon: Table2, color: 'text-emerald-500' },
  form: { label: 'Form', icon: FormInput, color: 'text-violet-500' },
  form_dialog: { label: 'Form Dialog', icon: FormInput, color: 'text-violet-400' },
  chart: { label: 'Chart', icon: PieChart, color: 'text-amber-500' },
  calendar: { label: 'Calendar', icon: Calendar, color: 'text-cyan-500' },
  detail_view: { label: 'Detail View', icon: FileText, color: 'text-sky-500' },
  markdown: { label: 'Markdown', icon: Type, color: 'text-foreground-muted' },
  image: { label: 'Image', icon: Image, color: 'text-pink-500' },
  hero: { label: 'Hero', icon: Layers, color: 'text-indigo-500' },
  tabs_container: { label: 'Tabs', icon: Columns3, color: 'text-teal-500' },
  list: { label: 'List', icon: LayoutDashboard, color: 'text-orange-500' },
  divider: { label: 'Divider', icon: Minus, color: 'text-foreground-muted' },
  auth: { label: 'Auth', icon: Shield, color: 'text-red-500' },
  file_upload: { label: 'File Upload', icon: Upload, color: 'text-green-500' },
  custom_code: { label: 'Custom Code', icon: FileText, color: 'text-yellow-500' },
}

export interface PageConfig {
  id: string
  title: string
  route: string
  icon: string
}

export interface PagesConfig {
  pages: PageConfig[]
  navigation: { type: string }
  default_page: string
}

interface PageManagerPanelProps {
  config: PagesConfig
  onChange: (config: PagesConfig) => void
  appPages?: AppPage[]
  className?: string
}

export function PageManagerPanel({ config, onChange, appPages, className }: PageManagerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedBlocksId, setExpandedBlocksId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Build a map from page id → AppPage (from the UI schema) for block info
  const appPageMap = useMemo(() => {
    const map: Record<string, AppPage> = {}
    if (appPages) {
      for (const p of appPages) {
        map[p.id] = p
      }
    }
    return map
  }, [appPages])

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return config.pages
    const q = searchQuery.toLowerCase()
    return config.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    )
  }, [config.pages, searchQuery])

  const addPage = () => {
    const id = `page_${Date.now()}`
    const newPage: PageConfig = {
      id,
      title: 'New Page',
      route: `/${id}`,
      icon: 'FileText',
    }
    onChange({
      ...config,
      pages: [...config.pages, newPage],
      default_page: config.pages.length === 0 ? id : config.default_page,
    })
    setEditingId(id)
  }

  const duplicatePage = (page: PageConfig) => {
    const id = `${page.id}_copy_${Date.now()}`
    const newPage: PageConfig = {
      ...page,
      id,
      title: `${page.title} (Copy)`,
      route: `${page.route}-copy`,
    }
    const idx = config.pages.findIndex((p) => p.id === page.id)
    const pages = [...config.pages]
    pages.splice(idx + 1, 0, newPage)
    onChange({ ...config, pages })
    setEditingId(id)
  }

  const removePage = (pageId: string) => {
    const updated = config.pages.filter((p) => p.id !== pageId)
    const newDefault = config.default_page === pageId ? updated[0]?.id || '' : config.default_page
    onChange({
      ...config,
      pages: updated,
      default_page: newDefault,
    })
    if (editingId === pageId) setEditingId(null)
    if (expandedBlocksId === pageId) setExpandedBlocksId(null)
  }

  const updatePage = (pageId: string, updates: Partial<PageConfig>) => {
    onChange({
      ...config,
      pages: config.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    })
  }

  const movePage = (pageId: string, direction: 'up' | 'down') => {
    const idx = config.pages.findIndex((p) => p.id === pageId)
    if (idx < 0) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= config.pages.length) return
    const pages = [...config.pages]
    const temp = pages[idx]
    pages[idx] = pages[newIdx]
    pages[newIdx] = temp
    onChange({ ...config, pages })
  }

  const setDefaultPage = (pageId: string) => {
    onChange({ ...config, default_page: pageId })
  }

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find((o) => o.name === iconName)
    return found ? found.icon : FileText
  }

  const getBlockMeta = (type: string) => {
    return BLOCK_TYPE_META[type as AppBlockType] || { label: type, icon: FileText, color: 'text-foreground-muted' }
  }

  // Summarize blocks by type for a given page
  const getBlockSummary = (pageId: string): { type: string; count: number }[] => {
    const ap = appPageMap[pageId]
    if (!ap || !ap.blocks || ap.blocks.length === 0) return []
    const counts: Record<string, number> = {}
    for (const b of ap.blocks) {
      counts[b.type] = (counts[b.type] || 0) + 1
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }

  const NAV_TYPE_OPTIONS: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'sidebar', label: 'Sidebar', icon: PanelLeft },
    { id: 'topbar', label: 'Top Bar', icon: PanelTop },
    { id: 'tabs', label: 'Tabs', icon: Columns3 },
  ]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-foreground-muted" />
          <span className="text-sm font-medium">Pages</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 text-foreground-muted">
            {config.pages.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {config.pages.length > 4 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
              className={cn('h-7 w-7 p-0', showSearch && 'bg-surface-200')}
              title="Search pages"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={addPage} className="h-7 px-2 gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Add</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="h-7 text-xs pl-8"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Page List */}
      <div className="flex-1 overflow-y-auto">
        {config.pages.length === 0 ? (
          <div className="flex items-center justify-center p-8 h-full">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface-200/50 flex items-center justify-center mx-auto">
                <LayoutDashboard className="w-5 h-5 text-foreground-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No Pages Yet</p>
                <p className="text-xs text-foreground-muted mt-1 max-w-[220px] mx-auto">
                  Pages define the screens of your app. Add a page to start building your UI layout.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addPage} className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add First Page
              </Button>
            </div>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-6 text-center text-xs text-foreground-muted">
            No pages match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredPages.map((page, idx) => {
            const IconComp = getIconComponent(page.icon)
            const isEditing = editingId === page.id
            const isDefault = config.default_page === page.id
            const blockSummary = getBlockSummary(page.id)
            const totalBlocks = blockSummary.reduce((s, b) => s + b.count, 0)
            const showBlocks = expandedBlocksId === page.id
            const ap = appPageMap[page.id]
            const isFirst = idx === 0
            const isLast = idx === filteredPages.length - 1

            return (
              <div key={page.id} className="border-b border-border last:border-0">
                {/* Page row */}
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-surface-200/30 transition-colors group',
                    isEditing && 'bg-surface-200/50'
                  )}
                  onClick={() => setEditingId(isEditing ? null : page.id)}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); movePage(page.id, 'up') }}
                      disabled={isFirst}
                      className={cn(
                        'w-4 h-3 flex items-center justify-center rounded-sm transition-colors',
                        isFirst ? 'text-foreground-muted/20' : 'text-foreground-muted hover:text-foreground hover:bg-surface-200'
                      )}
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); movePage(page.id, 'down') }}
                      disabled={isLast}
                      className={cn(
                        'w-4 h-3 flex items-center justify-center rounded-sm transition-colors',
                        isLast ? 'text-foreground-muted/20' : 'text-foreground-muted hover:text-foreground hover:bg-surface-200'
                      )}
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <IconComp className="w-4 h-4 text-foreground-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{page.title}</span>
                      {ap?.require_auth && (
                        <span title="Requires authentication">
                          <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-foreground-muted truncate font-mono">{page.route}</span>
                      {totalBlocks > 0 && (
                        <span className="text-[10px] text-foreground-muted/70 flex items-center gap-0.5 shrink-0">
                          <Layers className="w-2.5 h-2.5" />
                          {totalBlocks}
                        </span>
                      )}
                    </div>
                  </div>

                  {isDefault && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-medium shrink-0">
                      Default
                    </span>
                  )}

                  {/* Action buttons (visible on hover) */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {totalBlocks > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedBlocksId(showBlocks ? null : page.id)
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                        title="View blocks"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicatePage(page)
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-200 transition-colors"
                      title="Duplicate page"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removePage(page.id)
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Blocks preview (expandable) */}
                {showBlocks && ap && ap.blocks && ap.blocks.length > 0 && (
                  <div className="bg-surface-75/40 border-t border-border px-4 py-2 space-y-1">
                    <div className="text-[10px] text-foreground-muted uppercase tracking-wider mb-1.5 font-medium">
                      Blocks ({ap.blocks.length})
                    </div>
                    {ap.blocks.map((block: AppBlock, bIdx: number) => {
                      const meta = getBlockMeta(block.type)
                      const BlockIcon = meta.icon
                      return (
                        <div
                          key={block.id || bIdx}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-surface-200/30 transition-colors"
                        >
                          <BlockIcon className={cn('w-3.5 h-3.5 shrink-0', meta.color)} />
                          <span className="text-[11px] text-foreground-light flex-1 truncate">
                            {block.label || meta.label}
                          </span>
                          {block.data_source?.table && (
                            <span className="text-[9px] text-foreground-muted bg-surface-200 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
                              {block.data_source.table}
                            </span>
                          )}
                          {block.grid?.col_span && (
                            <span className="text-[9px] text-foreground-muted/60">
                              {block.grid.col_span}col
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Edit panel */}
                {isEditing && (
                  <div className="px-4 py-3 space-y-3 bg-surface-200/20 border-t border-border/50">
                    <div>
                      <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                        Title
                      </label>
                      <Input
                        value={page.title}
                        onChange={(e) => updatePage(page.id, { title: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                        Route
                      </label>
                      <Input
                        value={page.route}
                        onChange={(e) => updatePage(page.id, { route: e.target.value })}
                        className="h-8 text-sm font-mono mt-0.5"
                        placeholder="/path"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                        Icon
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ICON_OPTIONS.map((opt) => {
                          const Icon = opt.icon
                          return (
                            <button
                              key={opt.name}
                              onClick={() => updatePage(page.id, { icon: opt.name })}
                              className={cn(
                                'w-7 h-7 rounded flex items-center justify-center border transition-colors',
                                page.icon === opt.name
                                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                                  : 'border-border text-foreground-muted hover:border-foreground-muted'
                              )}
                              title={opt.name}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Block summary chips */}
                    {blockSummary.length > 0 && (
                      <div>
                        <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
                          Block Summary
                        </label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {blockSummary.map(({ type, count }) => {
                            const meta = getBlockMeta(type)
                            const BIcon = meta.icon
                            return (
                              <span
                                key={type}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-200/80 text-foreground-light"
                              >
                                <BIcon className={cn('w-2.5 h-2.5', meta.color)} />
                                {meta.label}
                                {count > 1 && <span className="text-foreground-muted">×{count}</span>}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {!isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefaultPage(page.id)}
                        className="h-7 text-xs w-full gap-1"
                      >
                        <Star className="w-3 h-3" />
                        Set as Default Page
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Navigation Type */}
      <div className="px-4 py-3 border-t border-border space-y-2.5">
        <label className="text-[10px] text-foreground-muted uppercase tracking-wider font-medium">
          Navigation Layout
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {NAV_TYPE_OPTIONS.map((opt) => {
            const NavIcon = opt.icon
            const isActive = config.navigation.type === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ ...config, navigation: { type: opt.id } })}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-md border transition-colors',
                  isActive
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground-light'
                )}
              >
                <NavIcon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
