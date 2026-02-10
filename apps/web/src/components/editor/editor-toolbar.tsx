'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import {
  Undo2,
  Redo2,
  Save,
  Play,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  ArrowRight,
  ArrowDown,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Copy,
  Trash2,
  Keyboard,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useReactFlow } from '@xyflow/react'
import { useWorkflowStore } from '@/stores/useWorkflowStore'
import { useAutoLayout } from '@/hooks/useAutoLayout'
import { KeyboardShortcutsDialog, useKeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { cn } from '@/lib/utils'

/**
 * Editor Top Toolbar - Manus Style
 *
 * The editor toolbar always uses a dark theme to maintain a consistent visual experience
 */

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface EditorToolbarProps {
  workflowName?: string
  workflowVersion?: number
  onSave?: () => void
  onRun?: () => void
  onStop?: () => void
  // Status
  saveStatus?: SaveStatus
  lastSavedAt?: Date | null
  isOnline?: boolean
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  executionStatus?: 'idle' | 'running' | 'completed' | 'failed'
}

// Editor dark style
const editorStyles = {
  bg: 'bg-surface-100/95 backdrop-blur-sm',
  border: 'border-border/70',
  buttonHover: 'hover:bg-surface-200/70',
  textPrimary: 'text-foreground',
  textSecondary: 'text-foreground-light',
  textMuted: 'text-foreground-muted',
  divider: 'bg-border/70',
}

export function EditorToolbar({
  workflowName = 'Untitled Workflow',
  workflowVersion,
  onSave,
  onRun,
  onStop,
  saveStatus = 'saved',
  lastSavedAt,
  isOnline = true,
  collaborators = [],
  executionStatus = 'idle',
}: EditorToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { applyHorizontalLayout, applyVerticalLayout } = useAutoLayout()
  const shortcutsDialog = useKeyboardShortcutsDialog()
  const {
    isDirty,
    isExecuting,
    canUndo,
    canRedo,
    undo,
    redo,
    nodes,
    edges,
    selectedNodeIds,
    removeNodes,
  } = useWorkflowStore()

  const saveStatusConfig = {
    saved: { label: 'Saved', dot: 'var(--color-brand-500)', textClass: 'text-foreground-light' },
    saving: { label: 'Saving', dot: 'var(--color-brand-500)', textClass: 'text-foreground-light' },
    unsaved: { label: 'Unsaved', dot: 'var(--color-warning)', textClass: 'text-warning' },
    error: {
      label: 'Failed to Save',
      dot: 'var(--color-destructive)',
      textClass: 'text-destructive',
    },
  } as const
  const saveMeta = saveStatusConfig[saveStatus]

  // Delete selected node
  const handleDelete = useCallback(() => {
    if (selectedNodeIds.length > 0) {
      removeNodes(selectedNodeIds)
    }
  }, [selectedNodeIds, removeNodes])

  // Export workflow
  const handleExport = useCallback(() => {
    const data = {
      version: '1.0',
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [nodes, edges, workflowName])

  // Optimized tool button component
  const ToolButton = ({
    icon: Icon,
    label,
    onClick,
    disabled,
    shortcut,
    variant = 'default',
  }: {
    icon: React.ElementType
    label: string
    onClick?: () => void
    disabled?: boolean
    shortcut?: string
    variant?: 'default' | 'primary' | 'danger'
  }) => (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md',
              'transition-all duration-150',
              'disabled:opacity-30 disabled:pointer-events-none',
              // Default style
              variant === 'default' && [
                'text-foreground-muted',
                'hover:text-foreground hover:bg-surface-200',
                'active:scale-95',
              ],
              // Primary style
              variant === 'primary' && [
                'text-brand-500',
                'hover:text-brand-500 hover:bg-brand-200/40',
                'active:scale-95',
              ],
              // Danger style
              variant === 'danger' && [
                'text-destructive-400',
                'hover:text-destructive hover:bg-destructive-200/60',
                'active:scale-95',
              ]
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className={cn(
            'bg-surface-100/95 border-border/70',
            'shadow-lg shadow-black/20',
            'px-3 py-2'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">{label}</span>
            {shortcut && (
              <kbd
                className={cn(
                  'px-2 py-0.5 rounded-md',
                  'bg-surface-200/80 border border-border/70',
                  'text-foreground-muted text-[11px] font-mono'
                )}
              >
                {shortcut}
              </kbd>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <header
      className={cn(
        'h-12 flex items-center justify-between px-4 border-b',
        editorStyles.bg,
        editorStyles.border
      )}
    >
      {/* Left side: Back + Title + Status */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/workflows">
          <button
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md transition-colors',
              editorStyles.textSecondary,
              `hover:${editorStyles.textPrimary}`,
              editorStyles.buttonHover
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
            <Link href="/dashboard/workflows" className="hover:text-foreground transition-colors">
              Workflow
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{workflowName}</span>
          </div>
          {workflowVersion !== undefined && (
            <Badge
              variant="secondary"
              size="xs"
              className="border-border/70 bg-surface-200/70 text-foreground-muted"
            >
              v{workflowVersion}
            </Badge>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-200/70 px-2 py-1 text-[11px]',
              saveMeta.textClass
            )}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: saveMeta.dot }}
              />
            )}
            <span>{saveMeta.label}</span>
            {lastSavedAt && saveStatus === 'saved' && (
              <span className="hidden xl:inline text-foreground-muted">
                {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-200/70 px-2 py-1 text-[11px] text-foreground-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isOnline
                  ? 'var(--color-brand-500)'
                  : 'var(--color-foreground-muted)',
              }}
            />
            {isOnline ? 'Connected' : 'Offline'}
          </div>

          {collaborators.length > 0 && (
            <Badge
              variant="secondary"
              size="xs"
              className="border-border/70 bg-surface-200/70 text-foreground-muted"
            >
              <Users className="h-3 w-3" />
              {collaborators.length} online
            </Badge>
          )}

          {isDirty && (
            <Badge
              variant="secondary"
              size="xs"
              className="border-warning/30 bg-warning-200/60 text-warning"
            >
              Unsaved
            </Badge>
          )}

          {(isExecuting || executionStatus === 'running') && (
            <Badge size="xs" className="border border-brand-400/30 bg-brand-200/70 text-brand-500">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Run
            </Badge>
          )}
        </div>
      </div>

      {/* Center: Tool Buttons */}
      <div className="flex items-center gap-0.5">
        {/* Undo/Redo */}
        <ToolButton icon={Undo2} label="Undo" shortcut="⌘Z" onClick={undo} disabled={!canUndo()} />
        <ToolButton icon={Redo2} label="Redo" shortcut="⌘⇧Z" onClick={redo} disabled={!canRedo()} />

        <div className={cn('w-px h-5 mx-2', editorStyles.divider)} />

        {/* Zoom Controls */}
        <ToolButton icon={ZoomOut} label="Zoom Out" shortcut="⌘-" onClick={() => zoomOut()} />
        <ToolButton icon={ZoomIn} label="Zoom In" shortcut="⌘+" onClick={() => zoomIn()} />
        <ToolButton
          icon={Maximize}
          label="Fit to Canvas"
          shortcut="⌘0"
          onClick={() => fitView({ padding: 0.1, duration: 300 })}
        />

        <div className={cn('w-px h-5 mx-2', editorStyles.divider)} />

        {/* Layout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-md transition-colors',
                editorStyles.textSecondary,
                `hover:${editorStyles.textPrimary}`,
                editorStyles.buttonHover
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="bg-surface-100/95 border-border/70 shadow-lg shadow-black/20"
          >
            <DropdownMenuItem
              onClick={applyHorizontalLayout}
              className="text-foreground hover:text-foreground hover:bg-surface-200/70"
            >
              <ArrowRight className="h-4 w-4" />
              Horizontal Layout (Left → Right)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={applyVerticalLayout}
              className="text-foreground hover:text-foreground hover:bg-surface-200/70"
            >
              <ArrowDown className="h-4 w-4" />
              Vertical Layout (Top → Down)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <ToolButton
          icon={Trash2}
          label="Delete Selected"
          shortcut="Del"
          onClick={handleDelete}
          disabled={selectedNodeIds.length === 0}
          variant="danger"
        />

        <div className={cn('w-px h-5 mx-2', editorStyles.divider)} />

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-md transition-colors',
                editorStyles.textSecondary,
                `hover:${editorStyles.textPrimary}`,
                editorStyles.buttonHover
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="bg-surface-100/95 border-border/70 shadow-lg shadow-black/20"
          >
            <DropdownMenuItem
              onClick={handleExport}
              className="text-foreground hover:text-foreground hover:bg-surface-200/70"
            >
              <Download className="h-4 w-4" />
              Export Workflow
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:text-foreground hover:bg-surface-200/70">
              <Upload className="h-4 w-4" />
              Import Workflow
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/70" />
            <DropdownMenuItem className="text-foreground hover:text-foreground hover:bg-surface-200/70">
              <Copy className="h-4 w-4" />
              Copy Workflow
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/70" />
            <DropdownMenuItem className="text-foreground hover:text-foreground hover:bg-surface-200/70">
              <Settings className="h-4 w-4" />
              Workflow Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/70" />
            <DropdownMenuItem
              onClick={shortcutsDialog.open}
              className="text-foreground hover:text-foreground hover:bg-surface-200/70"
            >
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
              <span className="ml-auto text-xs text-foreground-muted">?</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8',
            editorStyles.textSecondary,
            `hover:${editorStyles.textPrimary}`,
            editorStyles.buttonHover
          )}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          className="h-8 disabled:opacity-40"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saveStatus === 'saving' ? 'Saving' : 'Save'}
        </Button>
        {isExecuting || executionStatus === 'running' ? (
          <Button variant="destructive-fill" size="sm" onClick={onStop} className="h-8">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            variant={executionStatus === 'failed' ? 'destructive-fill' : 'default'}
            size="sm"
            onClick={onRun}
            disabled={nodes.length === 0}
            className="h-8 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsDialog.isOpen}
        onOpenChange={shortcutsDialog.setIsOpen}
      />
    </header>
  )
}
