#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)

function parseArgs(input) {
  const options = { requireAll: false }
  for (let i = 0; i < input.length; i += 1) {
    const arg = input[i]
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break
      case '--root':
        options.root = input[i + 1]
        i += 1
        break
      case '--output':
        options.output = input[i + 1]
        i += 1
        break
      case '--mark-compat':
        options.markCompat = input[i + 1] || 'manual confirmation'
        i += 1
        break
      case '--mark-rollback':
        options.markRollback = input[i + 1] || 'manual confirmation'
        i += 1
        break
      case '--require-all':
        options.requireAll = true
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
  console.log(`Release checklist helper

Usage:
  node scripts/ops/release-checklist.mjs [options]

Options:
  --root <path>           Repo root (default: cwd)
  --output <path>         Output JSON report path
  --mark-compat <note>    Mark compatibility tests as complete
  --mark-rollback <note>  Mark rollback drill as complete
  --require-all           Exit non-zero if any check is pending
  -h, --help              Show this help
`)
}

function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
}

function collectMigrationPairs(dir) {
  const files = listSqlFiles(dir)
  const pairs = new Map()
  const nonStandard = []
  const duplicates = []

  for (const file of files) {
    const match = file.match(/^(.*)\.(up|down)\.sql$/)
    if (!match) {
      nonStandard.push(file)
      continue
    }
    const key = match[1]
    const direction = match[2]
    const entry = pairs.get(key) || { up: null, down: null }
    if (entry[direction]) {
      duplicates.push(file)
    }
    entry[direction] = file
    pairs.set(key, entry)
  }

  const missingUp = []
  const missingDown = []
  for (const [key, entry] of pairs.entries()) {
    if (!entry.up) {
      missingUp.push(key)
    }
    if (!entry.down) {
      missingDown.push(key)
    }
  }

  return {
    directory: dir,
    files,
    missingUp,
    missingDown,
    nonStandard,
    duplicates,
  }
}

function summarizeChecklist(checks) {
  const summary = { total: checks.length, passed: 0, failed: 0, pending: 0 }
  for (const check of checks) {
    if (check.status === 'pass') summary.passed += 1
    if (check.status === 'fail') summary.failed += 1
    if (check.status === 'pending') summary.pending += 1
  }
  return summary
}

const options = parseArgs(args)
if (options.help) {
  usage()
  process.exit(0)
}

const root = options.root ? path.resolve(options.root) : process.cwd()
const reportsDir = path.resolve(root, 'reports')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputPath = options.output
  ? path.resolve(options.output)
  : path.join(reportsDir, `release-checklist-${timestamp}.json`)

const migrationDirs = [
  path.join(root, 'apps/server/migrations'),
  path.join(root, 'apps/server/internal/pkg/workspace_db/migrations'),
]
const migrationReports = migrationDirs.map((dir) => collectMigrationPairs(dir))

const schemaMissing = migrationReports.some(
  (report) => report.missingDown.length > 0 || report.missingUp.length > 0
)

const checks = [
  {
    id: 'schema-migrations',
    name: 'Schema migrations paired',
    status: schemaMissing ? 'fail' : 'pass',
    details: {
      directories: migrationReports,
    },
  },
  {
    id: 'compatibility-tests',
    name: 'Compatibility tests',
    status: options.markCompat ? 'pass' : 'pending',
    details: {
      note: options.markCompat || 'Run pnpm test && pnpm test:server (or equivalent).',
    },
  },
  {
    id: 'rollback-drill',
    name: 'Rollback drill',
    status: options.markRollback ? 'pass' : 'pending',
    details: {
      note:
        options.markRollback || 'Execute rollback drill against latest migration and app version.',
    },
  },
]

const report = {
  type: 'release-checklist',
  generatedAt: new Date().toISOString(),
  root,
  checks,
  summary: summarizeChecklist(checks),
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))

console.log(`Release checklist report saved: ${outputPath}`)
console.log(
  `Checks: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.pending} pending`
)

const shouldFail = report.summary.failed > 0 || (options.requireAll && report.summary.pending > 0)
if (shouldFail) {
  process.exit(1)
}
