'use client'

/**
 * PageTransition - Page Transition Animation Component
 *
 * Provide multiple type page switch effects:
 * - Enter fade out
 * - Slide
 * - Zoom
 * - Blur
 */

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
  variant?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'blur'
  duration?: number
}

export function PageTransition({
  children,
  className,
  variant = 'fade',
  duration = 300,
}: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsVisible(false)

    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [pathname, children])

  const variants = {
    fade: {
      initial: 'opacity-0',
      animate: 'opacity-100',
    },
    'slide-up': {
      initial: 'opacity-0 translate-y-4',
      animate: 'opacity-100 translate-y-0',
    },
    'slide-left': {
      initial: 'opacity-0 translate-x-4',
      animate: 'opacity-100 translate-x-0',
    },
    scale: {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100',
    },
    blur: {
      initial: 'opacity-0 blur-sm',
      animate: 'opacity-100 blur-0',
    },
  }

  const currentVariant = variants[variant]

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? currentVariant.animate : currentVariant.initial,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {displayChildren}
    </div>
  )
}

/**
 * FadeIn - SimpleenterAnimationWrapper
 */
interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 500,
  direction = 'up',
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const directionStyles = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: '',
  }

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0'
          : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * StaggerChildren - ElementAnimation
 */
interface StaggerChildrenProps {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 50,
  duration = 400,
  direction = 'up',
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay} duration={duration} direction={direction}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

/**
 * AnimatePresence - ElementEnter/ExitAnimation
 */
interface AnimatePresenceProps {
  children: ReactNode
  isVisible: boolean
  className?: string
  duration?: number
  variant?: 'fade' | 'scale' | 'slide-up' | 'slide-down'
}

export function AnimatePresence({
  children,
  isVisible,
  className,
  duration = 200,
  variant = 'fade',
}: AnimatePresenceProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)
  const [animationState, setAnimationState] = useState<'enter' | 'exit' | 'idle'>('idle')

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      requestAnimationFrame(() => setAnimationState('enter'))
    } else {
      setAnimationState('exit')
      const timer = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  if (!shouldRender) return null

  const variants = {
    fade: {
      enter: 'opacity-100',
      exit: 'opacity-0',
      initial: 'opacity-0',
    },
    scale: {
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95',
      initial: 'opacity-0 scale-95',
    },
    'slide-up': {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 translate-y-2',
      initial: 'opacity-0 translate-y-2',
    },
    'slide-down': {
      enter: 'opacity-100 translate-y-0',
      exit: 'opacity-0 -translate-y-2',
      initial: 'opacity-0 -translate-y-2',
    },
  }

  const currentVariant = variants[variant]
  const currentState =
    animationState === 'enter'
      ? currentVariant.enter
      : animationState === 'exit'
        ? currentVariant.exit
        : currentVariant.initial

  return (
    <div
      className={cn('transition-all ease-out', currentState, className)}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * SlideOver - EdgeenterPanel
 */
interface SlideOverProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  side?: 'left' | 'right'
  className?: string
}

export function SlideOver({
  children,
  isOpen,
  onClose,
  side = 'right',
  className,
}: SlideOverProps) {
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl',
          'transition-transform duration-300 ease-out',
          side === 'right' ? 'right-0' : 'left-0',
          side === 'right'
            ? isOpen
              ? 'translate-x-0'
              : 'translate-x-full'
            : isOpen
              ? 'translate-x-0'
              : '-translate-x-full',
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

/**
 * ModalTransition - Modalpast
 */
interface ModalTransitionProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ModalTransition({ children, isOpen, onClose, className }: ModalTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
        document.body.style.overflow = ''
      }, 200)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 w-full transition-all duration-200',
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * ProgressBar - PageLoadProgress Bar
 */
interface ProgressBarProps {
  isLoading: boolean
  className?: string
}

export function ProgressBar({ isLoading, className }: ProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setVisible(true)
      setProgress(0)

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
      const timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!visible) return null

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-[100] h-1', className)}>
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/**
 * ScrollReveal - ScrollDisplayAnimation
 */
interface ScrollRevealProps {
  children: ReactNode
  className?: string
  threshold?: number
  duration?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function ScrollReveal({
  children,
  className,
  threshold = 0.1,
  duration = 500,
  delay = 0,
  direction = 'up',
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold, delay])

  const directionStyles = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    none: '',
  }

  return (
    <div
      ref={setRef}
      className={cn(
        'transition-all ease-out',
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0'
          : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

export default PageTransition
