'use client'

/**
 * App Builder Page - Supabase Style
 * 3-Panel Layout: AI Chat / Workflow Canvas / UI Schema Config
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Edge } from '@xyflow/react'
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layout,
  Play,
  Save,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Bot,
  Sparkles,
  RefreshCw,
  Eye,
  Code,
  GitCompare,
  PanelLeftClose,
  PanelRightClose,
  Maximize2,
  Minimize2,
  Rocket,
  MoreHorizontal,
  Globe,
  Lock,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  appApi,
  type App,
  type AppVersion,
  type AppVersionDiff,
  type AppAccessPolicy,
} from '@/lib/api/workspace'
import { workflowApi } from '@/lib/api'
import { request } from '@/lib/api/shared'
import { workspaceApi, type Workspace } from '@/lib/api/workspace'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkflowStore, type WorkflowNode } from '@/stores/useWorkflowStore'
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from '@/lib/permissions'
import { AppAccessGate } from '@/components/permissions/app-access-gate'
import { PermissionAction } from '@/components/permissions/permission-action'
import { LazyWorkflowEditor } from '@/components/editor'

// PanelConfig
type PanelId = 'chat' | 'workflow' | 'schema'

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

type UISchemaField = {
  id: string
  label: string
  inputKey: string
  type: 'input' | 'select'
  required: boolean
  placeholder: string
  options: string
}

type WorkflowSnapshot = {
  id?: string
  name: string
  nodes: WorkflowNode[]
  edges: Edge[]
  version?: number
}

type APIResponse<T> = {
  code: string
  message: string
  data: T
}

type GenerateWorkflowPayload = {
  workflow_json: string
  ui_schema?: Record<string, unknown>
  db_schema?: Record<string, unknown>
  explanation?: string
  suggestions?: string[]
}

const chatQuickActions = [
  {
    label: 'Generate a Support FAQ Assistant',
    prompt:
      'Create a Support FAQ Assistant. Input: user issue. Output: answer and follow-up suggestions.',
  },
  {
    label: 'Build a Marketing Copy Generator',
    prompt:
      'Generate a Marketing Copy Generator. Input: product highlights and target audience. Output: multiple title versions and body copy.',
  },
  {
    label: 'Organize Meeting Notes',
    prompt:
      'Build a meeting notes tool. Input: meeting transcript text. Output: summary, to-do items, and owner checklist.',
  },
]

type BuilderPageProps = {
  workspaceId: string
  appId: string
}

export function BuilderPageContent({ workspaceId, appId }: BuilderPageProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role)
  const permissions = buildWorkspacePermissions(workspaceRole)
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const isDirty = useWorkflowStore((state) => state.isDirty)
  const markSaved = useWorkflowStore((state) => state.markSaved)
  const clearWorkflow = useWorkflowStore((state) => state.clearWorkflow)

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [app, setApp] = useState<App | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [workflowSnapshot, setWorkflowSnapshot] = useState<WorkflowSnapshot | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishWarning, setPublishWarning] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null)
  const [accessPolicyLoading, setAccessPolicyLoading] = useState(false)
  const [accessPolicyError, setAccessPolicyError] = useState<string | null>(null)
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null)

  const [uiSchemaFields, setUiSchemaFields] = useState<UISchemaField[]>([])
  const [uiSchemaDirty, setUiSchemaDirty] = useState(false)
  const [uiSchemaSaving, setUiSchemaSaving] = useState(false)
  const [uiSchemaError, setUiSchemaError] = useState<string | null>(null)
  const [previewInputs, setPreviewInputs] = useState<Record<string, string>>({})
  const [previewRunStatus, setPreviewRunStatus] = useState<
    'idle' | 'running' | 'success' | 'error'
  >('idle')
  const [previewRunResult, setPreviewRunResult] = useState<Record<string, unknown> | null>(null)
  const [previewRunError, setPreviewRunError] = useState<string | null>(null)
  const [previewRunAt, setPreviewRunAt] = useState<Date | null>(null)
  const [previewRunDuration, setPreviewRunDuration] = useState<number | null>(null)

  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [compareFrom, setCompareFrom] = useState<string>('')
  const [compareTo, setCompareTo] = useState<string>('')
  const [versionDiff, setVersionDiff] = useState<AppVersionDiff | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  // PanelStatus
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeRightPanel, setActiveRightPanel] = useState<'schema' | 'preview'>('schema')

  // AI Chat Status
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: 'user' | 'assistant'
      content: string
    }>
  >([])
  const [isChatting, setIsChatting] = useState(false)

  const workflowInitialData = useMemo(() => {
    if (!workflowSnapshot) return undefined
    return {
      name: workflowSnapshot.name,
      nodes: workflowSnapshot.nodes,
      edges: workflowSnapshot.edges,
    }
  }, [workflowSnapshot])

  const hasWorkflowContent = Boolean(workflowSnapshot?.nodes?.length)
  const shouldShowGuide =
    showGuide &&
    chatMessages.length === 0 &&
    !hasChanges &&
    !hasWorkflowContent &&
    !app?.current_version?.workflow_id
  const runtimeEntryUrl =
    workspace?.slug && app?.slug ? `/runtime/${workspace.slug}/${app.slug}` : null
  const accessModeMap = {
    private: {
      label: 'Private Access',
      description:
        'Only workspace members can access. Suitable for internal collaboration and testing.',
    },
    public_auth: {
      label: 'Public Access (Requires Sign-in)',
      description:
        'Users must sign in before accessing. Suitable for public apps that require user identification.',
    },
    public_anonymous: {
      label: 'Public Access (Anonymous)',
      description:
        'Anyone can access. We recommend enabling rate limiting or CAPTCHA to prevent abuse.',
    },
  } as const
  const accessModeKey = (accessPolicy?.access_mode || 'private') as keyof typeof accessModeMap
  const accessModeMeta = accessModeMap[accessModeKey] || accessModeMap.private
  const isPublicAccess = accessModeKey === 'public_auth' || accessModeKey === 'public_anonymous'
  const rateLimitConfigured = Boolean(
    accessPolicy?.rate_limit_json && Object.keys(accessPolicy.rate_limit_json).length > 0
  )
  const captchaConfigured = Boolean(accessPolicy?.require_captcha)
  const originConfigured = Boolean(accessPolicy?.allowed_origins?.length)
  const guardrailsReady =
    !isPublicAccess || rateLimitConfigured || captchaConfigured || originConfigured
  const guardrailLabels = [
    rateLimitConfigured ? 'Rate Limit' : null,
    captchaConfigured ? 'Verification Code' : null,
    originConfigured ? 'Allowed Domains' : null,
  ].filter(Boolean) as string[]
  const guardrailsSummary =
    guardrailLabels.length > 0
      ? `Enabled: ${guardrailLabels.join(', ')}`
      : 'No access protection enabled yet. We recommend enabling rate limiting or CAPTCHA.'
  const accessPolicyReady = Boolean(accessPolicy?.access_mode)
  const accessPolicyDetail = accessPolicyLoading
    ? 'Loading access policy...'
    : accessPolicyError
      ? 'Failed to load access policy. Please confirm access settings before publishing.'
      : `Current: ${accessModeMeta.label}`
  const publicGuardrailsDetail = isPublicAccess
    ? guardrailsSummary
    : 'Private access does not require external protection.'
  const publishChecklist = [
    {
      key: 'saved',
      title: 'Latest Changes Saved',
      passed: !hasChanges,
      required: true,
      detail: !hasChanges ? '' : 'You have unsaved changes. Please save first.',
    },
    {
      key: 'workflow',
      title: 'Workflow Associated with Version',
      passed: Boolean(app?.current_version_id || app?.current_version?.workflow_id),
      required: true,
      detail:
        app?.current_version_id || app?.current_version?.workflow_id
          ? ''
          : 'You must bind a workflow version before publishing.',
    },
    {
      key: 'ui_schema',
      title: 'UI Schema Configured',
      passed: Boolean(app?.current_version?.ui_schema),
      required: false,
      detail: app?.current_version?.ui_schema
        ? ''
        : 'UI Schema not configured. The default input form will be used.',
    },
    {
      key: 'access_policy',
      title: 'Access Policy Confirmed',
      passed: accessPolicyReady,
      required: false,
      detail: accessPolicyDetail,
    },
    {
      key: 'public_guardrails',
      title: 'Public Access Protection Configured',
      passed: guardrailsReady,
      required: false,
      detail: publicGuardrailsDetail,
    },
  ]
  const publishReady = publishChecklist.filter((item) => item.required).every((item) => item.passed)
  const saveStatusMap: Record<SaveStatus, { label: string; color: string }> = {
    saved: { label: 'Saved', color: 'text-brand-500' },
    saving: { label: 'Saving', color: 'text-warning' },
    unsaved: { label: 'Unsaved', color: 'text-warning' },
    error: { label: 'Failed to Save', color: 'text-destructive' },
  }
  const saveStatusMeta = saveStatusMap[saveStatus]
  const lastSavedLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '—'

  const extractUISchemaFields = (rawSchema?: Record<string, unknown> | null): UISchemaField[] => {
    if (!rawSchema || typeof rawSchema !== 'object') {
      return []
    }
    const blocks = Array.isArray((rawSchema as { blocks?: unknown }).blocks)
      ? ((rawSchema as { blocks?: unknown }).blocks as any[])
      : []
    return blocks
      .filter((block: any) => block?.type === 'input' || block?.type === 'select')
      .map((block: any, index: number) => {
        const props = block?.props || {}
        const options = Array.isArray(props.options) ? props.options.join(', ') : ''
        return {
          id: typeof block?.id === 'string' && block.id.trim() ? block.id : `field_${index + 1}`,
          label: typeof block?.label === 'string' ? block.label : '',
          inputKey: typeof block?.input_key === 'string' ? block.input_key : '',
          type: block?.type === 'select' ? 'select' : 'input',
          required: Boolean(block?.validation?.required),
          placeholder: typeof props.placeholder === 'string' ? props.placeholder : '',
          options,
        }
      })
  }

  const parseWorkflowDefinition = (workflowJson: string): Record<string, unknown> | null => {
    if (!workflowJson || !workflowJson.trim()) {
      return null
    }
    try {
      const parsed = JSON.parse(workflowJson)
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return parsed as Record<string, unknown>
    } catch (error) {
      return null
    }
  }

  const normalizeVersionPayload = (payload: unknown): AppVersion | null => {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const maybeVersion = (payload as { version?: AppVersion }).version ?? payload
    if (!maybeVersion || typeof maybeVersion !== 'object') {
      return null
    }
    return maybeVersion as AppVersion
  }

  const extractWorkflowId = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const data = payload as { id?: string; workflow?: { id?: string } }
    return data.workflow?.id || data.id || null
  }

  const buildEmptyWorkflowSnapshot = (name?: string): WorkflowSnapshot => ({
    name: name?.trim() ? name.trim() : 'Untitled Workflow',
    nodes: [],
    edges: [],
  })

  const extractWorkflowSnapshot = (
    definition: Record<string, unknown> | null,
    fallbackName: string
  ): WorkflowSnapshot => {
    const payload = definition as { nodes?: unknown; edges?: unknown; name?: unknown } | null
    const nodes = Array.isArray(payload?.nodes) ? (payload?.nodes as WorkflowNode[]) : []
    const edges = Array.isArray(payload?.edges) ? (payload?.edges as Edge[]) : []
    const name =
      typeof payload?.name === 'string' && payload.name.trim() ? payload.name.trim() : fallbackName
    return { name, nodes, edges }
  }

  const buildWorkflowDefinitionPayload = (nameOverride?: string) => ({
    name: nameOverride?.trim() || workflowSnapshot?.name || app?.name || 'Untitled Workflow',
    nodes,
    edges,
  })

  // LoadData
  useEffect(() => {
    loadData()
  }, [workspaceId, appId])

  useEffect(() => {
    loadVersions()
  }, [appId])

  useEffect(() => {
    loadAccessPolicy()
  }, [appId])

  useEffect(() => {
    const hasWorkflowChanges = isDirty
    setHasChanges(isDirty || uiSchemaDirty)
    if (hasWorkflowChanges) {
      if (saveStatus !== 'saving') {
        setSaveStatus('unsaved')
      }
    } else if (saveStatus === 'unsaved') {
      setSaveStatus('saved')
    }
  }, [isDirty, uiSchemaDirty, saveStatus])

  useEffect(() => {
    if (!app) return
    const workflowId = app.current_version?.workflow_id || null
    let cancelled = false

    if (!workflowId) {
      clearWorkflow()
      setWorkflowSnapshot(buildEmptyWorkflowSnapshot(app.name))
      setWorkflowError(null)
      setWorkflowLoading(false)
      setLastSavedAt(null)
      setSaveStatus('saved')
      return
    }

    setWorkflowLoading(true)
    setWorkflowError(null)
    clearWorkflow()

    workflowApi
      .get(workflowId)
      .then((response) => {
        if (cancelled) return
        const workflow = response.workflow
        setWorkflowSnapshot({
          id: workflow.id,
          name: workflow.name || app.name || 'Untitled Workflow',
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          version: workflow.version,
        })
        setLastSavedAt(workflow.updatedAt ? new Date(workflow.updatedAt) : null)
        setSaveStatus('saved')
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Failed to load workflow:', error)
        setWorkflowError('Failed to load workflow. Please try again.')
        setWorkflowSnapshot(buildEmptyWorkflowSnapshot(app.name))
      })
      .finally(() => {
        if (!cancelled) {
          setWorkflowLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [app?.current_version?.workflow_id, app?.name, clearWorkflow])

  useEffect(() => {
    const fields = extractUISchemaFields(
      app?.current_version?.ui_schema as Record<string, unknown> | null
    )
    setUiSchemaFields(fields)
    setUiSchemaDirty(false)
  }, [app?.current_version?.ui_schema])

  useEffect(() => {
    const defaults =
      (app?.current_version?.config_json?.public_input_defaults as Record<string, unknown>) || {}
    setPreviewInputs((prev) => {
      const next: Record<string, string> = {}
      uiSchemaFields.forEach((field, index) => {
        const key = (field.inputKey || field.id || `field_${index + 1}`).trim()
        if (!key) return
        const existing = prev[key]
        if (existing !== undefined) {
          next[key] = existing
          return
        }
        const fallback = defaults[key]
        if (fallback === undefined || fallback === null) {
          next[key] = ''
          return
        }
        next[key] = String(fallback)
      })
      return next
    })
  }, [uiSchemaFields, app?.current_version?.config_json])

  useEffect(() => {
    if (!appId) return
    try {
      const dismissed = localStorage.getItem(`workspace-guide-dismissed:${appId}`) === 'true'
      setShowGuide(!dismissed)
    } catch (error) {
      console.warn('Failed to load guide state:', error)
    }
  }, [appId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const [ws, appData] = await Promise.all([workspaceApi.get(workspaceId), appApi.get(appId)])
      setWorkspace(ws)
      setApp(appData)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoadError('Failed to load app info. Please check your permissions and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersions = async () => {
    if (!appId) return
    try {
      setVersionsLoading(true)
      const response = await appApi.getVersions(appId, { page: 1, page_size: 20 })
      const items = response.items || []
      setVersionList(items)
      if (items.length >= 2 && (!compareFrom || !compareTo)) {
        setCompareFrom(items[0].id)
        setCompareTo(items[1].id)
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setVersionsLoading(false)
    }
  }

  const loadAccessPolicy = async () => {
    if (!appId) return
    try {
      setAccessPolicyLoading(true)
      setAccessPolicyError(null)
      const policy = await appApi.getAccessPolicy(appId)
      setAccessPolicy(policy)
    } catch (error) {
      console.error('Failed to load access policy:', error)
      setAccessPolicy(null)
      setAccessPolicyError('Failed to load access policy')
    } finally {
      setAccessPolicyLoading(false)
    }
  }

  const handleApplyChatSuggestion = (prompt: string) => {
    if (isChatting) return
    setLeftPanelOpen(true)
    setChatInput(prompt)
    setTimeout(() => chatInputRef.current?.focus(), 120)
  }

  // Send Chat Message
  const handleSendChat = async (overrideMessage?: string) => {
    const message = (overrideMessage ?? chatInput).trim()
    if (!message || isChatting) return

    const history = [...chatMessages, { role: 'user', content: message }].slice(-6)
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: message }])
    setIsChatting(true)

    try {
      const response = await request<APIResponse<GenerateWorkflowPayload>>(
        '/ai/generate-workflow',
        {
          method: 'POST',
          body: JSON.stringify({
            description: message,
            conversation_history: history,
          }),
        }
      )

      const payload = response.data
      const workflowDefinition = parseWorkflowDefinition(payload.workflow_json)
      if (!workflowDefinition) {
        throw new Error('Invalid workflow format in AI output')
      }
      const workflowFallbackName = app?.name || workflowSnapshot?.name || 'Untitled Workflow'
      const nextSnapshot = extractWorkflowSnapshot(workflowDefinition, workflowFallbackName)

      const hasWorkflow = Boolean(app?.current_version?.workflow_id)
      let workflowId = app?.current_version?.workflow_id || null
      if (hasWorkflow && workflowId) {
        await request<APIResponse<Record<string, unknown>>>(`/workflows/${workflowId}`, {
          method: 'PATCH',
          body: JSON.stringify({ definition: workflowDefinition }),
        })
      } else {
        const workflowName =
          typeof (workflowDefinition as { name?: string }).name === 'string'
            ? (workflowDefinition as { name?: string }).name?.trim()
            : ''
        const created = await request<APIResponse<Record<string, unknown>>>('/workflows', {
          method: 'POST',
          body: JSON.stringify({
            name: workflowName || `${app?.name || 'AI'} Workflow`,
            description: message,
            definition: workflowDefinition,
            variables: {},
          }),
        })
        workflowId = extractWorkflowId(created.data)
      }

      if (!workflowId) {
        throw new Error('Failed to create workflow. Please try again.')
      }

      const uiSchema = payload.ui_schema
      const dbSchema = payload.db_schema
      let updatedVersion: AppVersion | null = null

      if (hasWorkflow && app?.current_version_id) {
        if (uiSchema) {
          const uiResponse = await request<APIResponse<unknown>>(`/workspaces/${appId}/ui-schema`, {
            method: 'PATCH',
            body: JSON.stringify({ ui_schema: uiSchema }),
          })
          updatedVersion = normalizeVersionPayload(uiResponse.data)
        }
      } else if (workflowId) {
        const versionResponse = await request<APIResponse<unknown>>(
          `/workspaces/${appId}/versions`,
          {
            method: 'POST',
            body: JSON.stringify({
              workflow_id: workflowId,
              ui_schema: uiSchema || {},
              db_schema: dbSchema || {},
              changelog: 'AI Generate',
            }),
          }
        )
        updatedVersion = normalizeVersionPayload(versionResponse.data)
      }

      if (updatedVersion) {
        setApp((prev) =>
          prev
            ? {
                ...prev,
                current_version_id: updatedVersion.id,
                current_version: updatedVersion,
              }
            : prev
        )
        setUiSchemaFields(
          extractUISchemaFields(updatedVersion.ui_schema as Record<string, unknown> | null)
        )
      } else if (uiSchema) {
        setUiSchemaFields(extractUISchemaFields(uiSchema))
      }

      setWorkflowSnapshot({
        ...nextSnapshot,
        id: workflowId ?? undefined,
      })
      setWorkflowError(null)
      markSaved()
      setLastSavedAt(new Date())
      setSaveStatus('saved')
      setUiSchemaDirty(false)
      setUiSchemaError(null)
      setHasChanges(false)
      await loadVersions()

      const suggestionText =
        payload.suggestions && payload.suggestions.length > 0
          ? `\nSuggestion: ${payload.suggestions.join('; ')}`
          : ''
      const assistantContent =
        payload.explanation && payload.explanation.trim()
          ? `${payload.explanation}${suggestionText}`
          : `Workflow and UI Schema generated and synced to the current version.${suggestionText}`
      setChatMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (error) {
      console.error('Failed to generate workflow:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to generate with AI. Please try again.'
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Generation failed: ${message}` },
      ])
    } finally {
      setIsChatting(false)
    }
  }

  // Save
  const handleSave = async () => {
    if (!appId || isSaving) return
    try {
      setIsSaving(true)
      setSaveStatus('saving')

      const definition = buildWorkflowDefinitionPayload()
      const workflowName = definition.name
      let workflowId = app?.current_version?.workflow_id || workflowSnapshot?.id || null

      if (workflowId) {
        await request<APIResponse<Record<string, unknown>>>(`/workflows/${workflowId}`, {
          method: 'PATCH',
          body: JSON.stringify({ definition }),
        })
      } else {
        const created = await request<APIResponse<Record<string, unknown>>>('/workflows', {
          method: 'POST',
          body: JSON.stringify({
            name: workflowName,
            description: app?.description || '',
            definition,
            variables: {},
          }),
        })
        workflowId = extractWorkflowId(created.data)
      }

      if (!workflowId) {
        throw new Error('Failed to save workflow. Please try again.')
      }

      let updatedVersion: AppVersion | null = null
      if (!app?.current_version_id || !app?.current_version?.workflow_id) {
        const versionResponse = await request<APIResponse<unknown>>(
          `/workspaces/${appId}/versions`,
          {
            method: 'POST',
            body: JSON.stringify({
              workflow_id: workflowId,
              ui_schema: app?.current_version?.ui_schema || {},
              db_schema: app?.current_version?.db_schema || {},
              changelog: 'Workflow update',
            }),
          }
        )
        updatedVersion = normalizeVersionPayload(versionResponse.data)
      }

      if (updatedVersion) {
        setApp((prev) =>
          prev
            ? {
                ...prev,
                current_version_id: updatedVersion.id,
                current_version: updatedVersion,
              }
            : prev
        )
      }

      setWorkflowSnapshot((prev) => ({
        id: workflowId ?? prev?.id,
        name: definition.name || prev?.name || 'Untitled Workflow',
        nodes,
        edges,
        version: prev?.version,
      }))
      setWorkflowError(null)
      markSaved()
      setLastSavedAt(new Date())
      setSaveStatus('saved')
      await loadVersions()
    } catch (error) {
      console.error('Failed to save workflow:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  // Publish
  const handlePublish = async () => {
    setPublishWarning(null)
    setPublishDialogOpen(true)
  }

  const handleConfirmPublish = async () => {
    if (!publishReady) {
      setPublishWarning('Please complete all required checks before publishing.')
      return
    }
    try {
      setIsPublishing(true)
      setPublishWarning(null)
      await appApi.publish(appId)
      await loadData()
      setPublishDialogOpen(false)
    } catch (error) {
      console.error('Failed to publish:', error)
      setPublishWarning('Failed to publish. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDismissGuide = () => {
    setShowGuide(false)
    if (!appId) return
    try {
      localStorage.setItem(`workspace-guide-dismissed:${appId}`, 'true')
    } catch (error) {
      console.warn('Failed to save guide state:', error)
    }
  }

  const handleFocusChat = () => {
    setLeftPanelOpen(true)
    setTimeout(() => chatInputRef.current?.focus(), 120)
  }

  const handleFocusSchema = () => {
    setRightPanelOpen(true)
    setActiveRightPanel('schema')
  }

  const formatPreviewTimestamp = (value?: Date | null) => {
    if (!value) return '-'
    return value.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePreviewRun = async () => {
    if (previewRunStatus === 'running') return
    setPreviewRunStatus('running')
    setPreviewRunError(null)
    const startedAt = Date.now()

    try {
      await new Promise((resolve) => setTimeout(resolve, 650))
      const inputCount = Object.keys(previewInputs).length
      const filledCount = Object.values(previewInputs).filter((value) => value?.trim()).length
      const result = {
        summary: `Received ${filledCount}/${inputCount} input fields`,
        inputs: previewInputs,
        output: {
          message:
            'This result is for preview only. After publishing, you can view actual execution output.',
          status: 'preview_success',
        },
      }
      setPreviewRunResult(result)
      setPreviewRunAt(new Date())
      setPreviewRunDuration(Date.now() - startedAt)
      setPreviewRunStatus('success')
    } catch (error) {
      console.error('Preview run failed:', error)
      setPreviewRunStatus('error')
      setPreviewRunError('Failed to run. Please try again.')
    }
  }

  const buildUISchemaPayload = () => {
    const blocks = uiSchemaFields.map((field, index) => {
      const id = field.id.trim() || `field_${index + 1}`
      const inputKey = field.inputKey.trim() || id
      const label = field.label.trim()
      const props: Record<string, unknown> = {}
      const placeholder = field.placeholder.trim()
      if (placeholder) {
        props.placeholder = placeholder
      }
      if (field.type === 'select') {
        const options = field.options
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean)
        if (options.length > 0) {
          props.options = options
        }
      }
      const block: Record<string, unknown> = {
        id,
        type: field.type,
        label: label || undefined,
        input_key: inputKey,
      }
      if (Object.keys(props).length > 0) {
        block.props = props
      }
      if (field.required) {
        block.validation = { required: true }
      }
      return block
    })

    return {
      schema_version: '1.0.0',
      layout: { type: 'single_column' },
      blocks,
    }
  }

  const handleAddUISchemaField = () => {
    setUiSchemaFields((prev) => [
      ...prev,
      {
        id: `field_${Date.now().toString(36)}`,
        label: '',
        inputKey: '',
        type: 'input',
        required: false,
        placeholder: '',
        options: '',
      },
    ])
    setUiSchemaDirty(true)
    setUiSchemaError(null)
    setHasChanges(true)
  }

  const handleRemoveUISchemaField = (index: number) => {
    setUiSchemaFields((prev) => prev.filter((_, idx) => idx !== index))
    setUiSchemaDirty(true)
    setUiSchemaError(null)
    setHasChanges(true)
  }

  const handleUpdateUISchemaField = (index: number, patch: Partial<UISchemaField>) => {
    setUiSchemaFields((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    )
    setUiSchemaDirty(true)
    setUiSchemaError(null)
    setHasChanges(true)
  }

  const handleResetUISchema = () => {
    const fields = extractUISchemaFields(
      app?.current_version?.ui_schema as Record<string, unknown> | null
    )
    setUiSchemaFields(fields)
    setUiSchemaDirty(false)
    setUiSchemaError(null)
  }

  const handleSaveUISchema = async () => {
    try {
      setUiSchemaSaving(true)
      setUiSchemaError(null)
      const uiSchema = buildUISchemaPayload()
      const updatedVersion = await appApi.updateUISchema(appId, {
        ui_schema: uiSchema,
      })
      setApp((prev) =>
        prev
          ? {
              ...prev,
              current_version_id: updatedVersion.id,
              current_version: updatedVersion,
            }
          : prev
      )
      setUiSchemaDirty(false)
      setHasChanges(false)
      await loadVersions()
    } catch (error) {
      console.error('Failed to save UI schema:', error)
      setUiSchemaError('Save failed. Please check the field configuration and try again.')
    } finally {
      setUiSchemaSaving(false)
    }
  }

  const handlePreviewInputChange = (key: string, value: string) => {
    setPreviewInputs((prev) => ({ ...prev, [key]: value }))
  }

  const handleCompareVersions = async () => {
    if (!compareFrom || !compareTo) {
      setCompareError('Please select versions to compare.')
      return
    }
    if (compareFrom === compareTo) {
      setCompareError('Please select different versions to compare.')
      return
    }
    try {
      setCompareLoading(true)
      setCompareError(null)
      const diff = await appApi.compareVersions(appId, compareFrom, compareTo)
      setVersionDiff(diff)
    } catch (error) {
      console.error('Failed to compare versions:', error)
      setCompareError('Comparison failed. Please try again.')
    } finally {
      setCompareLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-studio">
        <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-background-studio">
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load App"
          description={loadError}
          action={{ label: 'Reload', onClick: loadData, icon: RefreshCw }}
          secondaryAction={{
            label: 'Back to Apps',
            onClick: () => router.push('/dashboard/apps'),
          }}
        />
      </div>
    )
  }

  return (
    <AppAccessGate
      app={app}
      permissions={permissions}
      required={['workspace_edit']}
      backHref="/dashboard/apps"
    >
      <TooltipProvider delayDuration={100}>
        <div className="h-full flex flex-col bg-background-studio">
          {/* TopToolbar */}
          <header className="h-12 shrink-0 border-b border-border bg-surface-75 flex items-center px-4 gap-4">
            {/* Back */}
            <Link
              href="/dashboard/apps"
              className="flex items-center gap-1 text-[12px] text-foreground-light hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="h-4 w-px bg-border" />

            {/* AppInfo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-surface-200 border border-border flex items-center justify-center">
                {app?.icon ? (
                  <span className="text-sm">{app.icon}</span>
                ) : (
                  <Bot className="w-3.5 h-3.5 text-foreground-light" />
                )}
              </div>
              <span className="text-[13px] font-medium text-foreground">{app?.name}</span>
              <Badge
                variant="secondary"
                className="text-[10px] bg-surface-200 text-foreground-muted"
              >
                {app?.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              {hasChanges && (
                <Badge variant="secondary" className="text-[10px] bg-warning-200 text-warning">
                  Unsaved
                </Badge>
              )}
            </div>

            {/* VersionInfo */}
            <div className="text-[11px] text-foreground-muted">
              {app?.current_version?.version || 'v0.0.0'}
            </div>
            <div className="text-[11px] text-foreground-muted flex items-center gap-1">
              <span>Save Status:</span>
              <span className={cn('font-medium', saveStatusMeta.color)}>
                {saveStatusMeta.label}
              </span>
              <span className="text-foreground-muted">· {lastSavedLabel}</span>
            </div>

            <div className="flex-1" />

            {/* Action button */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  >
                    <PanelLeftClose className={cn('w-4 h-4', !leftPanelOpen && 'rotate-180')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {leftPanelOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  >
                    <PanelRightClose className={cn('w-4 h-4', !rightPanelOpen && 'rotate-180')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {rightPanelOpen ? 'Hide Config Panel' : 'Show Config Panel'}
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="h-8"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                Save
              </Button>

              <PermissionAction
                permissions={permissions}
                required={['workspace_publish']}
                label="Publish"
                icon={Rocket}
                size="sm"
                className="h-8"
                onClick={handlePublish}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/app/${appId}/monitoring`}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <Eye className="w-4 h-4" />
                      Monitoring
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/app/${appId}/domains`}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <Settings className="w-4 h-4" />
                      Domain Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Pre-Publish Checklist</AlertDialogTitle>
                <AlertDialogDescription>
                  Please confirm all required items below before publishing. Incomplete items will
                  block publishing.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3 text-sm">
                {publishChecklist.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-3 py-2',
                      item.passed
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-amber-500/30 bg-amber-500/5'
                    )}
                  >
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-foreground">
                          {item.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px]',
                            item.required
                              ? 'bg-surface-200 text-foreground-muted'
                              : 'bg-surface-100 text-foreground-light'
                          )}
                        >
                          {item.required ? 'Required' : 'Recommended'}
                        </Badge>
                      </div>
                      {item.detail &&
                        (!item.passed ||
                          item.key === 'access_policy' ||
                          item.key === 'public_guardrails') && (
                          <p className="text-[11px] text-foreground-muted mt-1">{item.detail}</p>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-border bg-surface-100/80 p-3">
                <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                  {isPublicAccess ? (
                    <Globe className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <Lock className="w-4 h-4 text-foreground-muted" />
                  )}
                  Public Access & Permission Info
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-surface-100 text-foreground-light"
                  >
                    {accessModeMeta.label}
                  </Badge>
                </div>
                <p className="mt-2 text-[11px] text-foreground-muted">
                  {accessPolicyLoading
                    ? 'Loading access policy...'
                    : accessPolicyError
                      ? 'Failed to load access policy. Please confirm your access policy before publishing.'
                      : accessModeMeta.description}
                </p>
                {!accessPolicyLoading && !accessPolicyError && (
                  <p className="mt-2 text-[11px] text-foreground-muted">{publicGuardrailsDetail}</p>
                )}
                <Link
                  href={`/dashboard/app/${appId}/domains`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-400"
                >
                  Go to Access Policy & Domain Settings
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {publishWarning && (
                <div className="mt-3 text-[12px] text-amber-500">{publishWarning}</div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmPublish}
                  disabled={!publishReady || isPublishing}
                  className={cn(!publishReady && 'opacity-60')}
                >
                  {isPublishing ? 'Publishing...' : 'Confirm Publish'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* mainRegion - 3Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidePanel - AI Chat */}
            {leftPanelOpen && (
              <div className="w-[320px] shrink-0 border-r border-border bg-surface-75 flex flex-col">
                {/* Chat Header */}
                <div className="h-10 shrink-0 border-b border-border px-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span className="text-[12px] font-medium text-foreground">AI Assistant</span>
                </div>

                {/* Chat MessageList */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="py-8 space-y-6">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-foreground-muted mx-auto mb-3" />
                        <p className="text-[13px] font-medium text-foreground mb-1">
                          AI Build Assistant
                        </p>
                        <p className="text-[12px] text-foreground-muted">
                          Describe the app you want to build, and AI will generate a workflow for
                          you
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface-100/70 p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-foreground-muted">
                          Suggested Actions
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {chatQuickActions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => handleApplyChatSuggestion(action.prompt)}
                              className="rounded-md border border-border bg-surface-200/60 px-2.5 py-1.5 text-[11px] text-foreground-light transition-colors hover:text-foreground hover:border-brand-500/40"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px] text-foreground-muted">
                          After selecting a suggestion you can adjust the description, then click
                          &quot;Generate&quot; again.
                        </div>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-md text-[12px]',
                          message.role === 'user'
                            ? 'bg-brand-200 text-foreground ml-6'
                            : 'bg-surface-100 text-foreground mr-6'
                        )}
                      >
                        {message.content}
                      </div>
                    ))
                  )}
                  {isChatting && (
                    <div className="flex items-center gap-2 text-[12px] text-foreground-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI is thinking...
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="shrink-0 p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Describe the features you need..."
                      value={chatInput}
                      ref={chatInputRef}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendChat()
                        }
                      }}
                      className="min-h-[60px] max-h-[120px] bg-surface-100 border-border focus:border-brand-500 text-[12px] resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-foreground-muted">
                      Enter to send and generate UI/Workflow, Shift+Enter for new line
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleSendChat()}
                      disabled={!chatInput.trim() || isChatting}
                      className="h-7 px-2"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* betweenPanel - Workflow Canvas */}
            <div className="flex-1 flex flex-col bg-background-studio">
              {shouldShowGuide ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full px-6">
                    <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.18),rgba(17,17,17,0.1)_55%,transparent_70%)] p-6">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
                        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(62,207,142,0.12),transparent_45%,rgba(62,207,142,0.08))] opacity-70" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(62,207,142,0.2)_1px,transparent_0)] bg-size-[14px_14px] opacity-25" />
                      </div>

                      <div className="relative flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-brand-500/80">
                              APP BOOT SEQUENCE
                            </p>
                            <h3 className="mt-2 text-[18px] font-semibold text-foreground">
                              App Creation Guide
                            </h3>
                            <p className="mt-1 text-[12px] text-foreground-light max-w-xl">
                              From requirements to publishing, complete 4 steps to get a running AI
                              app.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismissGuide}
                            className="text-[11px]"
                          >
                            Skip for now
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {[
                            {
                              key: '01',
                              title: 'Describe Your App',
                              detail:
                                'Describe the users, inputs, outputs, and constraints in the AI assistant.',
                            },
                            {
                              key: '02',
                              title: 'Edit Workflow',
                              detail: 'Add nodes on the canvas and ensure the logic is complete.',
                            },
                            {
                              key: '03',
                              title: 'Configure Form & Output',
                              detail:
                                'Define input fields and display style in the right-side UI config panel.',
                            },
                            {
                              key: '04',
                              title: 'Test & Publish',
                              detail: 'Run to verify output, then publish for users to access.',
                            },
                          ].map((step) => (
                            <div
                              key={step.key}
                              className="rounded-xl border border-border/60 bg-surface-100/70 px-4 py-3 backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-semibold text-brand-500">
                                  {step.key}
                                </span>
                                <h4 className="text-[13px] font-medium text-foreground">
                                  {step.title}
                                </h4>
                              </div>
                              <p className="mt-2 text-[12px] text-foreground-muted">
                                {step.detail}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Button size="sm" onClick={handleFocusChat} className="h-8">
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Open AI Assistant
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFocusSchema}
                            className="h-8"
                          >
                            <Layout className="w-4 h-4 mr-1.5" />
                            Open UI Config
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Play className="w-4 h-4 mr-1.5" />
                            Run Workflow
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : workflowLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
                </div>
              ) : workflowError ? (
                <div className="flex-1 flex items-center justify-center px-6">
                  <EmptyState
                    icon={AlertTriangle}
                    title="Failed to Load Workflow"
                    description={workflowError}
                    action={{
                      label: 'Reload',
                      onClick: () => window.location.reload(),
                      icon: RefreshCw,
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <LazyWorkflowEditor
                    workflowId={workflowSnapshot?.id || app?.current_version?.workflow_id}
                    workflowVersion={workflowSnapshot?.version}
                    initialData={workflowInitialData}
                    showEmptyState
                    saveStatus={saveStatus}
                    lastSavedAt={lastSavedAt}
                    isOnline={typeof navigator === 'undefined' ? true : navigator.onLine}
                    onSave={handleSave}
                  />
                </div>
              )}
            </div>

            {/* Right sidePanel - Schema Config / Preview */}
            {rightPanelOpen && (
              <div className="w-[320px] shrink-0 border-l border-border bg-surface-75 flex flex-col">
                {/* PanelSwitch */}
                <div className="h-10 shrink-0 border-b border-border px-1 flex items-center gap-1">
                  <button
                    onClick={() => setActiveRightPanel('schema')}
                    className={cn(
                      'flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors',
                      activeRightPanel === 'schema'
                        ? 'bg-surface-100 text-foreground'
                        : 'text-foreground-muted hover:text-foreground'
                    )}
                  >
                    <Code className="w-3.5 h-3.5" />
                    UI Config
                  </button>
                  <button
                    onClick={() => setActiveRightPanel('preview')}
                    className={cn(
                      'flex-1 h-8 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors',
                      activeRightPanel === 'preview'
                        ? 'bg-surface-100 text-foreground'
                        : 'text-foreground-muted hover:text-foreground'
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                </div>

                {/* PanelContent */}
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="mb-3 rounded-md border border-border bg-surface-100/80 p-3">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                      <Globe className="w-4 h-4 text-foreground-muted" />
                      Public Access & Permissions
                    </div>
                    <p className="mt-2 text-[11px] text-foreground-muted">
                      After publishing, you can configure access policies and custom domains. Public
                      access requires careful rate limiting and risk control settings.
                    </p>
                    {app?.status === 'published' && runtimeEntryUrl ? (
                      <Link
                        href={runtimeEntryUrl}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-400"
                      >
                        Access Entry Point
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <p className="mt-2 text-[11px] text-foreground-muted">
                        A public access entry point will be generated after publishing.
                      </p>
                    )}
                  </div>
                  {activeRightPanel === 'schema' ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">
                            UI Schema Config
                          </p>
                          <p className="text-[11px] text-foreground-muted">
                            Visually edit input form fields for public access
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleAddUISchemaField}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Field
                        </Button>
                      </div>

                      {uiSchemaError ? (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {uiSchemaError}
                        </div>
                      ) : null}

                      {uiSchemaFields.length === 0 ? (
                        <EmptyState
                          icon={Layout}
                          title="No Input Fields"
                          description="Add input fields to define the public access form structure and default values."
                          action={{ label: 'Add Field', onClick: handleAddUISchemaField }}
                          className="py-10"
                        />
                      ) : (
                        <div className="space-y-3">
                          {uiSchemaFields.map((field, index) => (
                            <div
                              key={`${field.id}-${index}`}
                              className="rounded-lg border border-border bg-surface-100/90 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-[12px] font-medium text-foreground">
                                  Field {index + 1}
                                </div>
                                <button
                                  onClick={() => handleRemoveUISchemaField(index)}
                                  className="text-foreground-muted hover:text-destructive transition-colors"
                                  aria-label="Delete field"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="mt-3 grid gap-2">
                                <Input
                                  className="h-8"
                                  placeholder="Field name, e.g., Title"
                                  value={field.label}
                                  onChange={(event) =>
                                    handleUpdateUISchemaField(index, { label: event.target.value })
                                  }
                                />
                                <Input
                                  className="h-8"
                                  placeholder="Input key, e.g., title"
                                  value={field.inputKey}
                                  onChange={(event) =>
                                    handleUpdateUISchemaField(index, {
                                      inputKey: event.target.value,
                                    })
                                  }
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) =>
                                      handleUpdateUISchemaField(index, {
                                        type: value === 'select' ? 'select' : 'input',
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Field type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="input">Text Input</SelectItem>
                                      <SelectItem value="select">Dropdown Select</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    className="h-8"
                                    placeholder="Placeholder text"
                                    value={field.placeholder}
                                    onChange={(event) =>
                                      handleUpdateUISchemaField(index, {
                                        placeholder: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                                {field.type === 'select' ? (
                                  <Input
                                    className="h-8"
                                    placeholder="Options, separated by commas"
                                    value={field.options}
                                    onChange={(event) =>
                                      handleUpdateUISchemaField(index, {
                                        options: event.target.value,
                                      })
                                    }
                                  />
                                ) : null}
                                <label className="flex items-center gap-2 text-[11px] text-foreground-muted">
                                  <Checkbox
                                    checked={field.required}
                                    onCheckedChange={(checked) =>
                                      handleUpdateUISchemaField(index, {
                                        required: checked === true,
                                      })
                                    }
                                  />
                                  Required field
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-foreground-muted">
                          {uiSchemaDirty ? 'Unsaved changes' : 'Saved'}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={handleResetUISchema}>
                            Reset
                          </Button>
                          <Button size="sm" onClick={handleSaveUISchema} disabled={uiSchemaSaving}>
                            {uiSchemaSaving ? 'Saving...' : 'Save UI'}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-surface-100/90 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                              <GitCompare className="w-4 h-4 text-foreground-muted" />
                              Version Comparison
                            </div>
                            <p className="mt-1 text-[11px] text-foreground-muted">
                              Select versions to view UI/config diff summary.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={loadVersions}
                            disabled={versionsLoading}
                          >
                            {versionsLoading ? 'Loading...' : 'Refresh'}
                          </Button>
                        </div>

                        {versionList.length < 2 ? (
                          <div className="mt-3 text-[11px] text-foreground-muted">
                            Not enough versions to compare. At least two versions are needed.
                          </div>
                        ) : (
                          <>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Select value={compareFrom} onValueChange={setCompareFrom}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select version A" />
                                </SelectTrigger>
                                <SelectContent>
                                  {versionList.map((version) => (
                                    <SelectItem key={version.id} value={version.id}>
                                      {version.version} · {version.created_at?.slice(0, 10)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={compareTo} onValueChange={setCompareTo}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select version B" />
                                </SelectTrigger>
                                <SelectContent>
                                  {versionList.map((version) => (
                                    <SelectItem key={version.id} value={version.id}>
                                      {version.version} · {version.created_at?.slice(0, 10)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={handleCompareVersions}
                                disabled={compareLoading}
                              >
                                {compareLoading ? 'Comparing...' : 'Compare'}
                              </Button>
                              {compareError ? (
                                <span className="text-[11px] text-destructive">{compareError}</span>
                              ) : null}
                            </div>

                            {versionDiff ? (
                              <div className="mt-3 rounded-md border border-border bg-surface-200/60 px-3 py-2">
                                <div className="text-[11px] text-foreground-muted">
                                  {versionDiff.from.version} → {versionDiff.to.version}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {versionDiff.changed_fields.length === 0 ? (
                                    <Badge variant="secondary">No Differences</Badge>
                                  ) : (
                                    versionDiff.changed_fields.map((field) => (
                                      <Badge key={field} variant="secondary">
                                        {field}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">Live Preview</p>
                        <p className="text-[11px] text-foreground-muted">
                          UI Schema changes are synced to the preview form in real time. Saved
                          changes will be applied to public access.
                        </p>
                      </div>

                      {uiSchemaFields.length === 0 ? (
                        <EmptyState
                          icon={Eye}
                          title="No Previewable Fields"
                          description="Add fields in the UI Config tab first, then preview them here."
                          action={{ label: 'Go to Config', onClick: handleFocusSchema }}
                          className="py-10"
                        />
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-border bg-surface-100/90 p-4">
                            <div className="text-[12px] font-medium text-foreground mb-3">
                              Preview Input Form
                            </div>
                            <div className="space-y-2">
                              {uiSchemaFields.map((field, index) => {
                                const key = (
                                  field.inputKey ||
                                  field.id ||
                                  `field_${index + 1}`
                                ).trim()
                                const value = previewInputs[key] ?? ''
                                return (
                                  <div key={`${key}-${index}`} className="space-y-1">
                                    <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                                      <span className="text-foreground">
                                        {field.label || 'Untitled Field'}
                                      </span>
                                      {field.required ? (
                                        <span className="text-destructive">*</span>
                                      ) : null}
                                      <span className="text-[10px] text-foreground-muted">
                                        ({key})
                                      </span>
                                    </div>
                                    {field.type === 'select' ? (
                                      <Select
                                        value={value}
                                        onValueChange={(nextValue) =>
                                          handlePreviewInputChange(key, nextValue)
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Please select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options
                                            .split(',')
                                            .map((option) => option.trim())
                                            .filter(Boolean)
                                            .map((option) => (
                                              <SelectItem key={option} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        className="h-8"
                                        placeholder={field.placeholder || 'Enter value'}
                                        value={value}
                                        onChange={(event) =>
                                          handlePreviewInputChange(key, event.target.value)
                                        }
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-surface-100/90 p-4">
                            <div className="text-[12px] font-medium text-foreground mb-2">
                              Input Mapping & Preview Data
                            </div>
                            <div className="text-[11px] text-foreground-muted mb-2">
                              Saving the UI schema will update the workflow input mapping.
                            </div>
                            {(() => {
                              const mapping = app?.current_version?.config_json?.input_mapping as
                                | Record<string, unknown>
                                | undefined
                              const missingWorkflow =
                                (mapping?.missing_in_workflow as string[]) || []
                              const missingSchema = (mapping?.missing_in_schema as string[]) || []
                              const duplicateTargets =
                                (mapping?.duplicate_targets as string[]) || []
                              const hasWarnings =
                                missingWorkflow.length > 0 ||
                                missingSchema.length > 0 ||
                                duplicateTargets.length > 0
                              if (!mapping || !hasWarnings) {
                                return (
                                  <div className="text-[11px] text-foreground-muted">
                                    No input mapping issues detected.
                                  </div>
                                )
                              }
                              return (
                                <div className="space-y-2 text-[11px]">
                                  {missingWorkflow.length > 0 ? (
                                    <div className="text-warning">
                                      Missing in workflow: {missingWorkflow.join(', ')}
                                    </div>
                                  ) : null}
                                  {missingSchema.length > 0 ? (
                                    <div className="text-warning">
                                      Missing in UI Schema: {missingSchema.join(', ')}
                                    </div>
                                  ) : null}
                                  {duplicateTargets.length > 0 ? (
                                    <div className="text-warning">
                                      Duplicate mappings: {duplicateTargets.join(', ')}
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })()}
                            <pre className="mt-3 rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
                              {JSON.stringify(previewInputs, null, 2)}
                            </pre>
                          </div>

                          <div className="rounded-lg border border-border bg-surface-100/90 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[12px] font-medium text-foreground">
                                  Preview Run
                                </div>
                                <div className="text-[11px] text-foreground-muted mt-1">
                                  Quick run with the current inputs to verify the output structure.
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handlePreviewRun}
                                disabled={previewRunStatus === 'running'}
                              >
                                {previewRunStatus === 'running' && (
                                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                )}
                                Run
                              </Button>
                            </div>

                            {previewRunError && (
                              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                                {previewRunError}
                              </div>
                            )}

                            {previewRunResult ? (
                              <div className="mt-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                                  <Badge variant="secondary">Completed</Badge>
                                  <span>Executed at: {formatPreviewTimestamp(previewRunAt)}</span>
                                  <span>
                                    Duration:{' '}
                                    {previewRunDuration !== null ? `${previewRunDuration}ms` : '-'}
                                  </span>
                                </div>
                                <div className="rounded-md border border-border bg-surface-200/70 px-3 py-2 text-[11px] text-foreground-light">
                                  {String(previewRunResult.summary || 'Preview result generated')}
                                </div>
                                <pre className="rounded-md bg-surface-200/70 border border-border px-3 py-2 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono">
                                  {JSON.stringify(previewRunResult, null, 2)}
                                </pre>
                              </div>
                            ) : (
                              <div className="mt-3 text-[11px] text-foreground-muted">
                                Not yet run. Click &quot;Run&quot; to generate preview results.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </AppAccessGate>
  )
}

export default function BuilderPage() {
  const params = useParams()
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId as string | undefined)
  const appId = Array.isArray(params?.appId)
    ? params.appId[0]
    : (params?.appId as string | undefined)

  if (!workspaceId || !appId) {
    return null
  }

  return <BuilderPageContent workspaceId={workspaceId} appId={appId} />
}

// Plus icon (inlined to avoid duplicate lucide-react import)
function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
