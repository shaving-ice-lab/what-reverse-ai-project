'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Database, Download, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { request } from '@/lib/api/shared'
import { cn } from '@/lib/utils'

const WORKSPACE_STORAGE_KEY = 'last_workspace_id'
const HISTORY_STORAGE_KEY = 'data-transfer-history-v1'
const MAX_HISTORY_ITEMS = 20
const MAX_IMPORT_MB = 5
const MAX_IMPORT_BYTES = MAX_IMPORT_MB * 1024 * 1024
const AUDIT_ACTIONS = [
  'workspace.export',
  'workflow.import',
  'workspace.schema.import',
  'workspace.db.backup',
  'workspace.db.restore',
]

type ApiResponse<T> = {
  code: string
  message: string
  data: T
}

type ApiListResponse<T> = ApiResponse<T> & {
  meta?: { total?: number; page?: number; page_size?: number }
}

type WorkspaceOption = {
  id: string
  name: string
  slug?: string
  icon?: string
  status?: string
}

type WorkflowImportResponse = {
  workflow?: { id: string; name?: string }
}

type ExportConfigResponse = {
  export?: { exported_at?: string }
  filename?: string
}

type SchemaImportResponse = {
  version?: { id?: string; version?: string }
}

type BackupResponse = {
  backup?: { backup_id: string; tables: number; database?: string }
}

type RestoreResponse = {
  restore?: { backup_id: string; restored_tables: number }
}

type AuditLogRecord = {
  id: string
  workspace_id: string
  action: string
  target_type: string
  target_id?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

type HistoryEntry = {
  id: string
  workspaceId: string
  action:
    | 'workspace_export'
    | 'workflow_import'
    | 'schema_import'
    | 'db_backup'
    | 'db_restore'
    | 'workspace.export'
    | 'workflow.import'
    | 'workspace.schema.import'
    | 'workspace.db.backup'
    | 'workspace.db.restore'
  status: 'success' | 'failed'
  label: string
  detail?: string
  timestamp: string
}

const extractWorkspaceList = (payload: unknown): WorkspaceOption[] => {
  if (!payload || typeof payload !== 'object') return []
  const data = (payload as { data?: unknown }).data ?? payload
  if (Array.isArray(data)) return data as WorkspaceOption[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: WorkspaceOption[] }).items
  }
  if (Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: WorkspaceOption[] }).items
  }
  return []
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const createHistoryId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const formatHistoryTimestamp = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

const loadHistoryFromStorage = (workspaceId: string): HistoryEntry[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => entry.workspaceId === workspaceId)
    }
    if (parsed && typeof parsed === 'object') {
      const list = (parsed as Record<string, unknown>)[workspaceId]
      return Array.isArray(list) ? (list as HistoryEntry[]) : []
    }
  } catch {
    // ignore invalid storage
  }
  return []
}

const saveHistoryToStorage = (workspaceId: string, entries: HistoryEntry[]) => {
  if (typeof window === 'undefined') return
  let store: Record<string, HistoryEntry[]> = {}
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        store = parsed as Record<string, HistoryEntry[]>
      }
    }
  } catch {
    store = {}
  }
  store[workspaceId] = entries
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store))
}

const validateJsonFile = (file: File, label: string) => {
  if (!file) return `Please select a ${label} JSON file`
  if (!file.name.toLowerCase().endsWith('.json')) return 'Only .json files are supported.'
  if (file.size === 0) return 'File is empty.'
  if (file.size > MAX_IMPORT_BYTES)
    return `File exceeds ${MAX_IMPORT_MB}MB. Please split and re-import.`
  if (file.type && !file.type.toLowerCase().includes('json')) return 'File type must be JSON.'
  return null
}

const readJsonFile = async (file: File) => {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (!isRecord(parsed)) {
    throw new Error('JSON must be an object.')
  }
  return parsed
}

