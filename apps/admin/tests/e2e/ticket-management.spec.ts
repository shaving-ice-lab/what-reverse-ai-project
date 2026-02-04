/**
 * 工单管理 E2E 测试
 * 关键管理流程：处理工单
 */

import { test, expect, type Page } from "@playwright/test";

const adminUser = {
  id: "admin_1",
  email: "admin@agentflow.ai",
  username: "admin",
  role: "admin",
  status: "active",
};

const mockTickets = [
  {
    id: "ticket_1",
    reference: "AF-001",
    requester_email: "customer@example.com",
    requester_name: "Customer One",
    subject: "订阅升级后额度未同步",
    description: "升级到 Pro 后，额度仍显示为 Free。",
    category: "billing",
    priority: "high",
    status: "open",
    channel: "email",
    created_at: "2026-02-03T07:20:00Z",
    updated_at: "2026-02-03T07:50:00Z",
    sla: {
      first_response_deadline: "2026-02-03T08:20:00Z",
      resolution_deadline: "2026-02-04T07:20:00Z",
    },
  },
  {
    id: "ticket_2",
    reference: "AF-002",
    requester_email: "user@example.com",
    requester_name: "User Two",
    subject: "Webhook 触发失败",
    description: "Webhook 在发布后开始频繁 500。",
    category: "integrations",
    priority: "medium",
    status: "in_progress",
    channel: "dashboard",
    assigned_to: "admin_1",
    created_at: "2026-02-03T05:00:00Z",
    updated_at: "2026-02-03T06:30:00Z",
  },
  {
    id: "ticket_3",
    reference: "AF-003",
    requester_email: "resolved@example.com",
    requester_name: "Resolved User",
    subject: "登录设备异常提醒",
    description: "新设备登录提醒邮件延迟。",
    category: "security",
    priority: "low",
    status: "resolved",
    channel: "email",
    created_at: "2026-02-02T09:00:00Z",
    updated_at: "2026-02-02T10:30:00Z",
  },
];

const mockComments = [
  {
    id: "comment_1",
    ticket_id: "ticket_1",
    body: "已收到工单，正在处理中。",
    author_name: "Support Team",
    is_internal: false,
    created_at: "2026-02-03T07:30:00Z",
  },
  {
    id: "comment_2",
    ticket_id: "ticket_1",
    body: "内部备注：需要联系计费团队核实。",
    author_name: "Admin",
    is_internal: true,
    created_at: "2026-02-03T07:35:00Z",
  },
];

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

async function setupAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: {
            id: "admin_1",
            email: "admin@agentflow.ai",
            username: "admin",
            role: "admin",
            status: "active",
          },
          tokens: {
            accessToken: "test-admin-token",
            refreshToken: "test-admin-refresh",
          },
          isAuthenticated: true,
        },
      })
    );
  });
}

