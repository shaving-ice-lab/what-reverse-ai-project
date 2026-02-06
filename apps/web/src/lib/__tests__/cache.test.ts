/**
 * Cache 模块测试
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CACHE_TIMES,
  queryKeys,
  localCache,
  dedupeRequest,
} from "../cache";

describe("CACHE_TIMES", () => {
  it("应该定义正确的缓存时间", () => {
    expect(CACHE_TIMES.INSTANT).toBe(0);
    expect(CACHE_TIMES.SHORT).toBe(60 * 1000);
    expect(CACHE_TIMES.MEDIUM).toBe(5 * 60 * 1000);
    expect(CACHE_TIMES.LONG).toBe(30 * 60 * 1000);
    expect(CACHE_TIMES.PERSISTENT).toBe(60 * 60 * 1000);
    expect(CACHE_TIMES.FOREVER).toBe(Infinity);
  });
});

describe("queryKeys", () => {
  describe("user", () => {
    it("应该生成正确的用户相关键", () => {
      expect(queryKeys.user.all).toEqual(["user"]);
      expect(queryKeys.user.profile()).toEqual(["user", "profile"]);
      expect(queryKeys.user.settings()).toEqual(["user", "settings"]);
    });
  });

  describe("workflows", () => {
    it("应该生成正确的工作流相关键", () => {
      expect(queryKeys.workflows.all).toEqual(["workflows"]);
      expect(queryKeys.workflows.lists()).toEqual(["workflows", "list"]);
      expect(queryKeys.workflows.list({ status: "active" })).toEqual([
        "workflows",
        "list",
        { status: "active" },
      ]);
      expect(queryKeys.workflows.detail("wf-123")).toEqual([
        "workflows",
        "detail",
        "wf-123",
      ]);
      expect(queryKeys.workflows.executions("wf-123")).toEqual([
        "workflows",
        "executions",
        "wf-123",
      ]);
    });
  });

  describe("apiKeys", () => {
    it("应该生成正确的 API 密钥相关键", () => {
      expect(queryKeys.apiKeys.all).toEqual(["apiKeys"]);
      expect(queryKeys.apiKeys.list()).toEqual(["apiKeys", "list"]);
      expect(queryKeys.apiKeys.providers()).toEqual(["apiKeys", "providers"]);
    });
  });

  describe("executions", () => {
    it("应该生成正确的执行相关键", () => {
      expect(queryKeys.executions.all).toEqual(["executions"]);
      expect(queryKeys.executions.detail("exec-123")).toEqual([
        "executions",
        "detail",
        "exec-123",
      ]);
      expect(queryKeys.executions.logs("exec-123")).toEqual([
        "executions",
        "logs",
        "exec-123",
      ]);
    });
  });

  describe("store", () => {
    it("应该生成正确的商店相关键", () => {
      expect(queryKeys.store.all).toEqual(["store"]);
      expect(queryKeys.store.agents({ category: "ai" })).toEqual([
        "store",
        "agents",
        { category: "ai" },
      ]);
      expect(queryKeys.store.agent("agent-123")).toEqual([
        "store",
        "agent",
        "agent-123",
      ]);
      expect(queryKeys.store.categories()).toEqual(["store", "categories"]);
    });
  });
});

describe("localCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("应该正确设置和获取缓存", () => {
    const data = { name: "test" };
    localCache.set("test-key", data);

    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("应该正确删除缓存", () => {
    localCache.remove("test-key");
    expect(localStorage.removeItem).toHaveBeenCalledWith("agentflow_cache_test-key");
  });
});

describe("dedupeRequest", () => {
  it("应该去重并发请求", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");

    // 同时发起两个相同的请求
    const promise1 = dedupeRequest("key", mockFn);
    const promise2 = dedupeRequest("key", mockFn);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    // 函数只应该被调用一次
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe("result");
    expect(result2).toBe("result");
  });

  it("不同 key 的请求应该分别执行", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");

    await Promise.all([
      dedupeRequest("key1", mockFn),
      dedupeRequest("key2", mockFn),
    ]);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("请求完成后应该允许新请求", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");

    await dedupeRequest("key", mockFn);
    await dedupeRequest("key", mockFn);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
