'use client'

import React from 'react'
import {
  Globe,
  Briefcase,
  UserCog,
  Bot,
  Sparkles,
  Headphones,
  ShieldCheck,
  ClipboardList,
  PackageSearch,
  Heart,
  Stethoscope,
  GraduationCap,
  Megaphone,
  Wrench,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PersonaMeta } from '@/lib/api/agent-chat'

export const personaIconMap: Record<string, LucideIcon> = {
  Globe,
  Briefcase,
  UserCog,
  Bot,
  Sparkles,
  Headphones,
  ShieldCheck,
  ClipboardList,
  PackageSearch,
  Heart,
  Stethoscope,
  GraduationCap,
  Megaphone,
  Wrench,
}

export const personaColorMap: Record<
  string,
  { bg: string; activeBg: string; border: string; text: string; iconBg: string; ring: string }
> = {
  blue: {
    bg: 'bg-blue-500/5 hover:bg-blue-500/10',
    activeBg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  amber: {
    bg: 'bg-amber-500/5 hover:bg-amber-500/10',
    activeBg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  green: {
    bg: 'bg-green-500/5 hover:bg-green-500/10',
    activeBg: 'bg-green-500/15',
    border: 'border-green-500/30',
    text: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-500/10',
    ring: 'ring-green-500/20',
  },
  violet: {
    bg: 'bg-violet-500/5 hover:bg-violet-500/10',
    activeBg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10',
    ring: 'ring-violet-500/20',
  },
  red: {
    bg: 'bg-red-500/5 hover:bg-red-500/10',
    activeBg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
}

const defaultColor = personaColorMap.violet

// ========== PersonaTabBar ==========

interface PersonaTabBarProps {
  personas: PersonaMeta[]
  activeId: string
  onSelect: (persona: PersonaMeta) => void
  loading?: boolean
  className?: string
}

export function PersonaTabBar({
  personas,
  activeId,
  onSelect,
  loading,
  className,
}: PersonaTabBarProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-2 px-3', className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-muted" />
        <span className="text-[11px] text-foreground-muted ml-1.5">Loading...</span>
      </div>
    )
  }

  if (personas.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none', className)}>
      {personas.map((persona) => {
        const Icon = personaIconMap[persona.icon] || Bot
        const colors = personaColorMap[persona.color] || defaultColor
        const isActive = persona.id === activeId

        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 border',
              isActive
                ? [colors.activeBg, colors.text, colors.border]
                : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-surface-200/50'
            )}
            title={persona.description}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{persona.name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ========== PersonaWelcome ==========

interface PersonaWelcomeProps {
  persona: PersonaMeta | null
  onSuggestionClick: (prompt: string) => void
  className?: string
}

export function PersonaWelcome({ persona, onSuggestionClick, className }: PersonaWelcomeProps) {
  const Icon = persona ? personaIconMap[persona.icon] || Bot : Bot
  const colors = persona ? personaColorMap[persona.color] || defaultColor : defaultColor
  const suggestions = persona?.suggestions || []

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full text-foreground-muted text-sm px-4',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
          colors.iconBg
        )}
      >
        <Icon className={cn('w-6 h-6', colors.text)} />
      </div>
      <p className="font-medium text-foreground text-sm">
        {persona?.name || 'AI Assistant'}
      </p>
      <p className="text-xs mt-1 text-center max-w-[280px] text-foreground-muted leading-relaxed">
        {persona?.description || 'Select an assistant above to get started.'}
      </p>

      {suggestions.length > 0 && (
        <div className="mt-4 grid gap-1.5 w-full max-w-[300px]">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => onSuggestionClick(s.prompt)}
              className={cn(
                'text-left px-3 py-2 rounded-lg border transition-all group',
                colors.bg,
                'border-border/40 hover:border-border'
              )}
            >
              <span className="text-[11px] font-medium text-foreground">{s.label}</span>
              <p className="text-[10px] text-foreground-muted mt-0.5 line-clamp-1 group-hover:text-foreground-light transition-colors">
                {s.prompt}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== PersonaBadge ==========

interface PersonaBadgeProps {
  persona: PersonaMeta | null
  className?: string
}

export function PersonaBadge({ persona, className }: PersonaBadgeProps) {
  if (!persona) return null

  const Icon = personaIconMap[persona.icon] || Bot
  const colors = personaColorMap[persona.color] || defaultColor

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium',
        colors.iconBg,
        colors.text,
        className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {persona.name}
    </span>
  )
}
