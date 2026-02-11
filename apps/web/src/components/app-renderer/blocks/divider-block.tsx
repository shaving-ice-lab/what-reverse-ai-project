'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { DividerConfig } from '../types'

interface DividerBlockProps {
  config: DividerConfig
}

export function DividerBlock({ config }: DividerBlockProps) {
  const spacing = {
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-8',
  }[config.spacing || 'md']

  const borderStyle = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  }[config.style || 'solid']

  if (config.label) {
    return (
      <div className={cn('flex items-center gap-3', spacing)}>
        <div className={cn('flex-1 border-t border-border', borderStyle)} />
        <span className="text-xs text-foreground-muted font-medium shrink-0">{config.label}</span>
        <div className={cn('flex-1 border-t border-border', borderStyle)} />
      </div>
    )
  }

  return (
    <hr className={cn('border-t border-border', borderStyle, spacing)} />
  )
}