const validateWorkflowPayload = (payload: Record<string, unknown>) => {
  const rawWorkflow = isRecord(payload.workflow) ? payload.workflow : payload
  if (!isRecord(rawWorkflow)) return 'Workflow structure is invalid.'
  if (rawWorkflow.name !== undefined && typeof rawWorkflow.name !== 'string') {
    return 'workflow.name must be a string.'
  }
  if (
    rawWorkflow.description !== undefined &&
    typeof rawWorkflow.description !== 'string' &&
    rawWorkflow.description !== null
  ) {
    return 'workflow.description must be a string or null.'
  }
  if (rawWorkflow.definition !== undefined && !isRecord(rawWorkflow.definition)) {
    return 'workflow.definition must be an object.'
  }
  if (
    rawWorkflow.variables !== undefined &&
    rawWorkflow.variables !== null &&
    !isRecord(rawWorkflow.variables)
  ) {
    return 'workflow.variables must be an object.'
  }
  if (rawWorkflow.trigger_type !== undefined && typeof rawWorkflow.trigger_type !== 'string') {
    return 'workflow.trigger_type must be a string.'
  }
  if (
    rawWorkflow.trigger_config !== undefined &&
    rawWorkflow.trigger_config !== null &&
    !isRecord(rawWorkflow.trigger_config)
  ) {
    return 'workflow.trigger_config must be an object.'
  }

  const definition = isRecord(rawWorkflow.definition) ? rawWorkflow.definition : rawWorkflow
  const nodes =
    (definition as { nodes?: unknown }).nodes ?? (rawWorkflow as { nodes?: unknown }).nodes
  const edges =
    (definition as { edges?: unknown }).edges ?? (rawWorkflow as { edges?: unknown }).edges
  if (nodes !== undefined && !Array.isArray(nodes)) return 'nodes must be an array.'
  if (edges !== undefined && !Array.isArray(edges)) return 'edges must be an array.'
  if (!Array.isArray(nodes) && !Array.isArray(edges)) return 'Missing nodes or edges.'

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (!isRecord(node)) return 'Each node must be an object.'
      if (typeof node.id !== 'string' || node.id.trim() === '') {
        return 'nodes.id must be a non-empty string.'
      }
    }
  }
  if (Array.isArray(edges)) {
    for (const edge of edges) {
      if (!isRecord(edge)) return 'Each edge must be an object.'
      if (typeof edge.source !== 'string' || edge.source.trim() === '') {
        return 'edges.source must be a non-empty string.'
      }
      if (typeof edge.target !== 'string' || edge.target.trim() === '') {
        return 'edges.target must be a non-empty string.'
      }
    }
  }
  return null
}

const validateSchemaPayload = (payload: Record<string, unknown>) => {
  const version = isRecord(payload.current_version)
    ? payload.current_version
    : isRecord(payload.version)
      ? payload.version
      : payload
  if (!isRecord(version)) return 'Schema structure is invalid.'

  const uiSchema = version.ui_schema ?? payload.ui_schema ?? undefined
  const dbSchema = version.db_schema ?? payload.db_schema ?? undefined
  const configJson = version.config_json ?? payload.config_json ?? undefined
  const workflowId = version.workflow_id ?? payload.workflow_id

  if (uiSchema === undefined && dbSchema === undefined && configJson === undefined) {
    return 'Missing ui_schema, db_schema, or config_json.'
  }
  if (uiSchema !== undefined && !isRecord(uiSchema)) return 'ui_schema must be an object.'
  if (dbSchema !== undefined && !isRecord(dbSchema)) return 'db_schema must be an object.'
  if (configJson !== undefined && !isRecord(configJson)) return 'config_json must be an object.'
  if (workflowId !== undefined && workflowId !== null && typeof workflowId !== 'string') {
    return 'workflow_id must be a string.'
  }
  return null
}

const auditActionLabels: Record<string, string> = {
  'workspace.export': 'Workspace Config Export',
  'workflow.import': 'Workflow Import',
  'workspace.schema.import': 'Schema Import',
  'workspace.db.backup': 'Database Backup',
  'workspace.db.restore': 'Database Restore',
}

const readStringValue = (value: unknown) => (typeof value === 'string' ? value : '')

const readNumberValue = (value: unknown) => (typeof value === 'number' ? value : null)

