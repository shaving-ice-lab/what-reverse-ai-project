'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { AppBlock, AppBlockType } from '@/components/app-renderer/types'

interface BlockConfigFormProps {
  block: AppBlock
  onChange: (updated: AppBlock) => void
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-foreground-muted uppercase tracking-wider">{label}</label>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8 text-sm ${mono ? 'font-mono' : ''}`}
    />
  )
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
}) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      placeholder={placeholder}
      className="h-8 text-sm font-mono"
    />
  )
}

function SwitchField({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-foreground">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  )
}

// ========== Type-specific config forms ==========

function StatsCardForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Label">
        <TextInput
          value={(config.label as string) || ''}
          onChange={(v) => setConfig({ ...config, label: v })}
          placeholder="e.g. Total Users"
        />
      </FieldRow>
      <FieldRow label="Value Key">
        <TextInput
          value={(config.value_key as string) || ''}
          onChange={(v) => setConfig({ ...config, value_key: v })}
          placeholder="e.g. count"
          mono
        />
      </FieldRow>
      <FieldRow label="Icon">
        <TextInput
          value={(config.icon as string) || ''}
          onChange={(v) => setConfig({ ...config, icon: v })}
          placeholder="e.g. Users"
        />
      </FieldRow>
      <FieldRow label="Format">
        <Select
          value={(config.format as string) || 'number'}
          onValueChange={(v) => setConfig({ ...config, format: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percent">Percent</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Color">
        <Select
          value={(config.color as string) || 'default'}
          onValueChange={(v) => setConfig({ ...config, color: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="red">Red</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="amber">Amber</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Trend Key">
        <TextInput
          value={(config.trend_key as string) || ''}
          onChange={(v) => setConfig({ ...config, trend_key: v })}
          placeholder="optional"
          mono
        />
      </FieldRow>
    </div>
  )
}

function DataTableForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  const columns = (config.columns as Array<Record<string, unknown>>) || []
  const actions = (config.actions as string[]) || []

  const addColumn = () => {
    setConfig({
      ...config,
      columns: [...columns, { key: '', label: '', type: 'text', sortable: true }],
    })
  }

  const removeColumn = (idx: number) => {
    setConfig({ ...config, columns: columns.filter((_, i) => i !== idx) })
  }

  const updateColumn = (idx: number, updates: Record<string, unknown>) => {
    setConfig({
      ...config,
      columns: columns.map((col, i) => (i === idx ? { ...col, ...updates } : col)),
    })
  }

  return (
    <div className="space-y-2.5">
      <FieldRow label="Table Name">
        <TextInput
          value={(config.table_name as string) || ''}
          onChange={(v) => setConfig({ ...config, table_name: v })}
          placeholder="e.g. users"
          mono
        />
      </FieldRow>
      <FieldRow label="Page Size">
        <NumberInput
          value={config.page_size as number | undefined}
          onChange={(v) => setConfig({ ...config, page_size: v })}
          placeholder="25"
        />
      </FieldRow>
      <SwitchField
        label="Pagination"
        value={config.pagination !== false}
        onChange={(v) => setConfig({ ...config, pagination: v })}
      />
      <SwitchField
        label="Filters Enabled"
        value={!!config.filters_enabled}
        onChange={(v) => setConfig({ ...config, filters_enabled: v })}
      />
      <SwitchField
        label="Search Enabled"
        value={!!config.search_enabled}
        onChange={(v) => setConfig({ ...config, search_enabled: v })}
      />
      {!!config.search_enabled && (
        <FieldRow label="Search Key">
          <TextInput
            value={(config.search_key as string) || ''}
            onChange={(v) => setConfig({ ...config, search_key: v })}
            placeholder="column to search"
            mono
          />
        </FieldRow>
      )}
      <FieldRow label="Actions">
        <div className="flex flex-wrap gap-1 mt-1">
          {(['edit', 'delete', 'view', 'create'] as const).map((act) => (
            <button
              key={act}
              onClick={() => {
                const next = actions.includes(act)
                  ? actions.filter((a) => a !== act)
                  : [...actions, act]
                setConfig({ ...config, actions: next })
              }}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${actions.includes(act) ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-border text-foreground-muted hover:border-foreground-muted'}`}
            >
              {act}
            </button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Columns">
        <div className="space-y-1.5 mt-1">
          {columns.map((col, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Input
                value={(col.key as string) || ''}
                onChange={(e) => updateColumn(idx, { key: e.target.value })}
                placeholder="key"
                className="h-7 text-[11px] font-mono flex-1"
              />
              <Input
                value={(col.label as string) || ''}
                onChange={(e) => updateColumn(idx, { label: e.target.value })}
                placeholder="label"
                className="h-7 text-[11px] flex-1"
              />
              <Select
                value={(col.type as string) || 'text'}
                onValueChange={(v) => updateColumn(idx, { type: v })}
              >
                <SelectTrigger className="h-7 w-20 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['text', 'number', 'date', 'boolean', 'badge'].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                onClick={() => removeColumn(idx)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] w-full"
            onClick={addColumn}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Column
          </Button>
        </div>
      </FieldRow>
    </div>
  )
}

function ChartForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Chart Type">
        <Select
          value={(config.chart_type as string) || 'bar'}
          onValueChange={(v) => setConfig({ ...config, chart_type: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['bar', 'line', 'pie', 'area'].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="X Key">
        <TextInput
          value={(config.x_key as string) || ''}
          onChange={(v) => setConfig({ ...config, x_key: v })}
          placeholder="x-axis column"
          mono
        />
      </FieldRow>
      <FieldRow label="Y Key">
        <TextInput
          value={(config.y_key as string) || ''}
          onChange={(v) => setConfig({ ...config, y_key: v })}
          placeholder="y-axis column"
          mono
        />
      </FieldRow>
      <FieldRow label="Title">
        <TextInput
          value={(config.title as string) || ''}
          onChange={(v) => setConfig({ ...config, title: v })}
        />
      </FieldRow>
      <FieldRow label="Height (px)">
        <NumberInput
          value={config.height as number | undefined}
          onChange={(v) => setConfig({ ...config, height: v })}
          placeholder="300"
        />
      </FieldRow>
      <FieldRow label="Color">
        <TextInput
          value={(config.color as string) || ''}
          onChange={(v) => setConfig({ ...config, color: v })}
          placeholder="#3ECF8E"
        />
      </FieldRow>
    </div>
  )
}

function FormBlockForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  const fields = (config.fields as Array<Record<string, unknown>>) || []

  const addField = () => {
    setConfig({
      ...config,
      fields: [...fields, { name: '', label: '', type: 'text', required: false }],
    })
  }

  const removeField = (idx: number) => {
    setConfig({ ...config, fields: fields.filter((_, i) => i !== idx) })
  }

  const updateField = (idx: number, updates: Record<string, unknown>) => {
    setConfig({
      ...config,
      fields: fields.map((f, i) => (i === idx ? { ...f, ...updates } : f)),
    })
  }

  return (
    <div className="space-y-2.5">
      <FieldRow label="Title">
        <TextInput
          value={(config.title as string) || ''}
          onChange={(v) => setConfig({ ...config, title: v })}
        />
      </FieldRow>
      <FieldRow label="Description">
        <TextInput
          value={(config.description as string) || ''}
          onChange={(v) => setConfig({ ...config, description: v })}
        />
      </FieldRow>
      <FieldRow label="Table Name">
        <TextInput
          value={(config.table_name as string) || ''}
          onChange={(v) => setConfig({ ...config, table_name: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Submit Label">
        <TextInput
          value={(config.submit_label as string) || ''}
          onChange={(v) => setConfig({ ...config, submit_label: v })}
          placeholder="Submit"
        />
      </FieldRow>
      <FieldRow label="Mode">
        <Select
          value={(config.mode as string) || 'create'}
          onValueChange={(v) => setConfig({ ...config, mode: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="edit">Edit</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Fields">
        <div className="space-y-1.5 mt-1">
          {fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Input
                value={(field.name as string) || ''}
                onChange={(e) => updateField(idx, { name: e.target.value })}
                placeholder="name"
                className="h-7 text-[11px] font-mono flex-1"
              />
              <Input
                value={(field.label as string) || ''}
                onChange={(e) => updateField(idx, { label: e.target.value })}
                placeholder="label"
                className="h-7 text-[11px] flex-1"
              />
              <Select
                value={(field.type as string) || 'text'}
                onValueChange={(v) => updateField(idx, { type: v })}
              >
                <SelectTrigger className="h-7 w-20 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['text', 'number', 'email', 'textarea', 'select', 'date', 'checkbox'].map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                onClick={() => removeField(idx)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="h-7 text-[11px] w-full" onClick={addField}>
            <Plus className="w-3 h-3 mr-1" /> Add Field
          </Button>
        </div>
      </FieldRow>
    </div>
  )
}

function DetailViewForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  const fields = (config.fields as Array<Record<string, unknown>>) || []

  return (
    <div className="space-y-2.5">
      <FieldRow label="Table Name">
        <TextInput
          value={(config.table_name as string) || ''}
          onChange={(v) => setConfig({ ...config, table_name: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Record ID Key">
        <TextInput
          value={(config.record_id_key as string) || ''}
          onChange={(v) => setConfig({ ...config, record_id_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Fields">
        <div className="space-y-1.5 mt-1">
          {fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Input
                value={(field.key as string) || ''}
                onChange={(e) => {
                  const next = [...fields]
                  next[idx] = { ...field, key: e.target.value }
                  setConfig({ ...config, fields: next })
                }}
                placeholder="key"
                className="h-7 text-[11px] font-mono flex-1"
              />
              <Input
                value={(field.label as string) || ''}
                onChange={(e) => {
                  const next = [...fields]
                  next[idx] = { ...field, label: e.target.value }
                  setConfig({ ...config, fields: next })
                }}
                placeholder="label"
                className="h-7 text-[11px] flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                onClick={() => {
                  setConfig({ ...config, fields: fields.filter((_, i) => i !== idx) })
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] w-full"
            onClick={() => {
              setConfig({ ...config, fields: [...fields, { key: '', label: '' }] })
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Field
          </Button>
        </div>
      </FieldRow>
    </div>
  )
}

function ListForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Table Name">
        <TextInput
          value={(config.table_name as string) || ''}
          onChange={(v) => setConfig({ ...config, table_name: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Title Key">
        <TextInput
          value={(config.title_key as string) || ''}
          onChange={(v) => setConfig({ ...config, title_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Subtitle Key">
        <TextInput
          value={(config.subtitle_key as string) || ''}
          onChange={(v) => setConfig({ ...config, subtitle_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Description Key">
        <TextInput
          value={(config.description_key as string) || ''}
          onChange={(v) => setConfig({ ...config, description_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Image Key">
        <TextInput
          value={(config.image_key as string) || ''}
          onChange={(v) => setConfig({ ...config, image_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Badge Key">
        <TextInput
          value={(config.badge_key as string) || ''}
          onChange={(v) => setConfig({ ...config, badge_key: v })}
          mono
        />
      </FieldRow>
      <FieldRow label="Layout">
        <Select
          value={(config.layout as string) || 'list'}
          onValueChange={(v) => setConfig({ ...config, layout: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <SwitchField
        label="Clickable"
        value={!!config.clickable}
        onChange={(v) => setConfig({ ...config, clickable: v })}
      />
      <FieldRow label="Empty Message">
        <TextInput
          value={(config.empty_message as string) || ''}
          onChange={(v) => setConfig({ ...config, empty_message: v })}
        />
      </FieldRow>
    </div>
  )
}

function HeroForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Title">
        <TextInput
          value={(config.title as string) || ''}
          onChange={(v) => setConfig({ ...config, title: v })}
        />
      </FieldRow>
      <FieldRow label="Subtitle">
        <TextInput
          value={(config.subtitle as string) || ''}
          onChange={(v) => setConfig({ ...config, subtitle: v })}
        />
      </FieldRow>
      <FieldRow label="Description">
        <TextInput
          value={(config.description as string) || ''}
          onChange={(v) => setConfig({ ...config, description: v })}
        />
      </FieldRow>
      <FieldRow label="Align">
        <Select
          value={(config.align as string) || 'center'}
          onValueChange={(v) => setConfig({ ...config, align: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Size">
        <Select
          value={(config.size as string) || 'md'}
          onValueChange={(v) => setConfig({ ...config, size: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Background Color">
        <TextInput
          value={(config.background_color as string) || ''}
          onChange={(v) => setConfig({ ...config, background_color: v })}
          placeholder="#1a1a2e"
        />
      </FieldRow>
      <FieldRow label="Text Color">
        <TextInput
          value={(config.text_color as string) || ''}
          onChange={(v) => setConfig({ ...config, text_color: v })}
          placeholder="#ffffff"
        />
      </FieldRow>
    </div>
  )
}

function ImageForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Image URL">
        <TextInput
          value={(config.src as string) || ''}
          onChange={(v) => setConfig({ ...config, src: v })}
          placeholder="https://..."
          mono
        />
      </FieldRow>
      <FieldRow label="Alt Text">
        <TextInput
          value={(config.alt as string) || ''}
          onChange={(v) => setConfig({ ...config, alt: v })}
        />
      </FieldRow>
      <FieldRow label="Width">
        <TextInput
          value={(config.width as string) || ''}
          onChange={(v) => setConfig({ ...config, width: v })}
          placeholder="100%"
        />
      </FieldRow>
      <FieldRow label="Height">
        <TextInput
          value={(config.height as string) || ''}
          onChange={(v) => setConfig({ ...config, height: v })}
          placeholder="auto"
        />
      </FieldRow>
      <FieldRow label="Object Fit">
        <Select
          value={(config.object_fit as string) || 'cover'}
          onValueChange={(v) => setConfig({ ...config, object_fit: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['cover', 'contain', 'fill', 'none'].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Caption">
        <TextInput
          value={(config.caption as string) || ''}
          onChange={(v) => setConfig({ ...config, caption: v })}
        />
      </FieldRow>
      <FieldRow label="Link">
        <TextInput
          value={(config.link as string) || ''}
          onChange={(v) => setConfig({ ...config, link: v })}
          placeholder="https://..."
          mono
        />
      </FieldRow>
    </div>
  )
}

function MarkdownForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Content">
        <textarea
          value={(config.content as string) || ''}
          onChange={(e) => setConfig({ ...config, content: e.target.value })}
          placeholder="# Heading\n\nMarkdown content..."
          className="w-full h-32 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-brand-500/30"
        />
      </FieldRow>
    </div>
  )
}

function DividerForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Label">
        <TextInput
          value={(config.label as string) || ''}
          onChange={(v) => setConfig({ ...config, label: v })}
          placeholder="optional section title"
        />
      </FieldRow>
      <FieldRow label="Style">
        <Select
          value={(config.style as string) || 'solid'}
          onValueChange={(v) => setConfig({ ...config, style: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Spacing">
        <Select
          value={(config.spacing as string) || 'md'}
          onValueChange={(v) => setConfig({ ...config, spacing: v })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
    </div>
  )
}

function GenericConfigForm({
  config,
  setConfig,
}: {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2.5">
      <FieldRow label="Raw JSON Config">
        <textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              setConfig(JSON.parse(e.target.value))
            } catch {
              /* ignore parse errors while typing */
            }
          }}
          className="w-full h-40 rounded-md border border-border bg-background px-3 py-2 text-[11px] font-mono resize-y focus:outline-none focus:ring-1 focus:ring-brand-500/30"
        />
      </FieldRow>
    </div>
  )
}

// ========== Main component ==========

const CONFIG_FORMS: Partial<
  Record<
    AppBlockType,
    React.FC<{ config: Record<string, unknown>; setConfig: (c: Record<string, unknown>) => void }>
  >
> = {
  stats_card: StatsCardForm,
  data_table: DataTableForm,
  chart: ChartForm,
  form: FormBlockForm,
  detail_view: DetailViewForm,
  list: ListForm,
  hero: HeroForm,
  image: ImageForm,
  markdown: MarkdownForm,
  divider: DividerForm,
}

export function BlockConfigForm({ block, onChange }: BlockConfigFormProps) {
  const setConfig = (newConfig: Record<string, unknown>) => {
    onChange({ ...block, config: newConfig })
  }

  const ConfigForm = CONFIG_FORMS[block.type] || GenericConfigForm

  return (
    <div className="space-y-3">
      {/* Common fields */}
      <FieldRow label="Block ID">
        <TextInput value={block.id} onChange={(v) => onChange({ ...block, id: v })} mono />
      </FieldRow>
      <FieldRow label="Label">
        <TextInput
          value={block.label || ''}
          onChange={(v) => onChange({ ...block, label: v || undefined })}
          placeholder="optional heading"
        />
      </FieldRow>

      {/* Data source — table */}
      {['data_table', 'chart', 'form', 'detail_view', 'list', 'stats_card'].includes(
        block.type
      ) && (
        <FieldRow label="Data Source Table">
          <TextInput
            value={block.data_source?.table || ''}
            onChange={(v) =>
              onChange({
                ...block,
                data_source: v ? { ...block.data_source, table: v } : undefined,
              })
            }
            placeholder="table name"
            mono
          />
        </FieldRow>
      )}

      {/* Grid */}
      <div className="flex gap-2">
        <div className="flex-1">
          <FieldRow label="Col Span">
            <NumberInput
              value={block.grid?.col_span}
              onChange={(v) => onChange({ ...block, grid: { ...block.grid, col_span: v } })}
              placeholder="1-4"
            />
          </FieldRow>
        </div>
        <div className="flex-1">
          <FieldRow label="Row Span">
            <NumberInput
              value={block.grid?.row_span}
              onChange={(v) => onChange({ ...block, grid: { ...block.grid, row_span: v } })}
              placeholder="1"
            />
          </FieldRow>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border pt-2">
        <p className="text-[10px] text-foreground-muted uppercase tracking-wider mb-2">
          {block.type.replace(/_/g, ' ')} Config
        </p>
      </div>

      {/* Type-specific form */}
      <ConfigForm config={block.config} setConfig={setConfig} />
    </div>
  )
}
