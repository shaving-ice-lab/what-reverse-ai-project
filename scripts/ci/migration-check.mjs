#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const migrationDirs = [
  path.join(root, 'apps/server/migrations'),
  path.join(root, 'apps/server/internal/pkg/workspace_db/migrations'),
]

function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
}

function analyzeDir(dir) {
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

function printSection(label, items) {
  if (!items.length) return
  console.error(`- ${label}:`)
  for (const item of items) {
    console.error(`  - ${item}`)
  }
}

const reports = migrationDirs.map(analyzeDir)
let hasErrors = false

for (const report of reports) {
  if (
    report.missingUp.length ||
    report.missingDown.length ||
    report.nonStandard.length ||
    report.duplicates.length
  ) {
    hasErrors = true
    console.error(`\nMigration issues in ${report.directory}:`)
    printSection('missing .up.sql', report.missingUp)
    printSection('missing .down.sql', report.missingDown)
    printSection('non-standard files', report.nonStandard)
    printSection('duplicate entries', report.duplicates)
  }
}

if (hasErrors) {
  console.error('\nMigration check failed.')
  process.exit(1)
}

console.log('Migration check passed.')
