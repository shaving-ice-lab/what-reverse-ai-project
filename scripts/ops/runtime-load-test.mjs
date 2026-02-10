#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const args = process.argv.slice(2)

function parseArgs(input) {
  const options = { headers: [] }
  for (let i = 0; i < input.length; i += 1) {
    const arg = input[i]
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break
      case '--url':
        options.url = input[i + 1]
        i += 1
        break
      case '--method':
        options.method = input[i + 1]
        i += 1
        break
      case '--payload':
        options.payload = input[i + 1]
        i += 1
        break
      case '--payload-file':
        options.payloadFile = input[i + 1]
        i += 1
        break
      case '--concurrency':
        options.concurrency = input[i + 1]
        i += 1
        break
      case '--requests':
        options.requests = input[i + 1]
        i += 1
        break
      case '--timeout-ms':
        options.timeoutMs = input[i + 1]
        i += 1
        break
      case '--header':
        options.headers.push(input[i + 1])
        i += 1
        break
      case '--output':
        options.output = input[i + 1]
        i += 1
        break
      case '--max-error-rate':
        options.maxErrorRate = input[i + 1]
        i += 1
        break
      case '--min-rps':
        options.minRps = input[i + 1]
        i += 1
        break
      case '--max-avg-ms':
        options.maxAvgMs = input[i + 1]
        i += 1
        break
      case '--max-p95-ms':
        options.maxP95Ms = input[i + 1]
        i += 1
        break
      case '--max-p99-ms':
        options.maxP99Ms = input[i + 1]
        i += 1
        break
      default:
        if (arg?.startsWith('--')) {
          options.unknown = options.unknown || []
          options.unknown.push(arg)
        }
        break
    }
  }
  return options
}

function usage() {
  console.log(`Runtime load test helper

Usage:
  node scripts/ops/runtime-load-test.mjs --url <endpoint> [options]

Options:
  --url <url>          Target URL
  --method <method>    HTTP method (default: POST)
  --payload <json>     JSON string payload
  --payload-file <p>   JSON file payload
  --concurrency <n>    Concurrent workers (default: 10)
  --requests <n>       Total requests (default: 100)
  --timeout-ms <n>     Timeout per request (default: 10000)
  --header <k:v>       Extra header (repeatable)
  --max-error-rate     Max error rate (0-1)
  --min-rps            Min requests per second
  --max-avg-ms         Max average latency in ms
  --max-p95-ms         Max p95 latency in ms
  --max-p99-ms         Max p99 latency in ms
  --output <path>      Output JSON report path
  -h, --help           Show this help
`)
}

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toOptionalNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function computeStats(durations) {
  if (durations.length === 0) {
    return null
  }
  const sorted = [...durations].sort((a, b) => a - b)
  const sum = sorted.reduce((acc, item) => acc + item, 0)
  const percentile = (p) => {
    if (sorted.length === 1) return sorted[0]
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
    return sorted[idx]
  }
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: percentile(0.5),
    p90: percentile(0.9),
    p95: percentile(0.95),
    p99: percentile(0.99),
  }
}

const options = parseArgs(args)
if (options.help) {
  usage()
  process.exit(0)
}

if (!options.url) {
  console.error('Missing --url')
  usage()
  process.exit(1)
}

const url = options.url
const method = (options.method || 'POST').toUpperCase()
const concurrency = toNumber(options.concurrency, 10)
const totalRequests = toNumber(options.requests, 100)
const timeoutMs = toNumber(options.timeoutMs, 10000)
const reportsDir = path.resolve(process.cwd(), 'reports')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputPath = options.output
  ? path.resolve(options.output)
  : path.join(reportsDir, `runtime-load-test-${timestamp}.json`)

let payload = undefined
if (options.payloadFile) {
  const content = fs.readFileSync(path.resolve(options.payloadFile), 'utf-8')
  payload = JSON.parse(content)
} else if (options.payload) {
  payload = JSON.parse(options.payload)
}

const headers = {
  'Content-Type': 'application/json',
}

for (const entry of options.headers) {
  if (!entry) continue
  const [key, ...rest] = entry.split(':')
  if (!key || rest.length === 0) continue
  headers[key.trim()] = rest.join(':').trim()
}

let nextIndex = 0
let success = 0
let failed = 0
const durations = []
const statusCounts = {}
const startAt = performance.now()

async function runRequest() {
  const started = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(payload || {}),
      signal: controller.signal,
    })
    await response.arrayBuffer()
    const duration = performance.now() - started
    durations.push(duration)
    const code = response.status
    statusCounts[code] = (statusCounts[code] || 0) + 1
    if (response.ok) {
      success += 1
    } else {
      failed += 1
    }
  } catch (error) {
    const duration = performance.now() - started
    durations.push(duration)
    statusCounts.error = (statusCounts.error || 0) + 1
    failed += 1
  } finally {
    clearTimeout(timer)
  }
}

async function worker() {
  while (true) {
    const current = nextIndex
    nextIndex += 1
    if (current >= totalRequests) {
      return
    }
    await runRequest()
  }
}

await Promise.all(new Array(concurrency).fill(null).map(() => worker()))

const finishedAt = performance.now()
const elapsedMs = finishedAt - startAt
const rps = totalRequests / (elapsedMs / 1000)
const errorRate = totalRequests > 0 ? failed / totalRequests : 0
const latencyStats = computeStats(durations)

const thresholds = {
  maxErrorRate: toOptionalNumber(options.maxErrorRate),
  minRps: toOptionalNumber(options.minRps),
  maxAvgMs: toOptionalNumber(options.maxAvgMs),
  maxP95Ms: toOptionalNumber(options.maxP95Ms),
  maxP99Ms: toOptionalNumber(options.maxP99Ms),
}

const thresholdResults = {
  errorRateOk: thresholds.maxErrorRate === null ? null : errorRate <= thresholds.maxErrorRate,
  rpsOk: thresholds.minRps === null ? null : rps >= thresholds.minRps,
  avgLatencyOk:
    thresholds.maxAvgMs === null
      ? null
      : latencyStats !== null && latencyStats.avg <= thresholds.maxAvgMs,
  p95LatencyOk:
    thresholds.maxP95Ms === null
      ? null
      : latencyStats !== null && latencyStats.p95 <= thresholds.maxP95Ms,
  p99LatencyOk:
    thresholds.maxP99Ms === null
      ? null
      : latencyStats !== null && latencyStats.p99 <= thresholds.maxP99Ms,
}

const thresholdPassed = Object.values(thresholdResults)
  .filter((value) => value !== null)
  .every(Boolean)

const passed = thresholdPassed

const report = {
  type: 'runtime-load-test',
  generatedAt: new Date().toISOString(),
  target: {
    url,
    method,
    concurrency,
    totalRequests,
    timeoutMs,
  },
  result: {
    success,
    failed,
    durationMs: elapsedMs,
    rps,
    errorRate,
    statusCounts,
    latencyMs: latencyStats,
  },
  thresholds,
  thresholdResults,
  passed,
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))

if (!report.passed) {
  console.error(`Runtime load test failed. Report saved: ${outputPath}`)
  process.exit(1)
}

console.log(`Runtime load test report saved: ${outputPath}`)
