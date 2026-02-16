'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Check,
  X,
  Download,
  Plus,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import { usePageParams } from '../app-renderer'
import type { DataTableConfig, ApiSource, DataSource, StatusActionConfig } from '../types'

interface DataTableBlockProps {
  config: DataTableConfig
  apiSource?: ApiSource
  dataSource?: DataSource
}

function buildSearchFilters(searchTerm: string, config: DataTableConfig) {
  if (!searchTerm) return { filters: undefined, combinator: undefined }
  if (config.search_key) {
    return {
      filters: [{ column: config.search_key, operator: 'LIKE', value: `%${searchTerm}%` }],
      combinator: undefined,
    }
  }
  const searchCols = config.columns
    .filter((col) => !col.type || col.type === 'text' || col.type === 'badge')
    .map((col) => col.key)
  if (searchCols.length === 0) searchCols.push(config.columns[0]?.key || 'id')
  const filters = searchCols.map((col) => ({
    column: col,
    operator: 'LIKE',
    value: `%${searchTerm}%`,
  }))
  return { filters, combinator: (filters.length > 1 ? 'OR' : undefined) as 'OR' | undefined }
}

export function DataTableBlock({ config, apiSource, dataSource }: DataTableBlockProps) {
  const { queryRows, insertRow, updateRow, deleteRows, notifyTableChange, onTableChange, fetchApiSource } =
    useDataProvider()
  const { navigateToPage } = usePageParams()
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [loading, setLoading] = useState(true)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [viewRow, setViewRow] = useState<Record<string, unknown> | null>(null)
  const [showCreateRow, setShowCreateRow] = useState(false)
  const [createValues, setCreateValues] = useState<Record<string, unknown>>({})
  // Lookup cache: { "vehicles:id:plate_number" => { 1: "京A12345", 3: "沪B67890" } }
  const [lookupMap, setLookupMap] = useState<Record<string, Record<string, string>>>({})
  const defaultSort = dataSource?.order_by?.[0]
  const [sortCol, setSortCol] = useState<string | null>(defaultSort?.column ?? null)
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>(defaultSort?.direction ?? 'ASC')
  const pageSize = config.page_size || 20

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      if (sortDir === 'ASC') setSortDir('DESC')
      else {
        setSortCol(null)
        setSortDir('ASC')
      }
    } else {
      setSortCol(colKey)
      setSortDir('ASC')
    }
    setPage(0)
  }

  // Resolve lookup columns by batch-querying their target tables
  const resolveLookups = useCallback(
    async (dataRows: Record<string, unknown>[]) => {
      const lookupCols = config.columns.filter(
        (col) => col.type === 'lookup' && col.lookup_table && col.display_key
      )
      if (lookupCols.length === 0) return

      const newMap: Record<string, Record<string, string>> = { ...lookupMap }

      for (const col of lookupCols) {
        const table = col.lookup_table!
        const lookupKey = col.lookup_key || 'id'
        const displayKey = col.display_key!
        const cacheKey = `${table}:${lookupKey}:${displayKey}`

        // Collect unique IDs that aren't already cached
        const existing = newMap[cacheKey] || {}
        const ids = new Set<string>()
        for (const row of dataRows) {
          const v = row[col.key]
          if (v !== null && v !== undefined && !(String(v) in existing)) {
            ids.add(String(v))
          }
        }
        if (ids.size === 0) continue

        try {
          // Query lookup table for these IDs
          const idArr = Array.from(ids)
          const result = await queryRows(table, {
            limit: idArr.length,
            filters: idArr.map((id) => ({ column: lookupKey, operator: '=', value: id })),
            filter_combinator: 'OR',
          })
          const resolved = { ...existing }
          for (const lRow of result.rows) {
            const key = String(lRow[lookupKey] ?? '')
            const display = String(lRow[displayKey] ?? '')
            if (key) resolved[key] = display
          }
          newMap[cacheKey] = resolved
        } catch {
          // lookup failure is non-critical
        }
      }

      setLookupMap(newMap)
    },
    [config.columns, lookupMap, queryRows]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let fetchedRows: Record<string, unknown>[] = []
      if (apiSource && fetchApiSource) {
        const raw = await fetchApiSource(apiSource.path, {
          method: apiSource.method || 'GET',
          body: apiSource.body,
        })
        const arr = Array.isArray(raw) ? raw : (raw as any)?.rows || (raw as any)?.data || []
        fetchedRows = arr as Record<string, unknown>[]
        setRows(fetchedRows)
        setTotal(fetchedRows.length)
      } else {
        const { filters, combinator } = buildSearchFilters(debouncedSearch, config)
        const result = await queryRows(config.table_name, {
          limit: pageSize,
          offset: page * pageSize,
          filters,
          filter_combinator: combinator,
          order_by: sortCol ? [{ column: sortCol, direction: sortDir }] : undefined,
        })
        fetchedRows = result.rows
        setRows(fetchedRows)
        setTotal(result.total)
      }
      // Resolve lookups after data is loaded
      resolveLookups(fetchedRows)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [
    queryRows,
    fetchApiSource,
    apiSource,
    config.table_name,
    config.columns,
    pageSize,
    page,
    debouncedSearch,
    sortCol,
    sortDir,
    resolveLookups,
  ])

  // Debounce search input — skip if value unchanged to avoid double initial load
  useEffect(() => {
    if (search === debouncedSearch) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for table changes from FormBlock or other blocks
  useEffect(() => {
    return onTableChange((table) => {
      if (table === config.table_name) fetchData()
    })
  }, [onTableChange, config.table_name, fetchData])

  const handleDelete = async (row: Record<string, unknown>) => {
    const pkColumn =
      config.columns.find((col) => col.key === 'id')?.key || 'id'
    const pkValue = row[pkColumn]
    if (pkValue === null || pkValue === undefined) return
    if (!window.confirm(`Delete record ${pkColumn}=${pkValue}?`)) return
    try {
      await deleteRows(config.table_name, '', [pkValue])
      notifyTableChange(config.table_name)
      if (rows.length <= 1 && page > 0) setPage(0)
      else fetchData()
    } catch {
      /* ignore */
    }
  }

  const handleEditStart = (idx: number, row: Record<string, unknown>) => {
    setEditingIdx(idx)
    setEditValues({ ...row })
  }

  const handleEditCancel = () => {
    setEditingIdx(null)
    setEditValues({})
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingIdx !== null) handleEditCancel()
        else if (viewRow) setViewRow(null)
        else if (showCreateRow) {
          setShowCreateRow(false)
          setCreateValues({})
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingIdx, viewRow, showCreateRow])

  const handleEditSave = async () => {
    if (editingIdx === null) return
    setSaving(true)
    try {
      const pkColumn =
        config.columns.find((col) => col.key === 'id')?.key || 'id'
      const data: Record<string, unknown> = {}
      for (const col of config.columns) {
        if (col.key === 'created_at' || col.key === 'updated_at' || col.key === 'deleted_at')
          continue
        const v = editValues[col.key]
        if (col.type === 'number' && v !== null && v !== undefined && v !== '') {
          data[col.key] = Number(v)
        } else if (col.type === 'boolean') {
          data[col.key] = Boolean(v)
        } else {
          data[col.key] = v
        }
      }
      if (!(pkColumn in data) && pkColumn in editValues) {
        data[pkColumn] = editValues[pkColumn]
      }
      await updateRow(config.table_name, data, `${pkColumn} = '${data[pkColumn]}'`)
      notifyTableChange(config.table_name)
      setEditingIdx(null)
      setEditValues({})
      fetchData()
    } catch {
      /* ignore */
    }
    setSaving(false)
  }

  const handleCreateRow = async () => {
    setSaving(true)
    try {
      const data: Record<string, unknown> = {}
      for (const col of config.columns) {
        if (
          col.key === 'id' ||
          col.key === 'created_at' ||
          col.key === 'updated_at' ||
          col.key === 'deleted_at'
        )
          continue
        const v = createValues[col.key]
        if (col.type === 'boolean') {
          data[col.key] = Boolean(v)
        } else if (v !== undefined && v !== '') {
          data[col.key] = col.type === 'number' ? Number(v) : v
        }
      }
      await insertRow(config.table_name, data)
      notifyTableChange(config.table_name)
      setShowCreateRow(false)
      setCreateValues({})
      setPage(0)
    } catch {
      /* ignore */
    }
    setSaving(false)
  }

  const handleStatusAction = async (
    row: Record<string, unknown>,
    action: StatusActionConfig
  ) => {
    const pkColumn = config.columns.find((col) => col.key === 'id')?.key || 'id'
    const pkValue = row[pkColumn]
    if (pkValue === null || pkValue === undefined) return

    if (action.confirm) {
      let confirmMsg = `确认将状态从 "${row[action.status_column]}" 变更为 "${action.to_status}"？`
      if (action.extra_fields?.length) {
        const inputs: Record<string, string> = {}
        for (const field of action.extra_fields) {
          const val = window.prompt(`${field.label}${field.required ? ' (必填)' : ''}:`)
          if (field.required && !val) return
          if (val) inputs[field.key] = val
        }
        if (!window.confirm(confirmMsg)) return
        try {
          const data: Record<string, unknown> = {
            [pkColumn]: pkValue,
            [action.status_column]: action.to_status,
            ...inputs,
          }
          await updateRow(config.table_name, data, `${pkColumn} = '${pkValue}'`)
          notifyTableChange(config.table_name)
          fetchData()
        } catch { /* ignore */ }
        return
      }
      if (!window.confirm(confirmMsg)) return
    }

    try {
      const data: Record<string, unknown> = {
        [pkColumn]: pkValue,
        [action.status_column]: action.to_status,
      }
      await updateRow(config.table_name, data, `${pkColumn} = '${pkValue}'`)
      notifyTableChange(config.table_name)
      fetchData()
    } catch { /* ignore */ }
  }

  const totalPages = Math.ceil(total / pageSize)
  const actions = config.actions || []
  const statusActions = config.status_actions || []

  const exportCSV = async () => {
    try {
      const { filters: exportFilters, combinator: exportCombinator } = buildSearchFilters(
        debouncedSearch,
        config
      )
      const allResult = await queryRows(config.table_name, {
        limit: 10000,
        filters: exportFilters,
        filter_combinator: exportCombinator,
        order_by: sortCol ? [{ column: sortCol, direction: sortDir }] : undefined,
      })
      const allRows = allResult.rows
      if (allRows.length === 0) return
      const headers = config.columns.map((c) => c.label)
      const csvRows = allRows.map((row) =>
        config.columns
          .map((c) => {
            const v = row[c.key]
            const s = v === null || v === undefined ? '' : String(v)
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"`
              : s
          })
          .join(',')
      )
      const csv = [headers.join(','), ...csvRows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${config.table_name || 'export'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface-200/20">
        {config.search_enabled && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                  setDebouncedSearch(search)
                  setPage(0)
                }
              }}
              placeholder={
                config.search_key
                  ? `Search ${config.columns.find((c) => c.key === config.search_key)?.label || config.search_key}...`
                  : `Search ${
                      config.columns
                        .filter((c) => !c.type || c.type === 'text' || c.type === 'badge')
                        .map((c) => c.label)
                        .slice(0, 3)
                        .join(', ') || 'records'
                    }...`
              }
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
        {actions.includes('create') && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-[10px] text-brand-500"
            onClick={() => {
              setShowCreateRow(!showCreateRow)
              setCreateValues({})
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-[10px] text-foreground-muted"
          onClick={exportCSV}
          disabled={rows.length === 0}
        >
          <Download className="w-3 h-3" />
          Export
        </Button>
        <span className="text-[10px] text-foreground-muted ml-auto">{total} records</span>
      </div>

      {/* Create Row Form */}
      {showCreateRow && (
        <div className="px-3 py-3 border-b border-border bg-brand-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">New Record</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                setShowCreateRow(false)
                setCreateValues({})
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {config.columns
              .filter(
                (c) =>
                  c.key !== 'id' &&
                  c.key !== 'created_at' &&
                  c.key !== 'updated_at' &&
                  c.key !== 'deleted_at'
              )
              .map((col) => (
                <div key={col.key}>
                  <label className="text-[10px] text-foreground-muted mb-0.5 block">
                    {col.label}
                  </label>
                  {col.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(createValues[col.key])}
                      onChange={(e) =>
                        setCreateValues((prev) => ({ ...prev, [col.key]: e.target.checked }))
                      }
                      className="rounded border-border mt-1"
                    />
                  ) : (
                    <Input
                      type={
                        col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'
                      }
                      value={String(createValues[col.key] ?? '')}
                      onChange={(e) =>
                        setCreateValues((prev) => ({ ...prev, [col.key]: e.target.value }))
                      }
                      placeholder={col.label}
                      className="h-7 text-xs"
                    />
                  )}
                </div>
              ))}
          </div>
          <div className="flex justify-end mt-2 gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setShowCreateRow(false)
                setCreateValues({})
              }}
            >
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleCreateRow} disabled={saving}>
              {saving ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* View Detail Overlay */}
      {viewRow && (
        <div className="px-4 py-3 border-b border-border bg-surface-200/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Record Detail</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setViewRow(null)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 max-h-48 overflow-y-auto">
            {config.columns.map((col) => (
              <div key={col.key}>
                <span className="text-[10px] text-foreground-muted">{col.label}</span>
                <div className="text-xs text-foreground-light break-all">
                  {formatCellValue(viewRow[col.key], col.type)}
                </div>
              </div>
            ))}
          </div>
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
                  className={cn(
                    'text-xs font-medium text-foreground-muted px-3 py-2 border-b border-border cursor-pointer select-none hover:text-foreground transition-colors',
                    col.type === 'number' ? 'text-right' : 'text-left'
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && (
                      <span className="text-[10px]">{sortDir === 'ASC' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="text-right text-xs font-medium text-foreground-muted px-3 py-2 border-b border-border w-28">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, ri) => (
                <tr key={`skel-${ri}`} className="animate-pulse">
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 border-b border-border/50">
                      <div
                        className={cn(
                          'h-3 bg-foreground/10 rounded',
                          col.type === 'number' ? 'w-12 ml-auto' : 'w-24'
                        )}
                      />
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-3 py-2.5 border-b border-border/50">
                      <div className="h-3 w-10 bg-foreground/10 rounded ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={config.columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-3 py-10 text-center"
                >
                  <div className="text-xs text-foreground-muted">
                    No records in <span className="font-medium">{config.table_name}</span>
                  </div>
                  <button
                    onClick={fetchData}
                    className="mt-2 text-[11px] text-brand-500 hover:underline"
                  >
                    Refresh
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const isEditing = editingIdx === i
                return (
                  <tr
                    key={i}
                    className={cn(
                      'transition-colors',
                      isEditing ? 'bg-brand-500/5' : 'hover:bg-surface-200/20',
                      config.row_click_action && !isEditing && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (isEditing || !config.row_click_action) return
                      const action = config.row_click_action
                      if (action.type === 'navigate') {
                        const targetPage = action.target_page || action.page_id || ''
                        // Support both params object mapping and simple param_key
                        if (action.params) {
                          const navParams: Record<string, unknown> = {}
                          for (const [paramName, rowKey] of Object.entries(action.params)) {
                            navParams[paramName] = row[rowKey as string] ?? row['id']
                          }
                          navigateToPage(targetPage, navParams)
                        } else {
                          const paramKey = action.param_key || 'id'
                          const pkColumn =
                            config.columns.find((col) => col.key === 'id')?.key ||
                            config.columns[0]?.key ||
                            'id'
                          const pkValue = row[paramKey] ?? row[pkColumn]
                          navigateToPage(targetPage, { [paramKey]: pkValue })
                        }
                      }
                    }}
                  >
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-3 py-2 border-b border-border/50 text-foreground-light max-w-[200px]',
                          col.type === 'number'
                            ? 'text-right tabular-nums'
                            : col.type !== 'badge' && col.type !== 'boolean'
                              ? 'truncate'
                              : ''
                        )}
                        title={
                          col.type !== 'badge' && col.type !== 'boolean' && !isEditing
                            ? String(row[col.key] ?? '')
                            : undefined
                        }
                      >
                        {isEditing ? (
                          ['id', 'created_at', 'updated_at', 'deleted_at'].includes(col.key) ? (
                            formatCellValue(row[col.key], col.type)
                          ) : col.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={Boolean(editValues[col.key])}
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [col.key]: e.target.checked }))
                              }
                              className="rounded border-border"
                            />
                          ) : (
                            <Input
                              type={
                                col.type === 'number'
                                  ? 'number'
                                  : col.type === 'date'
                                    ? 'date'
                                    : 'text'
                              }
                              value={
                                col.type === 'date'
                                  ? toDateInputValue(editValues[col.key])
                                  : String(editValues[col.key] ?? '')
                              }
                              onChange={(e) =>
                                setEditValues((prev) => ({ ...prev, [col.key]: e.target.value }))
                              }
                              className="h-7 text-xs"
                            />
                          )
                        ) : col.type === 'lookup' ? (
                          (() => {
                            const rawVal = row[col.key]
                            if (rawVal === null || rawVal === undefined) return <span className="text-foreground-muted">—</span>
                            const cacheKey = `${col.lookup_table}:${col.lookup_key || 'id'}:${col.display_key}`
                            const display = lookupMap[cacheKey]?.[String(rawVal)]
                            return display ? (
                              <span title={`ID: ${rawVal}`}>{display}</span>
                            ) : (
                              <span className="text-foreground-muted">{String(rawVal)}</span>
                            )
                          })()
                        ) : (
                          formatCellValue(row[col.key], col.type)
                        )}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-3 py-2 border-b border-border/50 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-brand-500"
                                onClick={handleEditSave}
                                disabled={saving}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={handleEditCancel}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {actions.includes('view') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setViewRow(row)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                              {actions.includes('edit') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditStart(i, row)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                              {actions.includes('delete') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(row) }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                              {statusActions
                                .filter((sa) => {
                                  const currentStatus = String(row[sa.status_column] || '')
                                  return sa.from_status.includes(currentStatus)
                                })
                                .map((sa, sai) => {
                                  const colorCls =
                                    sa.color === 'green' ? 'text-emerald-600 hover:bg-emerald-500/10' :
                                    sa.color === 'red' ? 'text-red-600 hover:bg-red-500/10' :
                                    sa.color === 'blue' ? 'text-blue-600 hover:bg-blue-500/10' :
                                    sa.color === 'amber' ? 'text-amber-600 hover:bg-amber-500/10' :
                                    'text-foreground-muted hover:bg-surface-200/50'
                                  return (
                                    <Button
                                      key={sai}
                                      size="sm"
                                      variant="ghost"
                                      className={cn('h-6 px-1.5 text-[10px]', colorCls)}
                                      onClick={(e) => { e.stopPropagation(); handleStatusAction(row, sa) }}
                                    >
                                      {sa.label}
                                    </Button>
                                  )
                                })
                              }
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {config.pagination !== false && totalPages > 1 && (
        <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-surface-200/20">
          <span className="text-[10px] text-foreground-muted">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function toDateInputValue(value: unknown): string {
  if (!value) return ''
  const d = new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function formatDateValue(value: unknown): string {
  const d = new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCellValue(value: unknown, type?: string): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-foreground-muted">—</span>
  switch (type) {
    case 'boolean':
      return (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          )}
        >
          {value ? 'Yes' : 'No'}
        </span>
      )
    case 'date':
      return <span title={String(value)}>{formatDateValue(value)}</span>
    case 'badge': {
      const v = String(value).toLowerCase()
      const sv = String(value)
      const badgeColor = /active|enabled|online|approved|published/.test(v) || /在线|在职|正常|有效|已发布|运营中|已通过|已批准/.test(sv)
        ? 'bg-emerald-500/10 text-emerald-600'
        : /inactive|disabled|offline|archived|cancelled/.test(v) || /离线|停运|已报废|已过期|离职|已取消/.test(sv)
          ? 'bg-gray-500/10 text-gray-500'
          : /pending|review|waiting|draft/.test(v) || /待处理|未处理|处理中|审核中|维修中|进行中|待审批/.test(sv)
            ? 'bg-amber-500/10 text-amber-600'
            : /failed|error|rejected|blocked|urgent/.test(v) || /紧急|超速|严重|违章|未缴|已拒绝|特急/.test(sv)
              ? 'bg-red-500/10 text-red-600'
              : /completed|done|success|delivered/.test(v) || /已完成|已处理|已缴|已维修|已解决/.test(sv)
                ? 'bg-blue-500/10 text-blue-600'
                : /ignored/.test(v) || /已忽略/.test(sv)
                  ? 'bg-slate-500/10 text-slate-500'
                  : 'bg-brand-500/10 text-brand-500'
      return (
        <span className={cn('text-xs px-1.5 py-0.5 rounded', badgeColor)}>{String(value)}</span>
      )
    }
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value)
    default: {
      const str = String(value)
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|\s)/.test(str)) {
        const d = new Date(str)
        if (!isNaN(d.getTime())) return <span title={str}>{formatDateValue(str)}</span>
      }
      if (typeof value === 'number') return value.toLocaleString()
      return str
    }
  }
}
