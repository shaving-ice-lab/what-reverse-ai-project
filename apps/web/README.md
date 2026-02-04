# Web App

## 环境与配置

- `NEXT_PUBLIC_APP_ENV`: local/dev/staging/prod
- `NEXT_PUBLIC_API_URL`: API 基础地址（优先级高于按环境配置）
- `NEXT_PUBLIC_API_URL_DEV|STAGING|PROD`: 按环境 API 地址
- `NEXT_PUBLIC_WS_URL`: WebSocket 地址（优先级高于按环境配置）
- `NEXT_PUBLIC_WS_URL_DEV|STAGING|PROD`: 按环境 WS 地址
- `NEXT_PUBLIC_RUNTIME_BASE_URL`: 公开运行时域名（可选，默认由 API_BASE 推导）
- `NEXT_PUBLIC_FEATURE_FLAGS`: Feature Flags（JSON 或逗号分隔）

示例（本地开发）：

```bash
NEXT_PUBLIC_APP_ENV=dev
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_FEATURE_FLAGS=analytics,local_mode
```

## 本地开发

```bash
pnpm --filter @agentflow/web dev
```

## 构建与发布

```bash
pnpm --filter @agentflow/web build
pnpm --filter @agentflow/web start
```

## Feature Flags

- `local_mode`: 允许本地模式下跳过部分实时连接
- `analytics`: 控制前端埋点/性能数据上报

可通过 `localStorage` 覆盖：

- `feature_flags_overrides` = `{ "analytics": true }`
