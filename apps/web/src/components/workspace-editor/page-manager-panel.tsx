'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
]

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
  className?: string
}

export function PageManagerPanel({ config, onChange, className }: PageManagerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

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
    })
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
  }

  const updatePage = (pageId: string, updates: Partial<PageConfig>) => {
    onChange({
      ...config,
      pages: config.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    })
  }

  const setDefaultPage = (pageId: string) => {
    onChange({ ...config, default_page: pageId })
  }

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find((o) => o.name === iconName)
    return found ? found.icon : FileText
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-foreground-muted" />
          <span className="text-sm font-medium">Pages</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 text-foreground-muted">
            {config.pages.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={addPage} className="h-7 px-2">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Page List */}
      <div className="flex-1 overflow-y-auto">
        {config.pages.length === 0 && (
          <div className="p-4 text-center text-xs text-foreground-muted">
            No pages configured. Click + to add a page.
          </div>
        )}

        {config.pages.map((page) => {
          const IconComp = getIconComponent(page.icon)
          const isEditing = editingId === page.id
          const isDefault = config.default_page === page.id

          return (
            <div key={page.id} className="border-b border-border last:border-0">
              {/* Page row */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-200/30 transition-colors',
                  isEditing && 'bg-surface-200/50'
                )}
                onClick={() => setEditingId(isEditing ? null : page.id)}
              >
                <GripVertical className="w-3 h-3 text-foreground-muted/40 shrink-0" />
                <IconComp className="w-4 h-4 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{page.title}</div>
                  <div className="text-[10px] text-foreground-muted truncate">{page.route}</div>
                </div>
                {isDefault && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-brand-500/10 text-brand-500 shrink-0">
                    Default
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePage(page.id)
                  }}
                  className="h-6 w-6 p-0 text-foreground-muted hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="px-4 pb-3 space-y-2.5 bg-surface-200/20">
                  <div>
                    <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
                      Title
                    </label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(page.id, { title: e.target.value })}
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
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
                    <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
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
                  {!isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultPage(page.id)}
                      className="h-7 text-xs w-full"
                    >
                      Set as Default Page
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation Type */}
      <div className="px-4 py-3 border-t border-border">
        <label className="text-[10px] text-foreground-muted uppercase tracking-wider">
          Navigation
        </label>
        <div className="flex gap-1.5 mt-1">
          {['sidebar', 'topbar', 'tabs'].map((navType) => (
            <button
              key={navType}
              onClick={() => onChange({ ...config, navigation: { type: navType } })}
              className={cn(
                'flex-1 text-xs py-1.5 rounded border transition-colors capitalize',
                config.navigation.type === navType
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border text-foreground-muted hover:border-foreground-muted'
              )}
            >
              {navType}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
