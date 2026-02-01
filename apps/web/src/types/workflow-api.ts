/**
 * 工作流 API 类型定义
 */

import type { WorkflowNode, WorkflowEdge } from "./workflow";

// 工作流状态
export type WorkflowStatus = "draft" | "published" | "archived";

// 工作流可见性
export type WorkflowVisibility = "private" | "public" | "team";

// 工作流元数据
export interface WorkflowMeta {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: WorkflowStatus;
  visibility: WorkflowVisibility;
  version: number;
  tags: string[];
  folderId?: string;
  
  // 统计信息
  runCount: number;
  successCount: number;
  failCount: number;
  avgDuration?: number;
  lastRunAt?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  
  // 创建者信息
  createdBy: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// 完整工作流定义
export interface Workflow extends WorkflowMeta {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, unknown>;
  settings?: WorkflowSettings;
}

// 工作流设置
export interface WorkflowSettings {
  // 执行设置
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  maxConcurrency?: number;
  
  // 触发设置
  triggers?: WorkflowTrigger[];
  
  // 通知设置
  notifications?: {
    onSuccess?: boolean;
    onFailure?: boolean;
    channels?: string[];
  };
}

// 工作流触发器
export interface WorkflowTrigger {
  id: string;
  type: "manual" | "schedule" | "webhook" | "event";
  enabled: boolean;
  config: Record<string, unknown>;
}

// 创建工作流请求
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  folderId?: string;
  tags?: string[];
  templateId?: string; // 从模板创建
}

// 创建工作流响应
export interface CreateWorkflowResponse {
  success: boolean;
  workflow: WorkflowMeta;
}

// 更新工作流请求
export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: WorkflowStatus;
  visibility?: WorkflowVisibility;
  folderId?: string;
  tags?: string[];
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  variables?: Record<string, unknown>;
  settings?: WorkflowSettings;
}

// 工作流列表请求
export interface ListWorkflowsRequest {
  page?: number;
  pageSize?: number;
  status?: WorkflowStatus;
  visibility?: WorkflowVisibility;
  folderId?: string;
  search?: string;
  tags?: string[];
  sortBy?: "name" | "createdAt" | "updatedAt" | "runCount";
  sortOrder?: "asc" | "desc";
}

// 工作流列表响应
export interface ListWorkflowsResponse {
  success: boolean;
  data: WorkflowMeta[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 工作流详情响应
export interface GetWorkflowResponse {
  success: boolean;
  workflow: Workflow;
}

// 工作流文件夹
export interface WorkflowFolder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  workflowCount: number;
  createdAt: string;
  updatedAt: string;
}

// 文件夹列表响应
export interface ListFoldersResponse {
  success: boolean;
  folders: WorkflowFolder[];
}

// 复制工作流请求
export interface DuplicateWorkflowRequest {
  name?: string;
  folderId?: string;
}

// 导出工作流响应
export interface ExportWorkflowResponse {
  success: boolean;
  data: string; // JSON string
  filename: string;
}

// 导入工作流请求
export interface ImportWorkflowRequest {
  data: string; // JSON string
  name?: string;
  folderId?: string;
}

// 工作流执行记录
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startTime: string;
  endTime?: string;
  duration?: number;
  trigger: {
    type: string;
    data?: Record<string, unknown>;
  };
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    nodeId?: string;
  };
  nodeResults?: Record<string, {
    status: string;
    duration?: number;
    outputs?: Record<string, unknown>;
  }>;
}

// 执行记录列表响应
export interface ListExecutionsResponse {
  success: boolean;
  data: WorkflowExecution[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// 工作流模板
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "createdBy">;
  useCount: number;
  rating: number;
  createdBy: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// 模板列表响应
export interface ListTemplatesResponse {
  success: boolean;
  data: WorkflowTemplate[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}
