/**
 * Concurrency ModuleTest
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
 it("ShouldGuaranteeAccess", async () => {
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

 // task1 ShouldcompleteallExecutecompleteagainExecute task2
 expect(results).toEqual([1, 2, 3]);
 });

 it("ShouldcurrentlyRelease", async () => {
 const mutex = new Mutex();

 await mutex.acquire();
 mutex.release();

 // ShouldcanagaintimesFetch
 await expect(mutex.acquire()).resolves.toBeUndefined();
 mutex.release();
 });
});

describe("RWMutex", () => {
 it("ShouldAllowmultipleReadusertimeAccess", async () => {
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

 // ReadShouldcanwithExecute
 expect(results[0]).toBe("read1-start");
 expect(results[1]).toBe("read2-start");
 });

 it("enterShouldAccess", async () => {
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

 // enterShouldOrderExecute
 expect(results).toEqual(["write1-start", "write1-end", "write2-start", "write2-end"]);
 });
});

describe("Semaphore", () => {
 it("ShouldLimitConcurrencycount", async () => {
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

 it("withPermit ShouldAutoReleasecan", async () => {
 const semaphore = new Semaphore(1);

 await semaphore.withPermit(async () => {
 expect(semaphore.availablePermits()).toBe(0);
 });

 expect(semaphore.availablePermits()).toBe(1);
 });
});

describe("AtomicCounter", () => {
 it("Shouldcurrently", () => {
 const counter = new AtomicCounter(0);

 expect(counter.increment()).toBe(1);
 expect(counter.increment()).toBe(2);
 expect(counter.get()).toBe(2);
 });

 it("Shouldcurrently", () => {
 const counter = new AtomicCounter(5);

 expect(counter.decrement()).toBe(4);
 expect(counter.decrement()).toBe(3);
 expect(counter.get()).toBe(3);
 });

 it("ShouldcurrentlyExecute compareAndSet", () => {
 const counter = new AtomicCounter(5);

 expect(counter.compareAndSet(5, 10)).toBe(true);
 expect(counter.get()).toBe(10);

 expect(counter.compareAndSet(5, 15)).toBe(false);
 expect(counter.get()).toBe(10);
 });

 it("ShouldcurrentlyReset", () => {
 const counter = new AtomicCounter(100);
 counter.reset();
 expect(counter.get()).toBe(0);
 });
});

describe("CancellationToken", () => {
 it("InitialStatusShouldisnot yetCancel", () => {
 const token = new CancellationToken();
 expect(token.isCancelled()).toBe(false);
 });

 it("CancelafterStatusShouldisCancelled", () => {
 const token = new CancellationToken();
 token.cancel();
 expect(token.isCancelled()).toBe(true);
 });

 it("ShouldCallCancelCallback", () => {
 const token = new CancellationToken();
 const callback = vi.fn();

 token.onCancel(callback);
 token.cancel();

 expect(callback).toHaveBeenCalledTimes(1);
 });

 it("throwIfCancelled ShouldatCancelafterThrowError", () => {
 const token = new CancellationToken();
 token.cancel();

 expect(() => token.throwIfCancelled()).toThrow("Operation cancelled");
 });

 it("re-CancelnotShouldre-CallCallback", () => {
 const token = new CancellationToken();
 const callback = vi.fn();

 token.onCancel(callback);
 token.cancel();
 token.cancel();

 expect(callback).toHaveBeenCalledTimes(1);
 });
});

describe("VersionedState", () => {
 it("ShouldcurrentlyFetchInitialvalueandVersion", () => {
 const state = new VersionedState({ count: 0 });
 const { value, version } = state.get();

 expect(value).toEqual({ count: 0 });
 expect(version).toBe(0);
 });

 it("SettingsnewvalueShouldIncreaseVersion", () => {
 const state = new VersionedState({ count: 0 });

 state.set({ count: 1 });
 expect(state.getVersion()).toBe(1);

 state.set({ count: 2 });
 expect(state.getVersion()).toBe(2);
 });

 it("compareAndSet ShouldCheckVersion", () => {
 const state = new VersionedState({ count: 0 });

 // VersionMatch，ShouldSuccess
 expect(state.compareAndSet(0, { count: 1 })).toBe(true);
 expect(state.get().value).toEqual({ count: 1 });

 // VersionnotMatch，ShouldFailed
 expect(state.compareAndSet(0, { count: 2 })).toBe(false);
 expect(state.get().value).toEqual({ count: 1 });
 });
});

describe("RequestSerializer", () => {
 it("ShouldVia Mutex SequenceRequestExecute", async () => {
 const serializer = new RequestSerializer();
 const results: number[] = [];

 const mockFn1 = vi.fn().mockImplementation(async () => {
 results.push(1);
 return "result1";
 });

 const mockFn2 = vi.fn().mockImplementation(async () => {
 results.push(2);
 return "result2";
 });

 // timenot key 'sRequest
 const [result1, result2] = await Promise.all([
 serializer.execute("key1", mockFn1),
 serializer.execute("key2", mockFn2),
 ]);

 // as Mutex row，RequestShouldallExecute
 expect(mockFn1).toHaveBeenCalledTimes(1);
 expect(mockFn2).toHaveBeenCalledTimes(1);
 expect(result1).toBe("result1");
 expect(result2).toBe("result2");
 });

 it("hasPending ShouldcurrentlyDetectIn Progress'sRequest", async () => {
 const serializer = new RequestSerializer();
 let resolvePromise: () => void;
 const mockFn = vi.fn().mockImplementation(
 () =>
 new Promise<string>((resolve) => {
 resolvePromise = () => resolve("result");
 })
 );

 const promise = serializer.execute("key", mockFn);

 // etcpending mutex FetchandStartExecute
 await new Promise((r) => setTimeout(r, 10));

 expect(serializer.hasPending("key")).toBe(true);
 expect(serializer.hasPending("other")).toBe(false);

 resolvePromise!();
 await promise;

 expect(serializer.hasPending("key")).toBe(false);
 });
});
