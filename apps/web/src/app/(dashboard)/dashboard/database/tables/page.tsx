'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Table2,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  Columns3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type {
  DatabaseTable,
  TableColumn,
  TableSchema,
  QueryFilter,
} from '@/lib/api/workspace-database'
import { TableGrid } from '@/components/database/table-grid'
import { RowDetailPanel } from '@/components/database/row-detail-panel'
import { ColumnManagerDialog } from '@/components/database/column-manager-dialog'
import { cn } from '@/lib/utils'

function useActiveWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('activeWorkspaceId')
      if (stored) setId(stored)
    } catch {}
  }, [])
  return id
}

export default function TablesPage() {
  const workspaceId = useActiveWorkspaceId()
  const searchParams = useSearchParams()
  const initialTable = searchParams.get('table')

  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(initialTable)
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingTables, setLoadingTables] = useState(true)

  // Data grid state
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<TableColumn[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [orderBy, setOrderBy] = useState<string | undefined>()
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC' | undefined>()
  const [filters, setFilters] = useState<QueryFilter[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [primaryKey, setPrimaryKey] = useState<string[]>([])

  // Row detail panel
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null)
  // Column manager
  const [showColumnManager, setShowColumnManager] = useState(false)

  // Load table list
  const loadTables = useCallback(async () => {
    if (!workspaceId) return
    setLoadingTables(true)
    try {
      const data = await workspaceDatabaseApi.listTables(workspaceId)
      setTables(data)
      if (!selectedTable && data.length > 0) {
        setSelectedTable(data[0].name)
      }
    } catch {
      // ignore
    } finally {
      setLoadingTables(false)
    }
  }, [workspaceId, selectedTable])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  // Load table schema
  useEffect(() => {
    if (!workspaceId || !selectedTable) return
    let cancelled = false
    ;(async () => {
      try {
        const schema = await workspaceDatabaseApi.getTableSchema(workspaceId, selectedTable)
        if (!cancelled) {
          setTableSchema(schema)
          setColumns(schema.columns)
          setPrimaryKey(schema.primary_key ?? [])
        }
      } catch {
        if (!cancelled) {
          setTableSchema(null)
          setColumns([])
          setPrimaryKey([])
        }
      }
    })()
    return () => { cancelled = true }
  }, [workspaceId, selectedTable])

  // Load rows
  const loadRows = useCallback(async () => {
    if (!workspaceId || !selectedTable) return
    setLoadingRows(true)
    try {
      const result = await workspaceDatabaseApi.queryRows(workspaceId, selectedTable, {
        page,
        page_size: pageSize,
        order_by: orderBy,
        order_dir: orderDir,
        filters,
      })
      setRows(result.rows)
      setTotalCount(result.total_count ?? 0)
    } catch {
      setRows([])
      setTotalCount(0)
    } finally {
      setLoadingRows(false)
    }
  }, [workspaceId, selectedTable, page, pageSize, orderBy, orderDir, filters])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  // Reset pagination when changing table
  const selectTable = (name: string) => {
    setSelectedTable(name)
    setPage(1)
    setOrderBy(undefined)
    setOrderDir(undefined)
    setFilters([])
    setDetailRow(null)
  }

  const handleSortChange = (col: string, dir: 'ASC' | 'DESC' | null) => {
    if (dir === null) {
      setOrderBy(undefined)
      setOrderDir(undefined)
    } else {
      setOrderBy(col)
      setOrderDir(dir)
    }
    setPage(1)
  }

  const handleInsertRow = () => {
    // Open detail panel with empty row for insert
    const emptyRow: Record<string, unknown> = {}
    columns.forEach((col) => {
      emptyRow[col.name] = null
    })
    emptyRow['__isNew'] = true
    setDetailRow(emptyRow)
  }

  const handleDeleteSelected = async (ids: unknown[]) => {
    if (!workspaceId || !selectedTable || ids.length === 0) return
    try {
      await workspaceDatabaseApi.deleteRows(workspaceId, selectedTable, ids)
      loadRows()
    } catch {
      // ignore
    }
  }

  const handleSaveRow = async (data: Record<string, unknown>, isNew: boolean) => {
    if (!workspaceId || !selectedTable) return
    try {
      if (isNew) {
        const cleaned = { ...data }
        delete cleaned['__isNew']
        // Remove null values for auto-increment PKs
        Object.keys(cleaned).forEach((k) => {
          if (cleaned[k] === null || cleaned[k] === undefined) {
            delete cleaned[k]
          }
        })
        await workspaceDatabaseApi.insertRow(workspaceId, selectedTable, cleaned)
      } else {
        await workspaceDatabaseApi.updateRow(workspaceId, selectedTable, data)
      }
      setDetailRow(null)
      loadRows()
    } catch {
      // ignore
    }
  }

  const handleDeleteRow = async (data: Record<string, unknown>) => {
    if (!workspaceId || !selectedTable || primaryKey.length === 0) return
    const id = data[primaryKey[0]]
    if (id === undefined || id === null) return
    try {
      await workspaceDatabaseApi.deleteRows(workspaceId, selectedTable, [id])
      setDetailRow(null)
      loadRows()
    } catch {
      // ignore
    }
  }

  const handleUpdateCell = async (rowId: unknown, column: string, newValue: unknown) => {
    if (!workspaceId || !selectedTable || primaryKey.length === 0) return
    try {
      await workspaceDatabaseApi.updateRow(workspaceId, selectedTable, {
        [primaryKey[0]]: rowId,
        [column]: newValue,
      })
      loadRows()
    } catch {
      // ignore
    }
  }

  const handleAddColumn = async (col: import('@/lib/api/workspace-database').CreateColumnDef) => {
    if (!workspaceId || !selectedTable) return
    await workspaceDatabaseApi.alterTable(workspaceId, selectedTable, { add_columns: [col] })
    // Reload schema and rows
    const schema = await workspaceDatabaseApi.getTableSchema(workspaceId, selectedTable)
    setTableSchema(schema)
    setColumns(schema.columns)
    loadRows()
  }

  const handleAlterColumn = async (col: import('@/lib/api/workspace-database').AlterColumnDef) => {
    if (!workspaceId || !selectedTable) return
    await workspaceDatabaseApi.alterTable(workspaceId, selectedTable, { alter_columns: [col] })
    const schema = await workspaceDatabaseApi.getTableSchema(workspaceId, selectedTable)
    setTableSchema(schema)
    setColumns(schema.columns)
    loadRows()
  }

  const handleDropColumn = async (colName: string) => {
    if (!workspaceId || !selectedTable) return
    await workspaceDatabaseApi.alterTable(workspaceId, selectedTable, { drop_columns: [colName] })
    const schema = await workspaceDatabaseApi.getTableSchema(workspaceId, selectedTable)
    setTableSchema(schema)
    setColumns(schema.columns)
    loadRows()
  }

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-light text-sm">
        Please select a workspace first.
      </div>
    )
  }

  return (
    <div className="flex h-full -mx-6 -my-5">
      {/* Left sidebar: table list */}
      <div className="w-[220px] shrink-0 border-r border-border bg-background-studio flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingTables ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-8 text-xs text-foreground-muted">
              No tables found
            </div>
          ) : (
            filteredTables.map((table) => (
              <button
                key={table.name}
                onClick={() => selectTable(table.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors text-left',
                  selectedTable === table.name
                    ? 'bg-surface-200 text-foreground font-medium'
                    : 'text-foreground-light hover:text-foreground hover:bg-surface-200/50'
                )}
              >
                <Table2 className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{table.name}</span>
                <span className="text-[10px] text-foreground-muted tabular-nums">
                  {table.row_count_est}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start h-8 text-xs"
            onClick={handleInsertRow}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Table
          </Button>
        </div>
      </div>

      {/* Main area: data grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedTable ? (
          <>
            {/* Table header */}
            <div className="px-4 py-2.5 border-b border-border bg-surface-75/30 flex items-center gap-2">
              <Table2 className="w-4 h-4 text-foreground-light" />
              <span className="text-sm font-medium text-foreground">{selectedTable}</span>
              {tableSchema && (
                <span className="text-xs text-foreground-muted">
                  {tableSchema.columns.length} columns
                </span>
              )}
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setShowColumnManager(true)}
                >
                  <Columns3 className="w-3.5 h-3.5 mr-1" />
                  Columns
                </Button>
              </div>
            </div>

            {/* Data grid */}
            <div className="flex-1 min-h-0">
              <TableGrid
                columns={columns}
                rows={rows}
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                orderBy={orderBy}
                orderDir={orderDir}
                loading={loadingRows}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
                onSortChange={handleSortChange}
                onInsertRow={handleInsertRow}
                onDeleteSelected={handleDeleteSelected}
                onFilterChange={(f) => {
                  setFilters(f)
                  setPage(1)
                }}
                onRefresh={loadRows}
                onRowClick={(row) => setDetailRow(row)}
                onUpdateCell={handleUpdateCell}
                filters={filters}
                primaryKey={primaryKey}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-foreground-muted text-sm">
            {loadingTables ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : tables.length === 0 ? (
              <div className="text-center">
                <Table2 className="w-8 h-8 mx-auto mb-3 text-foreground-muted" />
                <p className="mb-1">No tables yet</p>
                <p className="text-xs text-foreground-muted">Create your first table to get started.</p>
              </div>
            ) : (
              'Select a table from the sidebar'
            )}
          </div>
        )}
      </div>

      {/* Row detail panel */}
      {showColumnManager && selectedTable && (
        <ColumnManagerDialog
          open={showColumnManager}
          onClose={() => setShowColumnManager(false)}
          columns={columns}
          tableName={selectedTable}
          onAddColumn={handleAddColumn}
          onAlterColumn={handleAlterColumn}
          onDropColumn={handleDropColumn}
        />
      )}

      {detailRow && (
        <RowDetailPanel
          row={detailRow}
          columns={columns}
          primaryKey={primaryKey}
          isNew={!!detailRow['__isNew']}
          onSave={handleSaveRow}
          onDelete={handleDeleteRow}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  )
}
