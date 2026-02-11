'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Minus, Plus, Equal } from 'lucide-react'
import type { AppVersionDiff, AppVersionDiffChange } from '@/lib/api/workspace'

interface VersionDiffViewerProps {
  diff: AppVersionDiff
  className?: string
}

const FIELD_LABELS: Record<string, string> = {
  changelog: 'Changelog',
  workflow_id: 'Workflow',
  ui_schema: 'UI Schema',
  db_schema: 'DB Schema',
  config_json: 'Config',
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'string') return val || '(empty)'
  return JSON.stringify(val, null, 2)
}

/** Compute flat key→{from,to} diff between two objects */
function flatDiff(
  from: Record<string, unknown>,
  to: Record<string, unknown>,
  prefix = ''
): Array<{ key: string; from: unknown; to: unknown; type: 'added' | 'removed' | 'changed' }> {
  const result: Array<{ key: string; from: unknown; to: unknown; type: 'added' | 'removed' | 'changed' }> = []
  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)])
  for (const k of allKeys) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    const fv = from[k]
    const tv = to[k]
    if (!(k in from)) {
      result.push({ key: fullKey, from: undefined, to: tv, type: 'added' })
    } else if (!(k in to)) {
      result.push({ key: fullKey, from: fv, to: undefined, type: 'removed' })
    } else if (isObject(fv) && isObject(tv)) {
      result.push(...flatDiff(fv, tv, fullKey))
    } else if (JSON.stringify(fv) !== JSON.stringify(tv)) {
      result.push({ key: fullKey, from: fv, to: tv, type: 'changed' })
    }
  }
  return result
}

function DiffFieldSection({ fieldName, change }: { fieldName: string; change: AppVersionDiffChange }) {
  const [expanded, setExpanded] = useState(false)
  const label = FIELD_LABELS[fieldName] || fieldName

  const fromIsObj = isObject(change.from)
  const toIsObj = isObject(change.to)
  const hasDeepDiff = fromIsObj && toIsObj

  const entries = hasDeepDiff
    ? flatDiff(change.from as Record<string, unknown>, change.to as Record<string, unknown>)
    : []

  const addedCount = hasDeepDiff ? entries.filter((e) => e.type === 'added').length : 0
  const removedCount = hasDeepDiff ? entries.filter((e) => e.type === 'removed').length : 0
  const changedCount = hasDeepDiff ? entries.filter((e) => e.type === 'changed').length : 0

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-100/80 hover:bg-surface-200/60 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
        )}
        <span className="text-[12px] font-medium text-foreground flex-1">{label}</span>
        {hasDeepDiff ? (
          <div className="flex items-center gap-2 text-[10px]">
            {addedCount > 0 && (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Plus className="w-3 h-3" />
                {addedCount}
              </span>
            )}
            {removedCount > 0 && (
              <span className="text-red-400 flex items-center gap-0.5">
                <Minus className="w-3 h-3" />
                {removedCount}
              </span>
            )}
            {changedCount > 0 && (
              <span className="text-amber-400 flex items-center gap-0.5">
                <Equal className="w-3 h-3" />
                {changedCount}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-amber-400">modified</span>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 bg-surface-200/30 max-h-[300px] overflow-y-auto">
          {hasDeepDiff && entries.length > 0 ? (
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div key={entry.key} className="text-[11px] font-mono">
                  <span className="text-foreground-muted">{entry.key}</span>
                  {entry.type === 'added' && (
                    <div className="ml-3 mt-0.5 rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Plus className="w-3 h-3 inline mr-1" />
                      {formatValue(entry.to)}
                    </div>
                  )}
                  {entry.type === 'removed' && (
                    <div className="ml-3 mt-0.5 rounded px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20">
                      <Minus className="w-3 h-3 inline mr-1" />
                      {formatValue(entry.from)}
                    </div>
                  )}
                  {entry.type === 'changed' && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      <div className="rounded px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20">
                        <Minus className="w-3 h-3 inline mr-1" />
                        {formatValue(entry.from)}
                      </div>
                      <div className="rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Plus className="w-3 h-3 inline mr-1" />
                        {formatValue(entry.to)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="rounded px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20">
                <Minus className="w-3 h-3 inline mr-1" />
                <span className="whitespace-pre-wrap">{formatValue(change.from)}</span>
              </div>
              <div className="rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Plus className="w-3 h-3 inline mr-1" />
                <span className="whitespace-pre-wrap">{formatValue(change.to)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function VersionDiffViewer({ diff, className }: VersionDiffViewerProps) {
  const changedFields = Object.keys(diff.changes)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-[11px] text-foreground-muted">
        <span>
          {diff.from_version} → {diff.to_version}
        </span>
        <span>{changedFields.length} field(s) changed</span>
      </div>

      {changedFields.length === 0 ? (
        <div className="text-center py-3 text-[12px] text-foreground-muted border border-border rounded-md bg-surface-100/50">
          No differences found between these versions.
        </div>
      ) : (
        <div className="space-y-1.5">
          {changedFields.map((field) => (
            <DiffFieldSection key={field} fieldName={field} change={diff.changes[field]} />
          ))}
        </div>
      )}
    </div>
  )
}
