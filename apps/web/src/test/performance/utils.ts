/**
 * Performance Test Utilities
 * @description Provide performance measurement and reporting tools
 */

/**
 * Performance Result
 */
export interface PerformanceResult {
  /** Test Name */
  name: string
  /** Iteration Count */
  iterations: number
  /** Total Duration (ms) */
  totalTime: number
  /** Average Duration (ms) */
  averageTime: number
  /** Minimum Duration (ms) */
  minTime: number
  /** Maximum Duration (ms) */
  maxTime: number
  /** Standard Deviation (ms) */
  stdDev: number
  /** P50 (ms) */
  p50: number
  /** P90 (ms) */
  p90: number
  /** P99 (ms) */
  p99: number
  /** Operations Per Second */
  opsPerSecond: number
}

/**
 * Memory Usage Snapshot
 */
export interface MemorySnapshot {
  /** Used Heap Size (bytes) */
  usedJSHeapSize: number
  /** Total Heap Size (bytes) */
  totalJSHeapSize: number
  /** Heap Size Limit (bytes) */
  jsHeapSizeLimit: number
  /** Timestamp */
  timestamp: number
}

/**
 * Performance Threshold Configuration
 */
export interface PerformanceThresholds {
  /** Maximum Average Duration (ms) */
  maxAverageTime?: number
  /** Maximum P99 (ms) */
  maxP99?: number
  /** Minimum Operations Per Second */
  minOpsPerSecond?: number
  /** Maximum Memory Growth (bytes) */
  maxMemoryGrowth?: number
}

/**
 * Calculate Percentile
 */
export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate Standard Deviation
 */
export function standardDeviation(arr: number[]): number {
  const n = arr.length
  if (n === 0) return 0

  const mean = arr.reduce((sum, val) => sum + val, 0) / n
  const squaredDiffs = arr.map((val) => Math.pow(val - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / n

  return Math.sqrt(avgSquaredDiff)
}

/**
 * Execute Performance Benchmark
 */
export async function benchmark<T>(
  name: string,
  fn: () => T | Promise<T>,
  options: {
    iterations?: number
    warmupIterations?: number
  } = {}
): Promise<PerformanceResult> {
  const { iterations = 100, warmupIterations = 10 } = options
  const times: number[] = []

  //
  for (let i = 0; i < warmupIterations; i++) {
    await fn()
  }

  // Run Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0)
  const averageTime = totalTime / iterations

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
  }
}

/**
 * Get Memory Snapshot
 */
export function getMemorySnapshot(): MemorySnapshot | null {
  if (typeof performance === 'undefined') return null

  // @ts-expect-error - memory is non-standard
  const memory = performance.memory
  if (!memory) return null

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: Date.now(),
  }
}

/**
 * Measure Memory Growth
 */
export async function measureMemoryGrowth<T>(
  fn: () => T | Promise<T>,
  iterations: number = 100
): Promise<{
  startMemory: MemorySnapshot | null
  endMemory: MemorySnapshot | null
  growth: number
}> {
  // Force garbage collection (if available)
  if (typeof global !== 'undefined' && (global as unknown as { gc?: () => void }).gc) {
    ;(global as unknown as { gc: () => void }).gc()
  }

  const startMemory = getMemorySnapshot()

  for (let i = 0; i < iterations; i++) {
    await fn()
  }

  const endMemory = getMemorySnapshot()

  const growth =
    startMemory && endMemory ? endMemory.usedJSHeapSize - startMemory.usedJSHeapSize : 0

  return { startMemory, endMemory, growth }
}

/**
 * Verify if performance is acceptable
 */
export function validatePerformance(
  result: PerformanceResult,
  thresholds: PerformanceThresholds
): { passed: boolean; failures: string[] } {
  const failures: string[] = []

  if (thresholds.maxAverageTime && result.averageTime > thresholds.maxAverageTime) {
    failures.push(
      `Average duration ${result.averageTime.toFixed(2)}ms exceeds threshold ${thresholds.maxAverageTime}ms`
    )
  }

  if (thresholds.maxP99 && result.p99 > thresholds.maxP99) {
    failures.push(`P99 ${result.p99.toFixed(2)}ms exceeds threshold ${thresholds.maxP99}ms`)
  }

  if (thresholds.minOpsPerSecond && result.opsPerSecond < thresholds.minOpsPerSecond) {
    failures.push(
      `OPS ${result.opsPerSecond.toFixed(2)} below minimum ${thresholds.minOpsPerSecond}`
    )
  }

  return {
    passed: failures.length === 0,
    failures,
  }
}

/**
 * Format Performance Report
 */
export function formatPerformanceReport(result: PerformanceResult): string {
  return `
Performance Test Report: ${result.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Iterations: ${result.iterations}
Total Duration: ${result.totalTime.toFixed(2)}ms
Average Duration: ${result.averageTime.toFixed(2)}ms
Minimum Duration: ${result.minTime.toFixed(2)}ms
Maximum Duration: ${result.maxTime.toFixed(2)}ms
Standard Deviation: ${result.stdDev.toFixed(2)}ms
P50: ${result.p50.toFixed(2)}ms
P90: ${result.p90.toFixed(2)}ms
P99: ${result.p99.toFixed(2)}ms
OPS: ${result.opsPerSecond.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
}

/**
 * Format Bytes Size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Create Performance Test Suite
 */
export function createPerformanceSuite(name: string) {
  const results: PerformanceResult[] = []

  return {
    name,

    async add<T>(
      testName: string,
      fn: () => T | Promise<T>,
      options?: { iterations?: number; warmupIterations?: number }
    ) {
      const result = await benchmark(testName, fn, options)
      results.push(result)
      return result
    },

    getResults() {
      return [...results]
    },

    printReport() {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`Performance Test Suite: ${name}`)
      console.log('='.repeat(50))

      for (const result of results) {
        console.log(formatPerformanceReport(result))
        console.log('')
      }
    },

    validateAll(thresholds: PerformanceThresholds) {
      const validations = results.map((result) => ({
        name: result.name,
        ...validatePerformance(result, thresholds),
      }))

      return {
        allPassed: validations.every((v) => v.passed),
        validations,
      }
    },
  }
}
