/**
 * 用户管理 E2E 测试
 * 关键管理流程：冻结用户
 */

import { test, expect, type Page } from "@playwright/test";

const adminUser = {
  id: "admin_1",
  email: "admin@agentflow.ai",
  username: "admin",
  role: "admin",
  status: "active",
  email_verified: true,
};

const mockUsers = [
  {
    id: "user_1",
    email: "user1@example.com",
    username: "user1",
    display_name: "User One",
    role: "user",
    status: "active",
    email_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    last_login_at: "2026-02-03T08:00:00Z",
  },
  {
    id: "user_2",
    email: "user2@example.com",
    username: "user2",
    display_name: "User Two",
    role: "creator",
    status: "active",
    email_verified: true,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-02-02T00:00:00Z",
    last_login_at: "2026-02-02T10:00:00Z",
  },
  {
    id: "user_3",
    email: "suspended@example.com",
    username: "suspended",
    display_name: "Suspended User",
    role: "user",
    status: "suspended",
    email_verified: true,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    last_login_at: "2026-01-15T08:00:00Z",
  },
];

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

async function setupAuthenticatedSession(page: Page) {
  // 预设登录状态
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
          capabilities: ["users.read", "users.manage"],
        })
      );
    }

    // 用户列表
    if (path === "/api/v1/admin/users" && method === "GET") {
      const status = url.searchParams.get("status");
      let filteredUsers = mockUsers;
      
      if (status) {
        filteredUsers = mockUsers.filter((u) => u.status === status);
      }

      return route.fulfill(
        respondOk({
          items: filteredUsers,
          total: filteredUsers.length,
          page: 1,
          page_size: 20,
        })
      );
    }

    // 用户详情
    if (path.match(/\/api\/v1\/admin\/users\/user_\d+$/) && method === "GET") {
      const userId = path.split("/").pop();
      const user = mockUsers.find((u) => u.id === userId);
      
      if (user) {
        return route.fulfill(respondOk({ user }));
      }
      
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "NOT_FOUND", message: "用户不存在" }),
      });
    }

    // 更新用户状态（冻结/解冻）
    if (path.match(/\/api\/v1\/admin\/users\/user_\d+\/status$/) && method === "PATCH") {
      const userId = path.split("/").slice(-2)[0];
      const body = request.postDataJSON();
      const user = mockUsers.find((u) => u.id === userId);
      
      if (user && body?.status && body?.reason) {
        return route.fulfill(
          respondOk({
            user: { ...user, status: body.status },
          })
        );
      }
      
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ code: "VALIDATION_ERROR", message: "原因必填" }),
      });
    }

    // 更新用户角色
    if (path.match(/\/api\/v1\/admin\/users\/user_\d+\/role$/) && method === "PATCH") {
      const userId = path.split("/").slice(-2)[0];
      const body = request.postDataJSON();
      const user = mockUsers.find((u) => u.id === userId);
      
      if (user && body?.role) {
        return route.fulfill(
          respondOk({
            user: { ...user, role: body.role },
          })
        );
      }
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("用户管理", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("应该显示用户列表", async ({ page }) => {
    await page.goto("/users");

    // 等待用户列表加载
    await expect(page.getByText("user1@example.com")).toBeVisible();
    await expect(page.getByText("user2@example.com")).toBeVisible();
  });

  test("应该能按状态筛选用户", async ({ page }) => {
    await page.goto("/users");

    // 选择状态筛选
    await page.getByRole("combobox", { name: /状态/i }).click();
    await page.getByRole("option", { name: "已暂停" }).click();

    // 应该只显示暂停状态的用户
    await expect(page.getByText("suspended@example.com")).toBeVisible();
    await expect(page.getByText("user1@example.com")).not.toBeVisible();
  });

  test("应该能冻结用户", async ({ page }) => {
    await page.goto("/users");

    // 点击用户操作菜单
    await page.getByText("user1@example.com").click();
    
    // 等待详情页加载
    await expect(page).toHaveURL(/\/users\/user_1/);

    // 点击冻结按钮
    await page.getByRole("button", { name: /冻结/i }).click();

    // 填写冻结原因
    await page.getByPlaceholder(/原因/i).fill("违反服务条款");

    // 确认冻结
    await page.getByRole("button", { name: /确认/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功/)).toBeVisible();
  });

  test("冻结用户时必须填写原因", async ({ page }) => {
    await page.goto("/users/user_1");

    // 点击冻结按钮
    await page.getByRole("button", { name: /冻结/i }).click();

    // 不填写原因直接确认
    await page.getByRole("button", { name: /确认/i }).click();

    // 应该显示错误提示
    await expect(page.getByText(/原因必填|请填写/)).toBeVisible();
  });

  test("应该能恢复已冻结用户", async ({ page }) => {
    await page.goto("/users/user_3"); // suspended user

    // 点击恢复按钮
    await page.getByRole("button", { name: /恢复|解冻/i }).click();

    // 填写恢复原因
    await page.getByPlaceholder(/原因/i).fill("账号复核通过");

    // 确认恢复
    await page.getByRole("button", { name: /确认/i }).click();

    // 应该显示成功提示
    await expect(page.getByText(/成功/)).toBeVisible();
  });

  test("应该能查看用户详情", async ({ page }) => {
    await page.goto("/users/user_1");

    // 验证用户详情显示
    await expect(page.getByText("user1@example.com")).toBeVisible();
    await expect(page.getByText("User One")).toBeVisible();
  });
});
