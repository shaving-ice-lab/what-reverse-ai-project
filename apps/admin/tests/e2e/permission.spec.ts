/**
 * Permission regression tests
 * Verify unauthorized access is properly blocked
 */

import { test, expect, type Page } from "@playwright/test";

// Users with different permission levels
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
    message: "Access denied",
    error_code: "FORBIDDEN",
    error_message: "Access denied",
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

    // Get current user
    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(user));
    }

    // Get admin capabilities
    if (path === "/api/v1/admin/capabilities") {
      return route.fulfill(respondOk({ capabilities: user.capabilities }));
    }

    // User management API - check permissions
    if (path.startsWith("/api/v1/admin/users")) {
      if (method === "GET" && !user.capabilities.includes("users.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("users.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // Workspace management API - check permissions
    if (path.startsWith("/api/v1/admin/workspaces")) {
      if (method === "GET" && !user.capabilities.includes("workspaces.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("workspaces.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // App management API - check permissions
    if (path.startsWith("/api/v1/admin/apps")) {
      if (method === "GET" && !user.capabilities.includes("apps.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("apps.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // Ticket management API - check permissions
    if (path.startsWith("/api/v1/admin/support")) {
      if (method === "GET" && !user.capabilities.includes("support.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("support.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // Billing management API - check permissions
    if (path.startsWith("/api/v1/admin/billing") || path.startsWith("/api/v1/admin/earnings")) {
      if (method === "GET" && !user.capabilities.includes("billing.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("billing.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    // System management API - check permissions
    if (path.startsWith("/api/v1/system") || path.startsWith("/api/v1/admin/config")) {
      if (method === "GET" && !user.capabilities.includes("system.read")) {
        return route.fulfill(respondForbidden());
      }
      if (["POST", "PATCH", "DELETE"].includes(method) && !user.capabilities.includes("system.manage")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({}));
    }

    // Audit logs - check permissions
    if (path.startsWith("/api/v1/admin/audit-logs")) {
      if (!user.capabilities.includes("audit.read")) {
        return route.fulfill(respondForbidden());
      }
      return route.fulfill(respondOk({ items: [], total: 0, page: 1, page_size: 20 }));
    }

    return route.fulfill(respondOk({}));
  });
}

test.describe("Permission Regression Tests - SuperAdmin", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.superAdmin);
    await setupApiRoutes(page, users.superAdmin);
  });

  test("SuperAdmin should be able to access all admin pages", async ({ page }) => {
    // User management
    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/403/);

    // Workspace management
    await page.goto("/workspaces");
    await expect(page).not.toHaveURL(/\/403/);

    // App management
    await page.goto("/apps");
    await expect(page).not.toHaveURL(/\/403/);

    // Ticket management
    await page.goto("/support/tickets");
    await expect(page).not.toHaveURL(/\/403/);

    // System management
    await page.goto("/system/health");
    await expect(page).not.toHaveURL(/\/403/);
  });
});

test.describe("Permission Regression Tests - SupportOnly", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.supportOnly);
    await setupApiRoutes(page, users.supportOnly);
  });

  test("Support user should be able to access ticket management", async ({ page }) => {
    await page.goto("/support/tickets");
    await expect(page).not.toHaveURL(/\/403/);
  });

  test("Support user should be denied access to user management", async ({ page }) => {
    await page.goto("/users");
    // Should display permission denied message or redirect to 403 page
    await expect(page.getByText(/access denied|no permission|403/i)).toBeVisible();
  });

  test("Support user should be denied access to system management", async ({ page }) => {
    await page.goto("/system/health");
    await expect(page.getByText(/access denied|no permission|403/i)).toBeVisible();
  });
});

test.describe("Permission Regression Tests - ReadOnly", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.readOnly);
    await setupApiRoutes(page, users.readOnly);
  });

  test("ReadOnly user should be able to view user list", async ({ page }) => {
    await page.goto("/users");
    await expect(page).not.toHaveURL(/\/403/);
  });

  test("ReadOnly user should not see action buttons", async ({ page }) => {
    await page.goto("/users");
    // Action buttons should be hidden or disabled
    const freezeButton = page.getByRole("button", { name: /suspend/i });
    const count = await freezeButton.count();
    if (count > 0) {
      await expect(freezeButton).toBeDisabled();
    }
  });

  test("ReadOnly user cannot perform write operations", async ({ page }) => {
    await page.goto("/users/user_1");

    // Try clicking suspend button (if it exists)
    const freezeButton = page.getByRole("button", { name: /suspend/i });
    if (await freezeButton.isVisible()) {
      await freezeButton.click();
      // Should display permission denied message
      await expect(page.getByText(/access denied|no permission/i)).toBeVisible();
    }
  });
});

test.describe("Permission Regression Tests - NoPermission", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.noPermission);
    await setupApiRoutes(page, users.noPermission);
  });

  test("user with no permissions should be denied access to all admin pages", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText(/access denied|no permission|403/i)).toBeVisible();

    await page.goto("/workspaces");
    await expect(page.getByText(/access denied|no permission|403/i)).toBeVisible();

    await page.goto("/apps");
    await expect(page.getByText(/access denied|no permission|403/i)).toBeVisible();
  });

  test("user with no permissions should only see dashboard overview", async ({ page }) => {
    await page.goto("/");
    // Dashboard should display but with empty data or permission denied
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Permission Regression Tests - Unauthenticated User", () => {
  test("unauthenticated user should be redirected to login when accessing admin pages", async ({ page }) => {
    // Clear all storage
    await page.context().clearCookies();

    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/workspaces");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/support/tickets");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user accessing API should return 401", async ({ page }) => {
    await page.route("**/api/v1/admin/users", async (route) => {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Please sign in first",
        }),
      });
    });

    const response = await page.request.get("http://localhost:3002/api/v1/admin/users");
    expect(response.status()).toBe(401);
  });
});

test.describe("Permission Regression Tests - Cross-Module Privilege Escalation", () => {
  test.beforeEach(async ({ page }) => {
    await setupUserSession(page, users.supportOnly);
    await setupApiRoutes(page, users.supportOnly);
  });

  test("Support user attempting to update user status should be rejected", async ({ page }) => {
    // Direct API call
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

  test("Support user attempting to access billing API should be rejected", async ({ page }) => {
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
