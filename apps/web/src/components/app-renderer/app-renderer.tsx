'use client'

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  Home,
  Mail,
  Calendar,
  Settings,
  Globe,
  Menu,
  Package,
  DollarSign,
  Activity,
  Clock,
  Star,
  Heart,
  Database,
  Zap,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Building,
  Briefcase,
  Tag,
  BookOpen,
  Clipboard,
  PieChart,
  ListOrdered,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataProvider } from './data-provider'
import { StatsCardBlock } from './blocks/stats-card-block'
import { DataTableBlock } from './blocks/data-table-block'
import { ChartBlock } from './blocks/chart-block'
import { FormBlock } from './blocks/form-block'
import { FormDialogBlock } from './blocks/form-dialog-block'
import { DetailViewBlock } from './blocks/detail-view-block'
import { MarkdownBlock } from './blocks/markdown-block'
import { ImageBlock } from './blocks/image-block'
import { HeroBlock } from './blocks/hero-block'
import { TabsContainerBlock } from './blocks/tabs-container-block'
import { ListBlock } from './blocks/list-block'
import { DividerBlock } from './blocks/divider-block'
import { AuthBlock } from './blocks/auth-block'
import { FileUploadBlock } from './blocks/file-upload-block'
import { CustomCodeBlock } from './blocks/custom-code-block'
import type { CustomCodeConfig } from './blocks/custom-code-block'
import { CalendarBlock } from './blocks/calendar-block'
import type {
  AppSchema,
  AppPage,
  AppBlock,
  StatsCardConfig,
  DataTableConfig,
  ChartConfig,
  FormConfig,
  DetailViewConfig,
  ImageConfig,
  HeroConfig,
  TabsContainerConfig,
  ListConfig,
  DividerConfig,
  AuthBlockConfig,
  FileUploadConfig,
  CalendarConfig,
} from './types'

// ========== Page Params Context ==========

export interface PageParamsContextValue {
  params: Record<string, unknown>
  navigateToPage: (pageId: string, params?: Record<string, unknown>) => void
}

export const PageParamsContext = createContext<PageParamsContextValue>({
  params: {},
  navigateToPage: () => {},
})

export function usePageParams() {
  return useContext(PageParamsContext)
}

function parseHashParams(hash: string): { pageKey: string; params: Record<string, unknown> } {
  const cleaned = hash.replace(/^#/, '')
  const qIdx = cleaned.indexOf('?')
  if (qIdx === -1) return { pageKey: cleaned, params: {} }
  const pageKey = cleaned.slice(0, qIdx)
  const qs = cleaned.slice(qIdx + 1)
  const params: Record<string, unknown> = {}
  for (const part of qs.split('&')) {
    const [k, ...rest] = part.split('=')
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(rest.join('='))
  }
  return { pageKey, params }
}

function encodeHashParams(pageKey: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return `#${pageKey}`
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ''))}`)
    .join('&')
  return `#${pageKey}?${qs}`
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  FileText,
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  Home,
  Mail,
  Calendar,
  Settings,
  Globe,
  Package,
  DollarSign,
  Activity,
  Clock,
  Star,
  Heart,
  Database,
  Zap,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Building,
  Briefcase,
  Tag,
  BookOpen,
  Clipboard,
  PieChart,
  ListOrdered,
  MessageSquare,
  Menu,
}

interface AppRendererProps {
  schema: AppSchema
  workspaceId: string
  className?: string
  skipDataProvider?: boolean
}

