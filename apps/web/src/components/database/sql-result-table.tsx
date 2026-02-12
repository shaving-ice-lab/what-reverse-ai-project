'use client'

import React from 'react'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import type { QueryResult } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

interface SQLResultTableProps {
  result: QueryResult | null
  error?: string | null
  loading?: boolean
  className?: string
}

export function SQLResultTable({ result, error, className }: SQLResultTableProps) {
  if (error) {
    return (
      <div className={cn('flex items-start gap-2 p-4 text-sm text-destructive', className)}>
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-medium mb-1">Query Error</div>
          <pre className="text-xs font-mono whitespace-pre-wrap">{error}</pre>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-sm text-foreground-muted',
          className
        )}
      >
        Run a query to see results
      </div>
    )
  }

  const hasRows =
    result.columns && result.columns.length > 0 && result.rows && result.rows.length > 0

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-surface-75/60 text-xs text-foreground-light">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
          Success
        </span>
        {result.affected_rows > 0 && <span>{result.affected_rows} row(s) affected</span>}
        {result.rows && result.rows.length > 0 && <span>{result.rows.length} row(s) returned</span>}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {result.duration_ms}ms
        </span>
      </div>

      {/* Result table */}
      {hasRows ? (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-5">
              <tr className="bg-surface-75 border-b border-border">
                <th className="w-10 px-3 py-2 text-right text-[11px] font-medium text-foreground-muted">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-[11px] font-medium text-foreground-muted"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border hover:bg-surface-200/30 transition-colors"
                >
                  <td className="w-10 px-3 py-1.5 text-right text-[11px] text-foreground-muted tabular-nums">
                    {idx + 1}
                  </td>
                  {result.columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-1.5 text-[13px] text-foreground max-w-[300px] truncate"
                    >
                      <CellDisplay value={row[col]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-sm text-foreground-muted">
          Query executed successfully. No rows returned.
        </div>
      )}
    </div>
  )
}

function CellDisplay({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-muted italic">NULL</span>
  }
  if (typeof value === 'boolean') {
    return <span className="font-medium">{String(value)}</span>
  }
  if (typeof value === 'object') {
    return (
      <span className="font-mono text-xs text-foreground-light">
        {JSON.stringify(value).slice(0, 120)}
      </span>
    )
  }
  return <span>{String(value)}</span>
}
