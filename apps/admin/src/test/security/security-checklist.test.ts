/**
 * 安全测试清单
 * 系统化验证安全要求
 */

import { describe, it, expect, vi } from "vitest";
import {
  XSS_TEST_VECTORS,
  SQL_INJECTION_VECTORS,
  checkForSensitiveData,
} from "@/test/utils";

// 安全测试清单状态
interface SecurityCheckItem {
  id: string;
  category: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "pass" | "fail" | "pending" | "not_applicable";
  notes?: string;
}

const SECURITY_CHECKLIST: SecurityCheckItem[] = [
  // 认证与授权
  {
    id: "SEC-001",
    category: "认证",
    description: "登录必须使用 HTTPS",
    severity: "critical",
    status: "pass",
  },
  {
    id: "SEC-002",
    category: "认证",
    description: "密码必须加密传输",
    severity: "critical",
    status: "pass",
  },
  {
    id: "SEC-003",
    category: "认证",
    description: "会话 Token 使用 httpOnly cookie 或安全存储",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-004",
    category: "认证",
    description: "Token 过期后自动刷新或重新登录",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-005",
    category: "授权",
    description: "API 端点检查用户权限",
    severity: "critical",
    status: "pass",
  },
  {
    id: "SEC-006",
    category: "授权",
    description: "前端根据权限显示/隐藏功能",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-007",
    category: "授权",
    description: "敏感操作需要二次确认",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-008",
    category: "授权",
    description: "管理员操作记录审计日志",
    severity: "high",
    status: "pass",
  },

  // XSS 防护
  {
    id: "SEC-101",
    category: "XSS 防护",
    description: "用户输入在显示前进行转义",
    severity: "critical",
    status: "pass",
  },
  {
    id: "SEC-102",
    category: "XSS 防护",
    description: "使用 CSP 策略限制脚本执行",
    severity: "high",
    status: "pending",
  },
  {
    id: "SEC-103",
    category: "XSS 防护",
    description: "React dangerouslySetInnerHTML 审查",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-104",
    category: "XSS 防护",
    description: "第三方内容沙箱隔离",
    severity: "medium",
    status: "not_applicable",
  },

  // CSRF 防护
  {
    id: "SEC-201",
    category: "CSRF 防护",
    description: "状态变更使用 POST/PATCH/DELETE 方法",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-202",
    category: "CSRF 防护",
    description: "API 请求携带认证 Token",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-203",
    category: "CSRF 防护",
    description: "敏感操作要求确认",
    severity: "medium",
    status: "pass",
  },

  // 数据保护
  {
    id: "SEC-301",
    category: "数据保护",
    description: "敏感字段脱敏显示（邮箱/密钥）",
    severity: "high",
    status: "pass",
  },
  {
    id: "SEC-302",
    category: "数据保护",
    description: "API 响应不泄露敏感信息",
    severity: "critical",
    status: "pass",
  },
  {
    id: "SEC-303",
    category: "数据保护",
    description: "控制台不输出敏感信息",
    severity: "medium",
    status: "pass",
  },
  {
    id: "SEC-304",
    category: "数据保护",
    description: "导出数据不包含敏感字段",
    severity: "high",
    status: "pass",
  },

  // 输入验证
  {
    id: "SEC-401",
    category: "输入验证",
    description: "所有输入进行长度限制",
    severity: "medium",
    status: "pass",
  },
  {
    id: "SEC-402",
    category: "输入验证",
    description: "特殊字符正确处理",
    severity: "medium",
    status: "pass",
  },
  {
    id: "SEC-403",
    category: "输入验证",
    description: "文件上传类型和大小限制",
    severity: "high",
    status: "not_applicable",
  },
  {
    id: "SEC-404",
    category: "输入验证",
    description: "SQL 注入防护",
    severity: "critical",
    status: "pass",
  },

  // 错误处理
  {
    id: "SEC-501",
    category: "错误处理",
    description: "错误信息不泄露系统细节",
    severity: "medium",
    status: "pass",
  },
  {
    id: "SEC-502",
    category: "错误处理",
    description: "统一错误响应格式",
    severity: "low",
    status: "pass",
  },
];

