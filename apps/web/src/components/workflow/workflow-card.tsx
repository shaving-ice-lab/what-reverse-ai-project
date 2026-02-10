'use client'

/**
 * Workflow Card Component - Enhanced UI/UX v2
 *
 * Features:
 * - Support Light/Dark Theme
 * - 3D Hover Transform and Light Effect
 * - Smooth Interactive Animation
 * - Tag Display and Interaction
 * - Quick Action Buttons
 * - Run Status Dynamic Indicator
 * - Performance Optimized Animation
 */

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  MoreHorizontal,
  Play,
  Copy,
  Trash2,
  Archive,
  Edit,
  Download,
  Layers,
  Plus,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Star,
  TrendingUp,
  Tag,
  GripVertical,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { WorkflowMeta } from '@/types/workflow-api'

interface WorkflowCardProps {
  workflow: WorkflowMeta
  onRun?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onExport?: () => void
  style?: React.CSSProperties
  className?: string
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

// Status Badge Config - Enhanced Dynamic Effect
const statusConfig = {
  draft: {
    label: 'Draft',
    className:
      'bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10',
    icon: Clock,
    dotColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
  },
  published: {
    label: 'Published',
    className:
      'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
  },
  archived: {
    label: 'Archive',
    className:
      'bg-gradient-to-r from-muted/10 to-muted/5 border border-border/60 text-muted-foreground/80 shadow-sm',
    icon: Archive,
    dotColor: 'bg-muted-foreground',
    glowColor: '',
  },
}

export function WorkflowCard({
  workflow,
  onRun,
  onDuplicate,
  onDelete,
  onArchive,
  onExport,
  style,
  className,
  selected,
  onSelect,
}: WorkflowCardProps) {
  const status = statusConfig[workflow.status]
  const StatusIcon = status.icon
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate Node Count (Mock)
  const nodeCount = Math.floor(Math.random() * 10) + 3

  // Fetch Tags (if available)
  const tags = workflow.tags || []
  const displayTags = tags.slice(0, 2)
  const remainingTags = tags.length - 2

  // Mouse Track - Used for 3D Transform and Light Effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Set Mouse Variable - Used for Light Effect
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)

    // Calculate 3D Tilt Effect (visual)
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 25
    const rotateY = (centerX - x) / 25

    cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`)
    cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`)
  }, [])

  // Mouse Leave - Reset
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (cardRef.current) {
      cardRef.current.style.setProperty('--rotate-x', '0deg')
      cardRef.current.style.setProperty('--rotate-y', '0deg')
    }
  }, [])

  // Toggle Favorite
  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsFavorited(!isFavorited)
    },
    [isFavorited]
  )

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative bg-card border-2 rounded-3xl p-6 overflow-hidden',
          'cursor-pointer transition-all duration-500 ease-out',
          'hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-3',
          // 3D Transform Support
          'transform-gpu perspective-1000',
          '[transform:rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))]',
          selected
            ? 'border-primary ring-2 ring-primary/25 bg-primary/8 shadow-xl shadow-primary/15'
            : 'border-border/60 hover:border-primary/60',
          className
        )}
        style={{
          ...style,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Edge Gradient Light Effect on Hover */}
        <div
          className="absolute inset-[-1px] rounded-3xl bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '2px',
          }}
        />

        {/* Mouse Follow Light Effect - Enhanced */}
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none',
            'bg-[radial-gradient(320px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(62,207,142,0.18),transparent)]'
          )}
        />
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-800 delay-100 pointer-events-none',
            'bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(62,207,142,0.06),transparent)]'
          )}
        />

        {/* Decoration Light Point on Hover */}
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/60 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150" />
        <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200" />

        {/* Top Gradient - Dynamic Flow Effect Enhanced */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1 overflow-hidden',
            'opacity-0 group-hover:opacity-100 transition-all duration-600'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent transform scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
        </div>

        {/* Status Indicator - Based on Status, not Color */}
        <div
          className={cn(
            'absolute top-0 left-0 w-1.5 h-full rounded-r-full transition-all duration-500',
            workflow.status === 'published' &&
              'bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500/50',
            workflow.status === 'draft' &&
              'bg-gradient-to-b from-amber-500 via-amber-400 to-amber-500/50',
            workflow.status === 'archived' &&
              'bg-gradient-to-b from-muted-foreground via-muted-foreground/80 to-muted-foreground/50',
            'opacity-0 group-hover:opacity-100'
          )}
        />

        {/* Decoration - Multiple Gradients Enhanced */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-primary/10 via-primary/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-800 pointer-events-none rounded-bl-[3rem]" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-800 delay-150 pointer-events-none rounded-tr-[2rem]" />

        {/* Favorite Button - Display on Hover */}
        <button
          onClick={toggleFavorite}
          className={cn(
            'absolute top-3 right-3 z-20 p-1.5 rounded-lg',
            'transition-all duration-300 ease-out',
            isFavorited
              ? 'opacity-100 bg-amber-500/10 text-amber-500'
              : 'opacity-0 group-hover:opacity-100 bg-muted/80 text-foreground-light hover:text-amber-500 hover:bg-amber-500/10',
            'translate-x-2 group-hover:translate-x-0'
          )}
          title={isFavorited ? 'Unfavorite' : 'Add to favorites'}
        >
          <Star
            className={cn(
              'w-4 h-4 transition-transform duration-300',
              isFavorited && 'fill-amber-500 scale-110'
            )}
          />
        </button>

        {/* Drag & Drop Handle - Display on Hover */}
        <div
          className={cn(
            'absolute top-1/2 -left-0.5 -translate-y-1/2 p-1',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'cursor-grab active:cursor-grabbing',
            '-translate-x-3 group-hover:translate-x-0'
          )}
          title="Drag & drop to sort"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
        </div>

        {/* Header: Thumbnail/Preview + Quick Actions + More Button */}
        <div className="relative flex items-start justify-between mb-5">
          <Link
            href={`/editor/${workflow.id}`}
            className={cn(
              'relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden',
              'bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5',
              'border-2 border-primary/30',
              'transition-all duration-400 ease-out',
              'group-hover:shadow-2xl group-hover:shadow-primary/40 group-hover:scale-110',
              'group-hover:rotate-3 group-hover:border-primary/60'
            )}
          >
            {/* Thumbnail Background Grid */}
            <div
              className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(62,207,142,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(62,207,142,0.1) 1px, transparent 1px)`,
                backgroundSize: '8px 8px',
              }}
            />

            {/* Internal Halo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Decoration Nodes */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-primary/60" />
            <div className="absolute top-2 right-3 w-1 h-1 rounded-full bg-primary/40" />
            <div className="absolute bottom-3 left-3 w-1 h-1 rounded-full bg-primary/40" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-primary/60" />

            {/* Connection Lines */}
            <div className="absolute top-2 left-3 w-5 h-px bg-gradient-to-r from-primary/40 to-transparent" />
            <div className="absolute bottom-3 right-3 w-4 h-px bg-gradient-to-l from-primary/40 to-transparent" />

            <Layers className="relative w-6 h-6 text-primary transition-all duration-400 group-hover:scale-125 group-hover:drop-shadow-[0_0_12px_rgba(62,207,142,0.6)]" />

            {/* Pulse Effect - Published Status */}
            {workflow.status === 'published' && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                <span className="relative block w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-card shadow-lg shadow-emerald-500/40 flex items-center justify-center" />
                <Sparkles className="absolute inset-0 w-2.5 h-2.5 m-auto text-white" />
              </span>
            )}
            {/* Draft Status Indicator */}
            {workflow.status === 'draft' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-card shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              </span>
            )}
            {/* Archive Status Indicator */}
            {workflow.status === 'archived' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-muted-foreground/80 to-muted-foreground border-2 border-card shadow-md flex items-center justify-center">
                <Archive className="w-2 h-2 text-white" />
              </span>
            )}
          </Link>

          <div className="flex items-center gap-1">
            {/* Quick Actions Button - Display on Hover */}
            {onRun && workflow.status === 'published' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200',
                      'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10',
                      'translate-x-2 group-hover:translate-x-0'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRun()
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Run now</TooltipContent>
              </Tooltip>
            )}

            {onDuplicate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200',
                      'text-foreground-light hover:text-foreground hover:bg-surface-200',
                      'translate-x-2 group-hover:translate-x-0 delay-75'
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate()
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300',
                    'text-foreground-light hover:text-foreground',
                    'hover:bg-gradient-to-br hover:from-primary/15 hover:to-primary/5',
                    'hover:shadow-lg hover:shadow-primary/10 hover:scale-105',
                    'translate-x-2 group-hover:translate-x-0 delay-100'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={cn(
                  'w-56 p-2.5 rounded-2xl',
                  'bg-card/98 backdrop-blur-2xl border-2 border-border/50',
                  'shadow-2xl shadow-black/25'
                )}
              >
                {/* Top Decoration Line */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Main Actions */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/editor/${workflow.id}`}
                    className={cn(
                      'flex items-center cursor-pointer rounded-xl py-3 px-3.5',
                      'hover:bg-gradient-to-r hover:from-primary/18 hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/25 flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-primary/20 transition-all duration-300">
                      <Edit className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Edit workflow</span>
                      <span className="text-[10px] text-muted-foreground/70">Open to edit</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                {onRun && workflow.status === 'published' && (
                  <DropdownMenuItem
                    onClick={onRun}
                    className={cn(
                      'cursor-pointer rounded-xl py-3 px-3.5',
                      'hover:bg-gradient-to-r hover:from-emerald-500/18 hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-emerald-500/20 transition-all duration-300">
                      <Play className="h-4.5 w-4.5 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Run now</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        Execute this workflow
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-2.5 bg-border/40" />

                {/* Secondary Action */}
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={onDuplicate}
                    className={cn(
                      'cursor-pointer rounded-xl py-3 px-3.5',
                      'hover:bg-gradient-to-r hover:from-blue-500/18 hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/25 flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:rotate-12 group-hover/item:shadow-lg group-hover/item:shadow-blue-500/20 transition-all duration-300">
                      <Copy className="h-4.5 w-4.5 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Copy</span>
                      <span className="text-[10px] text-muted-foreground/70">Create a copy</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem
                    onClick={onExport}
                    className={cn(
                      'cursor-pointer rounded-xl py-3 px-3.5',
                      'hover:bg-gradient-to-r hover:from-amber-500/18 hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/25 flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:translate-y-0.5 group-hover/item:shadow-lg group-hover/item:shadow-amber-500/20 transition-all duration-300">
                      <Download className="h-4.5 w-4.5 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Export</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        Download JSON File
                      </span>
                    </div>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-2.5 bg-border/40" />

                {/* Danger Action */}
                {onArchive && workflow.status !== 'archived' && (
                  <DropdownMenuItem
                    onClick={onArchive}
                    className={cn(
                      'cursor-pointer rounded-xl py-3 px-3.5',
                      'hover:bg-gradient-to-r hover:from-muted hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:shadow-lg group-hover/item:shadow-muted/20 transition-all duration-300">
                      <Archive className="h-4.5 w-4.5 text-foreground-light" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Archive</span>
                      <span className="text-[10px] text-muted-foreground/70">Archive</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className={cn(
                      'cursor-pointer rounded-xl py-3 px-3.5',
                      'text-destructive hover:text-destructive',
                      'hover:bg-gradient-to-r hover:from-destructive/18 hover:to-transparent',
                      'transition-all duration-300 group/item hover:scale-[1.01]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/25 flex items-center justify-center mr-3.5 group-hover/item:scale-110 group-hover/item:rotate-6 group-hover/item:shadow-lg group-hover/item:shadow-destructive/20 transition-all duration-300">
                      <Trash2 className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">Delete</span>
                      <span className="text-[10px] text-destructive/70">Permanently delete</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        {/* Title Region - Enhanced */}
        <Link href={`/editor/${workflow.id}`} className="block group/title mb-2">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5 group-hover/title:text-primary transition-all duration-400">
            <span className="relative">
              {workflow.name}
              {/* Title Underline Animation - Enhanced */}
              <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full group-hover/title:w-full transition-all duration-400 ease-out shadow-sm shadow-primary/30" />
            </span>
            <div className="flex items-center gap-1.5 opacity-0 -translate-x-3 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-400 ease-out">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </h3>
        </Link>

        {/* Description - Enhanced */}
        {workflow.description ? (
          <p className="text-sm text-foreground-light line-clamp-2 mb-4 leading-relaxed group-hover:text-foreground/85 transition-colors duration-400 pl-0.5">
            {workflow.description}
          </p>
        ) : (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-muted/30 border border-dashed border-border/50">
            <div className="w-5 h-5 rounded-lg bg-muted/60 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground/50 italic">No description</p>
          </div>
        )}

        {/* Tags Showcase - Enhanced v3 */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            {displayTags.map((tag, index) => (
              <span
                key={index}
                className={cn(
                  'group/tag relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold',
                  'bg-gradient-to-r from-primary/15 via-primary/8 to-primary/3 text-foreground/85',
                  'border border-primary/25',
                  'transition-all duration-400 hover:scale-105 hover:border-primary/60 hover:text-foreground',
                  'hover:shadow-lg hover:shadow-primary/15',
                  'cursor-pointer overflow-hidden'
                )}
              >
                {/* Background Light Effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover/tag:opacity-100 transition-opacity duration-400" />

                <div className="relative w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center group-hover/tag:bg-primary/30 transition-colors">
                  <Tag className="w-3 h-3 text-primary group-hover/tag:scale-110 transition-transform" />
                </div>
                <span className="relative">
                  {tag}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gradient-to-r from-primary to-primary/50 rounded-full group-hover/tag:w-full transition-all duration-400" />
                </span>
              </span>
            ))}
            {remainingTags > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs text-foreground-light font-semibold bg-muted/60 border border-border/50 cursor-pointer hover:bg-surface-200 hover:border-border/80 hover:text-foreground transition-all duration-300 hover:scale-105 hover:shadow-md">
                    <div className="w-5 h-5 rounded-lg bg-surface-200 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span>{remainingTags} more</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-xs max-w-56 p-3 rounded-xl bg-card/95 backdrop-blur-sm border-border/60"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {tags.slice(2).map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-muted/80 text-foreground-light border border-border/30 text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Footer Info - Enhanced v4 */}
        <div className="flex items-center justify-between pt-5 border-t border-border/30">
          <div className="flex items-center gap-2.5 text-xs text-foreground-light">
            {/* Node Count - Enhanced v2 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="group/stat relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/12 to-amber-500/5 hover:from-amber-500/25 hover:to-amber-500/12 border border-amber-500/25 hover:border-amber-500/50 transition-all duration-400 cursor-default hover:scale-105 hover:shadow-xl hover:shadow-amber-500/15 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-400" />
                  <div className="relative w-6 h-6 rounded-lg bg-amber-500/25 flex items-center justify-center group-hover/stat:scale-110 group-hover/stat:rotate-6 transition-all duration-300">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="relative font-black text-amber-600 dark:text-amber-400">
                    {nodeCount}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-xs px-3 py-2 rounded-xl bg-card/98 backdrop-blur-xl border-border/60 shadow-xl"
              >
                <span className="flex items-center gap-2.5 font-semibold">
                  <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-amber-500" />
                  </div>
                  {nodeCount} Node
                </span>
              </TooltipContent>
            </Tooltip>

            {/* Run Count - Enhanced v2 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="group/stat relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-500/12 to-blue-500/5 hover:from-blue-500/25 hover:to-blue-500/12 border border-blue-500/25 hover:border-blue-500/50 transition-all duration-400 cursor-default hover:scale-105 hover:shadow-xl hover:shadow-blue-500/15 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-400" />
                  <div className="relative w-6 h-6 rounded-lg bg-blue-500/25 flex items-center justify-center group-hover/stat:scale-110 group-hover/stat:-rotate-6 transition-all duration-300">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="relative font-black text-blue-600 dark:text-blue-400">
                    {(workflow.runCount || 0).toLocaleString()}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-xs px-3 py-2 rounded-xl bg-card/98 backdrop-blur-xl border-border/60 shadow-xl"
              >
                <span className="flex items-center gap-2.5 font-semibold">
                  <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-blue-500" />
                  </div>
                  Run {(workflow.runCount || 0).toLocaleString()} times
                </span>
              </TooltipContent>
            </Tooltip>

            {/* Updated At - Enhanced v2 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden sm:flex group/stat items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 hover:from-muted/80 hover:to-muted/50 border border-border/40 hover:border-border/70 transition-all duration-400 cursor-default hover:scale-105 hover:shadow-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-400" />
                  <div className="relative w-6 h-6 rounded-lg bg-surface-200 flex items-center justify-center group-hover/stat:scale-110 transition-all duration-300">
                    <Clock className="w-3.5 h-3.5 text-foreground-light group-hover/stat:text-foreground transition-colors" />
                  </div>
                  <span className="relative font-bold text-foreground-light group-hover/stat:text-foreground transition-colors">
                    {formatDistanceToNow(new Date(workflow.updatedAt), {
                      addSuffix: false,
                      locale: zhCN,
                    })}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="text-xs px-3 py-2 rounded-xl bg-card/98 backdrop-blur-xl border-border/60 shadow-xl"
              >
                <span className="flex items-center gap-2.5 font-semibold">
                  <div className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </div>
                  Updated at {new Date(workflow.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Status Badge - Enhanced v3 */}
          <span
            className={cn(
              'relative flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold',
              'transition-all duration-400 group-hover:scale-105 group-hover:shadow-lg',
              status.className,
              status.glowColor && `group-hover:${status.glowColor}`
            )}
          >
            {/* Status Indicator - Enhanced */}
            <span
              className={cn(
                'relative w-2.5 h-2.5 rounded-full',
                status.dotColor,
                workflow.status === 'published' && 'animate-pulse'
              )}
            >
              {workflow.status === 'published' && (
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
              )}
            </span>
            <StatusIcon
              className={cn(
                'w-4 h-4 transition-all duration-400',
                workflow.status === 'published' && 'group-hover:rotate-12 group-hover:scale-115'
              )}
            />
            {status.label}
            {/* Published Status Dynamic Light Effect */}
            {workflow.status === 'published' && (
              <>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute -inset-px rounded-xl border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
          </span>
        </div>

        {/* Select Status Checkbox */}
        {onSelect && (
          <div
            className={cn(
              'absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center',
              'transition-all duration-200 cursor-pointer',
              selected
                ? 'bg-primary border-primary'
                : 'border-border bg-background opacity-0 group-hover:opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(!selected)
            }}
          >
            {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Create New Workflow Card - Enhanced UI/UX
 */
interface CreateWorkflowCardProps {
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export function CreateWorkflowCard({ onClick, style, className }: CreateWorkflowCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative border-2 border-dashed border-border/40 rounded-3xl p-8',
        'flex flex-col items-center justify-center min-h-[280px]',
        'cursor-pointer transition-all duration-600 ease-out overflow-hidden',
        'hover:border-primary/80 hover:border-solid',
        'hover:bg-gradient-to-br hover:from-primary/12 hover:via-primary/6 hover:to-transparent',
        'hover:shadow-2xl hover:shadow-primary/25',
        'hover:-translate-y-3 hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
        'active:scale-[0.98]',
        className
      )}
      style={style}
    >
      {/* Background Animation Grid - Enhanced */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-800">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(62,207,142,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(62,207,142,0.05)_1px,transparent_1px)] bg-[size:28px_28px]" />
        {/* Dynamic Scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/8 to-transparent h-[200%] -translate-y-full animate-[scan_3s_ease-in-out_infinite]" />
      </div>

      {/* Multiple Light Effects - Enhanced */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/30 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-all duration-800 group-hover:scale-110" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-all duration-800 delay-150 group-hover:scale-110" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/8 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      {/* Icon - 3D Effect Enhanced */}
      <div
        className={cn(
          'relative w-20 h-20 rounded-3xl flex items-center justify-center mb-6',
          'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10',
          'border-2 border-primary/50',
          'transition-all duration-600 ease-out',
          'group-hover:scale-120 group-hover:shadow-2xl group-hover:shadow-primary/50',
          'group-hover:rotate-6 group-hover:border-primary/70',
          // Internal Highlight
          'before:absolute before:inset-0 before:rounded-3xl',
          'before:bg-gradient-to-br before:from-white/25 before:to-transparent',
          'before:opacity-0 before:group-hover:opacity-100 before:transition-opacity before:duration-600'
        )}
      >
        <Plus
          className={cn(
            'w-9 h-9 text-primary transition-all duration-600 ease-out',
            'group-hover:rotate-90 group-hover:scale-115',
            'group-hover:drop-shadow-[0_0_16px_rgba(62,207,142,0.7)]'
          )}
        />

        {/* Multiple Pulse - Enhanced */}
        <div className="absolute inset-[-4px] rounded-[1.75rem] border-2 border-primary/40 scale-100 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-800" />
        <div className="absolute inset-[-8px] rounded-[2rem] border border-primary/25 scale-100 opacity-0 group-hover:scale-140 group-hover:opacity-100 transition-all duration-1000 delay-100" />
        <div className="absolute inset-[-12px] rounded-[2.25rem] border border-dashed border-primary/15 scale-100 opacity-0 group-hover:scale-155 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-[1.5s] delay-200" />

        {/* Blink Decoration - Multiple */}
        <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all duration-400 delay-200 group-hover:animate-pulse" />
        <Star
          className="absolute -bottom-1 -left-1 w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-all duration-400 delay-300 group-hover:animate-bounce"
          style={{ animationDuration: '2s' }}
        />
      </div>

      <span className="text-lg font-black text-foreground-light group-hover:text-foreground transition-all duration-400 group-hover:tracking-wider">
        Create Workflow
      </span>
      <span className="text-sm text-muted-foreground/60 mt-2.5 group-hover:text-foreground-light transition-all duration-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-600 text-primary" />
        From Start or Use Template
      </span>

      {/* Quick Start Option - Enhanced */}
      <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-y-4 group-hover:translate-y-0">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 text-xs font-semibold text-primary cursor-pointer hover:bg-primary/25 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          Empty Canvas
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 text-xs font-semibold text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-500/25 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          From Template
        </div>
      </div>

      {/* Shortcut Key Tip - Enhanced */}
      <div className="mt-5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 translate-y-3 group-hover:translate-y-0">
        <kbd className="px-3 py-1.5 rounded-xl bg-card border border-border/60 text-[11px] font-mono text-foreground-light shadow-md group-hover:border-primary/40 group-hover:shadow-primary/10 transition-all duration-300">
          N
        </kbd>
        <span className="text-xs text-muted-foreground/80 font-medium">Quick create</span>
      </div>

      {/* Footer Decoration Line - Enhanced */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 group-hover:w-4/5 transition-all duration-600 ease-out rounded-t-full shadow-lg shadow-primary/30" />
    </button>
  )
}

/**
 * WorkflowCardSkeleton - Enhanced UI/UX v3
 * Smoother Load Animation and Better Visual Effects
 */
export function WorkflowCardSkeleton() {
  return (
    <div className="group relative bg-card border border-border/50 rounded-2xl p-5 overflow-hidden hover:border-border/80 transition-colors duration-300">
      {/* Top Gradient - Dynamic Effect */}
      <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 animate-pulse"
          style={{ animationDuration: '2s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>

      {/* Multiple Wave Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
      <div
        className="absolute inset-0 translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite_0.3s] bg-gradient-to-r from-transparent via-accent/5 to-transparent"
        style={{ animationDelay: '0.3s' }}
      />

      {/* Background Decoration - Multiple Halos */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/5 via-primary/2 to-transparent rounded-bl-[100px] opacity-80" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-accent/4 to-transparent rounded-full blur-2xl" />

      {/* Decoration */}
      <div className="absolute top-3 left-3 w-1 h-6 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
      <div className="absolute top-3 left-3 w-6 h-1 bg-gradient-to-r from-primary/30 to-transparent rounded-full" />

      {/* Header Icon */}
      <div className="flex items-start justify-between mb-5">
        <div className="relative">
          {/* Icon Outside Halo */}
          <div
            className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-sm animate-pulse"
            style={{ animationDuration: '2s' }}
          />
          <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-muted/90 via-muted/70 to-muted/50 shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-muted/80 to-muted/50 animate-pulse border-2 border-card"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden"
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              <div
                className="w-full h-full animate-pulse bg-muted/40"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Title - Gradient Skeleton */}
      <div className="relative h-6 rounded-lg overflow-hidden mb-3 w-[85%]">
        <div className="absolute inset-0 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/40" />
        <div className="absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Description - Multi-row Gradient */}
      <div className="space-y-2.5 mb-5">
        <div className="relative h-4 rounded-lg overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/60 to-muted/30" />
          <div className="absolute inset-0 animate-[shimmer_1.6s_ease-in-out_infinite_0.1s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
        <div className="relative h-4 rounded-lg overflow-hidden w-[65%]">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/25" />
          <div className="absolute inset-0 animate-[shimmer_1.6s_ease-in-out_infinite_0.2s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>

      {/* Tags - Dynamic Width */}
      <div className="flex items-center gap-2.5 mb-5">
        {[18, 14, 12].map((w, i) => (
          <div
            key={i}
            className="relative h-7 rounded-full overflow-hidden"
            style={{ width: `${w * 4}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30" />
            <div
              className="absolute inset-0 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent"
              style={{ animationDelay: `${150 + i * 100}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Footer Info - Enhanced Separator */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div className="flex items-center gap-4">
          {/* Node Count */}
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.2s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <div className="relative h-4 w-8 rounded overflow-hidden">
              <div className="absolute inset-0 bg-muted/50" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.25s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-border/50 to-transparent" />

          {/* Run Count */}
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.3s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <div className="relative h-4 w-10 rounded overflow-hidden">
              <div className="absolute inset-0 bg-muted/50" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.35s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-border/50 to-transparent hidden sm:block" />

          {/* Updated At */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.4s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <div className="relative h-4 w-14 rounded overflow-hidden">
              <div className="absolute inset-0 bg-muted/50" />
              <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite_0.45s] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="relative h-8 w-20 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/70 via-muted/50 to-muted/30" />
          <div className="absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite_0.5s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      {/* Footer Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 animate-[loading_1.5s_ease-in-out_infinite]"
          style={{ width: '30%' }}
        />
      </div>
    </div>
  )
}
