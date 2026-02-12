'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Bot,
  Database,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'
import { workspaceApi } from '@/lib/api/workspace'

const SETUP_STORAGE_KEY = 'reverseai-setup-completed'

const TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank Project',
    description: 'Start from scratch with an empty workspace',
    icon: LayoutGrid,
  },
  {
    id: 'fleet',
    label: 'Fleet Management',
    description: 'Vehicle tracking, drivers, trips management',
    icon: Bot,
    prompt: 'Build a fleet management system with vehicles, drivers, and trips tracking',
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Contacts, deals, and pipeline management',
    icon: Database,
    prompt: 'Build a CRM system with contacts, companies, deals, and a sales pipeline dashboard',
  },
  {
    id: 'inventory',
    label: 'Inventory System',
    description: 'Products, stock levels, and orders',
    icon: Database,
    prompt:
      'Build an inventory management system with products, categories, stock levels, and orders',
  },
]

export default function SetupPage() {
  const router = useRouter()
  const { workspaceId, workspace, isLoading: wsLoading } = useWorkspace()
  const [step, setStep] = useState<'name' | 'template'>('name')
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (workspace && workspace.name !== 'Default Workspace') {
      setWorkspaceName(workspace.name)
      setWorkspaceSlug(workspace.slug)
    }
  }, [workspace])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
  }

  const handleNameChange = (value: string) => {
    setWorkspaceName(value)
    if (!slugManuallyEdited) {
      setWorkspaceSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setWorkspaceSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 40)
    )
  }

  const handleSaveName = async () => {
    if (!workspaceId || !workspaceName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await workspaceApi.update(workspaceId, {
        name: workspaceName.trim(),
        slug: workspaceSlug.trim() || generateSlug(workspaceName),
      })
      setStep('template')
    } catch (err: any) {
      setError(err?.message || 'Failed to update workspace. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_STORAGE_KEY, 'true')
    }
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (template && 'prompt' in template && template.prompt) {
      router.replace(`/dashboard/agent?prompt=${encodeURIComponent(template.prompt)}`)
    } else {
      router.replace('/dashboard')
    }
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETUP_STORAGE_KEY, 'true')
    }
    router.replace('/dashboard')
  }

  if (wsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-lg mx-auto px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-500">
            <Sparkles className="w-4.5 h-4.5 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">ReverseAI</span>
        </div>

        {step === 'name' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Welcome to ReverseAI</h1>
              <p className="text-sm text-foreground-muted mt-1">
                Let&apos;s set up your workspace. Give it a name that describes your project.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  Workspace Name
                </label>
                <Input
                  value={workspaceName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Fleet Manager, My CRM, Inventory System"
                  className="h-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && workspaceName.trim()) handleSaveName()
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-light mb-1.5 block">
                  URL Slug
                </label>
                <div className="flex items-center gap-0">
                  <span className="h-10 px-3 flex items-center rounded-l-md border border-r-0 border-border bg-surface-100 text-xs text-foreground-muted">
                    /runtime/
                  </span>
                  <Input
                    value={workspaceSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-project"
                    className="h-10 rounded-l-none"
                  />
                </div>
                <p className="text-[10px] text-foreground-muted mt-1">
                  Your app will be accessible at this URL after publishing.
                </p>
              </div>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSkip}
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                Skip setup
              </button>
              <Button
                onClick={handleSaveName}
                disabled={!workspaceName.trim() || saving}
                className="h-9"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Continue
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">What do you want to build?</h1>
              <p className="text-sm text-foreground-muted mt-1">
                Choose a template to get started quickly, or start with a blank project and tell the
                AI Agent what to build.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((template) => {
                const Icon = template.icon
                const isSelected = selectedTemplate === template.id
                return (
                  <button
                    key={template.id}
                    onClick={() => handleComplete(template.id)}
                    disabled={!!selectedTemplate}
                    className={cn(
                      'flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-500/5'
                        : 'border-border hover:border-brand-500/40 hover:bg-surface-100/50',
                      selectedTemplate && !isSelected && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isSelected
                            ? 'bg-brand-500/10 text-brand-500'
                            : 'bg-surface-200/50 text-foreground-muted'
                        )}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-500" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">{template.label}</span>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed">
                      {template.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep('name')}
                disabled={!!selectedTemplate}
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                Back
              </button>
              {selectedTemplate && (
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Setting up...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