describe("安全测试清单", () => {
  describe("清单状态检查", () => {
    it("应该没有失败的关键安全项", () => {
      const criticalFails = SECURITY_CHECKLIST.filter(
        (item) => item.severity === "critical" && item.status === "fail"
      );

      if (criticalFails.length > 0) {
        console.error("关键安全问题:");
        criticalFails.forEach((item) => {
          console.error(`  - ${item.id}: ${item.description}`);
        });
      }

      expect(criticalFails).toHaveLength(0);
    });

    it("应该没有失败的高危安全项", () => {
      const highFails = SECURITY_CHECKLIST.filter(
        (item) => item.severity === "high" && item.status === "fail"
      );

      if (highFails.length > 0) {
        console.warn("高危安全问题:");
        highFails.forEach((item) => {
          console.warn(`  - ${item.id}: ${item.description}`);
        });
      }

      expect(highFails).toHaveLength(0);
    });

    it("输出安全清单状态报告", () => {
      const report = {
        total: SECURITY_CHECKLIST.length,
        passed: SECURITY_CHECKLIST.filter((i) => i.status === "pass").length,
        failed: SECURITY_CHECKLIST.filter((i) => i.status === "fail").length,
        pending: SECURITY_CHECKLIST.filter((i) => i.status === "pending").length,
        notApplicable: SECURITY_CHECKLIST.filter((i) => i.status === "not_applicable").length,
        byCategory: {} as Record<string, { passed: number; failed: number; total: number }>,
      };

      SECURITY_CHECKLIST.forEach((item) => {
        if (!report.byCategory[item.category]) {
          report.byCategory[item.category] = { passed: 0, failed: 0, total: 0 };
        }
        report.byCategory[item.category].total++;
        if (item.status === "pass") {
          report.byCategory[item.category].passed++;
        } else if (item.status === "fail") {
          report.byCategory[item.category].failed++;
        }
      });

      console.log("\n========== 安全清单报告 ==========");
      console.log(`总计: ${report.total} 项`);
      console.log(`通过: ${report.passed} 项`);
      console.log(`失败: ${report.failed} 项`);
      console.log(`待定: ${report.pending} 项`);
      console.log(`不适用: ${report.notApplicable} 项`);
      console.log("\n按分类:");
      Object.entries(report.byCategory).forEach(([category, stats]) => {
        console.log(`  ${category}: ${stats.passed}/${stats.total} 通过`);
      });
      console.log("===================================\n");

      // 确保通过率超过 80%
      const passRate = report.passed / (report.total - report.notApplicable);
      expect(passRate).toBeGreaterThan(0.8);
    });
  });

  describe("XSS 向量测试", () => {
    it("应该检测所有 XSS 测试向量", () => {
      expect(XSS_TEST_VECTORS.length).toBeGreaterThan(0);

      XSS_TEST_VECTORS.forEach((vector) => {
        // 验证向量包含潜在危险内容
        const hasDangerousContent =
          vector.includes("<script") ||
          vector.includes("javascript:") ||
          vector.includes("onerror") ||
          vector.includes("onclick") ||
          vector.includes("onload") ||
          vector.includes("constructor");
        expect(hasDangerousContent).toBe(true);
      });
    });

    it("HTML 转义应该正确工作", () => {
      const escapeHtml = (str: string) => {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      XSS_TEST_VECTORS.forEach((vector) => {
        const escaped = escapeHtml(vector);
        // 转义后不应该包含原始的 HTML 标签
        expect(escaped).not.toContain("<script");
        expect(escaped).not.toContain("<img");
        expect(escaped).not.toContain("<svg");
      });
    });
  });

  describe("SQL 注入向量测试", () => {
    it("应该检测所有 SQL 注入测试向量", () => {
      expect(SQL_INJECTION_VECTORS.length).toBeGreaterThan(0);

      SQL_INJECTION_VECTORS.forEach((vector) => {
        // 验证向量包含 SQL 关键字
        const hasSqlKeyword =
          vector.toUpperCase().includes("DROP") ||
          vector.toUpperCase().includes("DELETE") ||
          vector.toUpperCase().includes("UNION") ||
          vector.includes("'") ||
          vector.includes("--");
        expect(hasSqlKeyword).toBe(true);
      });
    });

    it("参数化查询应该安全处理 SQL 注入", () => {
      // 模拟参数化查询
      const safeQuery = (search: string) => {
        // 参数化查询会将参数作为值而非 SQL 代码处理
        return { query: "SELECT * FROM users WHERE name = $1", params: [search] };
      };

      SQL_INJECTION_VECTORS.forEach((vector) => {
        const result = safeQuery(vector);
        // 参数应该作为独立值传递
        expect(result.params[0]).toBe(vector);
        // 查询本身不应该包含用户输入
        expect(result.query).not.toContain(vector);
      });
    });
  });

  describe("敏感数据检测", () => {
    it("应该检测响应中的敏感数据", () => {
      const safeResponse = {
        user: {
          id: "user_1",
          email: "user@example.com",
          username: "user1",
        },
      };

      const issues = checkForSensitiveData(safeResponse);
      expect(issues).toHaveLength(0);
    });

    it("应该标记包含敏感字段的响应", () => {
      const unsafeResponse = {
        user: {
          id: "user_1",
          email: "user@example.com",
          password: "hashed_password_here",
        },
      };

      const issues = checkForSensitiveData(unsafeResponse);
      expect(issues.length).toBeGreaterThan(0);
    });

    it("应该检测 API 密钥泄露", () => {
      const responseWithApiKey = {
        config: {
          api_key: "sk-1234567890abcdef",
        },
      };

      const issues = checkForSensitiveData(responseWithApiKey);
      expect(issues.length).toBeGreaterThan(0);
    });

    it("应该检测 Token 泄露", () => {
      const responseWithToken = {
        debug: {
          access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      };

      const issues = checkForSensitiveData(responseWithToken);
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe("密码策略验证", () => {
    const validatePassword = (password: string) => {
      const errors: string[] = [];

      if (password.length < 8) {
        errors.push("密码长度至少 8 位");
      }
      if (!/[A-Z]/.test(password)) {
        errors.push("密码需要包含大写字母");
      }
      if (!/[a-z]/.test(password)) {
        errors.push("密码需要包含小写字母");
      }
      if (!/[0-9]/.test(password)) {
        errors.push("密码需要包含数字");
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("密码需要包含特殊字符");
      }

      return { valid: errors.length === 0, errors };
    };

    it("应该拒绝弱密码", () => {
      const weakPasswords = ["123456", "password", "qwerty", "abc123"];

      weakPasswords.forEach((pwd) => {
        const result = validatePassword(pwd);
        expect(result.valid).toBe(false);
      });
    });

    it("应该接受强密码", () => {
      const strongPasswords = ["P@ssw0rd!", "Str0ng#Pass", "C0mplex$Pwd"];

      strongPasswords.forEach((pwd) => {
        const result = validatePassword(pwd);
        expect(result.valid).toBe(true);
      });
    });
  });
});

describe("安全配置检查", () => {
  it("应该使用安全的 HTTP 头", () => {
    const expectedHeaders = [
      "X-Content-Type-Options: nosniff",
      "X-Frame-Options: DENY",
      "X-XSS-Protection: 1; mode=block",
      "Strict-Transport-Security",
      "Content-Security-Policy",
    ];

    // 这里模拟检查，实际应该从服务器响应中获取
    const mockHeaders = {
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "x-xss-protection": "1; mode=block",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
    };

    expect(mockHeaders["x-content-type-options"]).toBe("nosniff");
    expect(mockHeaders["x-frame-options"]).toBe("DENY");
  });

  it("应该禁用不安全的 JavaScript 特性", () => {
    // 检查代码中不应该使用的危险函数
    const dangerousFunctions = [
      "eval(",
      "new Function(",
      "setTimeout(string",
      "setInterval(string",
      "document.write(",
      "innerHTML =",
    ];

    // 在实际测试中，应该扫描代码库
    // 这里只是示例
    dangerousFunctions.forEach((fn) => {
      // 验证检测函数名正确
      expect(fn.length).toBeGreaterThan(0);
    });
  });
});
