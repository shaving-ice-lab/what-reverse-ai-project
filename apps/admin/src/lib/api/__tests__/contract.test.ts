/**
 * API contract tests
 * Verify admin response structure stability
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// API response base structure
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

// Paginated list response structure
const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
  });

// ===== Entity Schema Definitions =====

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

// ===== Contract Tests =====

describe("API Contract Tests", () => {
  describe("Base Response Structure", () => {
    it("success response should match base structure", () => {
      const response = {
        code: "OK",
        message: "OK",
        data: { id: "1" },
        trace_id: "trace-123",
      };

      const result = ApiResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("error response should match base structure", () => {
      const response = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        trace_id: "trace-456",
      };

      const result = ApiResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("User API Contract", () => {
    it("user list response should match contract", () => {
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
        console.error("Contract validation failed:", result.error.issues);
      }
      
      expect(result.success).toBe(true);
    });

    it("user details response should match contract", () => {
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

    it("user status update response should match contract", () => {
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

  describe("Workspace API Contract", () => {
    it("workspace list response should match contract", () => {
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

  describe("App API Contract", () => {
    it("app list response should match contract", () => {
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

  describe("Ticket API Contract", () => {
    it("ticket list response should match contract", () => {
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

  describe("Workflow API Contract", () => {
    it("workflow list response should match contract", () => {
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

  describe("Execution API Contract", () => {
    it("execution list response should match contract", () => {
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

  describe("Announcement API Contract", () => {
    it("announcement list response should match contract", () => {
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

  describe("Capabilities API Contract", () => {
    it("capabilities list response should match contract", () => {
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

  describe("Required Field Validation", () => {
    it("missing required fields should fail validation", () => {
      const invalidUser = {
        id: "user_1",
        // Missing email
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

    it("invalid enum values should fail validation", () => {
      const invalidUser = {
        id: "user_1",
        email: "user@example.com",
        username: "user1",
        role: "invalid_role", // Invalid role
        status: "active",
        email_verified: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-02-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("invalid date format should fail validation", () => {
      const invalidUser = {
        id: "user_1",
        email: "user@example.com",
        username: "user1",
        role: "user",
        status: "active",
        email_verified: true,
        created_at: "invalid-date", // Invalid date
        updated_at: "2026-02-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("Pagination Parameter Validation", () => {
    it("paginated response should contain correct metadata", () => {
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

    it("missing pagination metadata should fail validation", () => {
      const response = {
        items: [],
        // Missing total, page, page_size
      };

      const schema = PaginatedResponseSchema(z.unknown());
      const result = schema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});
