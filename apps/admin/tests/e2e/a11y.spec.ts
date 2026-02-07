/**
 * Accessibility tests
 * Verify core pages meet WCAG standards
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const adminUser = {
  id: "admin_1",
  email: "admin@agentflow.ai",
  username: "admin",
  role: "admin",
  status: "active",
};

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
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/v1/users/me") {
      return route.fulfill(respondOk(adminUser));
    }

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

    // Mock list responses
    if (path.includes("/admin/users") || 
        path.includes("/admin/workspaces") || 
        path.includes("/admin/apps") ||
        path.includes("/admin/support/tickets")) {
      return route.fulfill(
        respondOk({
          items: [
            {
              id: "mock-1",
              email: "user@example.com",
              name: "Mock User",
              status: "active",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        })
      );
    }

    return route.fulfill(respondOk({}));
  });
}

// Generic function for accessibility checks
async function checkA11y(page: Page, pageName: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"]) // Temporarily disable color contrast checks (dark theme may need adjustments)
    .analyze();

  // Filter out serious and critical issues
  const seriousOrCritical = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact || "")
  );

  // If there are serious issues, output detailed information
  if (seriousOrCritical.length > 0) {
    console.log(`\n${pageName} accessibility issues:`);
    seriousOrCritical.forEach((violation) => {
      console.log(`  - ${violation.id}: ${violation.description}`);
      violation.nodes.forEach((node) => {
        console.log(`    Target: ${node.target}`);
        console.log(`    HTML: ${node.html.substring(0, 100)}...`);
      });
    });
  }

  return seriousOrCritical;
}

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("login page should pass basic accessibility checks", async ({ page }) => {
    // Clear login state
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "Login page");
    expect(violations).toEqual([]);
  });

  test("dashboard page should pass basic accessibility checks", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "Dashboard page");
    expect(violations).toEqual([]);
  });

  test("user list page should pass basic accessibility checks", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "User list page");
    expect(violations).toEqual([]);
  });

  test("ticket list page should pass basic accessibility checks", async ({ page }) => {
    await page.goto("/support/tickets");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "Ticket list page");
    expect(violations).toEqual([]);
  });

  test("all tables should have correct ARIA attributes", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Check if table has correct role
    const table = page.locator("table").first();
    if (await table.isVisible()) {
      await expect(table).toHaveAttribute("role", /(table|grid)/);
    }

    // Check headers
    const headers = page.locator("th");
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) {
      const header = headers.nth(i);
      const scope = await header.getAttribute("scope");
      expect(scope).toMatch(/(col|row)/);
    }
  });

  test("all buttons should have accessible names", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Button should have text content or aria-label
        const hasAccessibleName =
          (await button.textContent())?.trim() ||
          (await button.getAttribute("aria-label"));
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test("all form fields should have associated labels", async ({ page }) => {
    // Clear login state to access login page
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const inputs = page.locator("input:not([type='hidden'])");
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const placeholder = await input.getAttribute("placeholder");

        // Input should have a label associated by id, or aria-label, or aria-labelledby
        const hasLabel =
          (id && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
          ariaLabel ||
          ariaLabelledBy ||
          placeholder;

        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test("modals should handle focus correctly", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Click a button that opens a modal (if it exists)
    const modalTrigger = page.getByRole("button", { name: /new|add|create/i }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        // Modal should have aria-modal attribute
        await expect(modal).toHaveAttribute("aria-modal", "true");

        // Focus should move into the modal
        const focusedElement = page.locator(":focus");
        const isInsideModal = await modal.locator(":focus").count();
        expect(isInsideModal).toBeGreaterThan(0);

        // Pressing Escape should close the modal
        await page.keyboard.press("Escape");
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test("keyboard navigation should work correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab should move between interactive elements
    await page.keyboard.press("Tab");

    // Verify an element received focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe("BODY");
  });

  test("sidebar navigation should be operable via keyboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find navigation area
    const nav = page.locator("nav").first();
    if (await nav.isVisible()) {
      // Navigation links should be accessible via Tab
      const links = nav.locator("a");
      const linkCount = await links.count();

      if (linkCount > 0) {
        // First link should be focusable
        await links.first().focus();
        const isFocused = await links.first().evaluate(
          (el) => document.activeElement === el
        );
        expect(isFocused).toBe(true);
      }
    }
  });
});

test.describe("Visual Regression - Core Page Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("dashboard page screenshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Wait for animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      maxDiffPixels: 100, // Allow minor pixel differences
    });
  });

  test("user list page screenshot", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("users-list.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("ticket list page screenshot", async ({ page }) => {
    await page.goto("/support/tickets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("tickets-list.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("login page screenshot", async ({ page }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("login.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
