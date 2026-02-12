/**
 * Workspace Database API Service
 * Table/Row CRUD, SQL execution, schema graph, stats
 */

import { request } from './shared'

// ===== Type Definitions =====

export interface DatabaseTable {
  name: string
  row_count_est: number
  data_size: number
  column_count: number
  update_time?: string
}

export interface TableColumn {
  name: string
  type: string
  nullable: boolean
  default_value?: string | null
  is_primary_key: boolean
  is_unique: boolean
  extra?: string
  comment?: string
  ordinal_position: number
}

export interface TableIndex {
  name: string
  columns: string[]
  is_unique: boolean
  is_primary: boolean
  type: string
}

export interface ForeignKey {
  name: string
  column: string
  referenced_table: string
  referenced_column: string
  on_update: string
  on_delete: string
}

export interface TableSchema {
  name: string
  columns: TableColumn[]
  indexes: TableIndex[]
  foreign_keys: ForeignKey[]
  primary_key: string[]
  ddl: string
}

export interface CreateColumnDef {
  name: string
  type: string
  nullable?: boolean
  default_value?: string
  unique?: boolean
  comment?: string
}

export interface CreateIndexDef {
  name: string
  columns: string[]
  unique?: boolean
}

export interface CreateTableRequest {
  name: string
  columns: CreateColumnDef[]
  primary_key?: string[]
  indexes?: CreateIndexDef[]
}

export interface AlterColumnDef {
  name: string
  new_name?: string
  type?: string
  nullable?: boolean
  default_value?: string
  comment?: string
}

export interface AlterTableRequest {
  add_columns?: CreateColumnDef[]
  alter_columns?: AlterColumnDef[]
  drop_columns?: string[]
  rename?: string
}

export interface QueryFilter {
  column: string
  operator: string
  value: string
}

export interface QueryRowsParams {
  page?: number
  page_size?: number
  order_by?: string
  order_dir?: 'ASC' | 'DESC'
  filters?: QueryFilter[]
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  affected_rows: number
  duration_ms: number
  total_count?: number
}

export interface QueryHistoryItem {
  sql: string
  duration_ms: number
  status: string
  created_at: string
  error?: string
}

export interface DatabaseStats {
  table_count: number
  total_rows: number
  total_size_bytes: number
  connection_count: number
}

export interface SchemaGraphNode {
  id: string
  name: string
  columns: TableColumn[]
}

export interface SchemaGraphEdge {
  id: string
  source: string
  target: string
  source_column: string
  target_column: string
  constraint_name: string
}

export interface SchemaGraphData {
  nodes: SchemaGraphNode[]
  edges: SchemaGraphEdge[]
}

// ===== Database Role Types =====

export interface DatabaseRole {
  id: string
  workspace_id: string
  role_type: 'read' | 'write' | 'admin'
  db_username: string
  status: 'active' | 'revoked' | 'expired'
  expires_at?: string
  revoked_at?: string
  revoked_reason?: string
  last_used_at?: string
  created_at: string
  updated_at: string
}

// ===== API Response wrapper =====

interface ApiResponse<T> {
  code: string
  message: string
  data: T
  meta?: {
    total?: number
    page?: number
    page_size?: number
  }
}

// ===== Workspace Database API =====