async function mockApiRoutes(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // 获取当前用户
    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(adminUser));
    }

    // 获取管理员能力点
    if (path === "/api/v1/admin/capabilities") {
      return route.fulfill(
        respondOk({
          capabilities: ["support.read", "support.manage"],
        })
      );
    }

    // 工单列表
    if (path === "/api/v1/admin/support/tickets" && method === "GET") {
      const status = url.searchParams.get("status");
      const priority = url.searchParams.get("priority");
      let filteredTickets = mockTickets;

      if (status) {
        filteredTickets = filteredTickets.filter((t) => t.status === status);
      }
      if (priority) {
        filteredTickets = filteredTickets.filter((t) => t.priority === priority);
      }

      return route.fulfill(
        respondOk({
          items: filteredTickets,
          total: filteredTickets.length,
          page: 1,
          page_size: 20,
        })
      );
    }

    // 工单详情
    if (path.match(/\/api\/v1\/admin\/support\/tickets\/ticket_\d+$/) && method === "GET") {
      const ticketId = path.split("/").pop();
      const ticket = mockTickets.find((t) => t.id === ticketId);

      if (ticket) {
        return route.fulfill(respondOk({ ticket }));
      }

      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "NOT_FOUND", message: "工单不存在" }),
      });
    }

    // 工单评论列表
    if (path.match(/\/api\/v1\/admin\/support\/tickets\/ticket_\d+\/comments$/) && method === "GET") {
      const ticketId = path.split("/").slice(-2)[0];
      const comments = mockComments.filter((c) => c.ticket_id === ticketId);
      return route.fulfill(respondOk({ comments }));
    }

    // 创建工单评论
    if (path.match(/\/api\/v1\/admin\/support\/tickets\/ticket_\d+\/comments$/) && method === "POST") {
      const body = request.postDataJSON();
      const newComment = {
        id: `comment_${Date.now()}`,
        ticket_id: path.split("/").slice(-2)[0],
        body: body.body,
        author_name: body.author_name || "Admin",
        is_internal: body.is_internal || false,
        created_at: new Date().toISOString(),
      };
      return route.fulfill(respondOk({ comment: newComment }));
    }

    // 更新工单状态
    if (path.match(/\/api\/v1\/admin\/support\/tickets\/ticket_\d+\/status$/) && method === "PATCH") {
      const ticketId = path.split("/").slice(-2)[0];
      const body = request.postDataJSON();
      const ticket = mockTickets.find((t) => t.id === ticketId);

      if (ticket && body?.status) {
        return route.fulfill(
          respondOk({
            ticket: { ...ticket, status: body.status },
          })
        );
      }
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("工单管理", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("应该显示工单列表", async ({ page }) => {
    await page.goto("/support/tickets");

    // 等待工单列表加载
    await expect(page.getByText("AF-001")).toBeVisible();
    await expect(page.getByText("订阅升级后额度未同步")).toBeVisible();
  });

  test("应该能按状态筛选工单", async ({ page }) => {
    await page.goto("/support/tickets");

    // 选择状态筛选
    await page.getByRole("combobox", { name: /状态/i }).click();
    await page.getByRole("option", { name: /待处理|open/i }).click();

    // 应该只显示待处理状态的工单
    await expect(page.getByText("AF-001")).toBeVisible();
    await expect(page.getByText("AF-003")).not.toBeVisible();
  });

  test("应该能按优先级筛选工单", async ({ page }) => {
    await page.goto("/support/tickets");

    // 选择优先级筛选
    await page.getByRole("combobox", { name: /优先级/i }).click();
    await page.getByRole("option", { name: /高/i }).click();

    // 应该只显示高优先级工单
    await expect(page.getByText("AF-001")).toBeVisible();
  });

  test("应该能查看工单详情", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 验证工单详情显示
    await expect(page.getByText("AF-001")).toBeVisible();
    await expect(page.getByText("订阅升级后额度未同步")).toBeVisible();
    await expect(page.getByText("customer@example.com")).toBeVisible();
  });

  test("应该显示工单评论列表", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 等待评论加载
    await expect(page.getByText("已收到工单，正在处理中。")).toBeVisible();
  });

  test("应该区分内部评论和外部评论", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 内部评论应该有特殊标记
    await expect(page.getByText("内部备注：需要联系计费团队核实。")).toBeVisible();
    await expect(page.locator("[data-internal='true']").first()).toBeVisible();
  });

  test("应该能添加工单评论", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 输入评论内容
    await page.getByPlaceholder(/输入评论|回复/i).fill("问题已解决，请确认。");

    // 提交评论
    await page.getByRole("button", { name: /发送|提交/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功/)).toBeVisible();
  });

  test("应该能添加内部备注", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 切换到内部备注模式
    await page.getByRole("checkbox", { name: /内部备注/i }).check();

    // 输入内部备注
    await page.getByPlaceholder(/输入评论|回复/i).fill("需要技术团队协助排查。");

    // 提交
    await page.getByRole("button", { name: /发送|提交/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功/)).toBeVisible();
  });

  test("应该能更新工单状态", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 点击状态下拉
    await page.getByRole("combobox", { name: /状态/i }).click();

    // 选择新状态
    await page.getByRole("option", { name: /处理中|in_progress/i }).click();

    // 确认状态更新
    await page.getByRole("button", { name: /确认|保存/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功|已更新/)).toBeVisible();
  });

  test("应该能将工单标记为已解决", async ({ page }) => {
    await page.goto("/support/tickets/ticket_2");

    // 点击解决按钮
    await page.getByRole("button", { name: /标记为已解决|解决/i }).click();

    // 填写解决备注
    await page.getByPlaceholder(/备注|原因/i).fill("问题已修复，webhook 正常运行。");

    // 确认
    await page.getByRole("button", { name: /确认/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功/)).toBeVisible();
  });

  test("应该显示 SLA 信息", async ({ page }) => {
    await page.goto("/support/tickets/ticket_1");

    // 验证 SLA 信息显示
    await expect(page.getByText(/首次响应/i)).toBeVisible();
    await expect(page.getByText(/解决期限/i)).toBeVisible();
  });
});
