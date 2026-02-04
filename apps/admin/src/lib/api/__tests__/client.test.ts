/**
 * API Client 单元测试
 * 覆盖核心请求、错误处理、重试逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  api,
  requestRaw,
  ApiError,
  setTokens,
  clearTokens,
  getAccessToken,
} from "../client";

describe("API Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearTokens();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("基础请求", () => {
    it("应该正确发送 GET 请求", async () => {
      const mockResponse = { code: "OK", message: "OK", data: { id: "1" } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get<{ id: string }>("/test");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: "1" });
    });

    it("应该正确发送 POST 请求并传递 body", async () => {
      const mockResponse = { code: "OK", message: "OK", data: { created: true } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const body = { name: "test" };
      const result = await api.post<{ created: boolean }>("/test", body);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall[1]?.body).toBe(JSON.stringify(body));
      expect(result).toEqual({ created: true });
    });

    it("应该正确发送 PATCH 请求", async () => {
      const mockResponse = { code: "OK", message: "OK", data: { updated: true } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const body = { status: "active" };
      const result = await api.patch<{ updated: boolean }>("/test/1", body);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ updated: true });
    });

    it("应该正确发送 DELETE 请求", async () => {
      const mockResponse = { code: "OK", message: "OK", data: {} };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.delete("/test/1");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("查询参数处理", () => {
    it("应该正确附加查询参数", async () => {
      const mockResponse = { code: "OK", message: "OK", data: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.get("/test", { params: { page: 1, page_size: 20, search: "test" } });

      const url = vi.mocked(global.fetch).mock.calls[0][0] as string;
      expect(url).toContain("page=1");
      expect(url).toContain("page_size=20");
      expect(url).toContain("search=test");
    });

    it("应该忽略 undefined 参数值", async () => {
      const mockResponse = { code: "OK", message: "OK", data: [] };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.get("/test", { params: { page: 1, status: undefined } });

      const url = vi.mocked(global.fetch).mock.calls[0][0] as string;
      expect(url).toContain("page=1");
      expect(url).not.toContain("status");
    });
  });

  describe("认证处理", () => {
    it("应该在请求中添加 Authorization header", async () => {
      setTokens("test-access-token", "test-refresh-token");

      const mockResponse = { code: "OK", message: "OK", data: {} };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.get("/test");

      const headers = vi.mocked(global.fetch).mock.calls[0][1]?.headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer test-access-token");
    });

    it("无 token 时不应该添加 Authorization header", async () => {
      clearTokens();

      const mockResponse = { code: "OK", message: "OK", data: {} };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      await api.get("/test");

      const headers = vi.mocked(global.fetch).mock.calls[0][1]?.headers as Headers;
      expect(headers.has("Authorization")).toBe(false);
    });

    it("getAccessToken 应该返回缓存的 token", () => {
      setTokens("cached-token", "refresh-token");
      expect(getAccessToken()).toBe("cached-token");
    });

    it("clearTokens 应该清除所有 token", () => {
      setTokens("token", "refresh");
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("错误处理", () => {
    it("应该在 HTTP 错误时抛出 ApiError", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            code: "VALIDATION_ERROR",
            message: "验证失败",
            error_code: "VALIDATION_ERROR",
            error_message: "验证失败",
          }),
      });

      await expect(api.get("/test")).rejects.toThrow(ApiError);
      await expect(api.get("/test")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });
    });

    it("应该在 403 时抛出权限错误", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            code: "FORBIDDEN",
            message: "无权限访问",
          }),
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("应该在 404 时抛出 NOT_FOUND 错误", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            code: "NOT_FOUND",
            message: "资源不存在",
          }),
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });

    it("应该在网络错误时抛出 NETWORK_ERROR", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });

    it("应该在超时时抛出 TIMEOUT 错误", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(api.get("/test", { timeout: 100 })).rejects.toMatchObject({
        code: "TIMEOUT",
        status: 408,
      });
    });
  });

  describe("Token 刷新", () => {
    it("应该在 401 时尝试刷新 token", async () => {
      setTokens("expired-token", "valid-refresh-token");

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          return {
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                code: "OK",
                message: "OK",
                data: {
                  access_token: "new-access-token",
                  refresh_token: "new-refresh-token",
                },
              }),
          };
        }

        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                code: "TOKEN_EXPIRED",
                message: "Token 已过期",
              }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({ code: "OK", message: "OK", data: {} }),
        };
      });

      await api.get("/test");

      expect(global.fetch).toHaveBeenCalledTimes(3); // 原始请求 + 刷新 + 重试
    });

    it("刷新失败时应该抛出 TOKEN_EXPIRED 错误", async () => {
      setTokens("expired-token", "invalid-refresh-token");

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          return {
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                code: "INVALID_REFRESH_TOKEN",
                message: "刷新 Token 无效",
              }),
          };
        }

        return {
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              code: "TOKEN_EXPIRED",
              message: "Token 已过期",
            }),
        };
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "TOKEN_EXPIRED",
        status: 401,
      });
    });
  });

  describe("重试逻辑", () => {
    it("GET 请求在 5xx 错误时应该重试", async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            json: () =>
              Promise.resolve({
                code: "INTERNAL_ERROR",
                message: "服务器错误",
              }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve({ code: "OK", message: "OK", data: {} }),
        };
      });

      await api.get("/test", { retry: 1 });

      expect(callCount).toBe(2);
    });

    it("POST 请求默认不应该重试", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            code: "INTERNAL_ERROR",
            message: "服务器错误",
          }),
      });

      await expect(api.post("/test", {})).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("不应该重试 401/403/404 错误", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            code: "FORBIDDEN",
            message: "无权限",
          }),
      });

      await expect(api.get("/test", { retry: 3 })).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("响应解析", () => {
    it("应该正确解包 data 字段", async () => {
      const mockResponse = {
        code: "OK",
        message: "OK",
        data: { users: [{ id: "1" }], total: 1 },
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get<{ users: { id: string }[]; total: number }>("/users");

      expect(result).toEqual({ users: [{ id: "1" }], total: 1 });
    });

    it("requestRaw 应该返回完整响应", async () => {
      const mockResponse = {
        code: "OK",
        message: "OK",
        data: { id: "1" },
        trace_id: "trace-123",
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await requestRaw("/test");

      expect(result).toMatchObject({
        code: "OK",
        data: { id: "1" },
        trace_id: "trace-123",
      });
    });
  });
});
