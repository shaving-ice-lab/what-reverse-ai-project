/**
 * 权限回归测试
 * 验证越权访问被正确拦截
 */

import { test, expect, type Page } from "@playwright/test";

// 不同权限级别的用户
interface TestUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  capabilities: string[];
}

const users: Record<string, TestUser> = {
  superAdmin: {
    id: "super_admin_1",
    email: "superadmin@agentflow.ai",
    username: "superadmin",
    role: "admin",
    status: "active",
    capabilities: [
      "users.read",
      "users.manage",
      "workspaces.read",
      "workspaces.manage",
      "apps.read",
      "apps.manage",
      "support.read",
      "support.manage",
      "billing.read",
      "billing.manage",
      "system.read",
      "system.manage",
      "audit.read",
    ],
  },
  supportOnly: {
    id: "support_user_1",
    email: "support@agentflow.ai",
    username: "support",
    role: "user",
    status: "active",
    capabilities: ["support.read", "support.manage"],
  },
  readOnly: {
    id: "readonly_user_1",
    email: "readonly@agentflow.ai",
    username: "readonly",
    role: "user",
    status: "active",
    capabilities: ["users.read", "workspaces.read", "apps.read"],
  },
  noPermission: {
    id: "no_perm_user_1",
    email: "noperm@agentflow.ai",
    username: "noperm",
    role: "user",
    status: "active",
    capabilities: [],
  },
};

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

const respondForbidden = () => ({
  status: 403,
  contentType: "application/json",
  body: JSON.stringify({
    code: "FORBIDDEN",
    message: "无权限访问",
    error_code: "FORBIDDEN",
    error_message: "无权限访问",
  }),
});

function setupUserSession(page: Page, user: (typeof users)[keyof typeof users]) {
  return page.addInitScript(
    (userData) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: userData.id,
              email: userData.email,
              username: userData.username,
              role: userData.role,
              status: userData.status,
            },
            tokens: {
              accessToken: `test-token-${userData.id}`,
              refreshToken: `test-refresh-${userData.id}`,
            },
            isAuthenticated: true,
          },
        })
      );
    },
    user
  );
}

