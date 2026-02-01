/**
 * Concurrency 模块测试
 */

import { describe, it, expect, vi } from "vitest";
import {
  Mutex,
  RWMutex,
  Semaphore,
  AtomicCounter,
  CancellationToken,
  VersionedState,
  RequestSerializer,
} from "../concurrency";

describe("Mutex", () => {
  it("应该保证互斥访问", async () => {
    const mutex = new Mutex();
    const results: number[] = [];

    const task1 = mutex.withLock(async () => {
      results.push(1);
      await new Promise((r) => setTimeout(r, 50));
      results.push(2);
      return "task1";
    });

    const task2 = mutex.withLock(async () => {
      results.push(3);
      return "task2";
    });

    await Promise.all([task1, task2]);

    // task1 应该完全执行完再执行 task2
    expect(results).toEqual([1, 2, 3]);
  });

  it("应该正确释放锁", async () => {
    const mutex = new Mutex();

    await mutex.acquire();
    mutex.release();

    // 应该能再次获取锁
    await expect(mutex.acquire()).resolves.toBeUndefined();
    mutex.release();
  });
});

describe("RWMutex", () => {
  it("应该允许多个读取者同时访问", async () => {
    const rwMutex = new RWMutex();
    const results: string[] = [];

    const read1 = rwMutex.withReadLock(async () => {
      results.push("read1-start");
      await new Promise((r) => setTimeout(r, 50));
      results.push("read1-end");
    });

    const read2 = rwMutex.withReadLock(async () => {
      results.push("read2-start");
      await new Promise((r) => setTimeout(r, 50));
      results.push("read2-end");
    });

    await Promise.all([read1, read2]);

    // 两个读取应该可以交错执行
    expect(results[0]).toBe("read1-start");
    expect(results[1]).toBe("read2-start");
  });

  it("写入应该独占访问", async () => {
    const rwMutex = new RWMutex();
    const results: string[] = [];

    const write1 = rwMutex.withWriteLock(async () => {
      results.push("write1-start");
      await new Promise((r) => setTimeout(r, 50));
      results.push("write1-end");
    });

    const write2 = rwMutex.withWriteLock(async () => {
      results.push("write2-start");
      results.push("write2-end");
    });

    await Promise.all([write1, write2]);

    // 写入应该顺序执行
    expect(results).toEqual(["write1-start", "write1-end", "write2-start", "write2-end"]);
  });
});

describe("Semaphore", () => {
  it("应该限制并发数", async () => {
    const semaphore = new Semaphore(2);
    let concurrent = 0;
    let maxConcurrent = 0;

    const task = async () => {
      await semaphore.acquire();
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 50));
      concurrent--;
      semaphore.release();
    };

    await Promise.all([task(), task(), task(), task()]);

    expect(maxConcurrent).toBe(2);
  });

  it("withPermit 应该自动释放许可", async () => {
    const semaphore = new Semaphore(1);

    await semaphore.withPermit(async () => {
      expect(semaphore.availablePermits()).toBe(0);
    });

    expect(semaphore.availablePermits()).toBe(1);
  });
});

describe("AtomicCounter", () => {
  it("应该正确递增", () => {
    const counter = new AtomicCounter(0);

    expect(counter.increment()).toBe(1);
    expect(counter.increment()).toBe(2);
    expect(counter.get()).toBe(2);
  });

  it("应该正确递减", () => {
    const counter = new AtomicCounter(5);

    expect(counter.decrement()).toBe(4);
    expect(counter.decrement()).toBe(3);
    expect(counter.get()).toBe(3);
  });

  it("应该正确执行 compareAndSet", () => {
    const counter = new AtomicCounter(5);

    expect(counter.compareAndSet(5, 10)).toBe(true);
    expect(counter.get()).toBe(10);

    expect(counter.compareAndSet(5, 15)).toBe(false);
    expect(counter.get()).toBe(10);
  });

  it("应该正确重置", () => {
    const counter = new AtomicCounter(100);
    counter.reset();
    expect(counter.get()).toBe(0);
  });
});

describe("CancellationToken", () => {
  it("初始状态应该是未取消", () => {
    const token = new CancellationToken();
    expect(token.isCancelled()).toBe(false);
  });

  it("取消后状态应该是已取消", () => {
    const token = new CancellationToken();
    token.cancel();
    expect(token.isCancelled()).toBe(true);
  });

  it("应该调用取消回调", () => {
    const token = new CancellationToken();
    const callback = vi.fn();

    token.onCancel(callback);
    token.cancel();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("throwIfCancelled 应该在取消后抛出错误", () => {
    const token = new CancellationToken();
    token.cancel();

    expect(() => token.throwIfCancelled()).toThrow("Operation cancelled");
  });

  it("重复取消不应该重复调用回调", () => {
    const token = new CancellationToken();
    const callback = vi.fn();

    token.onCancel(callback);
    token.cancel();
    token.cancel();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("VersionedState", () => {
  it("应该正确获取初始值和版本", () => {
    const state = new VersionedState({ count: 0 });
    const { value, version } = state.get();

    expect(value).toEqual({ count: 0 });
    expect(version).toBe(0);
  });

  it("设置新值应该增加版本", () => {
    const state = new VersionedState({ count: 0 });

    state.set({ count: 1 });
    expect(state.getVersion()).toBe(1);

    state.set({ count: 2 });
    expect(state.getVersion()).toBe(2);
  });

  it("compareAndSet 应该检查版本", () => {
    const state = new VersionedState({ count: 0 });

    // 版本匹配，应该成功
    expect(state.compareAndSet(0, { count: 1 })).toBe(true);
    expect(state.get().value).toEqual({ count: 1 });

    // 版本不匹配，应该失败
    expect(state.compareAndSet(0, { count: 2 })).toBe(false);
    expect(state.get().value).toEqual({ count: 1 });
  });
});

describe("RequestSerializer", () => {
  it("应该序列化相同 key 的请求", async () => {
    const serializer = new RequestSerializer();
    const mockFn = vi.fn().mockResolvedValue("result");

    // 同时发起两个相同 key 的请求
    const promise1 = serializer.execute("key", mockFn);
    const promise2 = serializer.execute("key", mockFn);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    // 请求应该只执行一次
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe("result");
    expect(result2).toBe("result");
  });

  it("hasPending 应该正确检测进行中的请求", async () => {
    const serializer = new RequestSerializer();
    let resolvePromise: () => void;
    const mockFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = () => resolve("result");
      })
    );

    const promise = serializer.execute("key", mockFn);

    expect(serializer.hasPending("key")).toBe(true);
    expect(serializer.hasPending("other")).toBe(false);

    resolvePromise!();
    await promise;

    expect(serializer.hasPending("key")).toBe(false);
  });
});
