# Web App

## environmentand Configuration

- `NEXT_PUBLIC_APP_ENV`: local/dev/staging/prod
- `NEXT_PUBLIC_API_URL`: API baseAddress(PriorityHighatbyenvironmentConfiguration)
- `NEXT_PUBLIC_API_URL_DEV|STAGING|PROD`: byenvironment API Address
- `NEXT_PUBLIC_WS_URL`: WebSocket Address(PriorityHighatbyenvironmentConfiguration)
- `NEXT_PUBLIC_WS_URL_DEV|STAGING|PROD`: byenvironment WS Address
- `NEXT_PUBLIC_RUNTIME_BASE_URL`: PublicRuntimeDomain(Optional,Defaultfrom API_BASE derive)
- `NEXT_PUBLIC_FEATURE_FLAGS`: Feature Flags(JSON orcommanumberdivideseparate)

Example(Localdevelop):

```bash
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_FEATURE_FLAGS=analytics,local_mode
```

## Localdevelop

```bash
pnpm --filter @agentflow/web dev
```

## Buildand Publish

```bash
pnpm --filter @agentflow/web build
pnpm --filter @agentflow/web start
```

## Feature Flags

- `local_mode`: allowLocalmodedownSkipPartialReal-TimeConnection
- `analytics`: controlbeforeendpointembedpoint/PerformanceDataupreport

canthrough `localStorage` cover:

- `feature_flags_overrides` = `{ "analytics": true }`
