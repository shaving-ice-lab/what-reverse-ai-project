'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Key,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Braces,
  Link2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { TableColumn, CreateColumnDef, AlterColumnDef } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'

// Supabase-style categorized column types
const TYPE_CATEGORIES = [
  {
    label: 'Number',
    icon: Hash,
    types: [
      { value: 'INT', label: 'int4', desc: '32-bit integer' },
      { value: 'BIGINT', label: 'int8', desc: '64-bit integer' },
      { value: 'SMALLINT', label: 'int2', desc: '16-bit integer' },
      { value: 'DECIMAL(10,2)', label: 'decimal', desc: 'Exact numeric' },
      { value: 'FLOAT', label: 'float4', desc: '32-bit float' },
      { value: 'DOUBLE', label: 'float8', desc: '64-bit float' },
    ],
  },
  {
    label: 'Text',
    icon: Type,
    types: [
      { value: 'VARCHAR(255)', label: 'varchar', desc: 'Variable-length string' },
      { value: 'TEXT', label: 'text', desc: 'Unlimited text' },
      { value: 'CHAR(1)', label: 'char', desc: 'Fixed-length string' },
    ],
  },
  {
    label: 'Date / Time',
    icon: Calendar,
    types: [
      { value: 'TIMESTAMP', label: 'timestamp', desc: 'Date and time' },
      { value: 'DATETIME', label: 'datetime', desc: 'Date and time' },
      { value: 'DATE', label: 'date', desc: 'Date only' },
      { value: 'TIME', label: 'time', desc: 'Time only' },
    ],
  },
  {
    label: 'Boolean',
    icon: ToggleLeft,
    types: [{ value: 'BOOLEAN', label: 'bool', desc: 'True or false' }],
  },
  {
    label: 'JSON',
    icon: Braces,
    types: [
      { value: 'JSON', label: 'json', desc: 'JSON data' },
      { value: 'JSONB', label: 'jsonb', desc: 'Binary JSON' },
    ],
  },
  {
    label: 'Other',
    icon: Key,
    types: [
      { value: 'UUID', label: 'uuid', desc: 'Universally unique ID' },
      { value: 'BLOB', label: 'blob', desc: 'Binary data' },
      { value: 'ENUM', label: 'enum', desc: 'Enumerated type' },
    ],
  },
]

const ALL_TYPES = TYPE_CATEGORIES.flatMap((c) => c.types)

const DEFAULT_EXPRESSIONS = [
  { label: 'NULL', value: 'NULL' },
  { label: 'Now', value: 'CURRENT_TIMESTAMP' },
  { label: 'UUID', value: 'UUID()' },
  { label: '0', value: '0' },
  { label: 'Empty string', value: "''" },
  { label: 'True', value: 'TRUE' },
  { label: 'False', value: 'FALSE' },
]

function getTypeIcon(sqlType: string) {
  const upper = sqlType.toUpperCase()
  if (/INT|BIGINT|SMALLINT|DECIMAL|FLOAT|DOUBLE|NUMERIC/.test(upper)) return Hash
  if (/CHAR|TEXT|STRING/.test(upper)) return Type
  if (/DATE|TIME|TIMESTAMP/.test(upper)) return Calendar
  if (/BOOL/.test(upper)) return ToggleLeft
  if (/JSON/.test(upper)) return Braces
  if (/UUID/.test(upper)) return Key
  return Type
}

function getTypeColor(sqlType: string) {
  const upper = sqlType.toUpperCase()
  if (/INT|BIGINT|SMALLINT|DECIMAL|FLOAT|DOUBLE|NUMERIC/.test(upper))
    return 'text-blue-500 bg-blue-500/10'
  if (/CHAR|TEXT|STRING/.test(upper)) return 'text-emerald-500 bg-emerald-500/10'
  if (/DATE|TIME|TIMESTAMP/.test(upper)) return 'text-amber-500 bg-amber-500/10'
  if (/BOOL/.test(upper)) return 'text-purple-500 bg-purple-500/10'
  if (/JSON/.test(upper)) return 'text-orange-500 bg-orange-500/10'
  if (/UUID/.test(upper)) return 'text-pink-500 bg-pink-500/10'
  return 'text-foreground-muted bg-surface-200'
}

