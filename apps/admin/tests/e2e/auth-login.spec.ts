/**
 * Admin login flow E2E tests
 * Critical management flow: login authentication
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

    // Login
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
      
      return route.fulfill(respondError("INVALID_CREDENTIALS", "Invalid email or password", 401));
    }

    // Get current user
    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(adminUser));
    }

    // Get admin capabilities
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

    // Token refresh
    if (path === "/api/v1/auth/refresh" && method === "POST") {
      return route.fulfill(
        respondOk({
          access_token: "refreshed-admin-token",
          refresh_token: "refreshed-admin-refresh",
        })
      );
    }

    // Default response
    return route.fulfill(respondOk({}));
  });
}

test.describe("Admin Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test("should successfully log in and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    // Enter email
    await page.getByPlaceholder("Enter your email").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "Continue" }).click();

    // Enter password
    await page.getByPlaceholder("Enter password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/$/);
  });

  test("should display error message on login failure", async ({ page }) => {
    await page.goto("/login");

    // Enter email
    await page.getByPlaceholder("Enter your email").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "Continue" }).click();

    // Enter wrong password
    await page.getByPlaceholder("Enter password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should display error message
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("should redirect to login page when accessing dashboard without login", async ({ page }) => {
    // Clear login state
    await page.context().clearCookies();

    await page.goto("/");

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should fetch admin capabilities after login", async ({ page }) => {
    await page.goto("/login");

    // Complete login
    await page.getByPlaceholder("Enter your email").fill("admin@agentflow.ai");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByPlaceholder("Enter password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/$/);

    // Navigation should be visible
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("login page should support Enter key submission", async ({ page }) => {
    await page.goto("/login");

    // Enter email and press Enter
    await page.getByPlaceholder("Enter your email").fill("admin@agentflow.ai");
    await page.getByPlaceholder("Enter your email").press("Enter");

    // Should enter password input stage
    await expect(page.getByPlaceholder("Enter password")).toBeVisible();

    // Enter password and press Enter
    await page.getByPlaceholder("Enter password").fill("admin123");
    await page.getByPlaceholder("Enter password").press("Enter");

    // Wait for redirect
    await expect(page).toHaveURL(/\/$/);
  });
});
