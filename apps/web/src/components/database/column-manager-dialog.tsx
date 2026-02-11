'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { TableColumn, CreateColumnDef, AlterColumnDef } from '@/lib/api/workspace-database'

const COMMON_TYPES = [
  'INT',
  'BIGINT',
  'VARCHAR(255)',
  'TEXT',
  'BOOLEAN',
  'DATETIME',
  'DATE',
  'DECIMAL(10,2)',
  'FLOAT',
  'JSON',
]

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
      <div className="bg-background border border-border rounded-xl shadow-xl w-[520px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {mode === 'add' ? 'Add Column' : mode === 'edit' ? 'Edit Column' : 'Manage Columns'}
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">{tableName}</p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-3 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          {mode === 'list' && (
            <div className="space-y-1">
              {columns.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-200/40 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{col.name}</span>
                      {col.is_primary_key && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-600">PK</span>
                      )}
                      {col.is_unique && !col.is_primary_key && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-500/10 text-blue-500">UQ</span>
                      )}
                    </div>
                    <div className="text-[11px] text-foreground-muted mt-0.5">
                      {col.type}
                      {col.nullable ? ' · nullable' : ' · NOT NULL'}
                      {col.comment ? ` · ${col.comment}` : ''}
                    </div>
                  </div>
                  {!col.is_primary_key && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => startEdit(col)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => handleDrop(col.name)}
                        disabled={saving}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mode === 'add' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Column Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. email"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={newNullable}
                    onCheckedChange={(v) => setNewNullable(!!v)}
                  />
                  Nullable
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={newUnique}
                    onCheckedChange={(v) => setNewUnique(!!v)}
                  />
                  Unique
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Default Value</label>
                <Input
                  value={newDefault}
                  onChange={(e) => setNewDefault(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Comment</label>
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
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Column Name</label>
                <Input
                  value={editNewName}
                  onChange={(e) => setEditNewName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Type</label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                    {!COMMON_TYPES.includes(editType) && (
                      <SelectItem value={editType}>{editType}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1 block">Comment</label>
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
              <Button size="sm" variant="default" onClick={() => { resetAddForm(); setMode('add') }} className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Column
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="h-8 text-xs">
                Close
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setMode('list'); setError('') }} className="h-8 text-xs">
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
