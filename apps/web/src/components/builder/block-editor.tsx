'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  BarChart3,
  Table2,
  FileText,
  LayoutDashboard,
  Image,
  List,
  Minus,
  Type,
  Shield,
  Upload,
  Layers,
  Sparkles,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AppSchema, AppPage, AppBlock, AppBlockType } from '@/components/app-renderer/types'
import { BlockConfigForm } from './block-config-form'

// ========== Block type metadata ==========

const BLOCK_TYPE_META: Record<
  AppBlockType,
  { label: string; icon: React.ElementType; description: string }
> = {
  stats_card: { label: 'Stats Card', icon: Sparkles, description: 'KPI metric card' },
  data_table: { label: 'Data Table', icon: Table2, description: 'Interactive data grid' },
  form: { label: 'Form', icon: FileText, description: 'Input form' },
  form_dialog: { label: 'Form Dialog', icon: FileText, description: 'Form in a dialog' },
  chart: { label: 'Chart', icon: BarChart3, description: 'Bar/line/pie chart' },
  detail_view: { label: 'Detail View', icon: LayoutDashboard, description: 'Record detail' },
  markdown: { label: 'Markdown', icon: Type, description: 'Rich text content' },
  image: { label: 'Image', icon: Image, description: 'Static image' },
  hero: { label: 'Hero', icon: Layers, description: 'Hero banner section' },
  tabs_container: { label: 'Tabs Container', icon: LayoutDashboard, description: 'Tabbed layout' },
  list: { label: 'List', icon: List, description: 'Data list view' },
  divider: { label: 'Divider', icon: Minus, description: 'Section divider' },
  auth: { label: 'Auth', icon: Shield, description: 'Login/register' },
  file_upload: { label: 'File Upload', icon: Upload, description: 'File upload widget' },
  custom_code: { label: 'Custom Code', icon: Layers, description: 'Custom JS component in sandbox' },
}

const ALL_BLOCK_TYPES = Object.keys(BLOCK_TYPE_META) as AppBlockType[]

// ========== Props ==========

interface BlockEditorProps {
  schema: AppSchema
  onChange: (schema: AppSchema) => void
  className?: string
}

