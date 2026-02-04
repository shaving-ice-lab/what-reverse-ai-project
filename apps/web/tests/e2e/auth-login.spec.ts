import { test, expect, type Page } from "@playwright/test";

const user = {
  id: "user_1",
  email: "test@example.com",
  username: "tester",
  role: "admin",
  emailVerified: true,
  createdAt: "2026-02-01T10:00:00Z",
  updatedAt: "2026-02-02T10:00:00Z",
};

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

async function mockApiRoutes(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/api/v1/auth/login" && method === "POST") {
      return route.fulfill(
        respondOk({
          access_token: "test-token",
          refresh_token: "test-refresh",
          user,
        })
      );
    }

    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(user));
    }

    if (path === "/api/v1/workspaces" && method === "GET") {
      return route.fulfill(
        respondOk({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
        })
      );
    }

    return route.fulfill(respondOk({}));
  });
}

test("login redirects to requested page", async ({ page }) => {
  await mockApiRoutes(page);

  await page.goto("/login?redirect=/workspaces");
  await page.getByPlaceholder("请输入您的电子邮件地址").fill("test@example.com");
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByPlaceholder("输入密码").fill("password123");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL(/\/workspaces$/);
  await expect(page.getByRole("button", { name: "创建工作空间" })).toBeVisible();
});
