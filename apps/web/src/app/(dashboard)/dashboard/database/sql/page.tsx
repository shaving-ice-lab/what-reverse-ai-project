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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { QueryResult, QueryHistoryItem, DatabaseTable } from '@/lib/api/workspace-database'
import { SQLResultTable } from '@/components/database/sql-result-table'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function SQLEditorPage() {
  const { workspaceId } = useWorkspace()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [sql, setSql] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Side panel
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [sideTab, setSideTab] = useState<'tables' | 'history'>('tables')
  const [showSide, setShowSide] = useState(true)

  // Load tables & history
  useEffect(() => {
    if (!workspaceId) return
    workspaceDatabaseApi
      .listTables(workspaceId)
      .then(setTables)
      .catch(() => {})
    workspaceDatabaseApi
      .getQueryHistory(workspaceId)
      .then(setHistory)
      .catch(() => {})
  }, [workspaceId])

  const runQuery = useCallback(async () => {
    if (!workspaceId || !sql.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await workspaceDatabaseApi.executeSQL(workspaceId, sql.trim())
      setResult(res)
      // Refresh history
      workspaceDatabaseApi
        .getQueryHistory(workspaceId)
        .then(setHistory)
        .catch(() => {})
    } catch (err: any) {
      setError(err?.message || 'Query failed')
    } finally {
      setRunning(false)
    }
  }, [workspaceId, sql, running])

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
    // Basic formatting: uppercase keywords
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'INSERT',
      'INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'TABLE',
      'ALTER',
      'DROP',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'ON',
      'GROUP',
      'BY',
      'ORDER',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'AS',
      'IN',
      'NOT',
      'NULL',
      'IS',
      'LIKE',
      'BETWEEN',
      'EXISTS',
      'DISTINCT',
      'COUNT',
      'SUM',
      'AVG',
      'MAX',
      'MIN',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'IF',
      'UNION',
      'ALL',
    ]
    let formatted = sql
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi')
      formatted = formatted.replace(regex, kw)
    })
    // Add newlines before major clauses
    const breakBefore = [
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'UNION',
    ]
    breakBefore.forEach((clause) => {
      const regex = new RegExp(`\\s+${clause}\\b`, 'gi')
      formatted = formatted.replace(regex, `\n${clause}`)
    })
    setSql(formatted.trim())
  }

  const loadHistoryItem = (item: QueryHistoryItem) => {
    setSql(item.sql)
    textareaRef.current?.focus()
  }

  const insertTableRef = (tableName: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = sql.slice(0, start)
    const after = sql.slice(end)
    const newSql = `${before}\`${tableName}\`${after}`
    setSql(newSql)
    setTimeout(() => {
      ta.focus()
      const pos = start + tableName.length + 2
      ta.setSelectionRange(pos, pos)
    }, 0)
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-light text-sm">
        Please select a workspace first.
      </div>
    )
  }

  return (
    <div className="flex h-full -mx-6 -my-5">
      {/* Side panel */}
      {showSide && (
        <div className="w-[220px] shrink-0 border-r border-border bg-background-studio flex flex-col">
          {/* Side tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setSideTab('tables')}
              className={cn(
                'flex-1 px-3 py-2 text-[11px] font-medium transition-colors',
                sideTab === 'tables'
                  ? 'text-foreground border-b-2 border-brand-500'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <Table2 className="w-3.5 h-3.5 inline mr-1" />
              Tables
            </button>
            <button
              onClick={() => setSideTab('history')}
              className={cn(
                'flex-1 px-3 py-2 text-[11px] font-medium transition-colors',
                sideTab === 'history'
                  ? 'text-foreground border-b-2 border-brand-500'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <History className="w-3.5 h-3.5 inline mr-1" />
              History
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sideTab === 'tables' ? (
              tables.length === 0 ? (
                <div className="text-center py-6 text-xs text-foreground-muted">No tables</div>
              ) : (
                <div className="space-y-0.5">
                  {tables.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => insertTableRef(t.name)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200/50 text-left transition-colors"
                    >
                      <Table2 className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
                      <span className="flex-1 truncate font-mono">{t.name}</span>
                    </button>
                  ))}
                </div>
              )
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-xs text-foreground-muted">No history</div>
            ) : (
              <div className="space-y-1">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-surface-200/50 transition-colors group"
                  >
                    <code className="text-[11px] font-mono text-foreground line-clamp-2 block">
                      {item.sql}
                    </code>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground-muted">
                      <span
                        className={cn(
                          item.status === 'success' ? 'text-brand-500' : 'text-destructive'
                        )}
                      >
                        {item.status}
                      </span>
                      <span>{item.duration_ms}ms</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor area */}
        <div className="flex flex-col border-b border-border">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-75/60">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={runQuery}
                disabled={running || !sql.trim()}
                className="h-7 text-xs"
              >
                {running ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1" />
                )}
                Run
                <span className="ml-1.5 text-[10px] opacity-60">Ctrl+Enter</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={formatSQL}
                disabled={!sql.trim()}
                className="h-7 text-xs"
              >
                <AlignLeft className="w-3.5 h-3.5 mr-1" />
                Format
              </Button>
              <Button size="sm" variant="ghost" onClick={clearEditor} className="h-7 text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSide(!showSide)}
              className="h-7 text-xs"
            >
              {showSide ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Panel
            </Button>
          </div>

          {/* SQL textarea */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SELECT * FROM your_table LIMIT 100;"
              className="border-0 rounded-none resize-none font-mono text-sm min-h-[180px] focus-visible:ring-0 focus-visible:ring-offset-0 bg-background"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <SQLResultTable result={result} error={error} loading={running} />
        </div>
      </div>
    </div>
  )
}
