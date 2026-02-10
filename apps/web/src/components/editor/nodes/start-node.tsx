'use client'

/**
 * StartNode - optimalversion
 */

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface StartNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

export const StartNode = memo(function StartNode({
  data,
  selected,
  isConnectable = true,
}: StartNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border px-5 py-3',
        'bg-linear-to-r from-brand-500/10 to-brand-600/10',
        'backdrop-blur-sm transition-all duration-200',
        // EdgeandShadow
        'border-brand-500/30',
        'shadow-lg shadow-brand-500/10',
        // FloatEffect
        isHovered &&
          !selected && ['border-brand-500/50', 'shadow-lg shadow-brand-500/20', '-translate-y-0.5'],
        // selectEffect
        selected && [
          'border-brand-500',
          'shadow-[0_0_20px_rgba(62,207,142,0.3)]',
          'ring-1 ring-brand-500/30',
        ]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-lg',
          'bg-linear-to-br from-brand-500 to-brand-600',
          'shadow-lg shadow-brand-500/30',
          'transition-transform duration-200',
          isHovered && 'scale-105'
        )}
      >
        <Play className="h-5 w-5 text-background ml-0.5" />
        {/* PulseAnimation */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg bg-brand-500/40',
            'animate-ping opacity-75',
            !isHovered && !selected && 'hidden'
          )}
          style={{ animationDuration: '1.5s' }}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-brand-500">{data.label || 'Start'}</span>
        <span className="text-[10px] text-brand-500/70 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" />
          WorkflowEntry
        </span>
      </div>

      {/* OutputPort */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className={cn(
          'w-3.5! h-3.5! border-2! border-background! rounded-full! -right-1.5!',
          'bg-brand-500! transition-all! duration-200!',
          'hover:scale-125! hover:ring-4! hover:ring-brand-500/30!'
        )}
      />

      {/* selectIndicator */}
      {selected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-brand-500/50" />
      )}
    </div>
  )
})
