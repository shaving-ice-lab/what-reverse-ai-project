'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X, CornerDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

type ColumnDataType = 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' | 'unknown'

interface CellEditorProps {
  value: unknown
  columnName: string
  columnType: string
  nullable: boolean
  onSave: (newValue: unknown) => void
  onCancel: () => void
  className?: string
}

function resolveDataType(pgType: string): ColumnDataType {
  const t = pgType.toLowerCase()
  if (/^(int|bigint|smallint|serial|bigserial|integer|numeric|decimal|real|double|float)/.test(t))
    return 'number'
  if (/^(bool|boolean)/.test(t)) return 'boolean'
  if (/^(date)$/.test(t)) return 'date'
  if (/^(timestamp|timestamptz|datetime)/.test(t)) return 'datetime'
  if (/^(json|jsonb)/.test(t)) return 'json'
  if (/^(text|varchar|character|char|citext|name|uuid)/.test(t)) return 'text'
  return 'unknown'
}

function formatValueForEdit(value: unknown, dataType: ColumnDataType): string {
  if (value === null || value === undefined) return ''
  if (dataType === 'json') {
    try {
      return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  if (dataType === 'date' && value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  if (dataType === 'datetime') {
    if (value instanceof Date) return value.toISOString().slice(0, 16)
    if (typeof value === 'string' && value.length > 16) return value.slice(0, 16)
  }
  return String(value)
}

function parseEditedValue(editStr: string, dataType: ColumnDataType, nullable: boolean): unknown {
  if (editStr === '' && nullable) return null
  switch (dataType) {
    case 'number': {
      const n = Number(editStr)
      return isNaN(n) ? editStr : n
    }
    case 'boolean':
      return editStr === 'true' || editStr === '1'
    case 'json':
      try {
        return JSON.parse(editStr)
      } catch {
        return editStr
      }
    default:
      return editStr
  }
}

export function CellEditor({
  value,
  columnName,
  columnType,
  nullable,
  onSave,
  onCancel,
  className,
}: CellEditorProps) {
  const dataType = resolveDataType(columnType)
  const [editValue, setEditValue] = useState(() => formatValueForEdit(value, dataType))
  const [isNull, setIsNull] = useState(value === null || value === undefined)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (inputRef.current && 'select' in inputRef.current) {
      inputRef.current.select()
    }
  }, [])

  const handleSave = useCallback(() => {
    if (isNull && nullable) {
      onSave(null)
      return
    }
    if (dataType === 'json' && editValue.trim()) {
      try {
        JSON.parse(editValue)
        setJsonError(null)
      } catch (e: any) {
        setJsonError(e.message || 'Invalid JSON')
        return
      }
    }
    const parsed = parseEditedValue(editValue, dataType, nullable)
    onSave(parsed)
  }, [editValue, isNull, nullable, dataType, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
      if (e.key === 'Enter' && !e.shiftKey && dataType !== 'json') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSave()
      }
      e.stopPropagation()
    },
    [onCancel, handleSave, dataType]
  )

  const toggleNull = () => {
    if (!nullable) return
    const next = !isNull
    setIsNull(next)
    if (next) {
      setEditValue('')
    }
  }

  return (
    <div
      className={cn(
        'border border-brand-500 rounded-md bg-background shadow-lg p-2 space-y-1.5 min-w-[200px]',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Column info */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground-muted">
          {columnName}
          <span className="ml-1 opacity-60">({columnType})</span>
        </span>
        {nullable && (
          <button
            onClick={toggleNull}
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
              isNull
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                : 'border-border text-foreground-muted hover:border-foreground-muted'
            )}
          >
            NULL
          </button>
        )}
      </div>

      {/* Editor by type */}
      {isNull ? (
        <div className="text-xs text-amber-500 italic py-1">Value is NULL</div>
      ) : dataType === 'boolean' ? (
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            checked={editValue === 'true' || editValue === '1'}
            onCheckedChange={(checked) => setEditValue(checked ? 'true' : 'false')}
          />
          <span className="text-xs text-foreground">
            {editValue === 'true' || editValue === '1' ? 'TRUE' : 'FALSE'}
          </span>
        </div>
      ) : dataType === 'json' ? (
        <div>
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              setJsonError(null)
            }}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] max-h-[250px] font-mono text-xs resize-y"
            placeholder='{"key": "value"}'
          />
          {jsonError && <div className="text-[10px] text-destructive mt-0.5">{jsonError}</div>}
          <div className="text-[10px] text-foreground-muted mt-0.5">Ctrl+Enter to save</div>
        </div>
      ) : dataType === 'date' ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
        />
      ) : dataType === 'datetime' ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="datetime-local"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
        />
      ) : dataType === 'number' ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
          step="any"
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10px] text-foreground-muted flex items-center gap-0.5">
          <CornerDownLeft className="w-2.5 h-2.5" />
          Enter to save
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
          <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
            <Check className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
