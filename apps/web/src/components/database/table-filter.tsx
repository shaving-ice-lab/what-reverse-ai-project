'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TableColumn, QueryFilter } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

const OPERATORS = [
  { value: '=', label: '= Equals' },
  { value: '!=', label: '!= Not Equals' },
  { value: '>', label: '> Greater Than' },
  { value: '<', label: '< Less Than' },
  { value: '>=', label: '>= Greater or Equal' },
  { value: '<=', label: '<= Less or Equal' },
  { value: 'LIKE', label: 'LIKE Contains' },
  { value: 'NOT LIKE', label: 'NOT LIKE' },
  { value: 'IS NULL', label: 'IS NULL' },
  { value: 'IS NOT NULL', label: 'IS NOT NULL' },
  { value: 'IN', label: 'IN List' },
]

const NULL_OPERATORS = ['IS NULL', 'IS NOT NULL']

export type FilterCombinator = 'AND' | 'OR'

export interface TableFilterProps {
  columns: TableColumn[]
  filters: QueryFilter[]
  combinator: FilterCombinator
  onChange: (filters: QueryFilter[], combinator: FilterCombinator) => void
  className?: string
}

export function TableFilter({
  columns,
  filters,
  combinator,
  onChange,
  className,
}: TableFilterProps) {
  const [isOpen, setIsOpen] = useState(filters.length > 0)

  const addFilter = () => {
    const firstCol = columns[0]?.name || ''
    onChange([...filters, { column: firstCol, operator: '=', value: '' }], combinator)
    if (!isOpen) setIsOpen(true)
  }

  const removeFilter = (index: number) => {
    const next = filters.filter((_, i) => i !== index)
    onChange(next, combinator)
  }

  const updateFilter = (index: number, patch: Partial<QueryFilter>) => {
    const next = filters.map((f, i) => (i === index ? { ...f, ...patch } : f))
    onChange(next, combinator)
  }

  const clearAll = () => {
    onChange([], combinator)
    setIsOpen(false)
  }

  const toggleCombinator = () => {
    onChange(filters, combinator === 'AND' ? 'OR' : 'AND')
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toggle + Badge Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={isOpen ? 'secondary' : 'ghost'}
          onClick={() => setIsOpen(!isOpen)}
          className="h-7 text-xs"
        >
          <Filter className="w-3.5 h-3.5 mr-1" />
          Filter
          {filters.length > 0 && (
            <span className="ml-1 px-1 py-0.5 text-[10px] rounded bg-brand-500 text-white">
              {filters.length}
            </span>
          )}
        </Button>

        {/* Active filter badges (shown when panel is closed) */}
        {!isOpen && filters.length > 0 && (
          <>
            {filters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-200 text-xs text-foreground"
              >
                <span className="font-medium">{f.column}</span>
                <span className="text-foreground-muted">{f.operator}</span>
                {!NULL_OPERATORS.includes(f.operator) && <span>{f.value}</span>}
                <button
                  onClick={() => removeFilter(i)}
                  className="ml-0.5 text-foreground-muted hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAll}
              className="text-[10px] text-foreground-muted hover:text-destructive"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Filter Builder Panel */}
      {isOpen && (
        <div className="border border-border rounded-lg bg-surface-100/50 p-3 space-y-2">
          {/* Combinator toggle */}
          {filters.length > 1 && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider">
                Match
              </span>
              <button
                onClick={toggleCombinator}
                className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded border transition-colors',
                  combinator === 'AND'
                    ? 'border-brand-500/30 bg-brand-500/10 text-brand-500'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                )}
              >
                {combinator === 'AND' ? 'ALL conditions (AND)' : 'ANY condition (OR)'}
              </button>
            </div>
          )}

          {/* Filter rows */}
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Combinator label between rows */}
              {index > 0 && (
                <span className="text-[10px] text-foreground-muted w-8 text-right shrink-0">
                  {combinator}
                </span>
              )}
              {index === 0 && filters.length > 1 && <span className="w-8 shrink-0" />}

              {/* Column select */}
              <Select
                value={filter.column}
                onValueChange={(val) => updateFilter(index, { column: val })}
              >
                <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <span className="flex items-center gap-1.5">
                        <span>{col.name}</span>
                        <span className="text-[10px] text-foreground-muted">{col.type}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator select */}
              <Select
                value={filter.operator}
                onValueChange={(val) => {
                  const patch: Partial<QueryFilter> = { operator: val }
                  if (NULL_OPERATORS.includes(val)) {
                    patch.value = ''
                  }
                  updateFilter(index, patch)
                }}
              >
                <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input */}
              {!NULL_OPERATORS.includes(filter.operator) && (
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder={
                    filter.operator === 'IN'
                      ? 'val1, val2, val3'
                      : filter.operator === 'LIKE'
                        ? '%search%'
                        : 'Value'
                  }
                  className="h-7 text-xs flex-1 min-w-[80px]"
                />
              )}

              {/* Remove button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFilter(index)}
                className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {/* Add + Clear buttons */}
          <div className="flex items-center justify-between pt-1">
            <Button size="sm" variant="ghost" onClick={addFilter} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add Condition
            </Button>
            {filters.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAll}
                className="h-7 text-xs text-foreground-muted hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
