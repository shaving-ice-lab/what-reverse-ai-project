'use client'

/**
 * LogoCarousel - Logo Carousel Component
 *
 * Auto-scrolling Brand/Technology Logo Showcase
 */

import { cn } from '@/lib/utils'

interface LogoItem {
  name: string
  icon?: React.ReactNode
  logo?: string
}

interface LogoCarouselProps {
  items: LogoItem[]
  speed?: 'slow' | 'normal' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  className?: string
}

export function LogoCarousel({
  items,
  speed = 'normal',
  direction = 'left',
  pauseOnHover = true,
  className,
}: LogoCarouselProps) {
  const speedMap = {
    slow: '40s',
    normal: '25s',
    fast: '15s',
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items]

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Scrolling Container */}
      <div
        className={cn(
          'flex gap-8 items-center',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
        style={{
          animation: `scroll-${direction} ${speedMap[speed]} linear infinite`,
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={cn(
              'flex items-center gap-3 shrink-0',
              'px-6 py-3 rounded-xl',
              'bg-card/50 border border-border/50',
              'hover:border-primary/30 hover:bg-card',
              'transition-all duration-300'
            )}
          >
            {item.icon && (
              <div className="w-8 h-8 flex items-center justify-center text-primary">
                {item.icon}
              </div>
            )}
            {item.logo && (
              <div className="w-8 h-8 flex items-center justify-center">
                <span className="text-2xl">{item.logo}</span>
              </div>
            )}
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes scroll-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

// Pre-built AI Model logos
export const aiModelLogos: LogoItem[] = [
  { name: 'GPT-4', logo: '🧠' },
  { name: 'Claude 3', logo: '🤖' },
  { name: 'Gemini', logo: '✨' },
  { name: 'Llama 3', logo: '🦙' },
  { name: 'Mistral', logo: '🌬️' },
  { name: 'Qwen', logo: '🐼' },
  { name: 'DeepSeek', logo: '🔍' },
  { name: 'Ollama', logo: '🏠' },
  { name: 'LM Studio', logo: '🎛️' },
]

// Pre-built Integration logos
export const integrationLogos: LogoItem[] = [
  { name: 'Slack', logo: '💬' },
  { name: 'Discord', logo: '🎮' },
  { name: 'GitHub', logo: '🐙' },
  { name: 'Notion', logo: '📝' },
  { name: 'Feishu', logo: '🐦' },
  { name: 'DingTalk', logo: '📌' },
  { name: 'Enterprise WeChat', logo: '💼' },
  { name: 'Airtable', logo: '📊' },
  { name: 'Zapier', logo: '⚡' },
  { name: 'Make', logo: '🔧' },
]

export default LogoCarousel