export function BlockEditor({ schema, onChange, className }: BlockEditorProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>(schema.pages[0]?.id || '')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragCounterRef = useRef(0)

  const currentPage = schema.pages.find((p) => p.id === selectedPageId) || null
  const blocks = currentPage?.blocks || []
  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) || null
    : null

  // ========== Helpers ==========

  const updatePage = useCallback(
    (pageId: string, updater: (page: AppPage) => AppPage) => {
      onChange({
        ...schema,
        pages: schema.pages.map((p) => (p.id === pageId ? updater(p) : p)),
      })
    },
    [schema, onChange]
  )

  const updateBlocks = useCallback(
    (newBlocks: AppBlock[]) => {
      if (!selectedPageId) return
      updatePage(selectedPageId, (page) => ({ ...page, blocks: newBlocks }))
    },
    [selectedPageId, updatePage]
  )

  // ========== Add block ==========

  const addBlock = (type: AppBlockType) => {
    const id = `${type}_${Date.now()}`
    const newBlock: AppBlock = {
      id,
      type,
      config: getDefaultConfig(type),
    }
    updateBlocks([...blocks, newBlock])
    setSelectedBlockId(id)
    setAddMenuOpen(false)
  }

  // ========== Delete block ==========

  const deleteBlock = (blockId: string) => {
    updateBlocks(blocks.filter((b) => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  // ========== Duplicate block ==========

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId)
    if (!block) return
    const newId = `${block.type}_${Date.now()}`
    const idx = blocks.indexOf(block)
    const copy: AppBlock = { ...block, id: newId, config: { ...block.config } }
    const next = [...blocks]
    next.splice(idx + 1, 0, copy)
    updateBlocks(next)
    setSelectedBlockId(newId)
  }

  // ========== Update block ==========

  const updateBlock = (updated: AppBlock) => {
    updateBlocks(blocks.map((b) => (b.id === updated.id ? updated : b)))
  }

  // ========== Drag-and-drop ==========

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
    // Make the drag ghost semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDragIdx(null)
    setDragOverIdx(null)
    dragCounterRef.current = 0
  }

  const handleDragEnter = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    dragCounterRef.current++
    setDragOverIdx(idx)
  }

  const handleDragLeave = () => {
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      setDragOverIdx(null)
      dragCounterRef.current = 0
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setDragOverIdx(null)

    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      return
    }

    const next = [...blocks]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx > dragIdx ? targetIdx - 1 : targetIdx, 0, moved)
    updateBlocks(next)
    setDragIdx(null)
  }

  // ========== Render ==========

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Page selector */}
      <div className="px-3 py-2 border-b border-border">
        <label className="text-[10px] text-foreground-muted uppercase tracking-wider">Page</label>
        <Select
          value={selectedPageId}
          onValueChange={(v) => {
            setSelectedPageId(v)
            setSelectedBlockId(null)
          }}
        >
          <SelectTrigger className="h-8 mt-0.5">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            {schema.pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.title || page.id} ({page.blocks?.length || 0} blocks)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Block list + config split */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Block list header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-medium text-foreground">
            Blocks {blocks.length > 0 && `(${blocks.length})`}
          </span>
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5"
              onClick={() => setAddMenuOpen(!addMenuOpen)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-52 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface-100 shadow-lg p-1">
                  {ALL_BLOCK_TYPES.map((type) => {
                    const meta = BLOCK_TYPE_META[type]
                    const Icon = meta.icon
                    return (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-surface-200 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-foreground">
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-foreground-muted truncate">
                            {meta.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Block list */}
        <div className="overflow-y-auto" style={{ maxHeight: selectedBlock ? '45%' : '100%' }}>
          {!currentPage ? (
            <div className="p-4 text-center text-[11px] text-foreground-muted">
              No pages in schema. Use the AI Agent to generate a UI schema first.
            </div>
          ) : blocks.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-foreground-muted">
              No blocks on this page. Click + to add one.
            </div>
          ) : (
            blocks.map((block, idx) => {
              const meta = BLOCK_TYPE_META[block.type] || {
                label: block.type,
                icon: LayoutDashboard,
              }
              const Icon = meta.icon
              const isSelected = selectedBlockId === block.id
              const isDragOver = dragOverIdx === idx && dragIdx !== idx

              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 border-b border-border cursor-pointer transition-all',
                    isSelected
                      ? 'bg-brand-500/10 border-l-2 border-l-brand-500'
                      : 'hover:bg-surface-200/30',
                    isDragOver && 'border-t-2 border-t-brand-500',
                    dragIdx === idx && 'opacity-50'
                  )}
                >
                  <GripVertical className="w-3 h-3 text-foreground-muted/40 shrink-0 cursor-grab active:cursor-grabbing" />
                  <Icon className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-foreground truncate">
                      {block.label || meta.label}
                    </div>
                    <div className="text-[10px] text-foreground-muted truncate">{block.id}</div>
                  </div>
                  {block.grid?.col_span && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-surface-200 text-foreground-muted shrink-0">
                      {block.grid.col_span}col
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-foreground-muted hover:text-foreground shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateBlock(block.id)
                    }}
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-foreground-muted hover:text-destructive shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBlock(block.id)
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )
            })
          )}
        </div>

        {/* Config form for selected block */}
        {selectedBlock && (
          <div className="border-t border-border flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-surface-200/30">
              <div className="flex items-center gap-1.5">
                {selectedBlockId && (
                  <button
                    onClick={() => setSelectedBlockId(null)}
                    className="text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[11px] font-medium text-foreground">
                  Edit: {BLOCK_TYPE_META[selectedBlock.type]?.label || selectedBlock.type}
                </span>
              </div>
              <span className="text-[10px] text-foreground-muted font-mono">
                {selectedBlock.id}
              </span>
            </div>
            <div className="p-3">
              <BlockConfigForm block={selectedBlock} onChange={updateBlock} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ========== Default configs per block type ==========

function getDefaultConfig(type: AppBlockType): Record<string, unknown> {
  switch (type) {
    case 'stats_card':
      return { label: 'Metric', value_key: 'count', format: 'number' }
    case 'data_table':
      return {
        table_name: '',
        columns: [],
        actions: ['view', 'edit', 'delete'],
        pagination: true,
        page_size: 25,
      }
    case 'form':
      return {
        title: 'New Form',
        fields: [],
        table_name: '',
        mode: 'create',
        submit_label: 'Submit',
      }
    case 'form_dialog':
      return {
        title: 'Form Dialog',
        fields: [],
        table_name: '',
        mode: 'create',
        submit_label: 'Submit',
      }
    case 'chart':
      return { chart_type: 'bar', x_key: '', y_key: '', title: 'Chart' }
    case 'detail_view':
      return { fields: [], table_name: '' }
    case 'markdown':
      return { content: '# Heading\n\nContent here...' }
    case 'image':
      return { src: '', alt: '' }
    case 'hero':
      return { title: 'Welcome', subtitle: '', align: 'center', size: 'md' }
    case 'tabs_container':
      return { tabs: [{ id: 'tab1', label: 'Tab 1', blocks: [] }] }
    case 'list':
      return { table_name: '', title_key: 'name', layout: 'list' }
    case 'divider':
      return { style: 'solid', spacing: 'md' }
    case 'auth':
      return { mode: 'login_register', title: 'Sign In' }
    case 'file_upload':
      return { label: 'Upload File', max_size_mb: 10 }
    default:
      return {}
  }
}
