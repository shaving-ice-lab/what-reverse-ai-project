/**
 * API Client unit tests
 * Covering core requests, error handling, retry logic
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

  describe("Basic Requests", () => {
    it("should correctly send GET request", async () => {
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

    it("should correctly send POST request with body", async () => {
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

    it("should correctly send PATCH request", async () => {
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

    it("should correctly send DELETE request", async () => {
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

  describe("Query Parameter Handling", () => {
    it("should correctly append query parameters", async () => {
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

    it("should ignore undefined parameter values", async () => {
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

  describe("Authentication Handling", () => {
    it("should add Authorization header to requests", async () => {
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

    it("should not add Authorization header when no token exists", async () => {
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

    it("getAccessToken should return cached token", () => {
      setTokens("cached-token", "refresh-token");
      expect(getAccessToken()).toBe("cached-token");
    });

    it("clearTokens should clear all tokens", () => {
      setTokens("token", "refresh");
      clearTokens();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should throw ApiError on HTTP errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            error_code: "VALIDATION_ERROR",
            error_message: "Validation failed",
          }),
      });

      await expect(api.get("/test")).rejects.toThrow(ApiError);
      await expect(api.get("/test")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });
    });

    it("should throw permission error on 403", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            code: "FORBIDDEN",
            message: "Access denied",
          }),
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("should throw NOT_FOUND error on 404", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            code: "NOT_FOUND",
            message: "Resource not found",
          }),
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });

    it("should throw NETWORK_ERROR on network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });

    it("should throw TIMEOUT error on timeout", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(api.get("/test", { timeout: 100 })).rejects.toMatchObject({
        code: "TIMEOUT",
        status: 408,
      });
    });
  });

  describe("Token Refresh", () => {
    it("should attempt token refresh on 401", async () => {
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
                message: "Token expired",
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

      expect(global.fetch).toHaveBeenCalledTimes(3); // Original request + refresh + retry
    });

    it("should throw TOKEN_EXPIRED error when refresh fails", async () => {
      setTokens("expired-token", "invalid-refresh-token");

      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/auth/refresh")) {
          return {
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                code: "INVALID_REFRESH_TOKEN",
                message: "Invalid refresh token",
              }),
          };
        }

        return {
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              code: "TOKEN_EXPIRED",
              message: "Token expired",
            }),
        };
      });

      await expect(api.get("/test")).rejects.toMatchObject({
        code: "TOKEN_EXPIRED",
        status: 401,
      });
    });
  });

  describe("Retry Logic", () => {
    it("GET requests should retry on 5xx errors", async () => {
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
                message: "Server error",
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

    it("POST requests should not retry by default", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            code: "INTERNAL_ERROR",
            message: "Server error",
          }),
      });

      await expect(api.post("/test", {})).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should not retry 401/403/404 errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            code: "FORBIDDEN",
            message: "No permission",
          }),
      });

      await expect(api.get("/test", { retry: 3 })).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Response Parsing", () => {
    it("should correctly unwrap the data field", async () => {
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

    it("requestRaw should return the full response", async () => {
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