const buildAuditDetail = (action: string, metadata?: Record<string, unknown>) => {
  if (!metadata) return ''
  const backupId = readStringValue(metadata.backup_id)
  const workflowName = readStringValue(metadata.workflow_name)
  const filename = readStringValue(metadata.filename)
  const appName = readStringValue(metadata.workspace_name) || readStringValue(metadata.app_name)
  const version = readStringValue(metadata.version)
  const versionId = readStringValue(metadata.version_id)
  const tables = readNumberValue(metadata.tables)
  const restoredTables = readNumberValue(metadata.restored_tables)
  const status = readStringValue(metadata.status)
  const errorMessage = readStringValue(metadata.error)

  if (status === 'failed' && errorMessage) {
    return errorMessage
  }

  switch (action) {
    case 'workspace.export':
      if (appName && filename) return `${appName} · ${filename}`
      if (appName) return appName
      return filename || ''
    case 'workflow.import':
      return workflowName || readStringValue(metadata.workflow_id)
    case 'workspace.schema.import':
      if (version) return `Version ${version}`
      if (versionId) return `Version ${versionId.slice(0, 8)}`
      return ''
    case 'workspace.db.backup':
      if (backupId && typeof tables === 'number') return `Backup ${backupId} · ${tables} `
      return backupId ? `Backup ${backupId}` : ''
    case 'workspace.db.restore':
      if (backupId && typeof restoredTables === 'number')
        return `Backup ${backupId} · ${restoredTables} `
      return backupId ? `Backup ${backupId}` : ''
    default:
      return ''
  }
}

const mapAuditLogToHistoryEntry = (log: AuditLogRecord): HistoryEntry => {
  const metadata = isRecord(log.metadata) ? (log.metadata as Record<string, unknown>) : undefined
  const label = auditActionLabels[log.action] || log.action
  const detail = buildAuditDetail(log.action, metadata)
  const status = readStringValue(metadata?.status) === 'failed' ? 'failed' : 'success'
  return {
    id: log.id,
    workspaceId: log.workspace_id,
    action: log.action as HistoryEntry['action'],
    status,
    label,
    detail: detail || undefined,
    timestamp: log.created_at,
  }
}

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const resolveWorkflowImport = (payload: Record<string, unknown>, fallbackName: string) => {
  const rawWorkflow = (payload.workflow as Record<string, unknown> | undefined) ?? payload
  const definition = (rawWorkflow.definition as Record<string, unknown> | undefined) ?? {}
  const nodes = Array.isArray((definition as { nodes?: unknown }).nodes)
    ? (definition as { nodes: unknown[] }).nodes
    : Array.isArray((rawWorkflow as { nodes?: unknown }).nodes)
      ? (rawWorkflow as { nodes: unknown[] }).nodes
      : []
  const edges = Array.isArray((definition as { edges?: unknown }).edges)
    ? (definition as { edges: unknown[] }).edges
    : Array.isArray((rawWorkflow as { edges?: unknown }).edges)
      ? (rawWorkflow as { edges: unknown[] }).edges
      : []

  return {
    name: (rawWorkflow.name as string) || fallbackName,
    description: (rawWorkflow.description as string | null) ?? null,
    icon: (rawWorkflow.icon as string) || '⚡',
    definition: {
      ...definition,
      nodes,
      edges,
    },
    variables: (rawWorkflow.variables as Record<string, unknown>) ?? {},
    trigger_type: (rawWorkflow.trigger_type as string) || 'manual',
    trigger_config: (rawWorkflow.trigger_config as Record<string, unknown>) ?? {},
  }
}

const resolveSchemaPayload = (payload: Record<string, unknown>) => {
  const version =
    (payload.current_version as Record<string, unknown> | undefined) ??
    (payload.version as Record<string, unknown> | undefined) ??
    payload

  return {
    ui_schema: (version.ui_schema ?? payload.ui_schema) as Record<string, unknown> | undefined,
    db_schema: (version.db_schema ?? payload.db_schema) as Record<string, unknown> | undefined,
    config_json: (version.config_json ?? payload.config_json) as
      | Record<string, unknown>
      | undefined,
    workflow_id: (version.workflow_id ?? payload.workflow_id) as string | undefined,
  }
}

