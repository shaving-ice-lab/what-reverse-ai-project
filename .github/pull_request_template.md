# Pull Request

## Summary

- Summary here

## Review priority (label required)

- [ ] review/p0 (<=4h): security, incident, data loss risk, or prod outage
- [ ] review/p1 (<=1 business day): release blocker or user-impacting
- [ ] review/p2 (<=3 business days): routine change

## Scope

- [ ] Backend
- [ ] Web
- [ ] Desktop
- [ ] SDK
- [ ] Docs only

## Quality checks

- [ ] Added/updated tests when needed
- [ ] Migration/backward-compatibility reviewed
- [ ] Observability/logging updated where relevant
- [ ] Code owners requested and at least one owner approval

## Critical merge gate (auto-checked)

If CODEOWNERS resolves to critical owner groups or module approvals (see
`.github/CODEOWNERS`), add label `merge-gate/critical` and obtain the required
approvals (base/owner/file/group/change/module thresholds).
