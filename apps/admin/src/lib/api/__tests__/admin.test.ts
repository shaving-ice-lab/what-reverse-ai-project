/**
 * Admin API 单元测试
 * 覆盖用户、Workspace、应用、工单等核心管理 API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminApi } from "../admin";
import * as clientModule from "../client";

// Mock client module
vi.mock("../client", async () => {
  const actual = await vi.importActual("../client");
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockApi = clientModule.api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("Admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("capabilities", () => {
    it("应该获取管理员能力点列表", async () => {
      const mockCapabilities = { capabilities: ["users.read", "users.manage"] };
      mockApi.get.mockResolvedValue(mockCapabilities);

      const result = await adminApi.capabilities();

      expect(mockApi.get).toHaveBeenCalledWith("/admin/capabilities");
      expect(result).toEqual(mockCapabilities);
    });
  });

  describe("users", () => {
    it("应该获取用户列表", async () => {
      const mockUsers = {
        items: [{ id: "1", email: "test@example.com" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockUsers);

      const result = await adminApi.users.list({ page: 1, page_size: 20 });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/users", {
        params: { page: 1, page_size: 20 },
      });
      expect(result).toEqual(mockUsers);
    });

    it("应该支持搜索和状态筛选", async () => {
      mockApi.get.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });

      await adminApi.users.list({ search: "test", status: "active", role: "admin" });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/users", {
        params: { search: "test", status: "active", role: "admin" },
      });
    });

    it("应该获取用户详情", async () => {
      const mockUser = { user: { id: "1", email: "test@example.com" } };
      mockApi.get.mockResolvedValue(mockUser);

      const result = await adminApi.users.get("1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/users/1");
      expect(result).toEqual(mockUser);
    });

    it("应该更新用户状态", async () => {
      const mockResult = { user: { id: "1", status: "suspended" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.users.updateStatus("1", {
        status: "suspended",
        reason: "违规操作",
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/users/1/status", {
        status: "suspended",
        reason: "违规操作",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该更新用户角色", async () => {
      const mockResult = { user: { id: "1", role: "admin" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.users.updateRole("1", { role: "admin" });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/users/1/role", {
        role: "admin",
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("workspaces", () => {
    it("应该获取 Workspace 列表", async () => {
      const mockWorkspaces = {
        items: [{ id: "1", name: "Test WS" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockWorkspaces);

      const result = await adminApi.workspaces.list({ page: 1 });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/workspaces", {
        params: { page: 1 },
      });
      expect(result).toEqual(mockWorkspaces);
    });

    it("应该获取 Workspace 详情", async () => {
      const mockWorkspace = {
        workspace: { id: "1", name: "Test WS" },
        members: [],
        apps: [],
      };
      mockApi.get.mockResolvedValue(mockWorkspace);

      const result = await adminApi.workspaces.get("1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/workspaces/1", { params: {} });
      expect(result).toEqual(mockWorkspace);
    });

    it("应该更新 Workspace 状态", async () => {
      const mockResult = { workspace: { id: "1", status: "suspended" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.workspaces.updateStatus("1", {
        status: "suspended",
        reason: "违规内容",
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/workspaces/1/status", {
        status: "suspended",
        reason: "违规内容",
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("apps", () => {
    it("应该获取应用列表", async () => {
      const mockApps = {
        items: [{ id: "1", name: "Test App" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockApps);

      const result = await adminApi.apps.list({ page: 1 });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/apps", { params: { page: 1 } });
      expect(result).toEqual(mockApps);
    });

    it("应该获取应用详情", async () => {
      const mockApp = {
        app: { id: "1", name: "Test App" },
        versions: [],
        domains: [],
      };
      mockApi.get.mockResolvedValue(mockApp);

      const result = await adminApi.apps.get("1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/apps/1", { params: {} });
      expect(result).toEqual(mockApp);
    });

    it("应该更新应用状态", async () => {
      const mockResult = { app: { id: "1", status: "deprecated" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.apps.updateStatus("1", {
        status: "deprecated",
        reason: "版本过旧",
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/apps/1/status", {
        status: "deprecated",
        reason: "版本过旧",
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("support.tickets", () => {
    it("应该获取工单列表", async () => {
      const mockTickets = {
        items: [{ id: "1", subject: "Test Ticket" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockTickets);

      const result = await adminApi.support.tickets.list({ page: 1, status: "open" });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/support/tickets", {
        params: { page: 1, status: "open" },
      });
      expect(result).toEqual(mockTickets);
    });

    it("应该获取工单详情", async () => {
      const mockTicket = { ticket: { id: "1", subject: "Test Ticket" } };
      mockApi.get.mockResolvedValue(mockTicket);

      const result = await adminApi.support.tickets.get("1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/support/tickets/1");
      expect(result).toEqual(mockTicket);
    });

    it("应该更新工单状态", async () => {
      const mockResult = { ticket: { id: "1", status: "resolved" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.support.tickets.updateStatus("1", {
        status: "resolved",
        note: "问题已解决",
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/support/tickets/1/status", {
        status: "resolved",
        note: "问题已解决",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该获取工单评论", async () => {
      const mockComments = { comments: [{ id: "1", body: "Test comment" }] };
      mockApi.get.mockResolvedValue(mockComments);

      const result = await adminApi.support.tickets.comments.list("ticket-1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/support/tickets/ticket-1/comments");
      expect(result).toEqual(mockComments);
    });

    it("应该创建工单评论", async () => {
      const mockComment = { comment: { id: "1", body: "New comment" } };
      mockApi.post.mockResolvedValue(mockComment);

      const result = await adminApi.support.tickets.comments.create("ticket-1", {
        body: "New comment",
        is_internal: true,
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/admin/support/tickets/ticket-1/comments",
        {
          body: "New comment",
          is_internal: true,
          author_name: "Admin",
        }
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe("workflows", () => {
    it("应该获取工作流列表", async () => {
      const mockWorkflows = {
        items: [{ id: "1", name: "Test Workflow" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockWorkflows);

      const result = await adminApi.workflows.list({ page: 1 });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/workflows", { params: { page: 1 } });
      expect(result).toEqual(mockWorkflows);
    });

    it("应该获取工作流详情", async () => {
      const mockWorkflow = {
        workflow: { id: "1", name: "Test Workflow" },
        versions: [],
        recent_executions: [],
      };
      mockApi.get.mockResolvedValue(mockWorkflow);

      const result = await adminApi.workflows.get("1");

      expect(mockApi.get).toHaveBeenCalledWith("/admin/workflows/1");
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe("executions", () => {
    it("应该获取执行列表", async () => {
      const mockExecutions = {
        items: [{ id: "1", status: "success" }],
        total: 1,
        page: 1,
        page_size: 20,
      };
      mockApi.get.mockResolvedValue(mockExecutions);

      const result = await adminApi.executions.list({ page: 1 });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/executions", { params: { page: 1 } });
      expect(result).toEqual(mockExecutions);
    });

    it("应该取消执行", async () => {
      const mockResult = { execution: { id: "1", status: "cancelled" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.executions.cancel("1", { reason: "测试取消" });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/executions/1/cancel", {
        reason: "测试取消",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该重试执行", async () => {
      const mockResult = { execution: { id: "1", status: "pending" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.executions.retry("1");

      expect(mockApi.post).toHaveBeenCalledWith("/admin/executions/1/retry", {});
      expect(result).toEqual(mockResult);
    });
  });

  describe("announcements", () => {
    it("应该创建公告", async () => {
      const mockResult = { announcement: { id: "1", title: "New Announcement" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.announcements.create({
        title: "New Announcement",
        description: "Test description",
        type: "notice",
      });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/announcements", {
        title: "New Announcement",
        description: "Test description",
        type: "notice",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该更新公告", async () => {
      const mockResult = { announcement: { id: "1", is_active: false } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.announcements.update("1", { is_active: false });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/announcements/1", {
        is_active: false,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("billing", () => {
    it("应该处理提现请求", async () => {
      const mockResult = { message: "处理成功" };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.billing.withdrawals.process("1", {
        action: "approve",
        reason: "审核通过",
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/admin/earnings/withdrawals/1/process",
        {
          approved: true,
          reason: "审核通过",
        }
      );
      expect(result).toEqual(mockResult);
    });

    it("应该拒绝退款请求", async () => {
      const mockResult = { refund: { id: "1", status: "rejected" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.billing.refunds.process("1", {
        action: "reject",
        reason: "不符合退款条件",
      });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/billing/refunds/1/process", {
        action: "reject",
        reason: "不符合退款条件",
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("templates", () => {
    it("应该更新模板状态", async () => {
      const mockResult = { template: { id: "1", status: "featured" } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.templates.updateStatus("1", {
        status: "featured",
      });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/templates/1/status", {
        status: "featured",
        reason: "",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该设置模板精选状态", async () => {
      const mockResult = { template: { id: "1", is_featured: true } };
      mockApi.patch.mockResolvedValue(mockResult);

      const result = await adminApi.templates.setFeatured("1", { is_featured: true });

      expect(mockApi.patch).toHaveBeenCalledWith("/admin/templates/1/featured", {
        is_featured: true,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("tags", () => {
    it("应该创建标签", async () => {
      const mockResult = { tag: { id: "1", name: "New Tag" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.tags.create({
        name: "New Tag",
        slug: "new-tag",
        category: "type",
      });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/tags", {
        name: "New Tag",
        slug: "new-tag",
        category: "type",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该删除标签", async () => {
      mockApi.delete.mockResolvedValue({});

      await adminApi.tags.delete("1");

      expect(mockApi.delete).toHaveBeenCalledWith("/admin/tags/1");
    });
  });

  describe("security", () => {
    it("应该轮换密钥", async () => {
      const mockResult = { secret: { id: "1", status: "active" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.security.secrets.rotate("1", { reason: "定期轮换" });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/secrets/1/rotate", {
        reason: "定期轮换",
      });
      expect(result).toEqual(mockResult);
    });

    it("应该禁用密钥", async () => {
      const mockResult = { secret: { id: "1", status: "disabled" } };
      mockApi.post.mockResolvedValue(mockResult);

      const result = await adminApi.security.secrets.disable("1", { reason: "安全风险" });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/secrets/1/disable", {
        reason: "安全风险",
      });
      expect(result).toEqual(mockResult);
    });
  });
});
