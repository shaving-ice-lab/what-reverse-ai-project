'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataProvider } from './data-provider'
import { StatsCardBlock } from './blocks/stats-card-block'
import { DataTableBlock } from './blocks/data-table-block'
import { ChartBlock } from './blocks/chart-block'
import { FormBlock } from './blocks/form-block'
import { DetailViewBlock } from './blocks/detail-view-block'
import { MarkdownBlock } from './blocks/markdown-block'
import type {
  AppSchema,
  AppPage,
  AppBlock,
  StatsCardConfig,
  DataTableConfig,
  ChartConfig,
  FormConfig,
  DetailViewConfig,
} from './types'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FileText, Users, ShoppingCart, Truck,
  BarChart3, Home, Mail, Calendar, Settings, Globe,
}

interface AppRendererProps {
  schema: AppSchema
  workspaceId: string
  className?: string
  skipDataProvider?: boolean
}

export function AppRenderer({ schema, workspaceId, className, skipDataProvider }: AppRendererProps) {
  const [currentPageId, setCurrentPageId] = useState(schema.default_page || schema.pages[0]?.id || '')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const currentPage = schema.pages.find((p) => p.id === currentPageId) || schema.pages[0]
  const navType = schema.navigation?.type || 'sidebar'

  const content = (
      <div className={cn('flex h-full bg-background', className)}>
        {/* Sidebar Navigation */}
        {navType === 'sidebar' && (
          <aside
            className={cn(
              'border-r border-border bg-surface-200/20 flex flex-col shrink-0 transition-all',
              sidebarOpen ? 'w-52' : 'w-12'
            )}
          >
            <div className="px-3 py-3 border-b border-border flex items-center gap-2">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground-muted hover:text-foreground">
                <Menu className="w-4 h-4" />
              </button>
              {sidebarOpen && <span className="text-sm font-medium text-foreground truncate">App</span>}
            </div>
            <nav className="flex-1 py-2">
              {schema.pages.map((page) => {
                const Icon = iconMap[page.icon || ''] || FileText
                const isActive = page.id === currentPageId
                return (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageId(page.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-500/10 text-brand-500 font-medium'
                        : 'text-foreground-muted hover:text-foreground hover:bg-surface-200/50'
                    )}
                    title={page.title}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{page.title}</span>}
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          {navType === 'topbar' && (
            <div className="border-b border-border px-4 py-2 flex items-center gap-1 bg-surface-200/20 overflow-x-auto">
              {schema.pages.map((page) => {
                const Icon = iconMap[page.icon || ''] || FileText
                const isActive = page.id === currentPageId
                return (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageId(page.id)}
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
                    onClick={() => setCurrentPageId(page.id)}
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
            {currentPage && <PageContent page={currentPage} />}
          </div>
        </div>
      </div>
  )

  if (skipDataProvider) {
    return content
  }

  return (
    <DataProvider workspaceId={workspaceId}>
      {content}
    </DataProvider>
  )
}

function PageContent({ page }: { page: AppPage }) {
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold text-foreground">{page.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {page.blocks
          .filter((b) => b.type === 'stats_card')
          .map((block) => (
            <StatsCardBlock key={block.id} config={block.config as unknown as StatsCardConfig} />
          ))}
      </div>
      <div className="space-y-4">
        {page.blocks
          .filter((b) => b.type !== 'stats_card')
          .map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
      </div>
    </div>
  )
}

function BlockRenderer({ block }: { block: AppBlock }) {
  switch (block.type) {
    case 'stats_card':
      return <StatsCardBlock config={block.config as unknown as StatsCardConfig} />
    case 'data_table':
      return <DataTableBlock config={block.config as unknown as DataTableConfig} />
    case 'chart':
      return <ChartBlock config={block.config as unknown as ChartConfig} />
    case 'form':
    case 'form_dialog':
      return <FormBlock config={block.config as unknown as FormConfig} />
    case 'detail_view':
      return <DetailViewBlock config={block.config as unknown as DetailViewConfig} />
    case 'markdown':
      return <MarkdownBlock content={(block.config as any).content || ''} />
    default:
      return (
        <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-foreground-muted">
          Unknown block type: {block.type}
        </div>
      )
  }
}
