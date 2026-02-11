'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Layout,
  GitBranch,
  Plug,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { request } from '@/lib/api/shared'
import { useWorkspace } from '@/hooks/useWorkspace'

interface SkillMeta {
  id: string
  name: string
  description: string
  category: string
  icon: string
  tool_count: number
  tool_names: string[]
  system_prompt_addition?: string
  enabled: boolean
  builtin: boolean
}

const categoryIcons: Record<string, React.ElementType> = {
  data_modeling: Database,
  ui_generation: Layout,
  business_logic: GitBranch,
  integration: Plug,
}

const categoryLabels: Record<string, string> = {
  data_modeling: 'Data Modeling',
  ui_generation: 'UI Generation',
  business_logic: 'Business Logic',
  integration: 'Integration',
}

// Fallback skill data when API is unavailable
const BUILTIN_SKILLS: SkillMeta[] = [
  {
    id: 'builtin_data_modeling',
    name: 'Data Modeling',
    description: 'Design and manage database schemas. Create tables, modify structures, insert seed data, and query data.',
    category: 'data_modeling',
    icon: 'Database',
    tool_count: 4,
    tool_names: ['create_table', 'alter_table', 'insert_data', 'query_data'],
    enabled: true,
    builtin: true,
  },
  {
    id: 'builtin_ui_generation',
    name: 'UI Generation',
    description: 'Generate and modify UI Schema for application pages. Create data tables, forms, charts, and stats cards.',
    category: 'ui_generation',
    icon: 'Layout',
    tool_count: 2,
    tool_names: ['generate_ui_schema', 'modify_ui_schema'],
    enabled: true,
    builtin: true,
  },
  {
    id: 'builtin_business_logic',
    name: 'Business Logic',
    description: 'Design and manage business workflows. Create workflows, modify flow logic, and get suggestions for automation.',
    category: 'business_logic',
    icon: 'GitBranch',
    tool_count: 4,
    tool_names: ['create_workflow', 'modify_workflow', 'get_workspace_info', 'suggest_workflow'],
    enabled: true,
    builtin: true,
  },
]

