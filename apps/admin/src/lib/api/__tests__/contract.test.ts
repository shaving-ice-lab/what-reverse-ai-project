/**
 * API 契约测试
 * 验证管理端响应结构稳定
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// API 响应基础结构
const ApiResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.unknown().optional(),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      page_size: z.number().optional(),
    })
    .optional(),
  trace_id: z.string().optional(),
  request_id: z.string().optional(),
});

// 分页列表响应结构
const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
  });

// ===== 实体 Schema 定义 =====

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  display_name: z.string().optional().nullable(),
  role: z.enum(["admin", "user", "creator"]),
  status: z.enum(["active", "suspended"]),
  email_verified: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  last_login_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().optional().nullable(),
  status: z.enum(["active", "suspended", "deleted", "cold_storage"]),
  plan: z.enum(["free", "pro", "enterprise"]),
  region: z.string().optional(),
  owner_user_id: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

const AppSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  owner_user_id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "deprecated", "archived"]),
  pricing_type: z.enum(["free", "pro", "enterprise"]),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  published_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const TicketSchema = z.object({
  id: z.string(),
  reference: z.string(),
  requester_email: z.string().email(),
  requester_name: z.string().optional().nullable(),
  subject: z.string(),
  description: z.string().optional().nullable(),
  category: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "waiting_on_customer", "resolved", "closed"]),
  channel: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

const WorkflowSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "draft", "disabled", "archived"]),
  trigger_type: z.enum(["manual", "schedule", "webhook", "event", "api"]),
  version: z.number(),
  nodes_count: z.number().optional(),
  created_by: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  last_run_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const ExecutionSchema = z.object({
  id: z.string(),
  workflow_id: z.string(),
  workspace_id: z.string(),
  version: z.number(),
  status: z.enum(["pending", "running", "success", "failed", "cancelled", "timeout"]),
  trigger_type: z.string(),
  trigger_data: z.record(z.string(), z.unknown()).optional(),
  duration_ms: z.number().optional().nullable(),
  retries: z.number(),
  error_message: z.string().optional().nullable(),
  error_code: z.string().optional().nullable(),
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
});

const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["notice", "feature", "warning", "improvement"]),
  priority: z.number(),
  is_active: z.boolean(),
  read_count: z.number().optional(),
  total_users: z.number().optional(),
  starts_at: z.string().datetime({ offset: true }).optional().nullable(),
  ends_at: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

const CapabilitiesSchema = z.object({
  capabilities: z.array(z.string()),
});

// ===== 契约测试 =====

describe("API 契约测试", () => {
  describe("基础响应结构", () => {
    it("成功响应应该符合基础结构", () => {
      const response = {
        code: "OK",
        message: "OK",
        data: { id: "1" },
        trace_id: "trace-123",
      };

      const result = ApiResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("错误响应应该符合基础结构", () => {
      const response = {
        code: "VALIDATION_ERROR",
        message: "验证失败",
        trace_id: "trace-456",
      };

      const result = ApiResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("用户 API 契约", () => {
    it("用户列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "user_1",
            email: "user@example.com",
            username: "user1",
            display_name: "User One",
            role: "user",
            status: "active",
            email_verified: true,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
            last_login_at: "2026-02-03T08:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(UserSchema);
      const result = schema.safeParse(response);
      
      if (!result.success) {
        console.error("契约验证失败:", result.error.issues);
      }
      
      expect(result.success).toBe(true);
    });

    it("用户详情响应应该符合契约", () => {
      const response = {
        user: {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          display_name: "User One",
          role: "admin",
          status: "active",
          email_verified: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-02-01T00:00:00Z",
          last_login_at: null,
        },
      };

      const schema = z.object({ user: UserSchema });
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("用户状态更新响应应该符合契约", () => {
      const response = {
        user: {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          role: "user",
          status: "suspended",
          email_verified: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-02-03T08:00:00Z",
        },
      };

      const schema = z.object({ user: UserSchema });
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Workspace API 契约", () => {
    it("Workspace 列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "ws_1",
            name: "Test Workspace",
            slug: "test-workspace",
            icon: "🏢",
            status: "active",
            plan: "pro",
            region: "ap-southeast-1",
            owner_user_id: "user_1",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(WorkspaceSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("应用 API 契约", () => {
    it("应用列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "app_1",
            workspace_id: "ws_1",
            owner_user_id: "user_1",
            name: "Test App",
            slug: "test-app",
            icon: "📦",
            description: "Test application",
            status: "published",
            pricing_type: "free",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
            published_at: "2026-01-15T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(AppSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("工单 API 契约", () => {
    it("工单列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "ticket_1",
            reference: "AF-001",
            requester_email: "customer@example.com",
            requester_name: "Customer",
            subject: "Test Ticket",
            description: "Test description",
            category: "billing",
            priority: "high",
            status: "open",
            channel: "email",
            created_at: "2026-02-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(TicketSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("工作流 API 契约", () => {
    it("工作流列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "wf_1",
            workspace_id: "ws_1",
            name: "Test Workflow",
            slug: "test-workflow",
            description: "Test workflow",
            status: "active",
            trigger_type: "manual",
            version: 1,
            nodes_count: 5,
            created_by: "user_1",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
            last_run_at: "2026-02-03T08:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(WorkflowSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("执行记录 API 契约", () => {
    it("执行记录列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "exec_1",
            workflow_id: "wf_1",
            workspace_id: "ws_1",
            version: 1,
            status: "success",
            trigger_type: "manual",
            trigger_data: {},
            duration_ms: 1500,
            retries: 0,
            started_at: "2026-02-03T08:00:00Z",
            completed_at: "2026-02-03T08:00:01Z",
            created_at: "2026-02-03T08:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(ExecutionSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("公告 API 契约", () => {
    it("公告列表响应应该符合契约", () => {
      const response = {
        items: [
          {
            id: "ann_1",
            title: "Test Announcement",
            description: "Test description",
            type: "notice",
            priority: 2,
            is_active: true,
            read_count: 100,
            total_users: 500,
            starts_at: "2026-02-01T00:00:00Z",
            ends_at: null,
            created_at: "2026-02-01T00:00:00Z",
            updated_at: "2026-02-01T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(AnnouncementSchema);
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("能力点 API 契约", () => {
    it("能力点列表响应应该符合契约", () => {
      const response = {
        capabilities: [
          "users.read",
          "users.manage",
          "workspaces.read",
          "workspaces.manage",
        ],
      };

      const result = CapabilitiesSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("字段必填性验证", () => {
    it("缺少必填字段应该验证失败", () => {
      const invalidUser = {
        id: "user_1",
        // 缺少 email
        username: "user1",
        role: "user",
        status: "active",
        email_verified: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-02-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("无效枚举值应该验证失败", () => {
      const invalidUser = {
        id: "user_1",
        email: "user@example.com",
        username: "user1",
        role: "invalid_role", // 无效角色
        status: "active",
        email_verified: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-02-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("无效日期格式应该验证失败", () => {
      const invalidUser = {
        id: "user_1",
        email: "user@example.com",
        username: "user1",
        role: "user",
        status: "active",
        email_verified: true,
        created_at: "invalid-date", // 无效日期
        updated_at: "2026-02-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("分页参数验证", () => {
    it("分页响应应该包含正确的元数据", () => {
      const response = {
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      };

      const schema = PaginatedResponseSchema(z.unknown());
      const result = schema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("缺少分页元数据应该验证失败", () => {
      const response = {
        items: [],
        // 缺少 total, page, page_size
      };

      const schema = PaginatedResponseSchema(z.unknown());
      const result = schema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});