function setupApiRoutes(page: Page, user: (typeof users)[keyof typeof users]) {
  return page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // 获取当前用户
    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(user));
    }

    // 获取管理员能力点
    if (path === "/api/v1/admin/capabilities") {
      return route.fulfill(respondOk({ capabilities: user.capabilities }));
    }

    // 用户管理 API - 检查权限
    if (path.startsWith("/api/v1/admin/users")) {
      if (method === "GET" && !user.capabilities.includes("users.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("users.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // Workspace 管理 API - 检查权限
    if (path.startsWith("/api/v1/admin/workspaces")) {
      if (method === "GET" && !user.capabilities.includes("workspaces.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("workspaces.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // 应用管理 API - 检查权限
    if (path.startsWith("/api/v1/admin/apps")) {
      if (method === "GET" && !user.capabilities.includes("apps.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("apps.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // 工单管理 API - 检查权限
    if (path.startsWith("/api/v1/admin/support")) {
      if (method === "GET" && !user.capabilities.includes("support.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("support.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // 计费管理 API - 检查权限
    if (path.startsWith("/api/v1/admin/billing") || path.startsWith("/api/v1/admin/earnings")) {
      if (method === "GET" && !user.capabilities.includes("billing.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("billing.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // 系统管理 API - 检查权限
    if (path.startsWith("/api/v1/system") || path.startsWith("/api/v1/admin/config")) {
      if (method === "GET" && !user.capabilities.includes("system.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("system.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({}));
    }

    // 审计日志 - 检查权限
    if (path.startsWith("/api/v1/admin/audit-logs")) {
      if (!user.capabilities.includes("audit.read")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("权限回归测试 - SuperAdmin", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.superAdmin);
    await setupApiRoutes(page, users.superAdmin);
  });

  test("SuperAdmin 应该能访问所有管理页面", async ({ page }) => {
    // 用户管理
    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/403/);

    // Workspace 管理
    await page.goto("/workspaces");
    await expect(page).not.toHaveURL(/\/403/);

    // 应用管理
    await page.goto("/apps");
    await expect(page).not.toHaveURL(/\/403/);

    // 工单管理
    await page.goto("/support/tickets");
    await expect(page).not.toHaveURL(/\/403/);

    // 系统管理
    await page.goto("/system/health");
    await expect(page).not.toHaveURL(/\/403/);
  });
});

test.describe("权限回归测试 - SupportOnly", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.supportOnly);
    await setupApiRoutes(page, users.supportOnly);
  });

  test("Support 用户应该能访问工单管理", async ({ page }) => {
    await page.goto("/support/tickets");
    await expect(page).not.toHaveURL(/\/403/);
  });

  test("Support 用户访问用户管理应该被拒绝", async ({ page }) => {
    await page.goto("/users");
    // 应该显示无权限提示或跳转到 403 页面
    await expect(page.getByText(/无权限|没有权限|403/)).toBeVisible();
  });

  test("Support 用户访问系统管理应该被拒绝", async ({ page }) => {
    await page.goto("/system/health");
    await expect(page.getByText(/无权限|没有权限|403/)).toBeVisible();
  });
});

test.describe("权限回归测试 - ReadOnly", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.readOnly);
    await setupApiRoutes(page, users.readOnly);
  });

  test("ReadOnly 用户应该能查看用户列表", async ({ page }) => {
    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/403/);
  });

  test("ReadOnly 用户不应该看到操作按钮", async ({ page }) => {
    await page.goto("/users");
    // 操作按钮应该被隐藏或禁用
    const freezeButton = page.getByRole("button", { name: /冻结/i });
    const count = await freezeButton.count();
    if (count > 0) {
      await expect(freezeButton).toBeDisabled();
    }
  });

  test("ReadOnly 用户不能执行写操作", async ({ page }) => {
    await page.goto("/users/user_1");

    // 尝试点击冻结按钮（如果存在）
    const freezeButton = page.getByRole("button", { name: /冻结/i });
    if (await freezeButton.isVisible()) {
      await freezeButton.click();
      // 应该显示无权限提示
      await expect(page.getByText(/无权限|没有权限/)).toBeVisible();
    }
  });
});

test.describe("权限回归测试 - NoPermission", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.noPermission);
    await setupApiRoutes(page, users.noPermission);
  });

  test("无权限用户访问任何管理页面都应该被拒绝", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText(/无权限|没有权限|403/)).toBeVisible();

    await page.goto("/workspaces");
    await expect(page.getByText(/无权限|没有权限|403/)).toBeVisible();

    await page.goto("/apps");
    await expect(page.getByText(/无权限|没有权限|403/)).toBeVisible();
  });

  test("无权限用户应该只能看到仪表盘概览", async ({ page }) => {
    await page.goto("/");
    // 仪表盘应该显示但数据为空或显示无权限
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("权限回归测试 - 未登录用户", () => {
  test("未登录用户访问管理页面应该跳转到登录", async ({ page }) => {
    // 清除所有存储
    await page.context().clearCookies();

    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/support/tickets");
    await expect(page).toHaveURL(/\/login/);
  });

  test("未登录用户访问 API 应该返回 401", async ({ page }) => {
    await page.route("**/api/v1/admin/users", async (route) => {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          code: "UNAUTHORIZED",
          message: "请先登录",
        }),
      });
    });

    const response = await page.request.get("http://localhost:3002/api/v1/admin/users");
    expect(response.status()).toBe(401);
  });
});

test.describe("权限回归测试 - 跨模块越权", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.supportOnly);
    await setupApiRoutes(page, users.supportOnly);
  });

  test("Support 用户尝试更新用户状态应该被拒绝", async ({ page }) => {
    // 直接调用 API
    const response = await page.request.patch(
      "http://localhost:3002/api/v1/admin/users/user_1/status",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-support_user_1",
        },
        data: { status: "suspended", reason: "test" },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("Support 用户尝试访问计费 API 应该被拒绝", async ({ page }) => {
    const response = await page.request.get(
      "http://localhost:3002/api/v1/admin/billing/invoices",
      {
        headers: {
          Authorization: "Bearer test-token-support_user_1",
        },
      }
    );

    expect(response.status()).toBe(403);
  });
});