export default function SkillsPage() {
  const { workspaceId } = useWorkspace()
  const [skills, setSkills] = useState<SkillMeta[]>(BUILTIN_SKILLS)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillMeta | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadSkills = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const res = await request<{ data: SkillMeta[] } | SkillMeta[]>(
        `/workspaces/${workspaceId}/agent/skills`
      )
      const items = Array.isArray(res) ? res : Array.isArray((res as any)?.data) ? (res as any).data : null
      if (items && items.length > 0) {
        setSkills(items)
      }
    } catch {
      // Keep fallback BUILTIN_SKILLS
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  const toggleEnabled = async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId)
    if (!skill) return
    const newEnabled = !skill.enabled
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, enabled: newEnabled } : s))
    )
    if (workspaceId) {
      try {
        await request(`/workspaces/${workspaceId}/agent/skills/${skillId}`, {
          method: 'PATCH',
          body: JSON.stringify({ enabled: newEnabled }),
        })
      } catch {
        setSkills((prev) =>
          prev.map((s) => (s.id === skillId ? { ...s, enabled: !newEnabled } : s))
        )
      }
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!workspaceId) return
    if (!confirm('Delete this custom skill?')) return
    setDeleting(skillId)
    try {
      await request(`/workspaces/${workspaceId}/agent/skills/${skillId}`, { method: 'DELETE' })
      setSkills((prev) => prev.filter((s) => s.id !== skillId))
      if (expandedId === skillId) setExpandedId(null)
    } catch {
      // ignore
    } finally {
      setDeleting(null)
    }
  }

  const handleCreateOrUpdate = async (data: {
    name: string
    description: string
    category: string
    icon: string
    system_prompt: string
  }) => {
    if (!workspaceId) return
    try {
      if (editingSkill) {
        await request(`/workspaces/${workspaceId}/agent/skills/${editingSkill.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await request(`/workspaces/${workspaceId}/agent/skills`, {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      setShowCreateDialog(false)
      setEditingSkill(null)
      await loadSkills()
    } catch {
      // ignore
    }
  }

  const allTools = skills
    .filter((s) => s.enabled)
    .flatMap((s) => s.tool_names)
  const uniqueTools = [...new Set(allTools)]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              AI Skills
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              Manage the capabilities available to your AI Agent. Each skill provides a set of tools and prompts.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditingSkill(null); setShowCreateDialog(true) }}
            className="h-8 text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Skill
          </Button>
        </div>

        {/* Agent Capabilities Overview */}
        <div className="bg-surface-200/30 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Wrench className="w-4 h-4 text-foreground-muted" />
            Agent Tool Overview
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 ml-auto">
              {uniqueTools.length} tools active
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueTools.map((tool) => (
              <span
                key={tool}
                className="text-[11px] px-2 py-1 rounded bg-background border border-border text-foreground-light font-mono"
              >
                {tool}
              </span>
            ))}
            {uniqueTools.length === 0 && (
              <span className="text-xs text-foreground-muted">No tools active. Enable at least one skill.</span>
            )}
          </div>
        </div>

        {/* Skills List */}
        <div className="space-y-3">
          {skills.map((skill) => {
            const CatIcon = categoryIcons[skill.category] || Plug
            const isExpanded = expandedId === skill.id

            return (
              <div
                key={skill.id}
                className={cn(
                  'border rounded-lg transition-all',
                  skill.enabled ? 'border-border bg-background' : 'border-border/50 bg-surface-200/20 opacity-70'
                )}
              >
                {/* Skill header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      skill.enabled ? 'bg-brand-500/10 text-brand-500' : 'bg-surface-200 text-foreground-muted'
                    )}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{skill.name}</span>
                      {skill.builtin && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-foreground-muted/10 text-foreground-muted">
                          Built-in
                        </span>
                      )}
                      <span className="text-[10px] text-foreground-muted">
                        {skill.tool_count} tools
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5 truncate">{skill.description}</p>
                  </div>

                  {/* Custom skill actions */}
                  {!skill.builtin && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => { setEditingSkill(skill); setShowCreateDialog(true) }}
                        className="p-1.5 text-foreground-muted hover:text-foreground transition-colors rounded"
                        title="Edit skill"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1.5 text-foreground-muted hover:text-destructive transition-colors rounded"
                        title="Delete skill"
                        disabled={deleting === skill.id}
                      >
                        {deleting === skill.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => toggleEnabled(skill.id)}
                    className={cn(
                      'w-10 h-5 rounded-full relative shrink-0 transition-colors',
                      skill.enabled ? 'bg-brand-500' : 'bg-surface-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform',
                        skill.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : skill.id)}
                    className="text-foreground-muted hover:text-foreground transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-0">
                    <div className="pt-3 space-y-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">
                          Category
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-surface-200 text-foreground-light">
                          {categoryLabels[skill.category] || skill.category}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">
                          Tools Provided
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skill.tool_names.map((tool) => (
                            <span
                              key={tool}
                              className="text-[11px] px-2 py-1 rounded border border-border bg-background text-foreground-light font-mono"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">
                          Description
                        </div>
                        <p className="text-xs text-foreground-light leading-relaxed">
                          {skill.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Create/Edit Skill Dialog */}
        {showCreateDialog && (
          <SkillFormDialog
            initial={editingSkill}
            onSubmit={handleCreateOrUpdate}
            onClose={() => { setShowCreateDialog(false); setEditingSkill(null) }}
          />
        )}
      </div>
    </div>
  )
}

function SkillFormDialog({
  initial,
  onSubmit,
  onClose,
}: {
  initial: SkillMeta | null
  onSubmit: (data: { name: string; description: string; category: string; icon: string; system_prompt: string }) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || 'integration')
  const [icon, setIcon] = useState(initial?.icon || 'Sparkles')
  const [systemPrompt, setSystemPrompt] = useState(initial?.system_prompt_addition || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !systemPrompt.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category,
        icon,
        system_prompt: systemPrompt.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {initial ? 'Edit Skill' : 'Create Custom Skill'}
          </h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground-light mb-1 block">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-commerce Expert"
              className="h-9 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-light mb-1 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill help with?"
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded border border-border bg-background px-3 text-sm"
              >
                <option value="data_modeling">Data Modeling</option>
                <option value="ui_generation">UI Generation</option>
                <option value="business_logic">Business Logic</option>
                <option value="integration">Integration</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-light mb-1 block">Icon</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full h-9 rounded border border-border bg-background px-3 text-sm"
              >
                <option value="Sparkles">Sparkles</option>
                <option value="Database">Database</option>
                <option value="Layout">Layout</option>
                <option value="GitBranch">GitBranch</option>
                <option value="Plug">Plug</option>
                <option value="Wrench">Wrench</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-light mb-1 block">
              System Prompt *
            </label>
            <p className="text-[10px] text-foreground-muted mb-1.5">
              This prompt will be appended to the AI Agent&apos;s system instructions when this skill is enabled.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={'You are an expert in...'}
              required
              rows={6}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y min-h-[120px] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving || !name.trim() || !systemPrompt.trim()} className="h-8 text-xs">
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {initial ? 'Save Changes' : 'Create Skill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
