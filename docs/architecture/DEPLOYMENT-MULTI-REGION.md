# Multi-Region Deployment Strategy

This document defines the minimum viable multi-region strategy and the path to scale.

## Goals

- Low latency for end users
- Region-aware data residency
- Resilient failover and recovery
- Clear, repeatable rollout steps

## Architecture Overview

- Global DNS or edge router directs traffic to a regional ingress.
- Each region runs API + worker + database for local write affinity.
- Clients can discover the running region via `/api/v1/system/deployment`.

## Region Model

- Workspace has a `region` field; writes are pinned to that region.
- Public metadata can be replicated asynchronously (optional).
- Secrets remain in-region by default.

## Routing Strategy

- Default routing: Geo DNS -> nearest region base URL.
- Workspace-aware routing: map workspace region to `region_base_urls`.
- Runtime/public entry prefers region-specific base URL when available.

## Data Strategy

- Primary-write per region.
- Read replicas for global reporting when needed.
- Cross-region replication is async and scoped to non-sensitive data.

## Failover

- Monitor region health and error rates.
- If a region is down, route new traffic to `primary_region`.
- Existing sessions degrade to read-only when required.

## Configuration

```yaml
deployment:
  region: 'us-east-1'
  primary_region: 'us-east-1'
  regions:
    - 'us-east-1'
    - 'eu-west-1'
  region_base_urls:
    us-east-1: 'https://us-east-1.api.reverseai.ai'
    eu-west-1: 'https://eu-west-1.api.reverseai.ai'
```

Notes:

- `deployment.region` is the current running region.
- `deployment.regions` is the list of supported regions.
- `deployment.region_base_urls` is used for routing discovery.
- `REVERSEAI_DEPLOYMENT_REGIONS` can override the list (comma-separated).

## Rollout Checklist

- Provision DB/Redis in the new region.
- Run migrations and smoke tests.
- Configure region-specific environment variables.
- Register the new region in DNS or edge router.
- Validate `/api/v1/system/deployment` and `/api/v1/system/health`.
