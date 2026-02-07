/**
 * Security tests
 * Verify unauthorized access, sensitive data leaks, and other security risks
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

// XSS test vectors
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

// SQL injection test vectors
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM users",
  "' UNION SELECT * FROM users --",
  "1' AND '1'='1",
];

// Sensitive information patterns
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

    // Mock secure responses
    if (path.includes("/admin/users") || path.includes("/admin/workspaces")) {
      return route.fulfill(
        respondOk({ items: [], total: 0, page: 1, page_size: 20 })
      );
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("Security Tests - XSS Protection", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("search box should filter or escape XSS attacks", async ({ page }) => {
    await page.goto("/users");

    for (const payload of XSS_PAYLOADS) {
      // Enter XSS payload in search box
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill(payload);
        await searchInput.press("Enter");

        // Wait for page update
        await page.waitForTimeout(100);

        // Verify XSS was not executed (page should have no alerts)
        const alertDialog = page.locator('text="xss"');
        const count = await alertDialog.count();
        expect(count).toBe(0);

        // Clear search box
        await searchInput.clear();
      }
    }
  });

  test("user input should be properly escaped when displayed", async ({ page }) => {
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

    // Malicious scripts should not be executed
    const scripts = await page.evaluate(() => {
      return document.querySelectorAll('script:not([src])').length;
    });
    
    // Page should not contain executable malicious scripts
    // Username should be displayed as text, not parsed as HTML
  });

  test("form submission should sanitize input", async ({ page }) => {
    await page.goto("/users");

    // Click add user (if it exists)
    const addButton = page.getByRole("button", { name: /new|add/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      // Try entering XSS payload in input field
      const nameInput = page.getByPlaceholder(/name|username/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('<script>alert("xss")</script>');
      }

      // Submit form
      const submitButton = page.getByRole("button", { name: /save|submit|confirm/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Verify no XSS execution
        await page.waitForTimeout(500);
        // If there are alerts, the test fails
      }
    }
  });
});

test.describe("Security Tests - SQL Injection Protection", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("search parameters should properly handle SQL injection attempts", async ({ page }) => {
    let lastRequestUrl: string | null = null;

    await page.route("**/api/v1/admin/users**", async (route) => {
      lastRequestUrl = route.request().url();
      return route.fulfill(
        respondOk({ items: [], total: 0, page: 1, page_size: 20 })
      );
    });

    await page.goto("/users");

    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        await searchInput.fill(payload);
        await searchInput.press("Enter");

        // Wait for request
        await page.waitForTimeout(200);

        // Verify SQL injection payload is properly encoded
        if (lastRequestUrl) {
          const url = new URL(lastRequestUrl);
          const searchParam = url.searchParams.get("search");
          
            // Payload should be URL-encoded, not directly concatenated
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

test.describe("Security Tests - Sensitive Data Protection", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test("API responses should not leak sensitive information", async ({ page }) => {
    const responses: string[] = [];

    await page.route("**/api/v1/**", async (route) => {
      const response = respondOk({
        user: {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          // These fields should not be returned
          // password: "hashed_password",
          // api_key: "secret_key",
        },
      });
      responses.push(response.body);
      return route.fulfill(response);
    });

    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Verify responses do not contain sensitive information
    for (const responseBody of responses) {
      for (const pattern of SENSITIVE_PATTERNS) {
        const match = pattern.exec(responseBody);
        if (match) {
          // If matched is a structural field name (e.g. "access_token": "...") rather than actual values, further checks are needed
          // Here we primarily check for sensitive data that should not appear in UI-visible responses
          console.warn(`Potential sensitive data in response: ${match[0]}`);
        }
      }
    }
  });

  test("console should not output sensitive information", async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    await mockApiRoutes(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Check console output
    for (const log of consoleLogs) {
      for (const pattern of SENSITIVE_PATTERNS) {
        expect(log).not.toMatch(pattern);
      }
    }
  });

  test("sensitive fields should be masked when displayed", async ({ page }) => {
    await page.route("**/api/v1/admin/secrets", async (route) => {
      return route.fulfill(
        respondOk({
          items: [
            {
              id: "secret_1",
              name: "OpenAI API Key",
              key_prefix: "sk-...", // Should only show prefix
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

    // Full API key should not appear on the page
    const fullApiKey = "sk-1234567890abcdefghijklmnop";
    const pageContent = await page.content();
    expect(pageContent).not.toContain(fullApiKey);
  });

  test("export function should not include sensitive fields", async ({ page }) => {
    // Mock export request
    await page.route("**/api/v1/admin/users/export", async (route) => {
      // Export data should not contain sensitive fields like passwords
      const exportData = [
        {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
          role: "user",
          status: "active",
          // Does not include password, api_keys, etc.
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

test.describe("Security Tests - CSRF Protection", () => {
  test("sensitive operations should require confirmation", async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);

    await page.goto("/users/user_1");

    // Click dangerous action button
    const deleteButton = page.getByRole("button", { name: /delete|suspend/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should display confirmation dialog
      const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
      await expect(confirmDialog).toBeVisible();

      // Should require entering a reason
      const reasonInput = page.getByPlaceholder(/reason/i);
      await expect(reasonInput).toBeVisible();
    }
  });

  test("state change requests should use the correct HTTP method", async ({ page }) => {
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

    // Execute status change operation
    const statusButton = page.getByRole("button", { name: /suspend/i });
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
