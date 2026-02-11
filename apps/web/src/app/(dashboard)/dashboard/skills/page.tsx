'use client'

import React, { useState } from 'react'
import {
  Database,
  Layout,
  GitBranch,
  Plug,
  Wrench,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Built-in skill data (would come from API in production)
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
  const [skills, setSkills] = useState<SkillMeta[]>(BUILTIN_SKILLS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleEnabled = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const allTools = skills
    .filter((s) => s.enabled)
    .flatMap((s) => s.tool_names)
  const uniqueTools = [...new Set(allTools)]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            AI Skills
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage the capabilities available to your AI Agent. Each skill provides a set of tools and prompts.
          </p>
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
      </div>
    </div>
  )
}
