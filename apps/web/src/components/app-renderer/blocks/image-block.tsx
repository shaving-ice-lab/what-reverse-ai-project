'use client'

import React, { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageConfig } from '../types'

interface ImageBlockProps {
  config: ImageConfig
}

export function ImageBlock({ config }: ImageBlockProps) {
  const [error, setError] = useState(false)

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[config.object_fit || 'cover']

  const imgStyle = {
    width: config.width || '100%',
    height: config.height || 'auto',
    borderRadius: config.border_radius || '0.5rem',
  }

  const img = error ? (
    <div
      className="flex items-center justify-center bg-surface-200/30 border border-border text-foreground-muted"
      style={{ ...imgStyle, minHeight: 120 }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <ImageOff className="w-5 h-5" />
        <span className="text-xs">{config.alt || 'Image not available'}</span>
      </div>
    </div>
  ) : (
    <img
      src={config.src}
      alt={config.alt || ''}
      className={cn('w-full', objectFitClass)}
      style={imgStyle}
      onError={() => setError(true)}
    />
  )

  return (
    <figure className="space-y-1.5">
      {config.link ? (
        <a
          href={config.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity"
        >
          {img}
        </a>
      ) : (
        img
      )}
      {config.caption && (
        <figcaption className="text-xs text-foreground-muted text-center">
          {config.caption}
        </figcaption>
      )}
    </figure>
  )
}
