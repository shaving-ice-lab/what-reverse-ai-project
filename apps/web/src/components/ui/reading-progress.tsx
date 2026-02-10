'use client'

/**
 * ReadingProgress - ReadProgress BarComponent
 *
 * DisplayPageScrollProgress
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ReadingProgressProps {
  className?: string
  color?: string
  height?: number
  showPercentage?: boolean
}

export function ReadingProgress({
  className,
  color = 'hsl(var(--primary))',
  height = 3,
  showPercentage = false,
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPosition = window.scrollY
      const currentProgress = totalHeight > 0 ? (scrollPosition / totalHeight) * 100 : 0
      setProgress(Math.min(currentProgress, 100))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50', className)}>
      {/* Progress bar */}
      <div
        className="transition-all duration-150 ease-out"
        style={{
          height: `${height}px`,
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}40`,
        }}
      />

      {/* Optional percentage display */}
      {showPercentage && progress > 0 && (
        <div
          className={cn(
            'absolute top-2 right-4 px-2 py-1 rounded-md text-xs font-medium',
            'bg-background/80 backdrop-blur-sm border border-border shadow-sm',
            'transition-opacity duration-300',
            progress > 5 ? 'opacity-100' : 'opacity-0'
          )}
          style={{ color }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  )
}

export default ReadingProgress
