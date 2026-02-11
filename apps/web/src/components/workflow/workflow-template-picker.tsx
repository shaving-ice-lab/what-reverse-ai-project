'use client'

import React from 'react'
import {
  Table,
  BarChart3,
  CheckSquare,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WorkflowTemplateInfo {
  id: string
  name: string
  description: string
  category: string
  icon: string
  builtin: boolean
}

interface WorkflowTemplatePickerProps {
  templates: WorkflowTemplateInfo[]
  selectedId?: string
  onSelect: (templateId: string) => void
  className?: string
}

const categoryLabels: Record<string, string> = {
  application: 'Application',
  analytics: 'Analytics',
  business: 'Business',
}

const iconMap: Record<string, React.ElementType> = {
  Table: Table,
  BarChart3: BarChart3,
  CheckSquare: CheckSquare,
  FileText: FileText,
}

export function WorkflowTemplatePicker({
  templates,
  selectedId,
  onSelect,
  className,
}: WorkflowTemplatePickerProps) {
  // Group by category
  const grouped = templates.reduce<Record<string, WorkflowTemplateInfo[]>>((acc, t) => {
    const cat = t.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="w-4 h-4 text-brand-500" />
        Choose a Template
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-2">
            {categoryLabels[category] || category}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {items.map((tmpl) => {
              const Icon = iconMap[tmpl.icon] || FileText
              const isSelected = selectedId === tmpl.id

              return (
                <button
                  key={tmpl.id}
                  onClick={() => onSelect(tmpl.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/20'
                      : 'border-border hover:border-foreground-muted/50 hover:bg-surface-200/30'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-brand-500/10 text-brand-500' : 'bg-surface-200 text-foreground-muted'
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {tmpl.name}
                      {tmpl.builtin && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-brand-500/10 text-brand-500">
                          Built-in
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                      {tmpl.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className="text-center text-xs text-foreground-muted py-6">
          No templates available.
        </div>
      )}
    </div>
  )
}
