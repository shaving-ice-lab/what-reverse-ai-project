'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { TableColumn } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

export interface RowDetailPanelProps {
  row: Record<string, unknown>
  columns: TableColumn[]
  primaryKey: string[]
  isNew: boolean
  onSave: (data: Record<string, unknown>, isNew: boolean) => Promise<void>
  onDelete: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

export function RowDetailPanel({
  row,
  columns,
  primaryKey,
  isNew,
  onSave,
  onDelete,
  onClose,
}: RowDetailPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const data: Record<string, unknown> = {}
    columns.forEach((col) => {
      data[col.name] = row[col.name] ?? null
    })
    setFormData(data)
    setDirty(false)
  }, [row, columns])

  const handleChange = (colName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [colName]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData, isNew)
    } finally {
      setSaving(false)
    }
  }

  const { confirm: confirmDelete, Dialog: DeleteRowDialog } = useConfirmDialog()

  const handleDelete = async () => {
    const confirmed = await confirmDelete({
      title: 'Delete Row',
      description: 'Are you sure you want to delete this row? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })
    if (!confirmed) return
    setDeleting(true)
    try {
      await onDelete(formData)
    } finally {
      setDeleting(false)
    }
  }

  const isPK = (colName: string) => primaryKey.includes(colName)

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-background-studio flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">
          {isNew ? 'Insert Row' : 'Row Detail'}
        </h3>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {columns.map((col) => (
          <FieldEditor
            key={col.name}
            column={col}
            value={formData[col.name]}
            onChange={(val) => handleChange(col.name, val)}
            disabled={!isNew && isPK(col.name)}
            isPrimaryKey={isPK(col.name)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-75/60">
        <div>
          {!isNew && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-8 text-xs"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1" />
              )}
              Delete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (!isNew && !dirty)}
            className="h-8 text-xs"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            {isNew ? 'Insert' : 'Save'}
          </Button>
        </div>
      </div>
      <DeleteRowDialog />
    </div>
  )
}

function FieldEditor({
  column,
  value,
  onChange,
  disabled,
  isPrimaryKey,
}: {
  column: TableColumn
  value: unknown
  onChange: (val: unknown) => void
  disabled?: boolean
  isPrimaryKey?: boolean
}) {
  const typeLower = column.type.toLowerCase()
  const isBoolean =
    typeLower.includes('tinyint(1)') || typeLower.includes('boolean') || typeLower.includes('bool')
  const isNumber =
    typeLower.includes('int') ||
    typeLower.includes('decimal') ||
    typeLower.includes('float') ||
    typeLower.includes('double') ||
    typeLower.includes('numeric')
  const isText =
    typeLower.includes('text') || typeLower.includes('json') || typeLower.includes('blob')
  const isNull = value === null || value === undefined

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-[12px] font-medium text-foreground">{column.name}</label>
        {isPrimaryKey && (
          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
            PK
          </span>
        )}
        {!column.nullable && <span className="text-[9px] text-destructive">required</span>}
        <span className="text-[10px] text-foreground-muted ml-auto">{column.type}</span>
      </div>

      {isBoolean && !isNull ? (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked ? 1 : 0)}
            disabled={disabled}
          />
          <span className="text-xs text-foreground-light">{value ? 'true' : 'false'}</span>
          {column.nullable && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] text-foreground-muted ml-auto"
              onClick={() => onChange(null)}
            >
              Set NULL
            </Button>
          )}
        </div>
      ) : isText ? (
        <div className="space-y-1">
          <Textarea
            value={isNull ? '' : String(value)}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            placeholder={isNull ? 'NULL' : ''}
            className={cn(
              'text-xs font-mono min-h-[80px]',
              isNull && 'text-foreground-muted italic'
            )}
          />
          {column.nullable && !isNull && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] text-foreground-muted"
              onClick={() => onChange(null)}
            >
              Set NULL
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            type={isNumber && !isNull ? 'number' : 'text'}
            value={isNull ? '' : String(value)}
            onChange={(e) => {
              const v = e.target.value
              if (v === '' && column.nullable) {
                onChange(null)
              } else if (isNumber) {
                onChange(Number(v) || 0)
              } else {
                onChange(v)
              }
            }}
            disabled={disabled}
            placeholder={isNull ? 'NULL' : ''}
            className={cn('h-8 text-xs', isNull && 'text-foreground-muted italic')}
          />
          {column.nullable && !isNull && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 shrink-0 text-foreground-muted"
              onClick={() => onChange(null)}
              title="Set NULL"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
