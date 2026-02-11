'use client'

import React from 'react'
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Wrench,
  Brain,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AgentStep {
  step: number
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_confirmation'
  toolName?: string
}

interface AgentTaskProgressProps {
  steps: AgentStep[]
  currentStep?: number
  className?: string
}

const statusIcons: Record<AgentStep['status'], React.ReactNode> = {
  pending: <div className="w-4 h-4 rounded-full border-2 border-border" />,
  running: <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-brand-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
  waiting_confirmation: <AlertTriangle className="w-4 h-4 text-amber-500" />,
}

export function AgentTaskProgress({ steps, currentStep, className }: AgentTaskProgressProps) {
  if (steps.length === 0) return null

  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider mb-2">
        Progress
      </div>
      {steps.map((step) => {
        const isCurrent = step.step === currentStep
        return (
          <div
            key={step.step}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
              isCurrent && 'bg-brand-500/5 border border-brand-500/20',
              step.status === 'failed' && 'bg-destructive/5',
            )}
          >
            {statusIcons[step.status]}
            <span className="text-foreground-muted tabular-nums w-5 text-right shrink-0">
              {step.step}.
            </span>
            <span className={cn(
              'flex-1 truncate',
              isCurrent ? 'text-foreground font-medium' : 'text-foreground-light',
              step.status === 'completed' && 'line-through opacity-60',
            )}>
              {step.description}
            </span>
            {step.toolName && (
              <span className="text-[10px] text-foreground-muted flex items-center gap-0.5 shrink-0">
                <Wrench className="w-2.5 h-2.5" />
                {step.toolName}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
