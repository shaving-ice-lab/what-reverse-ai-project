'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Loader2, Code2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { CreateTableRequest, CreateColumnDef } from '@/lib/api/workspace-database'

const MYSQL_TYPES = [
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'SMALLINT', value: 'SMALLINT' },
  { label: 'TINYINT', value: 'TINYINT' },
  { label: 'DECIMAL', value: 'DECIMAL(10,2)' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'VARCHAR(255)', value: 'VARCHAR(255)' },
  { label: 'VARCHAR(100)', value: 'VARCHAR(100)' },
  { label: 'VARCHAR(50)', value: 'VARCHAR(50)' },
  { label: 'CHAR(36)', value: 'CHAR(36)' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'MEDIUMTEXT', value: 'MEDIUMTEXT' },
  { label: 'LONGTEXT', value: 'LONGTEXT' },
  { label: 'JSON', value: 'JSON' },
  { label: 'BOOLEAN', value: 'TINYINT(1)' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'BLOB', value: 'BLOB' },
  { label: 'ENUM', value: "ENUM('a','b')" },
]

interface ColumnDraft {
  id: string
  name: string
  type: string
  nullable: boolean
  defaultValue: string
  unique: boolean
  comment: string
  isPK: boolean
  autoIncrement: boolean
}

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (req: CreateTableRequest) => Promise<void>
}

let nextId = 1
function genId() {
  return `col_${nextId++}`
}

function defaultColumn(): ColumnDraft {
  return {
    id: genId(),
    name: '',
    type: 'VARCHAR(255)',
    nullable: true,
    defaultValue: '',
    unique: false,
    comment: '',
    isPK: false,
    autoIncrement: false,
  }
}

function defaultIdColumn(): ColumnDraft {
  return {
    id: genId(),
    name: 'id',
    type: 'BIGINT',
    nullable: false,
    defaultValue: '',
    unique: false,
    comment: '',
    isPK: true,
    autoIncrement: true,
  }
}

export function CreateTableDialog({ open, onOpenChange, onSubmit }: CreateTableDialogProps) {
  const [tableName, setTableName] = useState('')
  const [columns, setColumns] = useState<ColumnDraft[]>([defaultIdColumn(), defaultColumn()])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('columns')

  const updateColumn = (id: string, patch: Partial<ColumnDraft>) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  const addColumn = () => {
    setColumns((prev) => [...prev, defaultColumn()])
  }

  const primaryKeys = columns.filter((c) => c.isPK).map((c) => c.name)

  const generatedSQL = useMemo(() => {
    if (!tableName.trim()) return '-- Enter a table name'
    const validCols = columns.filter((c) => c.name.trim() && c.type.trim())
    if (validCols.length === 0) return '-- Add at least one column'

    const lines: string[] = []
    validCols.forEach((col) => {
      let line = `  \`${col.name}\` ${col.type}`
      if (!col.nullable) line += ' NOT NULL'
      if (col.autoIncrement) line += ' AUTO_INCREMENT'
      if (col.defaultValue) line += ` DEFAULT ${col.defaultValue}`
      if (col.unique && !col.isPK) line += ' UNIQUE'
      if (col.comment) line += ` COMMENT '${col.comment}'`
      lines.push(line)
    })

    const pks = validCols.filter((c) => c.isPK).map((c) => `\`${c.name}\``)
    if (pks.length > 0) {
      lines.push(`  PRIMARY KEY (${pks.join(', ')})`)
    }

    return `CREATE TABLE \`${tableName}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  }, [tableName, columns])

  const canSubmit = tableName.trim() && columns.some((c) => c.name.trim() && c.type.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const validCols = columns.filter((c) => c.name.trim() && c.type.trim())
      const reqColumns: CreateColumnDef[] = validCols.map((col) => ({
        name: col.name,
        type: col.autoIncrement ? `${col.type} AUTO_INCREMENT` : col.type,
        nullable: col.nullable,
        default_value: col.defaultValue || undefined,
        unique: col.unique,
        comment: col.comment || undefined,
      }))

      const req: CreateTableRequest = {
        name: tableName,
        columns: reqColumns,
        primary_key: primaryKeys.filter((pk) => pk.trim()),
      }

      await onSubmit(req)
      // Reset
      setTableName('')
      setColumns([defaultIdColumn(), defaultColumn()])
      setActiveTab('columns')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setTableName('')
    setColumns([defaultIdColumn(), defaultColumn()])
    setActiveTab('columns')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
          {/* Table Name */}
          <div>
            <label className="text-[12px] font-medium text-foreground mb-1.5 block">
              Table Name
            </label>
            <Input
              placeholder="e.g. users, orders, products"
              value={tableName}
              onChange={(e) => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="h-9"
            />
          </div>

          {/* Tabs: Columns / Preview SQL */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList variant="underline">
              <TabsTrigger value="columns">Columns ({columns.length})</TabsTrigger>
              <TabsTrigger value="sql">
                <Code2 className="w-3.5 h-3.5 mr-1" />
                SQL Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="columns" className="flex-1 overflow-y-auto mt-3 space-y-2">
              {/* Column Header */}
              <div className="grid grid-cols-[32px_1fr_140px_60px_60px_60px_32px] gap-2 items-center px-1 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                <span>PK</span>
                <span>Name</span>
                <span>Type</span>
                <span>Null</span>
                <span>Uniq</span>
                <span>AI</span>
                <span></span>
              </div>

              {columns.map((col) => (
                <div
                  key={col.id}
                  className="grid grid-cols-[32px_1fr_140px_60px_60px_60px_32px] gap-2 items-center px-1 py-1 rounded hover:bg-surface-200/30"
                >
                  <Checkbox
                    checked={col.isPK}
                    onCheckedChange={(checked) =>
                      updateColumn(col.id, {
                        isPK: !!checked,
                        nullable: checked ? false : col.nullable,
                      })
                    }
                  />
                  <Input
                    placeholder="column_name"
                    value={col.name}
                    onChange={(e) =>
                      updateColumn(col.id, { name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })
                    }
                    className="h-8 text-xs"
                  />
                  <Select value={col.type} onValueChange={(v) => updateColumn(col.id, { type: v })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MYSQL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={col.nullable}
                      onCheckedChange={(checked) => updateColumn(col.id, { nullable: !!checked })}
                      disabled={col.isPK}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={col.unique}
                      onCheckedChange={(checked) => updateColumn(col.id, { unique: !!checked })}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={col.autoIncrement}
                      onCheckedChange={(checked) =>
                        updateColumn(col.id, { autoIncrement: !!checked })
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                    onClick={() => removeColumn(col.id)}
                    disabled={columns.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <Button
                size="sm"
                variant="ghost"
                onClick={addColumn}
                className="h-8 text-xs w-full border border-dashed border-border"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Column
              </Button>
            </TabsContent>

            <TabsContent value="sql" className="flex-1 overflow-y-auto mt-3">
              <pre className="bg-surface-200/50 border border-border rounded-md p-4 text-xs font-mono text-foreground whitespace-pre-wrap overflow-auto max-h-[300px]">
                {generatedSQL}
              </pre>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            Reset
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="text-xs"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1" />
              )}
              Create Table
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
