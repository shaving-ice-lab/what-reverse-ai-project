#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const args = process.argv.slice(2);

function parseArgs(input) {
  const options = {};
  for (let i = 0; i < input.length; i += 1) {
    const arg = input[i];
    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--base-url":
        options.baseUrl = input[i + 1];
        i += 1;
        break;
      case "--token":
        options.token = input[i + 1];
        i += 1;
        break;
      case "--severity":
        options.severity = input[i + 1];
        i += 1;
        break;
      case "--message":
        options.message = input[i + 1];
        i += 1;
        break;
      case "--source":
        options.source = input[i + 1];
        i += 1;
        break;
      case "--metadata":
        options.metadata = input[i + 1];
        i += 1;
        break;
      case "--output":
        options.output = input[i + 1];
        i += 1;
        break;
      case "--expected-status":
        options.expectedStatus = input[i + 1];
        i += 1;
        break;
      case "--max-latency-ms":
        options.maxLatencyMs = input[i + 1];
        i += 1;
        break;
      default:
        if (arg?.startsWith("--")) {
          options.unknown = options.unknown || [];
          options.unknown.push(arg);
        }
        break;
    }
  }
  return options;
}

function usage() {
  console.log(`Alert smoke test helper

Usage:
  node scripts/ops/alert-smoke.mjs --base-url http://localhost:8080 --token <jwt>

Options:
  --base-url <url>    API base URL (default: http://localhost:8080)
  --token <jwt>       JWT bearer token
  --severity <level>  info | warning | error | critical
  --message <text>    Custom message
  --source <text>     Source tag
  --metadata <json>   JSON string for extra metadata
  --expected-status   Expected HTTP status code
  --max-latency-ms    Max allowed latency in milliseconds
  --output <path>     Output JSON report path
  -h, --help          Show this help
`);
}

function toOptionalNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const options = parseArgs(args);
if (options.help) {
  usage();
  process.exit(0);
}

const baseUrl = (options.baseUrl || "http://localhost:8080").replace(/\/$/, "");
const endpoint = `${baseUrl}/api/v1/ops/alerts/test`;
const reportsDir = path.resolve(process.cwd(), "reports");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputPath = options.output
  ? path.resolve(options.output)
  : path.join(reportsDir, `alert-test-${timestamp}.json`);

let metadata = undefined;
if (options.metadata) {
  try {
    metadata = JSON.parse(options.metadata);
  } catch (err) {
    console.error("Invalid JSON provided for --metadata");
    process.exit(1);
  }
}

const payload = {
  severity: options.severity || "warning",
  message: options.message || "Release alert smoke test",
  source: options.source || "ops.alert_smoke",
  metadata,
};

const headers = {
  "Content-Type": "application/json",
};
if (options.token) {
  headers.Authorization = `Bearer ${options.token}`;
}

let responseBody = null;
let responseStatus = null;
let ok = false;
let latencyMs = null;

const expectedStatus = toOptionalNumber(options.expectedStatus);
const maxLatencyMs = toOptionalNumber(options.maxLatencyMs);
const startedAt = performance.now();

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  responseStatus = response.status;
  const text = await response.text();
  try {
    responseBody = JSON.parse(text);
  } catch {
    responseBody = text;
  }
  ok = response.ok;
  latencyMs = performance.now() - startedAt;
} catch (error) {
  responseBody = { error: error?.message || String(error) };
  latencyMs = performance.now() - startedAt;
}

const thresholdResults = {
  statusMatch: expectedStatus === null ? null : responseStatus === expectedStatus,
  latencyOk: maxLatencyMs === null ? null : latencyMs !== null && latencyMs <= maxLatencyMs,
};
const thresholdPassed = Object.values(thresholdResults)
  .filter((value) => value !== null)
  .every(Boolean);
const passed = ok && thresholdPassed;

const report = {
  type: "alert-smoke-test",
  generatedAt: new Date().toISOString(),
  endpoint,
  payload,
  ok,
  passed,
  status: responseStatus,
  latencyMs,
  thresholds: {
    expectedStatus,
    maxLatencyMs,
  },
  thresholdResults,
  response: responseBody,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(`Alert smoke test failed. Report saved: ${outputPath}`);
  process.exit(1);
}

console.log(`Alert smoke test succeeded. Report saved: ${outputPath}`);