export default function ExportPage() {
  const router = useRouter()
  const workflowFileRef = useRef<HTMLInputElement | null>(null)
  const schemaFileRef = useRef<HTMLInputElement | null>(null)

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])
  const [workspacesLoading, setWorkspacesLoading] = useState(false)

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [schemaWorkspaceId, setSchemaWorkspaceId] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<{
    filename: string
    exportedAt?: string
  } | null>(null)

  const [workflowImporting, setWorkflowImporting] = useState(false)
  const [workflowImportError, setWorkflowImportError] = useState<string | null>(null)
  const [workflowImportResult, setWorkflowImportResult] = useState<{
    id: string
    name: string
  } | null>(null)

  const [schemaImporting, setSchemaImporting] = useState(false)
  const [schemaImportError, setSchemaImportError] = useState<string | null>(null)
  const [schemaImportResult, setSchemaImportResult] = useState<{ versionId?: string } | null>(null)

  const [backupLoading, setBackupLoading] = useState(false)
  const [backupError, setBackupError] = useState<string | null>(null)
  const [backupResult, setBackupResult] = useState<{
    backupId: string
    tables: number
    database?: string
  } | null>(null)

  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [restoreBackupId, setRestoreBackupId] = useState('')
  const [restoreResult, setRestoreResult] = useState<{
    backupId: string
    restoredTables: number
  } | null>(null)

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [historySource, setHistorySource] = useState<'backend' | 'local'>('local')
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (storedId) {
      setActiveWorkspaceId(storedId)
    }
  }, [])

  useEffect(() => {
    if (!activeWorkspaceId) return
    let isActive = true

    const loadWorkspaces = async () => {
      try {
        setWorkspacesLoading(true)
        const response = await request<ApiResponse<unknown>>(
          `/workspaces?workspace_id=${activeWorkspaceId}`
        )
        const resolved = extractWorkspaceList(response.data)
        if (isActive) {
          setWorkspaces(resolved)
          if (!selectedWorkspaceId && resolved.length > 0) {
            setSelectedWorkspaceId(resolved[0].id)
          }
          if (!schemaWorkspaceId && resolved.length > 0) {
            setSchemaWorkspaceId(resolved[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error)
        if (isActive) setWorkspaces([])
      } finally {
        if (isActive) setWorkspacesLoading(false)
      }
    }

    loadWorkspaces()
    return () => {
      isActive = false
    }
  }, [activeWorkspaceId, selectedWorkspaceId, schemaWorkspaceId])

  const workspaceOptions = useMemo(() => workspaces, [workspaces])

  const fetchAuditHistory = useCallback(async (workspaceId: string) => {
    setHistoryLoading(true)
    try {
      const actionsParam = encodeURIComponent(AUDIT_ACTIONS.join(','))
      const response = await request<ApiListResponse<AuditLogRecord[]>>(
        `/workspaces/${workspaceId}/audit-logs?actions=${actionsParam}&page=1&page_size=${MAX_HISTORY_ITEMS}`
      )
      const logs = Array.isArray(response.data) ? response.data : []
      const mapped = logs.map(mapAuditLogToHistoryEntry)
      setHistoryEntries(mapped)
      setHistorySource('backend')
    } catch (error) {
      setHistoryEntries(loadHistoryFromStorage(workspaceId))
      setHistorySource('local')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const recordClientAudit = useCallback(
    async (
      action: 'workflow.import' | 'workspace.schema.import',
      metadata: Record<string, unknown>
    ) => {
      if (!activeWorkspaceId) return
      try {
        await request<ApiResponse<{ recorded: boolean }>>(
          `/workspaces/${activeWorkspaceId}/audit-logs/client`,
          {
            method: 'POST',
            body: JSON.stringify({
              action,
              target_type: action === 'workflow.import' ? 'workflow' : 'app_version',
              metadata,
            }),
          }
        )
        await fetchAuditHistory(activeWorkspaceId)
      } catch {
        // ignore audit write failures
      }
    },
    [activeWorkspaceId, fetchAuditHistory]
  )

  useEffect(() => {
    if (!activeWorkspaceId) {
      setHistoryEntries([])
      setHistorySource('local')
      return
    }
    fetchAuditHistory(activeWorkspaceId)
  }, [activeWorkspaceId, fetchAuditHistory])

  const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'workspaceId'>) => {
    if (!activeWorkspaceId) return
    setHistoryEntries((prev) => {
      const next: HistoryEntry[] = [
        {
          id: createHistoryId(),
          workspaceId: activeWorkspaceId,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ].slice(0, MAX_HISTORY_ITEMS)
      saveHistoryToStorage(activeWorkspaceId, next)
      if (historySource === 'local') {
        return next
      }
      return prev
    })
  }

  const handleExportWorkspaceConfig = async () => {
    if (!selectedWorkspaceId) return
    setExporting(true)
    setExportError(null)
    setExportResult(null)
    try {
      const workspaceName =
        workspaceOptions.find((app) => app.id === selectedWorkspaceId)?.name ??
        `Workspace ${selectedWorkspaceId.slice(0, 8)}`
      const response = await request<ApiResponse<ExportConfigResponse>>(
        `/workspaces/${selectedWorkspaceId}/export`
      )
      const exportPayload = response.data?.export ?? response.data
      const filename =
        response.data?.filename || `app-${selectedWorkspaceId.slice(0, 8)}-config.json`
      downloadJson(exportPayload, filename)
      setExportResult({
        filename,
        exportedAt: response.data?.export?.exported_at,
      })
      addHistoryEntry({
        action: 'workspace_export',
        status: 'success',
        label: 'Workspace Config Export',
        detail: `${workspaceName} · ${filename}`,
      })
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export'
      setExportError(message)
      addHistoryEntry({
        action: 'workspace_export',
        status: 'failed',
        label: 'Workspace Config Export',
        detail: message,
      })
    } finally {
      setExporting(false)
    }
  }

  const handleImportWorkflow = async () => {
    const file = workflowFileRef.current?.files?.[0]
    const fileError = file
      ? validateJsonFile(file, 'Workflow')
      : 'Please select a Workflow JSON file'
    if (fileError) {
      setWorkflowImportError(fileError)
      await recordClientAudit('workflow.import', {
        status: 'failed',
        error: fileError,
        file_name: file?.name,
        validation_stage: 'file',
      })
      if (file) {
        addHistoryEntry({
          action: 'workflow_import',
          status: 'failed',
          label: 'Workflow Import',
          detail: `${file.name} · ${fileError}`,
        })
      }
      return
    }
    setWorkflowImporting(true)
    setWorkflowImportError(null)
    setWorkflowImportResult(null)
    try {
      const payload = await readJsonFile(file)
      const validationError = validateWorkflowPayload(payload)
      if (validationError) {
        throw new Error(validationError)
      }
      const fallbackName = file.name.replace(/\.[^/.]+$/, '')
      const workflow = resolveWorkflowImport(payload, fallbackName)
      const response = await request<ApiResponse<WorkflowImportResponse>>('/workflows/import', {
        method: 'POST',
        body: JSON.stringify({ workflow }),
      })
      const imported = response.data?.workflow
      if (!imported?.id) {
        throw new Error('Failed to import: workflow ID was not returned')
      }
      setWorkflowImportResult({
        id: imported.id,
        name: imported.name || workflow.name,
      })
      addHistoryEntry({
        action: 'workflow_import',
        status: 'success',
        label: 'Workflow Import',
        detail: `${file.name} · ${imported.name || workflow.name}`,
      })
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import'
      await recordClientAudit('workflow.import', {
        status: 'failed',
        error: message,
        file_name: file?.name,
        validation_stage: 'content',
      })
      setWorkflowImportError(message)
      addHistoryEntry({
        action: 'workflow_import',
        status: 'failed',
        label: 'Workflow Import',
        detail: `${file.name} · ${message}`,
      })
    } finally {
      setWorkflowImporting(false)
      if (workflowFileRef.current) workflowFileRef.current.value = ''
    }
  }

  const handleImportSchema = async () => {
    const file = schemaFileRef.current?.files?.[0]
    if (!schemaWorkspaceId) {
      setSchemaImportError('Please select a target workspace')
      await recordClientAudit('workspace.schema.import', {
        status: 'failed',
        error: 'Target workspace not selected',
        validation_stage: 'context',
        workspace_id: schemaWorkspaceId,
        source: 'schema_import',
      })
      return
    }
    const fileError = file ? validateJsonFile(file, 'Schema') : 'Please select a Schema JSON file'
    if (fileError) {
      setSchemaImportError(fileError)
      await recordClientAudit('workspace.schema.import', {
        status: 'failed',
        error: fileError,
        file_name: file?.name,
        validation_stage: 'file',
        workspace_id: schemaWorkspaceId,
        source: 'schema_import',
      })
      if (file) {
        addHistoryEntry({
          action: 'schema_import',
          status: 'failed',
          label: 'Schema Import',
          detail: `${file.name} · ${fileError}`,
        })
      }
      return
    }
    setSchemaImporting(true)
    setSchemaImportError(null)
    setSchemaImportResult(null)
    try {
      const payload = await readJsonFile(file)
      const validationError = validateSchemaPayload(payload)
      if (validationError) {
        throw new Error(validationError)
      }
      const schema = resolveSchemaPayload(payload)
      const requestBody: Record<string, unknown> = {
        changelog: `Import Schema · ${new Date().toISOString()}`,
        source: 'schema_import',
      }
      if (schema.ui_schema) requestBody.ui_schema = schema.ui_schema
      if (schema.db_schema) requestBody.db_schema = schema.db_schema
      if (schema.config_json) requestBody.config_json = schema.config_json
      if (schema.workflow_id) requestBody.workflow_id = schema.workflow_id

      const response = await request<ApiResponse<SchemaImportResponse>>(
        `/workspaces/${schemaWorkspaceId}/versions`,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )
      setSchemaImportResult({
        versionId: response.data?.version?.id,
      })
      const workspaceName =
        workspaceOptions.find((app) => app.id === schemaWorkspaceId)?.name ??
        `Workspace ${schemaWorkspaceId.slice(0, 8)}`
      addHistoryEntry({
        action: 'schema_import',
        status: 'success',
        label: 'Schema Import',
        detail: `${workspaceName} · ${file.name}`,
      })
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import'
      await recordClientAudit('workspace.schema.import', {
        status: 'failed',
        error: message,
        file_name: file?.name,
        validation_stage: 'content',
        workspace_id: schemaWorkspaceId,
        source: 'schema_import',
      })
      setSchemaImportError(message)
      addHistoryEntry({
        action: 'schema_import',
        status: 'failed',
        label: 'Schema Import',
        detail: `${file.name} · ${message}`,
      })
    } finally {
      setSchemaImporting(false)
      if (schemaFileRef.current) schemaFileRef.current.value = ''
    }
  }

  const handleBackup = async () => {
    if (!activeWorkspaceId) return
    setBackupLoading(true)
    setBackupError(null)
    setBackupResult(null)
    try {
      const response = await request<ApiResponse<BackupResponse>>(
        `/workspaces/${activeWorkspaceId}/database/backup`,
        { method: 'POST' }
      )
      const backup = response.data?.backup
      if (!backup?.backup_id) {
        throw new Error('Failed to create backup: backup ID was not returned')
      }
      setBackupResult({
        backupId: backup.backup_id,
        tables: backup.tables,
        database: backup.database,
      })
      setRestoreBackupId(backup.backup_id)
      addHistoryEntry({
        action: 'db_backup',
        status: 'success',
        label: 'Database Backup',
        detail: `Backup ${backup.backup_id} · ${backup.tables} `,
      })
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create backup'
      setBackupError(message)
      addHistoryEntry({
        action: 'db_backup',
        status: 'failed',
        label: 'Database Backup',
        detail: message,
      })
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!activeWorkspaceId) return
    if (!restoreBackupId.trim()) {
      setRestoreError('Please enter a Backup ID')
      return
    }
    setRestoreLoading(true)
    setRestoreError(null)
    setRestoreResult(null)
    try {
      const response = await request<ApiResponse<RestoreResponse>>(
        `/workspaces/${activeWorkspaceId}/database/restore`,
        {
          method: 'POST',
          body: JSON.stringify({ backup_id: restoreBackupId.trim() }),
        }
      )
      const restore = response.data?.restore
      if (!restore?.backup_id) {
        throw new Error('Failed to restore: restore result was not returned')
      }
      setRestoreResult({
        backupId: restore.backup_id,
        restoredTables: restore.restored_tables,
      })
      addHistoryEntry({
        action: 'db_restore',
        status: 'success',
        label: 'Database Restore',
        detail: `Backup ${restore.backup_id} · ${restore.restored_tables} `,
      })
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore'
      setRestoreError(message)
      addHistoryEntry({
        action: 'db_restore',
        status: 'failed',
        label: 'Database Restore',
        detail: message,
      })
    } finally {
      setRestoreLoading(false)
    }
  }

  const summaryItems = useMemo(
    () => [
      {
        label: 'Workspace Config Export',
        status: exportError ? 'Failed' : exportResult ? 'Completed' : 'Not yet executed',
        detail: exportResult?.filename,
      },
      {
        label: 'Workflow Import',
        status: workflowImportError
          ? 'Failed'
          : workflowImportResult
            ? 'Completed'
            : 'Not yet executed',
        detail: workflowImportResult?.name,
      },
      {
        label: 'Schema Import',
        status: schemaImportError
          ? 'Failed'
          : schemaImportResult
            ? 'Completed'
            : 'Not yet executed',
        detail: schemaImportResult?.versionId
          ? `Version ${schemaImportResult.versionId.slice(0, 8)}`
          : undefined,
      },
      {
        label: 'Database Backup',
        status: backupError ? 'Failed' : backupResult ? 'Completed' : 'Not yet executed',
        detail: backupResult?.backupId ? `Backup ${backupResult.backupId.slice(0, 8)}` : undefined,
      },
      {
        label: 'Database Restore',
        status: restoreError ? 'Failed' : restoreResult ? 'Completed' : 'Not yet executed',
        detail: restoreResult?.backupId
          ? `Backup ${restoreResult.backupId.slice(0, 8)}`
          : undefined,
      },
    ],
    [
      exportError,
      exportResult,
      workflowImportError,
      workflowImportResult,
      schemaImportError,
      schemaImportResult,
      backupError,
      backupResult,
      restoreError,
      restoreResult,
    ]
  )

  return (
    <PageContainer>
      <p className="page-caption">Data</p>
      <PageHeader
        title="Data Import/Export and Backup"
        description="Export workspace config, import workflows and schemas, and manage workspace backups"
        actions={
          <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
            {activeWorkspaceId ? 'Bound Workspace' : 'No workspace selected'}
          </Badge>
        }
      />

      <div className="max-w-6xl mx-auto">
        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="page-section space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Workspace Config Export</h2>
                <p className="page-panel-description mt-1">
                  Export workspace's current version UI/DB schema and config
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] text-foreground-light">Select Workspace</label>
                  <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                    <SelectTrigger className="bg-surface-100 border-border">
                      <SelectValue
                        placeholder={workspacesLoading ? 'Loading...' : 'Please select a workspace'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceOptions.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          <span className="flex items-center gap-2">
                            <span>{app.icon || '📦'}</span>
                            <span>{app.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleExportWorkspaceConfig}
                    disabled={!selectedWorkspaceId || exporting}
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Config
                      </>
                    )}
                  </Button>
                  {exportResult && (
                    <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                      Exported
                    </Badge>
                  )}
                </div>

                {exportError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {exportError}
                  </div>
                )}
                {exportResult && (
                  <div className="text-[12px] text-foreground-muted">
                    File: {exportResult.filename}
                    {exportResult.exportedAt ? ` · ${exportResult.exportedAt}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Workflow / Schema Import</h2>
                <p className="page-panel-description mt-1">
                  Import Workflow JSON and App Schema files
                </p>
              </div>
              <div className="p-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">Workflow Import</h3>
                    {workflowImportResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        Done
                      </Badge>
                    )}
                  </div>
                  <Input
                    ref={workflowFileRef}
                    type="file"
                    accept="application/json"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    onClick={handleImportWorkflow}
                    disabled={workflowImporting}
                    className="w-full"
                  >
                    {workflowImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Import...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Workflow
                      </>
                    )}
                  </Button>
                  {workflowImportError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {workflowImportError}
                    </div>
                  )}
                  {workflowImportResult && (
                    <div className="flex items-center justify-between text-[12px] text-foreground-muted">
                      <span>Imported: {workflowImportResult.name}</span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => router.push(`/editor/${workflowImportResult.id}`)}
                      >
                        Open
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">Schema Import</h3>
                    {schemaImportResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        Done
                      </Badge>
                    )}
                  </div>
                  <Select value={schemaWorkspaceId} onValueChange={setSchemaWorkspaceId}>
                    <SelectTrigger className="bg-surface-100 border-border">
                      <SelectValue
                        placeholder={workspacesLoading ? 'Loading...' : 'Select Target Workspace'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceOptions.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          <span className="flex items-center gap-2">
                            <span>{app.icon || '📦'}</span>
                            <span>{app.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    ref={schemaFileRef}
                    type="file"
                    accept="application/json"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    onClick={handleImportSchema}
                    disabled={schemaImporting || !schemaWorkspaceId}
                    className="w-full"
                  >
                    {schemaImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Import...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Schema
                      </>
                    )}
                  </Button>
                  {schemaImportError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {schemaImportError}
                    </div>
                  )}
                  {schemaImportResult && (
                    <div className="text-[12px] text-foreground-muted">
                      Version created: {schemaImportResult.versionId?.slice(0, 8)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Workspace Data Backup and Restore</h2>
                <p className="page-panel-description mt-1">
                  Create a backup of workspace data or perform a restore
                </p>
              </div>
              <div className="p-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">Create Backup</h3>
                    {backupResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        Done
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBackup}
                    disabled={backupLoading || !activeWorkspaceId}
                    className="w-full"
                  >
                    {backupLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Backup...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Create Database Backup
                      </>
                    )}
                  </Button>
                  {backupError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {backupError}
                    </div>
                  )}
                  {backupResult && (
                    <div className="text-[12px] text-foreground-muted">
                      Backup {backupResult.backupId} · {backupResult.tables}
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">Restore from Backup</h3>
                    {restoreResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        Done
                      </Badge>
                    )}
                  </div>
                  <Input
                    value={restoreBackupId}
                    onChange={(e) => setRestoreBackupId(e.target.value)}
                    placeholder="Backup ID"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestore}
                    disabled={restoreLoading || !activeWorkspaceId}
                    className="w-full"
                  >
                    {restoreLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Restore...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Execute Restore
                      </>
                    )}
                  </Button>
                  <div className="flex items-start gap-2 text-[12px] text-foreground-muted">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    Restoring will overwrite current database data. We suggest creating a backup
                    first.
                  </div>
                  {restoreError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {restoreError}
                    </div>
                  )}
                  {restoreResult && (
                    <div className="text-[12px] text-foreground-muted">
                      Restored: {restoreResult.restoredTables}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-section space-y-6">
            <div className="page-panel sticky top-6">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Action Summary</h2>
                <p className="page-panel-description mt-1">
                  Current import/export and backup status
                </p>
              </div>
              <div className="p-5 space-y-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] text-foreground-light">{item.label}</div>
                      {item.detail && (
                        <div className="text-[11px] text-foreground-muted">{item.detail}</div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px]',
                        item.status === 'Completed'
                          ? 'bg-brand-200/60 text-brand-500'
                          : item.status === 'Failed'
                            ? 'bg-destructive-200 text-destructive'
                            : 'bg-surface-200 text-foreground-muted'
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="page-panel-title">Export / Import History</h2>
                    <p className="page-panel-description mt-1">Recent {MAX_HISTORY_ITEMS} Record</p>
                  </div>
                  <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
                    {historySource === 'backend' ? 'Audit Log' : 'Local'}
                  </Badge>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {historyLoading ? (
                  <div className="text-[12px] text-foreground-muted">Loading...</div>
                ) : historyEntries.length === 0 ? (
                  <div className="text-[12px] text-foreground-muted">No Records</div>
                ) : (
                  historyEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] text-foreground-light">{entry.label}</div>
                        {entry.detail && (
                          <div className="text-[11px] text-foreground-muted">{entry.detail}</div>
                        )}
                        <div className="text-[10px] text-foreground-muted">
                          {formatHistoryTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px]',
                          entry.status === 'success'
                            ? 'bg-brand-200/60 text-brand-500'
                            : 'bg-destructive-200 text-destructive'
                        )}
                      >
                        {entry.status === 'success' ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[13px] font-medium text-foreground mb-1">Security Tips</h3>
                  <ul className="text-[12px] text-foreground-light space-y-1">
                    <li>• Export files are readable. We suggest encrypting them before saving.</li>
                    <li>
                      • Schema import will create a new version. Please verify in a test environment
                      first.
                    </li>
                    <li>• Database restore will overwrite existing data. Create a backup first.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
