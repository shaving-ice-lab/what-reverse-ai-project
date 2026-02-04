# 快速开始

> 目标：在本地跑通 Web 与 API，并能访问运行时入口。

## 1. 环境准备

- Node.js >= 20.x
- pnpm >= 9.x
- Go >= 1.22
- Docker & Docker Compose

## 2. 获取代码与安装依赖

```bash
git clone <your-repo-url>
cd <your-repo>
pnpm install
```

## 3. 启动数据库

```bash
cd docker
docker-compose up -d
```

## 4. 启动后端

```bash
pnpm dev:server
# 或热重载
pnpm dev:server:hot
```

## 5. 启动前端

```bash
pnpm dev:web
```

## 6. 验证

- 打开 <http://localhost:3000>
- 访问 API 健康检查：`GET /api/v1/system/health`

## 7. 一键开发

```bash
# 同时启动前后端
pnpm dev
```

## 参考

- 详细开发指南：`docs/DEVELOPMENT.md`
- API 入口与响应结构：`docs/public/API-REFERENCE.md`
