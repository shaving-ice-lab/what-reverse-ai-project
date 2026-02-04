/**
 * Admin 登录流程 E2E 测试
 * 关键管理流程：登录认证
 */

import { test, expect, type Page } from "@playwright/test";

const adminUser = {
  id: "admin_1",
  email: "admin@agentflow.ai",
  username: "admin",
  display_name: "Admin User",
  role: "admin",
  status: "active",
  email_verified: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

const respondError = (code: string, message: string, status = 400) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ code, message, error_code: code, error_message: message }),
});

async function mockApiRoutes(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    // 登录
    if (path === "/api/v1/auth/login" && method === "POST") {
      const body = request.postDataJSON();
      
      if (body?.email === "admin@agentflow.ai" && body?.password === "admin123") {
        return route.fulfill(
          respondOk({
            access_token: "test-admin-token",
            refresh_token: "test-admin-refresh",
            user: adminUser,
          })
        );
      }
      
      return route.fulfill(respondError("INVALID_CREDENTIALS", "邮箱或密码错误", 401));
    }

    // 获取当前用户
    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(adminUser));
    }

    // 获取管理员能力点
    if (path === "/api/v1/admin/capabilities") {
      return route.fulfill(
        respondOk({
          capabilities: [
            "users.read",
            "users.manage",
            "workspaces.read",
            "workspaces.manage",
            "apps.read",
            "apps.manage",
            "support.read",
            "support.manage",
          ],
        })
      );
    }

    // Token 刷新
    if (path === "/api/v1/auth/refresh" && method === "POST") {
      return route.fulfill(
        respondOk({
          access_token: "refreshed-admin-token",
          refresh_token: "refreshed-admin-refresh",
        })
      );
    }

    // 默认响应
    return route.fulfill(respondOk({}));
  });
}

test.describe("Admin 登录流程", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("应该成功登录并跳转到仪表盘", async ({ page }) => {
    await page.goto("/login");

    // 输入邮箱
    await page.getByPlaceholder("请输入邮箱").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "继续" }).click();

    // 输入密码
    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByRole("button", { name: "登录" }).click();

    // 等待跳转到仪表盘
    await expect(page).toHaveURL(/\/$/);
  });

  test("登录失败时应该显示错误信息", async ({ page }) => {
    await page.goto("/login");

    // 输入邮箱
    await page.getByPlaceholder("请输入邮箱").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "继续" }).click();

    // 输入错误密码
    await page.getByPlaceholder("输入密码").fill("wrongpassword");
    await page.getByRole("button", { name: "登录" }).click();

    // 应该显示错误信息
    await expect(page.getByText("邮箱或密码错误")).toBeVisible();
  });

  test("未登录时访问仪表盘应该跳转到登录页", async ({ page }) => {
    // 清除登录状态
    await page.context().clearCookies();

    await page.goto("/");

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test("登录后应该能获取管理员能力点", async ({ page }) => {
    await page.goto("/login");

    // 完成登录
    await page.getByPlaceholder("请输入邮箱").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "继续" }).click();
    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByRole("button", { name: "登录" }).click();

    // 等待仪表盘加载
    await expect(page).toHaveURL(/\/$/);

    // 导航应该可见
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("登录页应该支持回车提交", async ({ page }) => {
    await page.goto("/login");

    // 输入邮箱并按回车
    await page.getByPlaceholder("请输入邮箱").fill("admin@agentflow.ai");
    await page.getByPlaceholder("请输入邮箱").press("Enter");

    // 应该进入密码输入阶段
    await expect(page.getByPlaceholder("输入密码")).toBeVisible();

    // 输入密码并按回车
    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByPlaceholder("输入密码").press("Enter");

    // 等待跳转
    await expect(page).toHaveURL(/\/$/);
  });
});
