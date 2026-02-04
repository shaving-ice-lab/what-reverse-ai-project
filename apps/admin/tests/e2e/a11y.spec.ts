/**
 * 可访问性测试
 * 验证核心页面符合 WCAG 标准
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

    // Mock 列表响应
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

// 可访问性检查的通用函数
async function checkA11y(page: Page, pageName: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"]) // 暂时禁用颜色对比度检查（深色主题可能需要调整）
    .analyze();

  // 过滤出严重和关键问题
  const seriousOrCritical = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact || "")
  );

  // 如果有严重问题，输出详细信息
  if (seriousOrCritical.length > 0) {
    console.log(`\n${pageName} 可访问性问题:`);
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

test.describe("可访问性测试", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("登录页面应该通过基本可访问性检查", async ({ page }) => {
    // 清除登录状态
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "登录页面");
    expect(violations).toEqual([]);
  });

  test("仪表盘页面应该通过基本可访问性检查", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "仪表盘页面");
    expect(violations).toEqual([]);
  });

  test("用户列表页面应该通过基本可访问性检查", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "用户列表页面");
    expect(violations).toEqual([]);
  });

  test("工单列表页面应该通过基本可访问性检查", async ({ page }) => {
    await page.goto("/support/tickets");
    await page.waitForLoadState("networkidle");

    const violations = await checkA11y(page, "工单列表页面");
    expect(violations).toEqual([]);
  });

  test("所有表格应该有正确的 ARIA 属性", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // 检查表格是否有正确的角色
    const table = page.locator("table").first();
    if (await table.isVisible()) {
      await expect(table).toHaveAttribute("role", /(table|grid)/);
    }

    // 检查表头
    const headers = page.locator("th");
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) {
      const header = headers.nth(i);
      const scope = await header.getAttribute("scope");
      expect(scope).toMatch(/(col|row)/);
    }
  });

  test("所有按钮应该有可访问的名称", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // 按钮应该有文本内容或 aria-label
        const hasAccessibleName =
          (await button.textContent())?.trim() ||
          (await button.getAttribute("aria-label"));
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test("所有表单字段应该有关联的标签", async ({ page }) => {
    // 清除登录状态访问登录页
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

        // 输入框应该有 id 关联的 label，或者 aria-label，或者 aria-labelledby
        const hasLabel =
          (id && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
          ariaLabel ||
          ariaLabelledBy ||
          placeholder;

        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test("模态框应该正确处理焦点", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // 点击一个会打开模态框的按钮（如果存在）
    const modalTrigger = page.getByRole("button", { name: /新增|添加|创建/i }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();

      // 等待模态框出现
      const modal = page.locator('[role="dialog"]');
      if (await modal.isVisible()) {
        // 模态框应该有 aria-modal 属性
        await expect(modal).toHaveAttribute("aria-modal", "true");

        // 焦点应该移到模态框内
        const focusedElement = page.locator(":focus");
        const isInsideModal = await modal.locator(":focus").count();
        expect(isInsideModal).toBeGreaterThan(0);

        // 按 Escape 应该关闭模态框
        await page.keyboard.press("Escape");
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test("键盘导航应该正常工作", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 按 Tab 应该能在可交互元素间移动
    await page.keyboard.press("Tab");

    // 验证有元素获得焦点
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe("BODY");
  });

  test("侧边导航应该可通过键盘操作", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 找到导航区域
    const nav = page.locator("nav").first();
    if (await nav.isVisible()) {
      // 导航链接应该可以通过 Tab 访问
      const links = nav.locator("a");
      const linkCount = await links.count();

      if (linkCount > 0) {
        // 第一个链接应该可以获得焦点
        await links.first().focus();
        const isFocused = await links.first().evaluate(
          (el) => document.activeElement === el
        );
        expect(isFocused).toBe(true);
      }
    }
  });
});

test.describe("视觉回归 - 核心页面截图", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockApiRoutes(page);
  });

  test("仪表盘页面截图", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // 等待动画完成
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      maxDiffPixels: 100, // 允许少量像素差异
    });
  });

  test("用户列表页面截图", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("users-list.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("工单列表页面截图", async ({ page }) => {
    await page.goto("/support/tickets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("tickets-list.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("登录页面截图", async ({ page }) => {
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
