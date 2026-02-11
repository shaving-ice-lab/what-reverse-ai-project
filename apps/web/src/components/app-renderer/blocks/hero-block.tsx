'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { HeroConfig } from '../types'

interface HeroBlockProps {
  config: HeroConfig
}

export function HeroBlock({ config }: HeroBlockProps) {
  const align = config.align || 'center'
  const size = config.size || 'md'

  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-20',
  }[size]

  const titleSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align]

  return (
    <div
      className={cn(
        'rounded-lg px-6 flex flex-col',
        sizeClasses,
        alignClass,
      )}
      style={{
        backgroundColor: config.background_color || undefined,
        backgroundImage: config.background_image ? `url(${config.background_image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: config.text_color || undefined,
      }}
    >
      {config.subtitle && (
        <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-2">
          {config.subtitle}
        </p>
      )}
      <h2 className={cn('font-bold text-foreground', titleSize)} style={{ color: config.text_color || undefined }}>
        {config.title}
      </h2>
      {config.description && (
        <p className="mt-2 text-sm text-foreground-muted max-w-2xl" style={{ color: config.text_color ? `${config.text_color}cc` : undefined }}>
          {config.description}
        </p>
      )}
      {config.actions && config.actions.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          {config.actions.map((action, i) => {
            const rawHref = action.href || ''
            const isInternal = rawHref.startsWith('/') || rawHref.startsWith('#')
            const href = isInternal ? `#${rawHref.replace(/^[#/]+/, '')}` : (rawHref || '#')
            return (
              <a
                key={i}
                href={href}
                {...(!isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={cn(
                  'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                  action.variant === 'secondary'
                    ? 'border border-border text-foreground hover:bg-surface-200/50'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                )}
              >
                {action.label}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
