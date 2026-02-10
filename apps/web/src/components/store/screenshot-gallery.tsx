'use client'

/**
 * Screenshot Gallery Component
 *
 * Showcases Agent screenshots and demo videos
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Play, Maximize2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScreenshotGalleryProps {
  screenshots: string[]
  demoVideo?: string | null
  coverImage?: string | null
  agentName: string
  className?: string
}

export function ScreenshotGallery({
  screenshots,
  demoVideo,
  coverImage,
  agentName,
  className,
}: ScreenshotGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // All media items
  const mediaItems: Array<{ type: 'image' | 'video'; url: string }> = []

  if (coverImage) {
    mediaItems.push({ type: 'image', url: coverImage })
  }

  screenshots.forEach((url) => {
    mediaItems.push({ type: 'image', url })
  })

  if (demoVideo) {
    mediaItems.push({ type: 'video', url: demoVideo })
  }

  if (mediaItems.length === 0) {
    return (
      <div className={cn('rounded-xl bg-muted/50 border border-border p-8 text-center', className)}>
        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No Screenshots</p>
      </div>
    )
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const currentItem = mediaItems[currentIndex]

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {/* Main Preview */}
        <div className="relative group">
          <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
            {currentItem.type === 'video' ? (
              <video src={currentItem.url} controls className="w-full h-full object-cover" />
            ) : (
              <img
                src={currentItem.url}
                alt={`${agentName} Screenshot ${currentIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => openLightbox(currentIndex)}
              />
            )}
          </div>

          {/* Enlarge Button */}
          {currentItem.type === 'image' && (
            <button
              onClick={() => openLightbox(currentIndex)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Navigation Buttons */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Index Indicator */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>

        {/* Thumbnail List */}
        {mediaItems.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mediaItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-5 h-5 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {mediaItems[lightboxIndex].type === 'video' ? (
              <video
                src={mediaItems[lightboxIndex].url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh]"
              />
            ) : (
              <img
                src={mediaItems[lightboxIndex].url}
                alt={`${agentName} Screenshot ${lightboxIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
          </div>

          {/* Lightbox Navigation */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev + 1) % mediaItems.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Lightbox Index */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {lightboxIndex + 1} / {mediaItems.length}
          </div>
        </div>
      )}
    </>
  )
}
