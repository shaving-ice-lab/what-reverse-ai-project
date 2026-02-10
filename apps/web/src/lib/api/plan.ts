/**
 * PlanningModule API Service
 */

import { request } from './shared'

export interface PlanTask {
  id: string
  module_id: string
  code?: string
  title: string
  phase: string
  owner: string
  deliverable?: string
  acceptance?: string
  estimate_days: number
  status: string
  dependencies?: string[]
  sequence: number
  created_at: string
  updated_at: string
}

export interface PlanModule {
  id: string
  workspace_id: string
  key: string
  name: string
  description?: string
  version: string
  status: string
  sort_order: number
  created_at: string
  updated_at: string
  tasks?: PlanTask[]
}

export interface PlanVersionSummary {
  id: string
  workspace_id: string
  label?: string | null
  note?: string | null
  created_by?: string | null
  created_at: string
}

export interface PlanVersion {
  id: string
  workspace_id: string
  label?: string | null
  note?: string | null
  created_by?: string | null
  created_at: string
  snapshot: Record<string, unknown>
}

export interface PlanRestoreResult {
  modules: number
  tasks: number
}

export interface MetricsDimension {
  name: string
  description: string
  type: string
  labels: string[]
  unit?: string
  buckets?: number[]
}

export interface MetricsDictionary {
  key: string
  title: string
  summary?: string
  metrics: MetricsDimension[]
  notes?: string[]
}

export interface TrackingEventDefinition {
  key: string
  event: string
  category: string
  description: string
  trigger: string
  properties: string[]
  source?: string
}

export interface TrackingEventPlan {
  key: string
  title: string
  summary?: string
  events: TrackingEventDefinition[]
  notes?: string[]
}

export interface IncidentDrillPlanSet {
  key: string
  title: string
  summary: string
  drills: IncidentDrillPlan[]
  notes?: string[]
}

export interface IncidentDrillPlan {
  key: string
  title: string
  severity: string
  frequency: string
  objectives: string[]
  scenarios: IncidentDrillScenario[]
  preconditions: string[]
  steps: IncidentDrillStep[]
  validation: string[]
  rollback: string[]
  owners: string[]
  references?: string[]
}

export interface IncidentDrillScenario {
  key: string
  title: string
  trigger: string
  impact: string
  signals: string[]
}

export interface IncidentDrillStep {
  title: string
  actions: string[]
  expected?: string
}

export interface IncidentOwnerTable {
  key: string
  title: string
  summary: string
  roles: IncidentRole[]
  escalation: IncidentEscalation[]
  notes?: string[]
}

export interface IncidentRole {
  role: string
  primary: string
  backup: string
  responsibilities: string[]
  required_skills?: string[]
}

export interface IncidentEscalation {
  level: string
  condition: string
  action: string
}

export interface PostmortemTemplate {
  key: string
  title: string
  summary: string
  sections: PostmortemSection[]
  checklist: string[]
  action_item_fields: string[]
}

export interface PostmortemSection {
  key: string
  title: string
  questions: string[]
}

export interface ErrorBudgetBurnRate {
  window: string
  threshold: string
  action: string
}

export interface ErrorBudgetConsumptionRule {
  condition: string
  action: string
}

export interface ErrorBudgetRule {
  key: string
  title: string
  slo: string
  window: string
  budget: string
  measurement: string
  query: string
  burn_rate_alerts?: ErrorBudgetBurnRate[]
  consumption_rules?: ErrorBudgetConsumptionRule[]
  notes?: string[]
}

export interface ErrorBudgetPolicyTable {
  key: string
  title: string
  summary: string
  rules: ErrorBudgetRule[]
  notes?: string[]
}

export interface SyntheticProbe {
  key: string
  name: string
  method: string
  target: string
  frequency: string
  timeout: string
  locations: string[]
  success_criteria: string[]
  alerts: string[]
  tags?: string[]
}

export interface SyntheticMonitoringPlan {
  key: string
  title: string
  summary: string
  probes: SyntheticProbe[]
  deployment: string[]
  notes?: string[]
}

