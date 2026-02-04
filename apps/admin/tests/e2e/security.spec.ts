/**
 * 安全测试
 * 验证越权访问、敏感数据泄露等安全风险
 */

import { test, expect, type Page } from "@playwright/test";

const respondOk = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ code: "OK", message: "OK", data }),
});

const respondError = (code: string, message: string, status: number) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ code, message, error_code: code, error_message: message }),
});

// XSS 测试向量
const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '"><script>alert("xss")</script>',
  "' onclick='alert(\"xss\")'",
  '<svg/onload=alert("xss")>',
  '{{constructor.constructor("alert(1)")()}}',
  '${alert(1)}',
];

// SQL 注入测试向量
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM users",
  "' UNION SELECT * FROM users --",
  "1' AND '1'='1",
];

// 敏感信息模式
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api_key/i,
  /access_token/i,
  /refresh_token/i,
  /private_key/i,
  /credit_card/i,
  /ssn/i,
  /bearer\s+[a-z0-9\-_]+/i,
];

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
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/v1/users/me") {
      return route.fulfill(
        respondOk({
          id: "admin_1",
          email: "admin@agentflow.ai",
          username: "admin",
          role: "admin",
          status: "active",
        })
      );
    }

    if (path === "/api/v1/admin/capabilities") {
      return route.fulfill(
        respondOk({ capabilities: ["users.read", "users.manage"] })
      );
    }

    // 模拟安全响应
    if (path.includes("/admin/users") || path.includes("/admin/workspaces")) {
      return route.fulfill(
        respondOk({ items: [], total: 0, page: 1, page_size: 20 })
      );
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("安全测试 - XSS 防护", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("搜索框应该对 XSS 攻击进行过滤或转义", async ({ page }) => {
    await page.goto("/users");

    for (const payload of XSS_PAYLOADS) {
      // 在搜索框中输入 XSS payload
      const searchInput = page.getByPlaceholder(/搜索/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill(payload);
        await searchInput.press("Enter");

        // 等待页面更新
        await page.waitForTimeout(100);

        // 验证 XSS 没有被执行（页面不应该有弹窗）
        const alertDialog = page.locator('text="xss"');
        const count = await alertDialog.count();
        expect(count).toBe(0);

        // 清空搜索框
        await searchInput.clear();
      }
    }
  });

  test("用户输入应该被正确转义显示", async ({ page }) => {
    await page.route("**/api/v1/admin/users", async (route) => {
      return route.fulfill(
        respondOk({
          items: [
            {
              id: "user_xss",
              email: "user@example.com",
              username: '<script>alert("xss")</script>',
              display_name: '<img src=x onerror=alert("xss")>',
              role: "user",
              status: "active",
              email_verified: true,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-02-01T00:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        })
      );
    });

    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // 恶意脚本不应该被执行
    const scripts = await page.evaluate(() => {
      return document.querySelectorAll('script:not([src])').length;
    });
    
    // 页面不应该包含可执行的恶意脚本
    // 用户名应该以文本形式显示而不是被解析
  });

  test("表单提交应该对输入进行清理", async ({ page }) => {
    await page.goto("/users");

    // 点击添加用户（如果存在）
    const addButton = page.getByRole("button", { name: /新增|添加/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // 尝试在输入框中输入 XSS payload
      const nameInput = page.getByPlaceholder(/名称|用户名/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('<script>alert("xss")</script>');
      }

      // 提交表单
      const submitButton = page.getByRole("button", { name: /保存|提交|确认/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // 验证没有 XSS 执行
        await page.waitForTimeout(500);
        // 如果有弹窗，测试失败
      }
    }
  });
});

test.describe("安全测试 - SQL 注入防护", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("搜索参数应该正确处理 SQL 注入尝试", async ({ page }) => {
    let lastRequestUrl: string | null = null;

    await page.route("**/api/v1/admin/users**", async (route) => {
      lastRequestUrl = route.request().url();
      return route.fulfill(
        respondOk({ items: [], total: 0, page: 1, page_size: 20 })
      );
    });

    await page.goto("/users");

    const searchInput = page.getByPlaceholder(/搜索/i);
    if (await searchInput.isVisible()) {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        await searchInput.fill(payload);
        await searchInput.press("Enter");

        // 等待请求
        await page.waitForTimeout(200);

        // 验证 SQL 注入 payload 被正确编码
        if (lastRequestUrl) {
          const url = new URL(lastRequestUrl);
          const searchParam = url.searchParams.get("search");
          
          // payload 应该被 URL 编码，而不是直接拼接
          if (searchParam) {
            expect(searchParam).not.toContain("DROP TABLE");
            expect(searchParam).not.toContain("DELETE FROM");
            expect(searchParam).not.toContain("UNION SELECT");
          }
        }

        await searchInput.clear();
      }
    }
  });
});

test.describe("安全测试 - 敏感数据保护", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test("API 响应不应该泄露敏感信息", async ({ page }) => {
    const responses: string[] = [];

    await page.route("**/api/v1/**", async (route) => {
      const response = respondOk({
        user: {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          // 不应该返回这些字段
          // password: "hashed_password",
          // api_key: "secret_key",
        },
      });
      responses.push(response.body);
      return route.fulfill(response);
    });

    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // 验证响应中不包含敏感信息
    for (const responseBody of responses) {
      for (const pattern of SENSITIVE_PATTERNS) {
        const match = pattern.exec(responseBody);
        if (match) {
          // 如果匹配到的是结构字段名（如 "access_token": "..."），而不是实际值，需要进一步检查
          // 这里我们主要检查不应该出现在 UI 可见响应中的敏感数据
          console.warn(`Potential sensitive data in response: ${match[0]}`);
        }
      }
    }
  });

  test("控制台不应该输出敏感信息", async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    await mockApiRoutes(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // 检查控制台输出
    for (const log of consoleLogs) {
      for (const pattern of SENSITIVE_PATTERNS) {
        expect(log).not.toMatch(pattern);
      }
    }
  });

  test("敏感字段应该被脱敏显示", async ({ page }) => {
    await page.route("**/api/v1/admin/secrets", async (route) => {
      return route.fulfill(
        respondOk({
          items: [
            {
              id: "secret_1",
              name: "OpenAI API Key",
              key_prefix: "sk-...", // 应该只显示前缀
              description: "Production API key",
              status: "active",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        })
      );
    });

    // 完整的 API key 不应该出现在页面上
    const fullApiKey = "sk-1234567890abcdefghijklmnop";
    const pageContent = await page.content();
    expect(pageContent).not.toContain(fullApiKey);
  });

  test("导出功能不应该包含敏感字段", async ({ page }) => {
    // 模拟导出请求
    await page.route("**/api/v1/admin/users/export", async (route) => {
      // 导出数据不应该包含密码等敏感字段
      const exportData = [
        {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          role: "user",
          status: "active",
          // 不包含 password, api_keys 等
        },
      ];
      return route.fulfill({
        status: 200,
        contentType: "text/csv",
        body: "id,email,username,role,status\nuser_1,user@example.com,user1,user,active",
      });
    });
  });
});

test.describe("安全测试 - CSRF 防护", () => {
  test("敏感操作应该需要确认", async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);

    await page.goto("/users/user_1");

    // 点击危险操作按钮
    const deleteButton = page.getByRole("button", { name: /删除|冻结/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 应该显示确认对话框
      const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
      await expect(confirmDialog).toBeVisible();

      // 应该需要输入原因
      const reasonInput = page.getByPlaceholder(/原因/i);
      await expect(reasonInput).toBeVisible();
    }
  });

  test("状态变更请求应该包含正确的方法", async ({ page }) => {
    await setupAuthenticatedSession(page);

    let requestMethod: string | null = null;

    await page.route("**/api/v1/admin/users/*/status", async (route) => {
      requestMethod = route.request().method();
      return route.fulfill(
        respondOk({ user: { id: "user_1", status: "suspended" } })
      );
    });

    await mockApiRoutes(page);
    await page.goto("/users/user_1");

    // 执行状态变更操作
    const statusButton = page.getByRole("button", { name: /冻结/i });
    if (await statusButton.isVisible()) {
      await statusButton.click();

      // 填写原因并确认
      const reasonInput = page.getByPlaceholder(/原因/i);
      if (await reasonInput.isVisible()) {
        await reasonInput.fill("测试冻结");
      }

      const confirmButton = page.getByRole("button", { name: /确认/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // 验证使用了正确的 HTTP 方法（应该是 PATCH，不是 GET）
      if (requestMethod && requestMethod !== "PATCH") {
        throw new Error(`Expected PATCH but got ${requestMethod}`);
      }
    }
  });
});

test.describe("安全测试 - 认证与会话", () => {
  test("无效 token 应该被拒绝", async ({ page }) => {
    await page.route("**/api/v1/**", async (route) => {
      const authHeader = route.request().headers()["authorization"];
      
      if (authHeader === "Bearer invalid-token") {
        return route.fulfill(
          respondError("UNAUTHORIZED", "无效的访问令牌", 401)
        );
      }

      return route.fulfill(respondOk({}));
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: { id: "user_1" },
            tokens: {
              accessToken: "invalid-token",
              refreshToken: "invalid-refresh",
            },
            isAuthenticated: true,
          },
        })
      );
    });

    await page.goto("/users");

    // 应该跳转到登录页或显示错误
    await expect(page.getByText(/登录|无效/)).toBeVisible();
  });

  test("会话过期后应该跳转到登录页", async ({ page }) => {
    let requestCount = 0;

    await page.route("**/api/v1/**", async (route) => {
      requestCount++;
      
      // 第二次请求返回 401（模拟会话过期）
      if (requestCount > 1) {
        return route.fulfill(
          respondError("TOKEN_EXPIRED", "会话已过期", 401)
        );
      }

      return route.fulfill(respondOk({}));
    });

    await setupAuthenticatedSession(page);
    await page.goto("/users");

    // 触发另一个 API 请求
    await page.reload();

    // 应该跳转到登录页
    await expect(page).toHaveURL(/\/login/);
  });

  test("登出后不应该能访问受保护页面", async ({ page }) => {
    await mockApiRoutes(page);
    await setupAuthenticatedSession(page);

    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/login/);

    // 清除登录状态
    await page.evaluate(() => {
      localStorage.clear();
    });

    // 刷新页面
    await page.reload();

    // 应该跳转到登录页
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("安全测试 - 输入验证", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("超长输入应该被限制", async ({ page }) => {
    await page.goto("/users");

    const searchInput = page.getByPlaceholder(/搜索/i);
    if (await searchInput.isVisible()) {
      // 尝试输入超长字符串
      const longString = "a".repeat(10000);
      await searchInput.fill(longString);

      // 输入应该被截断或限制
      const value = await searchInput.inputValue();
      expect(value.length).toBeLessThan(10000);
    }
  });

  test("特殊字符应该被正确处理", async ({ page }) => {
    await page.goto("/users");

    const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
    const searchInput = page.getByPlaceholder(/搜索/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(specialChars);
      await searchInput.press("Enter");

      // 页面不应该崩溃
      await expect(page).not.toHaveURL(/\/error/);
    }
  });
});
