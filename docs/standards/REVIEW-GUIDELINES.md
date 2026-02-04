# Code Ownership and Review Policy

## Code ownership

- Source of truth: `.github/CODEOWNERS`
- Each top-level area has an owning team, and CODEOWNERS should be updated when ownership changes.
- For critical modules, CODEOWNERS includes security or platform owners in addition to the area owner.

## Review priority and SLA

Every PR must carry exactly one priority label:

- `review/p0`: <= 4 hours (security, incident, data loss risk, or prod outage)
- `review/p1`: <= 1 business day (release blocker or user-impacting)
- `review/p2`: <= 3 business days (routine change)

## Merge gates for critical modules

Critical modules are identified via CODEOWNERS matching (last match wins). If the resolved owners include any critical owner group, the path is treated as critical. Module approvals can also trigger a gate even when a path is not critical.

Critical owner groups:

- `@shaving-ice-lab/security`
- `@shaving-ice-lab/db`
- `@shaving-ice-lab/devops`
- Configured via `# critical-owners:` in `.github/CODEOWNERS`
- Base approvals via `# critical-approvals-base:`
- Per-owner overrides via `# critical-owners-approvals:` (e.g. `@team=3`)
- Multi-file thresholds via `# critical-files-approvals:` (e.g. `5=3 10=4`)
- Multi-group thresholds via `# critical-groups-approvals:` (e.g. `2=3 3=4`)
- Change-size thresholds via `# critical-changes-approvals:` (e.g. `200=3 500=4`)
- Module approvals via `# module-approvals:` (e.g. `/path/=3`)

Rules for critical modules:

- Add label `merge-gate/critical`
- Required approvals = max(base, owner override(s), file-count threshold, group-count threshold, change-size threshold, module approvals)
- At least one approval should be from a code owner for the touched path (enforce in branch protection)

## Automation

The workflow `.github/workflows/review-gate.yml` enforces (via CODEOWNERS parsing):

- presence of a review priority label
- critical-path label + approval count (derived from CODEOWNERS config)
- parsing supports `*`, `**`, `?`, `[]`, escaped whitespace, and `!` negation (clears ownership)
- module-level gates use the same `merge-gate/critical` label

## Review checklist

- Security and data access implications
- Migration/backward-compatibility impact
- Observability/logging updates where relevant
- Tests added or updated as needed
