'use client'

import React, { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Key,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TableColumn, QueryFilter } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'
import { TableFilter, type FilterCombinator } from './table-filter'
import { CellEditor } from './cell-editor'

export interface TableGridProps {
  columns: TableColumn[]
  rows: Record<string, unknown>[]
  totalCount: number
  page: number
  pageSize: number
  orderBy?: string
  orderDir?: 'ASC' | 'DESC'
  loading?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSortChange: (column: string, dir: 'ASC' | 'DESC' | null) => void
  onInsertRow: () => void
  onDeleteSelected: (ids: unknown[]) => void
  onFilterChange: (filters: QueryFilter[]) => void
  onRefresh: () => void
  onRowClick?: (row: Record<string, unknown>) => void
  onUpdateCell?: (rowId: unknown, column: string, newValue: unknown) => void
  filters: QueryFilter[]
  primaryKey: string[]
  combinator?: FilterCombinator
  onCombinatorChange?: (combinator: FilterCombinator) => void
}

export function TableGrid({
  columns,
  rows,
  totalCount,
  page,
  pageSize,
  orderBy,
  orderDir,
  loading,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onInsertRow,
  onDeleteSelected,
  onFilterChange,
  onRefresh,
  onRowClick,
  onUpdateCell,
  filters,
  primaryKey,
  combinator = 'AND',
  onCombinatorChange,
}: TableGridProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowKey: string; column: string } | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const getRowKey = (row: Record<string, unknown>): string => {
    if (primaryKey.length > 0) {
      return primaryKey.map((pk) => String(row[pk] ?? '')).join('_')
    }
    return JSON.stringify(row)
  }

  const allSelected = rows.length > 0 && selectedRows.size === rows.length
  const someSelected = selectedRows.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map((r) => getRowKey(r))))
    }
  }

  const toggleRow = (key: string) => {
    const next = new Set(selectedRows)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setSelectedRows(next)
  }

  const handleSort = (colName: string) => {
    if (orderBy === colName) {
      if (orderDir === 'ASC') {
        onSortChange(colName, 'DESC')
      } else {
        onSortChange(colName, null)
      }
    } else {
      onSortChange(colName, 'ASC')
    }
  }

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0 || primaryKey.length === 0) return
    const ids = rows.filter((r) => selectedRows.has(getRowKey(r))).map((r) => r[primaryKey[0]])
    onDeleteSelected(ids)
    setSelectedRows(new Set())
  }

  const exportCSV = () => {
    if (rows.length === 0 || columns.length === 0) return
    const colNames = columns.map((c) => c.name)
    const header = colNames.join(',')
    const csvRows = rows.map((row) =>
      colNames
        .map((col) => {
          const val = row[col]
          if (val === null || val === undefined) return ''
          const str = String(val)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-75/60">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={onInsertRow} className="h-7 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Insert row
          </Button>
          {selectedRows.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
              className="h-7 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete ({selectedRows.size})
            </Button>
          )}
          <TableFilter
            columns={columns}
            filters={filters}
            combinator={combinator}
            onChange={(newFilters, newCombinator) => {
              onFilterChange(newFilters)
              onCombinatorChange?.(newCombinator)
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={exportCSV} className="h-7 text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            className="h-7 text-xs"
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
          </div>
        )}
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-5">
            <tr className="bg-surface-75 border-b border-border">
              <th className="w-10 px-3 py-2 text-left">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-3 py-2 text-left cursor-pointer select-none group hover:bg-surface-200/50 transition-colors"
                  onClick={() => handleSort(col.name)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-foreground truncate">
                      {col.name}
                    </span>
                    <ColumnBadges col={col} />
                    <span className="ml-auto shrink-0">
                      {orderBy === col.name ? (
                        orderDir === 'ASC' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-brand-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-brand-500" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] text-foreground-muted font-normal mt-0.5">
                    {col.type}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-12 text-foreground-muted text-sm"
                >
                  No rows found
                </td>
              </tr>
            ) : (
              rows.map((row, _idx) => {
                const key = getRowKey(row)
                const selected = selectedRows.has(key)
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b border-border transition-colors',
                      selected ? 'bg-brand-500/5' : 'hover:bg-surface-200/30',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    <td className="w-10 px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected} onCheckedChange={() => toggleRow(key)} />
                    </td>
                    {columns.map((col) => {
                      const isEditing =
                        editingCell?.rowKey === key && editingCell?.column === col.name
                      return (
                        <td
                          key={col.name}
                          className="px-3 py-1.5 text-[13px] text-foreground max-w-[300px] truncate"
                          onDoubleClick={(e) => {
                            if (!onUpdateCell || col.is_primary_key) return
                            e.stopPropagation()
                            setEditingCell({ rowKey: key, column: col.name })
                          }}
                        >
                          {isEditing ? (
                            <CellEditor
                              value={row[col.name]}
                              columnName={col.name}
                              columnType={col.type}
                              nullable={col.nullable}
                              onSave={(newValue) => {
                                const rowId = primaryKey.length > 0 ? row[primaryKey[0]] : undefined
                                if (rowId !== undefined && onUpdateCell) {
                                  onUpdateCell(rowId, col.name, newValue)
                                }
                                setEditingCell(null)
                              }}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : (
                            <CellValue value={row[col.name]} type={col.type} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-75/60 text-xs text-foreground-light">
        <div className="flex items-center gap-2">
          <span>{totalCount.toLocaleString()} rows</span>
          <span className="text-foreground-muted">|</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColumnBadges({ col }: { col: TableColumn }) {
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {col.is_primary_key && (
        <span title="Primary Key">
          <Key className="w-3 h-3 text-amber-500" />
        </span>
      )}
      {col.is_unique && !col.is_primary_key && (
        <span className="text-[9px] font-bold text-blue-400" title="Unique">
          U
        </span>
      )}
      {!col.nullable && !col.is_primary_key && (
        <span title="NOT NULL">
          <AlertCircle className="w-3 h-3 text-foreground-muted" />
        </span>
      )}
    </span>
  )
}

function CellValue({ value }: { value: unknown; type: string }) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-muted italic">NULL</span>
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className={cn(
          'px-1.5 py-0.5 rounded text-[11px] font-medium',
          value ? 'bg-brand-500/10 text-brand-500' : 'bg-surface-200 text-foreground-muted'
        )}
      >
        {String(value)}
      </span>
    )
  }
  if (typeof value === 'object') {
    return (
      <span className="font-mono text-xs text-foreground-light">
        {JSON.stringify(value).slice(0, 100)}
      </span>
    )
  }
  return <span>{String(value)}</span>
}