export interface OnCallSLOTarget {
  severity: string
  coverage: string
  ack_target: string
  mitigate_target: string
  update_frequency: string
  measurement: string
  owner: string
}

export interface OnCallSLOTable {
  key: string
  title: string
  summary: string
  targets: OnCallSLOTarget[]
  notes?: string[]
}

export interface StabilityTrack {
  key: string
  title: string
  summary: string
  cadence: string
  scope: string[]
  actions: string[]
  acceptance: string[]
  owners: string[]
}

export interface StabilityPlan {
  key: string
  title: string
  summary: string
  tracks: StabilityTrack[]
  notes?: string[]
}

export interface RunbookStep {
  phase: string
  actions: string[]
  expected?: string[]
  rollback?: string[]
}

export interface Runbook {
  key: string
  title: string
  summary: string
  severity: string
  signals: string[]
  preconditions?: string[]
  steps: RunbookStep[]
  verification: string[]
  escalation: string[]
  references?: string[]
}

export interface RunbookPlan {
  key: string
  title: string
  summary: string
  runbooks: Runbook[]
  notes?: string[]
}

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export const planApi = {
  async listModules(workspaceId: string): Promise<PlanModule[]> {
    const response = await request<ApiResponse<{ modules: PlanModule[] }>>(
      `/plans/modules?workspace_id=${workspaceId}`
    )
    return response.data?.modules || []
  },

  async seedModules(workspaceId: string): Promise<PlanModule[]> {
    const response = await request<ApiResponse<{ modules: PlanModule[] }>>('/plans/modules/seed', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId }),
    })
    return response.data?.modules || []
  },

  async createModule(workspaceId: string, data: Partial<PlanModule>): Promise<PlanModule> {
    const response = await request<ApiResponse<{ module: PlanModule }>>('/plans/modules', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        key: data.key,
        name: data.name,
        description: data.description,
        version: data.version,
        status: data.status,
        sort_order: data.sort_order,
      }),
    })
    return response.data.module
  },

  async updateModule(moduleId: string, data: Partial<PlanModule>): Promise<PlanModule> {
    const response = await request<ApiResponse<{ module: PlanModule }>>(
      `/plans/modules/${moduleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          key: data.key,
          name: data.name,
          description: data.description,
          version: data.version,
          status: data.status,
          sort_order: data.sort_order,
        }),
      }
    )
    return response.data.module
  },

  async deleteModule(moduleId: string): Promise<boolean> {
    const response = await request<ApiResponse<{ deleted: boolean }>>(
      `/plans/modules/${moduleId}`,
      { method: 'DELETE' }
    )
    return response.data?.deleted ?? false
  },

  async createTask(moduleId: string, data: Partial<PlanTask>): Promise<PlanTask> {
    const response = await request<ApiResponse<{ task: PlanTask }>>(
      `/plans/modules/${moduleId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify({
          code: data.code,
          title: data.title,
          phase: data.phase,
          owner: data.owner,
          deliverable: data.deliverable,
          acceptance: data.acceptance,
          estimate_days: data.estimate_days,
          status: data.status,
          dependencies: data.dependencies,
          sequence: data.sequence,
        }),
      }
    )
    return response.data.task
  },

  async updateTask(taskId: string, data: Partial<PlanTask>): Promise<PlanTask> {
    const response = await request<ApiResponse<{ task: PlanTask }>>(`/plans/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        code: data.code,
        title: data.title,
        phase: data.phase,
        owner: data.owner,
        deliverable: data.deliverable,
        acceptance: data.acceptance,
        estimate_days: data.estimate_days,
        status: data.status,
        dependencies: data.dependencies,
        sequence: data.sequence,
      }),
    })
    return response.data.task
  },

  async deleteTask(taskId: string): Promise<boolean> {
    const response = await request<ApiResponse<{ deleted: boolean }>>(`/plans/tasks/${taskId}`, {
      method: 'DELETE',
    })
    return response.data?.deleted ?? false
  },

  async reorderTasks(moduleId: string, taskIds: string[]): Promise<boolean> {
    const response = await request<ApiResponse<{ reordered: boolean }>>(
      `/plans/modules/${moduleId}/tasks/reorder`,
      {
        method: 'POST',
        body: JSON.stringify({ task_ids: taskIds }),
      }
    )
    return response.data?.reordered ?? false
  },

  async listVersions(workspaceId: string): Promise<PlanVersionSummary[]> {
    const response = await request<ApiResponse<{ versions: PlanVersionSummary[] }>>(
      `/plans/versions?workspace_id=${workspaceId}`
    )
    return response.data?.versions || []
  },

  async createVersion(
    workspaceId: string,
    data: { label?: string; note?: string } = {}
  ): Promise<PlanVersion> {
    const response = await request<ApiResponse<{ version: PlanVersion }>>('/plans/versions', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        label: data.label,
        note: data.note,
      }),
    })
    return response.data.version
  },

  async getVersion(versionId: string): Promise<PlanVersion> {
    const response = await request<ApiResponse<{ version: PlanVersion }>>(
      `/plans/versions/${versionId}`
    )
    return response.data.version
  },

  async restoreVersion(versionId: string): Promise<PlanRestoreResult> {
    const response = await request<ApiResponse<{ restored: PlanRestoreResult }>>(
      `/plans/versions/${versionId}/restore`,
      { method: 'POST' }
    )
    return response.data.restored
  },

  async getIncidentDrillPlans(): Promise<IncidentDrillPlanSet> {
    const response =
      await request<ApiResponse<{ plan: IncidentDrillPlanSet }>>('/plans/incident-drills')
    return response.data.plan
  },

  async getIncidentOwnerTable(): Promise<IncidentOwnerTable> {
    const response =
      await request<ApiResponse<{ table: IncidentOwnerTable }>>('/plans/incident-owners')
    return response.data.table
  },

  async getPostmortemTemplate(): Promise<PostmortemTemplate> {
    const response = await request<ApiResponse<{ template: PostmortemTemplate }>>(
      '/plans/postmortem-template'
    )
    return response.data.template
  },

  async getMetricsDictionary(): Promise<MetricsDictionary> {
    const response = await request<ApiResponse<{ table: MetricsDictionary }>>(
      '/plans/metrics-dictionary'
    )
    return response.data.table
  },

  async getFrontendTrackingPlan(): Promise<TrackingEventPlan> {
    const response = await request<ApiResponse<{ table: TrackingEventPlan }>>(
      '/plans/tracking-events/frontend'
    )
    return response.data.table
  },

  async getBackendTrackingPlan(): Promise<TrackingEventPlan> {
    const response = await request<ApiResponse<{ table: TrackingEventPlan }>>(
      '/plans/tracking-events/backend'
    )
    return response.data.table
  },

  async getErrorBudgetPolicy(): Promise<ErrorBudgetPolicyTable> {
    const response = await request<ApiResponse<{ table: ErrorBudgetPolicyTable }>>(
      '/plans/sre/error-budgets'
    )
    return response.data.table
  },

  async getSyntheticMonitoringPlan(): Promise<SyntheticMonitoringPlan> {
    const response = await request<ApiResponse<{ plan: SyntheticMonitoringPlan }>>(
      '/plans/sre/synthetic-monitoring'
    )
    return response.data.plan
  },

  async getOnCallSLOTable(): Promise<OnCallSLOTable> {
    const response = await request<ApiResponse<{ table: OnCallSLOTable }>>('/plans/sre/oncall-slo')
    return response.data.table
  },

  async getStabilityPlan(): Promise<StabilityPlan> {
    const response = await request<ApiResponse<{ plan: StabilityPlan }>>(
      '/plans/sre/stability-plan'
    )
    return response.data.plan
  },

  async getRunbookPlan(): Promise<RunbookPlan> {
    const response = await request<ApiResponse<{ plan: RunbookPlan }>>('/plans/runbook')
    return response.data.plan
  },
}
