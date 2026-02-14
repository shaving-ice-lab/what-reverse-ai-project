'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play,
  Trash2,
  Table2,
  Loader2,
  History,
  ChevronRight,
  ChevronDown,
  AlignLeft,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  Clock,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { QueryResult, DatabaseTable, TableColumn } from '@/lib/api/workspace-database'
import { SQLResultTable } from '@/components/database/sql-result-table'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

interface LocalHistoryItem {
  sql: string
  status: 'success' | 'error'
  duration_ms: number
  rows_returned: number
  timestamp: number
}

const QUERY_TEMPLATES = [
  { label: 'Select all', sql: 'SELECT * FROM table_name LIMIT 100;' },
  { label: 'Count rows', sql: 'SELECT COUNT(*) as total FROM table_name;' },
  { label: 'Show tables', sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" },
  { label: 'Table info', sql: "PRAGMA table_info('table_name');" },
  { label: 'Create table', sql: "CREATE TABLE IF NOT EXISTS new_table (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);" },
  { label: 'Insert row', sql: "INSERT INTO table_name (col1, col2) VALUES ('value1', 'value2');" },
]

export default function SQLEditorPage() {
  const { workspaceId } = useWorkspace()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Side panel
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [expandedTable, setExpandedTable] = useState<string | null>(null)
  const [tableColumns, setTableColumns] = useState<Record<string, TableColumn[]>>({})
  const [localHistory, setLocalHistory] = useState<LocalHistoryItem[]>([])
  const [sideTab, setSideTab] = useState<'tables' | 'history' | 'templates'>('tables')
  const [showSide, setShowSide] = useState(true)
  const [copiedSQL, setCopiedSQL] = useState(false)

  // Editor height (resizable)
  const [editorHeight, setEditorHeight] = useState(200)
  const resizing = useRef(false)

  // Load tables
  useEffect(() => {
    if (!workspaceId) return
    workspaceDatabaseApi.listTables(workspaceId).then(setTables).catch(() => {})
  }, [workspaceId])

  // Load columns for expanded table
  useEffect(() => {
    if (!workspaceId || !expandedTable || tableColumns[expandedTable]) return
    workspaceDatabaseApi
      .getTableSchema(workspaceId, expandedTable)
      .then((schema) => {
        setTableColumns((prev) => ({ ...prev, [expandedTable]: schema.columns }))
      })
      .catch(() => {})
  }, [workspaceId, expandedTable, tableColumns])

  const addToHistory = useCallback((item: LocalHistoryItem) => {
    setLocalHistory((prev) => [item, ...prev].slice(0, 50))
  }, [])

  const runQuery = useCallback(async () => {
    if (!workspaceId || !sql.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)
    const start = Date.now()
    try {
      const res = await workspaceDatabaseApi.executeSQL(workspaceId, sql.trim())
      setResult(res)
      addToHistory({
        sql: sql.trim(),
        status: 'success',
        duration_ms: res.duration_ms || (Date.now() - start),
        rows_returned: res.rows?.length ?? 0,
        timestamp: Date.now(),
      })
      // Refresh table list in case DDL was executed
      workspaceDatabaseApi.listTables(workspaceId).then(setTables).catch(() => {})
    } catch (err: any) {
      const msg = err?.message || 'Query failed'
      setError(msg)
      addToHistory({
        sql: sql.trim(),
        status: 'error',
        duration_ms: Date.now() - start,
        rows_returned: 0,
        timestamp: Date.now(),
      })
    } finally {
      setRunning(false)
    }
  }, [workspaceId, sql, running, addToHistory])

  // Ctrl+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runQuery()
    }
  }

  const clearEditor = () => {
    setSql('')
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  const formatSQL = () => {
    const keywords = [
      'SELECT','FROM','WHERE','AND','OR','INSERT','INTO','VALUES','UPDATE','SET',
      'DELETE','CREATE','TABLE','ALTER','DROP','JOIN','LEFT','RIGHT','INNER','OUTER',
      'ON','GROUP','BY','ORDER','HAVING','LIMIT','OFFSET','AS','IN','NOT','NULL',
      'IS','LIKE','BETWEEN','EXISTS','DISTINCT','COUNT','SUM','AVG','MAX','MIN',
      'CASE','WHEN','THEN','ELSE','END','IF','UNION','ALL','PRIMARY','KEY',
      'AUTOINCREMENT','DEFAULT','UNIQUE','INDEX','INTEGER','TEXT','REAL','BLOB',
      'DATETIME','BOOLEAN','VARCHAR','PRAGMA',
    ]
    let formatted = sql
    keywords.forEach((kw) => {
      formatted = formatted.replace(new RegExp(`\\b${kw}\\b`, 'gi'), kw)
    })
    const breakBefore = ['SELECT','FROM','WHERE','AND','OR','JOIN','LEFT JOIN','RIGHT JOIN',
      'INNER JOIN','GROUP BY','ORDER BY','HAVING','LIMIT','UNION']
    breakBefore.forEach((clause) => {
      formatted = formatted.replace(new RegExp(`\\s+${clause}\\b`, 'gi'), `\n${clause}`)
    })
    setSql(formatted.trim())
  }

  const copySQL = () => {
    if (!sql.trim()) return
    navigator.clipboard.writeText(sql.trim())
    setCopiedSQL(true)
    setTimeout(() => setCopiedSQL(false), 1500)
  }

  const insertTableRef = (tableName: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = sql.slice(0, start)
    const after = sql.slice(end)
    setSql(`${before}"${tableName}"${after}`)
    setTimeout(() => {
      ta.focus()
      const pos = start + tableName.length + 2
      ta.setSelectionRange(pos, pos)
    }, 0)
  }

  const insertColumnRef = (colName: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = sql.slice(0, start)
    const after = sql.slice(end)
    setSql(`${before}${colName}${after}`)
    setTimeout(() => {
      ta.focus()
      const pos = start + colName.length
      ta.setSelectionRange(pos, pos)
    }, 0)
  }

  // Resize handle
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    const startY = e.clientY
    const startH = editorHeight
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const delta = ev.clientY - startY
      setEditorHeight(Math.max(100, Math.min(600, startH + delta)))
    }
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-lighter text-[13px]">
        Please select a workspace first.
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Side panel */}
      {showSide && (
        <div className="w-[240px] shrink-0 border-r border-border bg-background-studio flex flex-col">
          {/* Side tabs */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
            {([
              { id: 'tables' as const, icon: Table2, label: 'Tables' },
              { id: 'history' as const, icon: History, label: 'History' },
              { id: 'templates' as const, icon: BookOpen, label: 'Snippets' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSideTab(tab.id)}
                className={cn(
                  'h-6 px-2 rounded flex items-center gap-1 text-[11px] font-medium transition-colors',
                  sideTab === tab.id
                    ? 'bg-surface-200 text-foreground'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-100/60'
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sideTab === 'tables' ? (
              tables.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-foreground-lighter">No tables</div>
              ) : (
                <div className="py-1">
                  {tables.map((t) => {
                    const isExpanded = expandedTable === t.name
                    const cols = tableColumns[t.name]
                    return (
                      <div key={t.name}>
                        <button
                          onClick={() => setExpandedTable(isExpanded ? null : t.name)}
                          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-75 text-left transition-colors"
                        >
                          <ChevronRight className={cn('w-3 h-3 shrink-0 text-foreground-lighter transition-transform', isExpanded && 'rotate-90')} />
                          <Table2 className="w-3 h-3 shrink-0 text-foreground-lighter" />
                          <span className="flex-1 truncate font-mono text-[11px]">{t.name}</span>
                          <span className="text-[10px] text-foreground-lighter tabular-nums">{t.row_count_est}</span>
                        </button>
                        {isExpanded && (
                          <div className="pl-7 pr-2 pb-1">
                            {!cols ? (
                              <div className="py-1 text-[10px] text-foreground-lighter">Loading...</div>
                            ) : (
                              cols.map((col) => (
                                <button
                                  key={col.name}
                                  onClick={() => insertColumnRef(col.name)}
                                  className="w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-foreground-lighter hover:text-foreground hover:bg-surface-100 text-left transition-colors"
                                  title={`${col.type}${col.is_primary_key ? ' PK' : ''}${!col.nullable ? ' NOT NULL' : ''}`}
                                >
                                  {col.is_primary_key && <span className="text-[8px] text-amber-500">🔑</span>}
                                  <span className="flex-1 truncate font-mono">{col.name}</span>
                                  <span className="text-[9px] text-foreground-lighter font-mono shrink-0">{col.type}</span>
                                </button>
                              ))
                            )}
                            <button
                              onClick={() => insertTableRef(t.name)}
                              className="w-full text-left px-2 py-0.5 text-[10px] text-brand-500 hover:text-brand-400 transition-colors mt-0.5"
                            >
                              Insert table name
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : sideTab === 'history' ? (
              localHistory.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-foreground-lighter">
                  Run a query to see history
                </div>
              ) : (
                <div className="py-1">
                  {localHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSql(item.sql); textareaRef.current?.focus() }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-75 transition-colors border-b border-border/50"
                    >
                      <code className="text-[11px] font-mono text-foreground-light line-clamp-2 block">
                        {item.sql}
                      </code>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground-lighter">
                        <span className={item.status === 'success' ? 'text-brand-500' : 'text-destructive'}>
                          {item.status === 'success' ? `${item.rows_returned} rows` : 'error'}
                        </span>
                        <span>{item.duration_ms}ms</span>
                        <span className="flex items-center gap-0.5 ml-auto">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="py-1">
                {QUERY_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSql(tmpl.sql); textareaRef.current?.focus() }}
                    className="w-full text-left px-3 py-2 hover:bg-surface-75 transition-colors border-b border-border/50"
                  >
                    <div className="text-[12px] font-medium text-foreground">{tmpl.label}</div>
                    <code className="text-[10px] font-mono text-foreground-lighter line-clamp-2 block mt-0.5">
                      {tmpl.sql}
                    </code>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3 border-b border-border bg-surface-75/30">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => setShowSide(!showSide)}
              variant="ghost"
              className="h-7 w-7 p-0"
              title={showSide ? 'Hide panel' : 'Show panel'}
            >
              {showSide ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button size="sm" onClick={runQuery} disabled={running || !sql.trim()} className="h-7 text-[11px] gap-1">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run
              <kbd className="ml-1 text-[9px] opacity-50">⌘↵</kbd>
            </Button>
            <Button size="sm" variant="ghost" onClick={formatSQL} disabled={!sql.trim()} className="h-7 text-[11px] gap-1">
              <AlignLeft className="w-3.5 h-3.5" />
              Format
            </Button>
            <Button size="sm" variant="ghost" onClick={copySQL} disabled={!sql.trim()} className="h-7 text-[11px] gap-1">
              {copiedSQL ? <Check className="w-3.5 h-3.5 text-brand-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSQL ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearEditor} className="h-7 text-[11px] gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
          {result && (
            <div className="text-[10px] text-foreground-lighter tabular-nums">
              {result.rows?.length ?? 0} rows · {result.duration_ms}ms
            </div>
          )}
        </div>

        {/* SQL textarea */}
        <div className="relative border-b border-border" style={{ height: editorHeight }}>
          <Textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="-- Write your SQL here&#10;SELECT * FROM your_table LIMIT 100;"
            className="w-full h-full border-0 rounded-none resize-none font-mono text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 bg-background p-4"
            spellCheck={false}
          />
          {/* Line numbers indicator */}
          <div className="absolute bottom-2 right-3 text-[10px] text-foreground-lighter tabular-nums pointer-events-none">
            {sql.split('\n').length} lines · {sql.length} chars
          </div>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="h-1 shrink-0 bg-transparent hover:bg-brand-500/20 cursor-row-resize transition-colors"
        />

        {/* Results area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <SQLResultTable result={result} error={error} loading={running} />
        </div>
      </div>
    </div>
  )
}
