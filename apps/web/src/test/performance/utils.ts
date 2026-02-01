/**
 * 性能测试工具函数
 * @description 提供性能测量和报告的工具
 */

/**
 * 性能测量结果
 */
export interface PerformanceResult {
  /** 测试名称 */
  name: string;
  /** 执行次数 */
  iterations: number;
  /** 总耗时 (ms) */
  totalTime: number;
  /** 平均耗时 (ms) */
  averageTime: number;
  /** 最小耗时 (ms) */
  minTime: number;
  /** 最大耗时 (ms) */
  maxTime: number;
  /** 标准差 (ms) */
  stdDev: number;
  /** P50 (ms) */
  p50: number;
  /** P90 (ms) */
  p90: number;
  /** P99 (ms) */
  p99: number;
  /** 操作每秒 */
  opsPerSecond: number;
}

/**
 * 内存使用快照
 */
export interface MemorySnapshot {
  /** 已使用堆内存 (bytes) */
  usedJSHeapSize: number;
  /** 堆内存总大小 (bytes) */
  totalJSHeapSize: number;
  /** 堆内存限制 (bytes) */
  jsHeapSizeLimit: number;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 性能阈值配置
 */
export interface PerformanceThresholds {
  /** 最大平均耗时 (ms) */
  maxAverageTime?: number;
  /** 最大 P99 (ms) */
  maxP99?: number;
  /** 最小操作每秒 */
  minOpsPerSecond?: number;
  /** 最大内存增长 (bytes) */
  maxMemoryGrowth?: number;
}

/**
 * 计算百分位数
 */
export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 计算标准差
 */
export function standardDeviation(arr: number[]): number {
  const n = arr.length;
  if (n === 0) return 0;
  
  const mean = arr.reduce((sum, val) => sum + val, 0) / n;
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / n;
  
  return Math.sqrt(avgSquaredDiff);
}

/**
 * 执行性能测试
 */
export async function benchmark<T>(
  name: string,
  fn: () => T | Promise<T>,
  options: {
    iterations?: number;
    warmupIterations?: number;
  } = {}
): Promise<PerformanceResult> {
  const { iterations = 100, warmupIterations = 10 } = options;
  const times: number[] = [];

  // 预热
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // 正式测试
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0);
  const averageTime = totalTime / iterations;

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    stdDev: standardDeviation(times),
    p50: percentile(times, 50),
    p90: percentile(times, 90),
    p99: percentile(times, 99),
    opsPerSecond: 1000 / averageTime,
  };
}

/**
 * 获取内存快照
 */
export function getMemorySnapshot(): MemorySnapshot | null {
  if (typeof performance === 'undefined') return null;
  
  // @ts-expect-error - memory is non-standard
  const memory = performance.memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: Date.now(),
  };
}

/**
 * 测量内存增长
 */
export async function measureMemoryGrowth<T>(
  fn: () => T | Promise<T>,
  iterations: number = 100
): Promise<{
  startMemory: MemorySnapshot | null;
  endMemory: MemorySnapshot | null;
  growth: number;
}> {
  // 强制垃圾回收（如果可用）
  if (typeof global !== 'undefined' && (global as unknown as { gc?: () => void }).gc) {
    (global as unknown as { gc: () => void }).gc();
  }

  const startMemory = getMemorySnapshot();

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  const endMemory = getMemorySnapshot();

  const growth = startMemory && endMemory
    ? endMemory.usedJSHeapSize - startMemory.usedJSHeapSize
    : 0;

  return { startMemory, endMemory, growth };
}

/**
 * 验证性能是否符合阈值
 */
export function validatePerformance(
  result: PerformanceResult,
  thresholds: PerformanceThresholds
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  if (thresholds.maxAverageTime && result.averageTime > thresholds.maxAverageTime) {
    failures.push(
      `平均耗时 ${result.averageTime.toFixed(2)}ms 超过阈值 ${thresholds.maxAverageTime}ms`
    );
  }

  if (thresholds.maxP99 && result.p99 > thresholds.maxP99) {
    failures.push(
      `P99 ${result.p99.toFixed(2)}ms 超过阈值 ${thresholds.maxP99}ms`
    );
  }

  if (thresholds.minOpsPerSecond && result.opsPerSecond < thresholds.minOpsPerSecond) {
    failures.push(
      `OPS ${result.opsPerSecond.toFixed(2)} 低于阈值 ${thresholds.minOpsPerSecond}`
    );
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

/**
 * 格式化性能报告
 */
export function formatPerformanceReport(result: PerformanceResult): string {
  return `
性能测试报告: ${result.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
执行次数: ${result.iterations}
总耗时: ${result.totalTime.toFixed(2)}ms
平均耗时: ${result.averageTime.toFixed(2)}ms
最小耗时: ${result.minTime.toFixed(2)}ms
最大耗时: ${result.maxTime.toFixed(2)}ms
标准差: ${result.stdDev.toFixed(2)}ms
P50: ${result.p50.toFixed(2)}ms
P90: ${result.p90.toFixed(2)}ms
P99: ${result.p99.toFixed(2)}ms
OPS: ${result.opsPerSecond.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 创建性能测试套件
 */
export function createPerformanceSuite(name: string) {
  const results: PerformanceResult[] = [];

  return {
    name,
    
    async add<T>(
      testName: string,
      fn: () => T | Promise<T>,
      options?: { iterations?: number; warmupIterations?: number }
    ) {
      const result = await benchmark(testName, fn, options);
      results.push(result);
      return result;
    },

    getResults() {
      return [...results];
    },

    printReport() {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`性能测试套件: ${name}`);
      console.log('='.repeat(50));
      
      for (const result of results) {
        console.log(formatPerformanceReport(result));
        console.log('');
      }
    },

    validateAll(thresholds: PerformanceThresholds) {
      const validations = results.map(result => ({
        name: result.name,
        ...validatePerformance(result, thresholds),
      }));

      return {
        allPassed: validations.every(v => v.passed),
        validations,
      };
    },
  };
}