export function AppRenderer({
  schema,
  workspaceId,
  className,
  skipDataProvider,
}: AppRendererProps) {
  const defaultPageId = schema.default_page || schema.pages[0]?.id || ''
  const [currentPageId, setCurrentPageId] = useState(() => {
    if (typeof window === 'undefined') return defaultPageId
    const { pageKey } = parseHashParams(window.location.hash)
    if (pageKey && schema.pages.some((p) => p.id === pageKey || p.route === `/${pageKey}`)) {
      const matched = schema.pages.find((p) => p.id === pageKey || p.route === `/${pageKey}`)
      return matched?.id || defaultPageId
    }
    return defaultPageId
  })
  const [pageParams, setPageParams] = useState<Record<string, unknown>>(() => {
    if (typeof window === 'undefined') return {}
    const { params } = parseHashParams(window.location.hash)
    return params
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (e.matches) setSidebarOpen(false)
    }
    onChange(mql)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Sync hash → state on popstate (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const { pageKey, params } = parseHashParams(window.location.hash)
      if (!pageKey) return
      const matched = schema.pages.find((p) => p.id === pageKey || p.route === `/${pageKey}`)
      if (matched) {
        setCurrentPageId(matched.id)
        setPageParams(params)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [schema.pages])

  const navigateToPage = useCallback(
    (pageId: string, params?: Record<string, unknown>) => {
      setCurrentPageId(pageId)
      setPageParams(params || {})
      if (isMobile) setSidebarOpen(false)
      if (typeof window !== 'undefined') {
        const page = schema.pages.find((p) => p.id === pageId)
        const hashValue = page?.route ? page.route.replace(/^\//, '') : pageId
        window.history.pushState(null, '', encodeHashParams(hashValue, params))
      }
    },
    [schema.pages, isMobile]
  )

  const currentPage = schema.pages.find((p) => p.id === currentPageId) || schema.pages[0]
  const navType = schema.navigation?.type || 'sidebar'

  const themeVars: Record<string, string> = {}
  if (schema.theme?.primary_color) {
    themeVars['--app-primary'] = schema.theme.primary_color
  }
  if (schema.theme?.border_radius) {
    themeVars['--app-radius'] = schema.theme.border_radius
  }
  const themeStyle = themeVars as React.CSSProperties

  const pageParamsCtx = useMemo<PageParamsContextValue>(
    () => ({
      params: pageParams,
      navigateToPage,
    }),
    [pageParams, navigateToPage]
  )

  const content = (
    <PageParamsContext.Provider value={pageParamsCtx}>
      <div className={cn('flex h-full bg-background', className)} style={themeStyle}>
        <style>{`@keyframes appPageFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        {/* Mobile sidebar backdrop */}
        {navType === 'sidebar' && isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar Navigation */}
        {navType === 'sidebar' && (
          <aside
            className={cn(
              'border-r border-border bg-surface-200/20 flex flex-col shrink-0 transition-all',
              isMobile
                ? cn(
                    'fixed inset-y-0 left-0 z-40 w-56 shadow-lg',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  )
                : sidebarOpen
                  ? 'w-52'
                  : 'w-12'
            )}
          >
            <div className="px-3 py-3 border-b border-border flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-foreground-muted hover:text-foreground"
              >
                <Menu className="w-4 h-4" />
              </button>
              {sidebarOpen && (
                <span className="text-sm font-medium text-foreground truncate">
                  {schema.app_name || 'App'}
                </span>
              )}
            </div>
            <nav className="flex-1 py-2 overflow-y-auto">
              {schema.pages.map((page) => {
                const Icon = iconMap[page.icon || ''] || FileText
                const isActive = page.id === currentPageId
                return (
                  <button
                    key={page.id}
                    onClick={() => navigateToPage(page.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-500/10 text-brand-500 font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-200/50'
                    )}
                    title={page.title}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {(sidebarOpen || isMobile) && <span className="truncate">{page.title}</span>}
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Navigation */}
          {navType === 'topbar' && (
            <div className="border-b border-border px-4 py-2 flex items-center gap-1 bg-surface-200/20 overflow-x-auto">
              {schema.app_name && (
                <span className="text-sm font-medium text-foreground mr-3 shrink-0">
                  {schema.app_name}
                </span>
              )}
              {schema.pages.map((page) => {
                const Icon = iconMap[page.icon || ''] || FileText
                const isActive = page.id === currentPageId
                return (
                  <button
                    key={page.id}
                    onClick={() => navigateToPage(page.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors shrink-0',
                      isActive
                        ? 'bg-brand-500/10 text-brand-500 font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-200/50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {page.title}
                  </button>
                )
              })}
            </div>
          )}

          {/* Tabs Navigation */}
          {navType === 'tabs' && (
            <div className="border-b border-border px-4 flex items-center gap-0 bg-surface-200/20 overflow-x-auto">
              {schema.pages.map((page) => {
                const isActive = page.id === currentPageId
                return (
                  <button
                    key={page.id}
                    onClick={() => navigateToPage(page.id)}
                    className={cn(
                      'px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0',
                      isActive
                        ? 'border-brand-500 text-brand-500 font-medium'
                        : 'border-transparent text-foreground-muted hover:text-foreground'
                    )}
                  >
                    {page.title}
                  </button>
                )
              })}
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isMobile && navType === 'sidebar' && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mb-3 flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>Menu</span>
              </button>
            )}
            {currentPage && (
              <div key={currentPage.id} style={{ animation: 'appPageFadeIn 200ms ease-out' }}>
                <PageContent page={currentPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageParamsContext.Provider>
  )

  if (skipDataProvider) {
    return content
  }

  return <DataProvider workspaceId={workspaceId}>{content}</DataProvider>
}

function PageContent({ page }: { page: AppPage }) {
  // Separate form_dialog blocks (render in header) from content blocks
  const headerDialogBlocks = page.blocks.filter((b) => b.type === 'form_dialog')
  const contentBlocks = page.blocks.filter((b) => b.type !== 'form_dialog')

  // Group consecutive stats_card blocks together for compact grid rendering
  const groups: { type: 'stats_group' | 'block'; blocks: AppBlock[] }[] = []
  for (const block of contentBlocks) {
    if (block.type === 'stats_card') {
      const last = groups[groups.length - 1]
      if (last?.type === 'stats_group') {
        last.blocks.push(block)
      } else {
        groups.push({ type: 'stats_group', blocks: [block] })
      }
    } else {
      groups.push({ type: 'block', blocks: [block] })
    }
  }

  const hasGridBlocks = contentBlocks.some((b) => b.grid?.col_span && b.grid.col_span < 4)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{page.title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {headerDialogBlocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          {page.actions?.map((action) => (
            <PageActionButton key={action.id} action={action} />
          ))}
        </div>
      </div>
      {hasGridBlocks ? (
        <div className="grid grid-cols-4 gap-4">
          {groups.map((group, gi) => {
            if (group.type === 'stats_group') {
              return (
                <div
                  key={`sg-${gi}`}
                  className="col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {group.blocks.map((block) => (
                    <StatsCardBlock
                      key={block.id}
                      config={block.config as unknown as StatsCardConfig}
                      dataSource={block.data_source}
                    />
                  ))}
                </div>
              )
            }
            const block = group.blocks[0]
            const colSpan = block.grid?.col_span || 4
            const rowSpan = block.grid?.row_span
            return (
              <div
                key={block.id}
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: rowSpan && rowSpan > 1 ? `span ${rowSpan}` : undefined,
                }}
              >
                {block.label && (
                  <h3 className="text-sm font-medium text-foreground mb-2">{block.label}</h3>
                )}
                <BlockRenderer block={block} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => {
            if (group.type === 'stats_group') {
              return (
                <div
                  key={`sg-${gi}`}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {group.blocks.map((block) => (
                    <StatsCardBlock
                      key={block.id}
                      config={block.config as unknown as StatsCardConfig}
                      dataSource={block.data_source}
                    />
                  ))}
                </div>
              )
            }
            const block = group.blocks[0]
            return (
              <div key={block.id}>
                {block.label && (
                  <h3 className="text-sm font-medium text-foreground mb-2">{block.label}</h3>
                )}
                <BlockRenderer block={block} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BlockRenderer({ block }: { block: AppBlock }) {
  switch (block.type) {
    case 'stats_card':
      return (
        <StatsCardBlock
          config={block.config as unknown as StatsCardConfig}
          dataSource={block.data_source}
        />
      )
    case 'data_table':
      return <DataTableBlock config={block.config as unknown as DataTableConfig} apiSource={block.api_source} dataSource={block.data_source} />
    case 'chart':
      return (
        <ChartBlock
          config={block.config as unknown as ChartConfig}
          dataSource={block.data_source}
        />
      )
    case 'form':
      return <FormBlock config={block.config as unknown as FormConfig} />
    case 'form_dialog':
      return <FormDialogBlock config={block.config as unknown as FormConfig} />
    case 'detail_view':
      return (
        <DetailViewBlock
          config={block.config as unknown as DetailViewConfig}
          dataSource={block.data_source}
        />
      )
    case 'markdown':
      return <MarkdownBlock content={(block.config as any).content || ''} />
    case 'image':
      return <ImageBlock config={block.config as unknown as ImageConfig} />
    case 'hero':
      return <HeroBlock config={block.config as unknown as HeroConfig} />
    case 'tabs_container':
      return (
        <TabsContainerBlock
          config={block.config as unknown as TabsContainerConfig}
          renderBlock={(b) => <BlockRenderer block={b} />}
        />
      )
    case 'list':
      return (
        <ListBlock config={block.config as unknown as ListConfig} dataSource={block.data_source} />
      )
    case 'divider':
      return <DividerBlock config={block.config as unknown as DividerConfig} />
    case 'auth':
      return <AuthBlock config={block.config as unknown as AuthBlockConfig} />
    case 'file_upload':
      return <FileUploadBlock config={block.config as unknown as FileUploadConfig} />
    case 'calendar':
      return (
        <CalendarBlock
          config={block.config as unknown as CalendarConfig}
          dataSource={block.data_source}
        />
      )
    case 'custom_code':
      return <CustomCodeBlock config={block.config as unknown as CustomCodeConfig} apiSource={block.api_source} />
    default:
      return (
        <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-foreground-muted">
          Unknown block type: {block.type}
        </div>
      )
  }
}

function PageActionButton({ action }: { action: import('./types').AppAction }) {
  const variant = (action.config?.variant as string) || 'primary'
  const cls =
    variant === 'secondary'
      ? 'border border-border text-foreground hover:bg-surface-200/50'
      : 'bg-brand-500 text-white hover:bg-brand-600'

  if (action.type === 'navigate' && action.target) {
    const isInternal = action.target.startsWith('/') || action.target.startsWith('#')
    const href = isInternal ? `#${action.target.replace(/^[#/]+/, '')}` : action.target
    return (
      <a
        href={href}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
          cls
        )}
      >
        {action.label}
      </a>
    )
  }

  return (
    <button
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        cls
      )}
    >
      {action.label}
    </button>
  )
}
