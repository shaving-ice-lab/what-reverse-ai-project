'use client'

import React, { useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import type { DataTableConfig } from '../types'

interface DataTableBlockProps {
  config: DataTableConfig
}

export function DataTableBlock({ config }: DataTableBlockProps) {
  const { queryRows, deleteRows } = useDataProvider()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const pageSize = config.page_size || 20

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await queryRows(config.table_name, {
        limit: pageSize,
        offset: page * pageSize,
        where: search ? `name LIKE '%${search}%'` : undefined,
      })
      setRows(result.rows)
      setTotal(result.total)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, config.table_name])

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = row['id']
    if (!id) return
    try {
      await deleteRows(config.table_name, `id = '${id}'`)
      fetchData()
    } catch { /* ignore */ }
  }

  const totalPages = Math.ceil(total / pageSize)
  const actions = config.actions || []

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      {(config.search_enabled || config.filters_enabled) && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface-200/20">
          {config.search_enabled && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                placeholder="Search..."
                className="h-7 pl-7 text-xs"
              />
            </div>
          )}
          <span className="text-[10px] text-foreground-muted ml-auto">
            {total} records
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-200/30">
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-foreground-muted px-3 py-2 border-b border-border"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="text-right text-xs font-medium text-foreground-muted px-3 py-2 border-b border-border w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + (actions.length > 0 ? 1 : 0)} className="px-3 py-8 text-center text-xs text-foreground-muted">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + (actions.length > 0 ? 1 : 0)} className="px-3 py-8 text-center text-xs text-foreground-muted">
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-surface-200/20 transition-colors">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 border-b border-border/50 text-foreground-light">
                      {formatCellValue(row[col.key], col.type)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-3 py-2 border-b border-border/50 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {actions.includes('view') && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        {actions.includes('edit') && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        {actions.includes('delete') && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete(row)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {config.pagination !== false && totalPages > 1 && (
        <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-surface-200/20">
          <span className="text-[10px] text-foreground-muted">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCellValue(value: unknown, type?: string): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-foreground-muted">—</span>
  switch (type) {
    case 'boolean':
      return <span className={cn('text-xs px-1.5 py-0.5 rounded', value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600')}>{value ? 'Yes' : 'No'}</span>
    case 'date':
      return new Date(String(value)).toLocaleDateString()
    case 'badge':
      return <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500">{String(value)}</span>
    default:
      return String(value)
  }
}