export const workspaceDatabaseApi = {
  /**
   * List all tables in workspace database
   */
  async listTables(workspaceId: string): Promise<DatabaseTable[]> {
    try {
      const response = await request<ApiResponse<{ tables: DatabaseTable[] }>>(
        `/workspaces/${workspaceId}/database/tables`
      )
      return (response.data as any)?.tables ?? []
    } catch {
      // Database not provisioned yet
      return []
    }
  },

  /**
   * Get table schema (columns, indexes, foreign keys, DDL)
   */
  async getTableSchema(workspaceId: string, tableName: string): Promise<TableSchema> {
    const response = await request<ApiResponse<{ schema: TableSchema }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}/schema`
    )
    return (response.data as any)?.schema
  },

  /**
   * Create a new table
   */
  async createTable(workspaceId: string, req: CreateTableRequest): Promise<void> {
    await request<ApiResponse<{ message: string }>>(`/workspaces/${workspaceId}/database/tables`, {
      method: 'POST',
      body: JSON.stringify(req),
    })
  },

  /**
   * Alter table structure
   */
  async alterTable(workspaceId: string, tableName: string, req: AlterTableRequest): Promise<void> {
    await request<ApiResponse<{ message: string }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(req),
      }
    )
  },

  /**
   * Drop a table (requires confirm: true)
   */
  async dropTable(workspaceId: string, tableName: string): Promise<void> {
    await request<ApiResponse<{ message: string }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      }
    )
  },

  /**
   * Query rows from a table with pagination, sorting, and filtering
   */
  async queryRows(
    workspaceId: string,
    tableName: string,
    params?: QueryRowsParams
  ): Promise<QueryResult> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.page_size) searchParams.set('page_size', String(params.page_size))
    if (params?.order_by) searchParams.set('order_by', params.order_by)
    if (params?.order_dir) searchParams.set('order_dir', params.order_dir)
    if (params?.filters) {
      params.filters.forEach((f, i) => {
        searchParams.set(`filters[${i}][column]`, f.column)
        searchParams.set(`filters[${i}][operator]`, f.operator)
        searchParams.set(`filters[${i}][value]`, f.value)
      })
    }

    const qs = searchParams.toString()
    const url = `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}/rows${qs ? `?${qs}` : ''}`
    const response =
      await request<ApiResponse<{ columns: string[]; rows: Record<string, unknown>[] }>>(url)
    const data = response.data as any
    return {
      columns: data?.columns ?? [],
      rows: data?.rows ?? [],
      affected_rows: data?.rows?.length ?? 0,
      duration_ms: 0,
      total_count: (response as any)?.meta?.total ?? 0,
    }
  },

  /**
   * Insert a row into a table
   */
  async insertRow(
    workspaceId: string,
    tableName: string,
    data: Record<string, unknown>
  ): Promise<{ affected_rows: number; duration_ms: number }> {
    const response = await request<ApiResponse<{ affected_rows: number; duration_ms: number }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}/rows`,
      {
        method: 'POST',
        body: JSON.stringify({ data }),
      }
    )
    const payload = response.data as any
    return {
      affected_rows: payload?.affected_rows ?? 0,
      duration_ms: payload?.duration_ms ?? 0,
    }
  },

  /**
   * Update a row (data must include primary key fields)
   */
  async updateRow(
    workspaceId: string,
    tableName: string,
    data: Record<string, unknown>
  ): Promise<{ affected_rows: number; duration_ms: number }> {
    const response = await request<ApiResponse<{ affected_rows: number; duration_ms: number }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}/rows`,
      {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      }
    )
    const payload = response.data as any
    return {
      affected_rows: payload?.affected_rows ?? 0,
      duration_ms: payload?.duration_ms ?? 0,
    }
  },

  /**
   * Delete rows by primary key IDs
   */
  async deleteRows(
    workspaceId: string,
    tableName: string,
    ids: unknown[]
  ): Promise<{ affected_rows: number; duration_ms: number }> {
    const response = await request<ApiResponse<{ affected_rows: number; duration_ms: number }>>(
      `/workspaces/${workspaceId}/database/tables/${encodeURIComponent(tableName)}/rows`,
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }
    )
    const payload = response.data as any
    return {
      affected_rows: payload?.affected_rows ?? 0,
      duration_ms: payload?.duration_ms ?? 0,
    }
  },

  /**
   * Execute raw SQL query
   */
  async executeSQL(workspaceId: string, sql: string, params?: unknown[]): Promise<QueryResult> {
    const response = await request<ApiResponse<QueryResult>>(
      `/workspaces/${workspaceId}/database/query`,
      {
        method: 'POST',
        body: JSON.stringify({ sql, params: params ?? [] }),
      }
    )
    const data = response.data as any
    return {
      columns: data?.columns ?? [],
      rows: data?.rows ?? [],
      affected_rows: data?.affected_rows ?? 0,
      duration_ms: data?.duration_ms ?? 0,
    }
  },

  /**
   * Get SQL query history (last 100)
   */
  async getQueryHistory(workspaceId: string): Promise<QueryHistoryItem[]> {
    const response = await request<ApiResponse<{ history: QueryHistoryItem[] }>>(
      `/workspaces/${workspaceId}/database/query/history`
    )
    return (response.data as any)?.history ?? []
  },

  /**
   * Get database statistics
   */
  async getStats(workspaceId: string): Promise<DatabaseStats> {
    try {
      const response = await request<ApiResponse<{ stats: DatabaseStats }>>(
        `/workspaces/${workspaceId}/database/stats`
      )
      return (
        (response.data as any)?.stats ?? {
          table_count: 0,
          total_rows: 0,
          total_size_bytes: 0,
          connection_count: 0,
        }
      )
    } catch {
      // Database not provisioned yet
      return {
        table_count: 0,
        total_rows: 0,
        total_size_bytes: 0,
        connection_count: 0,
      }
    }
  },

  /**
   * Get schema graph data (ER diagram)
   */
  async getSchemaGraph(workspaceId: string): Promise<SchemaGraphData> {
    const response = await request<ApiResponse<{ graph: SchemaGraphData }>>(
      `/workspaces/${workspaceId}/database/schema-graph`
    )
    return (response.data as any)?.graph ?? { nodes: [], edges: [] }
  },

  /**
   * List database roles
   */
  async listRoles(workspaceId: string): Promise<DatabaseRole[]> {
    const response = await request<ApiResponse<{ roles: DatabaseRole[] } | DatabaseRole[]>>(
      `/workspaces/${workspaceId}/database/roles`
    )
    const payload = response.data as any
    return Array.isArray(payload?.roles) ? payload.roles : Array.isArray(payload) ? payload : []
  },

  /**
   * Create a database role
   */
  async createRole(
    workspaceId: string,
    roleType: 'read' | 'write' | 'admin',
    expiresAt?: string
  ): Promise<{ role: DatabaseRole; password: string }> {
    const response = await request<ApiResponse<{ role: DatabaseRole; password: string }>>(
      `/workspaces/${workspaceId}/database/roles`,
      {
        method: 'POST',
        body: JSON.stringify({ role_type: roleType, expires_at: expiresAt }),
      }
    )
    const payload = response.data as any
    return { role: payload?.role, password: payload?.password || '' }
  },

  /**
   * Rotate a database role's password
   */
  async rotateRole(
    workspaceId: string,
    roleId: string
  ): Promise<{ role: DatabaseRole; password: string }> {
    const response = await request<ApiResponse<{ role: DatabaseRole; password: string }>>(
      `/workspaces/${workspaceId}/database/roles/${roleId}/rotate`,
      { method: 'POST' }
    )
    const payload = response.data as any
    return { role: payload?.role, password: payload?.password || '' }
  },

  /**
   * Revoke a database role
   */
  async revokeRole(workspaceId: string, roleId: string, reason?: string): Promise<DatabaseRole> {
    const response = await request<ApiResponse<{ role: DatabaseRole }>>(
      `/workspaces/${workspaceId}/database/roles/${roleId}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    )
    return (response.data as any)?.role
  },
}