// Type picker component (Supabase-style categorized)
function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return TYPE_CATEGORIES
    const q = search.toLowerCase()
    return TYPE_CATEGORIES.map((cat) => ({
      ...cat,
      types: cat.types.filter(
        (t) =>
          t.value.toLowerCase().includes(q) ||
          t.label.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.types.length > 0)
  }, [search])

  const selectedLabel = ALL_TYPES.find((t) => t.value === value)?.label || value

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-8 px-3 flex items-center justify-between rounded-md border border-border bg-background text-sm hover:border-brand-500/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = getTypeIcon(value)
            return <Icon className={cn('w-3 h-3', getTypeColor(value).split(' ')[0])} />
          })()}
          <span className="text-foreground font-mono text-xs">{selectedLabel}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-foreground-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-background border border-border rounded-lg shadow-xl z-50 max-h-[320px] flex flex-col">
            <div className="p-2 border-b border-border shrink-0">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search types..."
                className="h-7 text-xs"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {filtered.map((cat) => (
                <div key={cat.label}>
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-foreground-muted font-medium">
                    {cat.label}
                  </div>
                  {cat.types.map((t) => {
                    const Icon = getTypeIcon(t.value)
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          onChange(t.value)
                          setOpen(false)
                          setSearch('')
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-left transition-colors',
                          value === t.value
                            ? 'bg-brand-500/10 text-brand-500'
                            : 'hover:bg-surface-200/50'
                        )}
                      >
                        <Icon
                          className={cn('w-3 h-3 shrink-0', getTypeColor(t.value).split(' ')[0])}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono">{t.label}</span>
                          <span className="text-[10px] text-foreground-muted ml-2">{t.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-xs text-foreground-muted text-center">
                  No matching types
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface ColumnManagerDialogProps {
  open: boolean
  onClose: () => void
  columns: TableColumn[]
  tableName: string
  onAddColumn: (col: CreateColumnDef) => Promise<void>
  onAlterColumn: (col: AlterColumnDef) => Promise<void>
  onDropColumn: (colName: string) => Promise<void>
}

type DialogMode = 'list' | 'add' | 'edit'

export function ColumnManagerDialog({
  open,
  onClose,
  columns,
  tableName,
  onAddColumn,
  onAlterColumn,
  onDropColumn,
}: ColumnManagerDialogProps) {
  const [mode, setMode] = useState<DialogMode>('list')
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Add column form
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('VARCHAR(255)')
  const [newNullable, setNewNullable] = useState(true)
  const [newDefault, setNewDefault] = useState('')
  const [newUnique, setNewUnique] = useState(false)
  const [newComment, setNewComment] = useState('')

  // Edit column form
  const [editNewName, setEditNewName] = useState('')
  const [editType, setEditType] = useState('')
  const [editComment, setEditComment] = useState('')

  if (!open) return null

  const resetAddForm = () => {
    setNewName('')
    setNewType('VARCHAR(255)')
    setNewNullable(true)
    setNewDefault('')
    setNewUnique(false)
    setNewComment('')
    setError('')
  }

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('Column name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onAddColumn({
        name: newName.trim(),
        type: newType,
        nullable: newNullable,
        default_value: newDefault.trim() || undefined,
        unique: newUnique,
        comment: newComment.trim() || undefined,
      })
      resetAddForm()
      setMode('list')
    } catch (err: any) {
      setError(err?.message || 'Failed to add column')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingColumn) return
    setSaving(true)
    setError('')
    try {
      const alter: AlterColumnDef = { name: editingColumn }
      if (editNewName.trim() && editNewName.trim() !== editingColumn) {
        alter.new_name = editNewName.trim()
      }
      if (editType.trim()) {
        alter.type = editType.trim()
      }
      if (editComment.trim()) {
        alter.comment = editComment.trim()
      }
      await onAlterColumn(alter)
      setMode('list')
      setEditingColumn(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to alter column')
    } finally {
      setSaving(false)
    }
  }

  const handleDrop = async (colName: string) => {
    if (!window.confirm(`Delete column "${colName}"? This action cannot be undone.`)) return
    setSaving(true)
    setError('')
    try {
      await onDropColumn(colName)
    } catch (err: any) {
      setError(err?.message || 'Failed to drop column')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (col: TableColumn) => {
    setEditingColumn(col.name)
    setEditNewName(col.name)
    setEditType(col.type)
    setEditComment(col.comment || '')
    setError('')
    setMode('edit')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-xl shadow-xl w-[560px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {mode === 'add' ? 'Add Column' : mode === 'edit' ? 'Edit Column' : 'Columns'}
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              {tableName} · {columns.length} column{columns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-5 mt-3 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          {mode === 'list' && (
            <div className="divide-y divide-border">
              {/* Column header row */}
              <div className="grid grid-cols-[1fr_120px_60px_60px_40px] gap-2 px-5 py-2 text-[10px] uppercase tracking-wider text-foreground-muted font-medium bg-surface-75/50">
                <span>Name</span>
                <span>Type</span>
                <span className="text-center">Null</span>
                <span className="text-center">Key</span>
                <span />
              </div>
              {columns.map((col) => {
                const TypeIcon = getTypeIcon(col.type)
                const typeColor = getTypeColor(col.type)
                return (
                  <div
                    key={col.name}
                    className="grid grid-cols-[1fr_120px_60px_60px_40px] gap-2 items-center px-5 py-2 hover:bg-surface-200/30 group transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-foreground font-mono truncate block">
                        {col.name}
                      </span>
                      {col.default_value && (
                        <span className="text-[10px] text-foreground-muted">
                          = {col.default_value}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono',
                          typeColor
                        )}
                      >
                        <TypeIcon className="w-2.5 h-2.5" />
                        {col.type.toLowerCase().replace(/\(.*\)/, '')}
                      </span>
                    </div>
                    <div className="text-center">
                      {col.nullable ? (
                        <span className="text-[10px] text-foreground-muted">yes</span>
                      ) : (
                        <span className="text-[10px] font-medium text-foreground">NO</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {col.is_primary_key && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-600">
                          PK
                        </span>
                      )}
                      {col.is_unique && !col.is_primary_key && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          UQ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      {!col.is_primary_key && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(col)}
                            className="p-1 rounded hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDrop(col.name)}
                            disabled={saving}
                            className="p-1 rounded hover:bg-destructive/10 text-foreground-muted hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {mode === 'add' && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Column Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) =>
                    setNewName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase())
                  }
                  placeholder="e.g. email"
                  className="h-8 text-sm font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Type
                </label>
                <TypePicker value={newType} onChange={setNewType} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <Checkbox checked={newNullable} onCheckedChange={(v) => setNewNullable(!!v)} />
                  <div>
                    <span className="text-foreground font-medium">Nullable</span>
                    <p className="text-[10px] text-foreground-muted">Allow NULL values</p>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <Checkbox checked={newUnique} onCheckedChange={(v) => setNewUnique(!!v)} />
                  <div>
                    <span className="text-foreground font-medium">Unique</span>
                    <p className="text-[10px] text-foreground-muted">Enforce uniqueness</p>
                  </div>
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Default Value
                </label>
                <Input
                  value={newDefault}
                  onChange={(e) => setNewDefault(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-sm font-mono"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {DEFAULT_EXPRESSIONS.map((expr) => (
                    <button
                      key={expr.value}
                      type="button"
                      onClick={() => setNewDefault(expr.value)}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] transition-colors',
                        newDefault === expr.value
                          ? 'bg-brand-500/10 text-brand-500'
                          : 'bg-surface-200/60 text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {expr.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Description
                </label>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'edit' && editingColumn && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Column Name
                </label>
                <Input
                  value={editNewName}
                  onChange={(e) => setEditNewName(e.target.value)}
                  className="h-8 text-sm font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Type
                </label>
                <TypePicker value={editType} onChange={setEditType} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Description
                </label>
                <Input
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          {mode === 'list' ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  resetAddForm()
                  setMode('add')
                }}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Column
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMode('list')
                  setError('')
                }}
                className="h-8 text-xs"
              >
                Back
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={mode === 'add' ? handleAdd : handleEdit}
                disabled={saving}
                className="h-8 text-xs"
              >
                {saving ? 'Saving...' : mode === 'add' ? 'Add Column' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
