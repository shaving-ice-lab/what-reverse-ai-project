# AgentFlow SDK & CLI 用户指南

> 让开发者在 30 分钟内完成自定义节点的创建、调试、测试与发布闭环

## 目录

1. [快速开始](#快速开始)
2. [CLI 命令参考](#cli-命令参考)
3. [SDK API 参考](#sdk-api-参考)
4. [模板说明](#模板说明)
5. [最佳实践](#最佳实践)
6. [常见问题](#常见问题)

---

## 快速开始

### 安装 SDK

```bash
npm install @agentflow/sdk
# 或
pnpm add @agentflow/sdk
```

### 创建第一个节点

```bash
# 使用 CLI 初始化项目
npx agentflow init my-custom-node --template basic

# 进入项目目录
cd my-custom-node

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 30 分钟工作流

| 步骤 | 命令 | 耗时 |
|------|------|------|
| 1. 初始化项目 | `agentflow init` | 1 分钟 |
| 2. 编写节点逻辑 | 编辑 `src/index.ts` | 15 分钟 |
| 3. 运行测试 | `npm test` | 5 分钟 |
| 4. 验证定义 | `agentflow validate` | 1 分钟 |
| 5. 构建发布 | `agentflow publish` | 8 分钟 |

---

## CLI 命令参考

### `agentflow init [name]`

初始化节点项目。

```bash
# 基础用法
agentflow init my-node

# 指定模板
agentflow init my-http-node --template http-request

# 指定目录
agentflow init my-node --directory ./projects/my-node

# 使用 JavaScript（默认 TypeScript）
agentflow init my-node --typescript false
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--template, -t` | 项目模板 | `basic` |
| `--directory, -d` | 目标目录 | 项目名称 |
| `--typescript` | 使用 TypeScript | `true` |
| `--author` | 作者名称 | `Your Name` |

**可用模板：**

- `basic` - 最小可运行节点
- `http-request` - HTTP 集成节点
- `llm` - LLM 调用节点
- `transform` - 数据转换节点
- `plugin` - 插件型项目（多节点）

### `agentflow dev`

启动开发模式，支持热重载。

```bash
# 基础用法
agentflow dev

# 指定端口
agentflow dev --port 3456

# 指定入口文件
agentflow dev --file src/custom.ts

# 禁用文件监听
agentflow dev --no-watch

# 非交互模式
agentflow dev --no-interactive
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--port, -p` | 开发服务器端口 | `3456` |
| `--file, -f` | 入口文件路径 | `src/index.ts` |
| `--no-watch` | 禁用文件监听 | `false` |
| `--no-interactive` | 非交互模式 | `false` |

### `agentflow build`

构建节点项目。

```bash
# 基础用法
agentflow build

# 监听模式
agentflow build --watch

# 指定输出目录
agentflow build --output ./lib

# 启用压缩
agentflow build --minify
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--watch, -w` | 监听文件变化 | `false` |
| `--output, -o` | 输出目录 | `dist` |
| `--minify` | 压缩代码 | `false` |

### `agentflow test`

运行节点测试。

```bash
# 运行所有测试
agentflow test

# 监听模式
agentflow test --watch

# 生成覆盖率报告
agentflow test --coverage

# 过滤测试
agentflow test --filter "should handle"
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--watch, -w` | 监听模式 | `false` |
| `--coverage` | 覆盖率报告 | `false` |
| `--filter` | 测试过滤 | - |

### `agentflow validate`

校验节点定义。

```bash
# 校验当前目录
agentflow validate

# 校验指定文件
agentflow validate --file src/custom.ts

# 严格模式
agentflow validate --strict
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--file, -f` | 入口文件 | `src/index.ts` |
| `--strict` | 严格模式 | `false` |

### `agentflow publish`

发布到市场。

```bash
# 发布到官方市场
agentflow publish

# 指定注册表
agentflow publish --registry https://custom-registry.com

# 使用特定 Token
agentflow publish --token $MY_TOKEN

# 跳过构建
agentflow publish --skip-build
```

**参数：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--registry` | 市场注册表 URL | 官方市场 |
| `--token` | 认证 Token | 环境变量 |
| `--manifest` | manifest 文件 | `manifest.json` |
| `--skip-build` | 跳过构建 | `false` |

---

## SDK API 参考

### `defineNode(options)`

定义一个自定义节点。

```typescript
import { defineNode, input, output } from "@agentflow/sdk";

export default defineNode({
  // 必填字段
  id: "my-node",           // 唯一标识符
  name: "My Node",         // 显示名称
  description: "描述",     // 节点描述
  
  // 可选字段
  icon: "puzzle",          // 图标名称
  category: "custom",      // 分类
  version: "1.0.0",        // 版本号
  author: "Your Name",     // 作者
  tags: ["tag1", "tag2"],  // 标签
  
  // 输入定义
  inputs: {
    // 使用 input builder
  },
  
  // 输出定义
  outputs: {
    // 使用 output builder
  },
  
  // 执行函数
  async execute(ctx) {
    // 执行逻辑
    return { /* outputs */ };
  },
});
```

### Input Builders

```typescript
import { input } from "@agentflow/sdk";

// 字符串输入
input.string("标签")
  .required()                    // 必填
  .default("默认值")             // 默认值
  .placeholder("占位符")         // 占位符
  .description("描述")           // 描述
  .minLength(1)                  // 最小长度
  .maxLength(100)                // 最大长度
  .pattern(/regex/)              // 正则验证
  .build()

// 数字输入
input.number("数量")
  .required()
  .default(10)
  .min(0)
  .max(100)
  .step(1)
  .build()

// 布尔输入
input.boolean("启用")
  .default(true)
  .build()

// 选择输入
input.select("选项", [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
])
  .default("a")
  .build()

// 多选输入
input.multiSelect("多选", [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
])
  .default(["a"])
  .build()

// 文本域输入
input.textarea("长文本")
  .rows(5)
  .build()

// JSON 输入
input.json("配置")
  .default({})
  .schema({ /* JSON Schema */ })
  .build()

// 文件输入
input.file("文件")
  .accept(".json,.csv")
  .maxSize(10 * 1024 * 1024)  // 10MB
  .build()
```

### Output Builders

```typescript
import { output } from "@agentflow/sdk";

// 字符串输出
output.string("结果")
  .description("描述")
  .build()

// 数字输出
output.number("数量")
  .description("描述")
  .build()

// 布尔输出
output.boolean("成功")
  .description("描述")
  .build()

// JSON 输出
output.json("数据")
  .description("描述")
  .schema({ /* JSON Schema */ })
  .build()

// 数组输出
output.array("列表")
  .description("描述")
  .build()
```

### 执行上下文 (ctx)

```typescript
async execute(ctx) {
  // 获取输入
  const { inputName } = ctx.inputs;
  
  // 日志
  ctx.log.info("消息", { data: "..." });
  ctx.log.warn("警告");
  ctx.log.error("错误");
  ctx.log.debug("调试");
  
  // 进度报告
  ctx.reportProgress(50, "处理中...");
  
  // 流式输出
  ctx.streamOutput("fieldName", "chunk");
  
  // HTTP 请求
  const response = await ctx.http.request({
    url: "https://api.example.com",
    method: "GET",
    headers: { "Authorization": "Bearer token" },
    body: JSON.stringify(data),
    timeout: 30000,
  });
  
  // LLM 调用
  const llmResponse = await ctx.llm.chat({
    model: "gpt-4",
    messages: [
      { role: "system", content: "..." },
      { role: "user", content: "..." },
    ],
    temperature: 0.7,
    maxTokens: 2048,
    stream: true,
    onStream: (chunk) => ctx.streamOutput("content", chunk),
  });
  
  // 缓存操作
  await ctx.cache.set("key", value, { ttl: 3600 });
  const cached = await ctx.cache.get("key");
  await ctx.cache.delete("key");
  
  // 密钥获取
  const apiKey = await ctx.secrets.get("API_KEY");
  
  return { /* outputs */ };
}
```

### 测试工具

```typescript
import { createNodeTester, assert } from "@agentflow/sdk";
import node from "./index";

const tester = createNodeTester(node);

// 执行测试
const result = await tester.execute({
  inputField: "value",
});

// 断言
assert.success(result);                      // 执行成功
assert.failed(result);                       // 执行失败
assert.hasLog(result, "info", "消息");       // 包含日志
assert.hasProgress(result, 50);              // 包含进度
assert.outputEquals(result, "field", value); // 输出值相等
```

---

## 模板说明

### basic 模板

最小可运行节点，适合快速上手。

```
my-node/
├── src/
│   └── index.ts      # 节点定义
├── test/
│   └── index.test.ts # 测试文件
├── manifest.json     # 节点清单
├── package.json
├── tsconfig.json
└── README.md
```

### http-request 模板

HTTP 请求节点，适合 API 集成。

特点：
- 支持多种 HTTP 方法
- 自定义请求头
- 超时和重试控制
- 响应解析

### llm 模板

LLM 调用节点，适合 AI 功能开发。

特点：
- 多模型支持 (GPT-4, Claude 等)
- 流式输出
- Token 统计
- 参数配置

### transform 模板

数据转换节点，适合数据处理。

特点：
- JSON 路径提取
- 字段映射
- 过滤、排序、分组
- 数组操作

### plugin 模板

插件项目，适合包含多个相关节点。

特点：
- 多节点组织
- 权限声明
- 共享存储
- 生命周期钩子

---

## 最佳实践

### 1. 输入验证

```typescript
inputs: {
  email: input.string("邮箱")
    .required()
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .description("请输入有效的邮箱地址")
    .build(),
}
```

### 2. 错误处理

```typescript
async execute(ctx) {
  try {
    const result = await doSomething();
    return { result };
  } catch (error) {
    ctx.log.error("操作失败", { error: error.message });
    throw new Error(`操作失败: ${error.message}`);
  }
}
```

### 3. 进度报告

```typescript
async execute(ctx) {
  ctx.reportProgress(0, "开始处理...");
  
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);
    ctx.reportProgress(
      Math.round((i + 1) / items.length * 100),
      `处理中 (${i + 1}/${items.length})`
    );
  }
  
  return { /* outputs */ };
}
```

### 4. 流式输出

```typescript
async execute(ctx) {
  await ctx.llm.chat({
    model: "gpt-4",
    messages: [...],
    stream: true,
    onStream: (chunk) => {
      ctx.streamOutput("content", chunk);
    },
  });
  
  return { content: fullContent };
}
```

---

## 常见问题

### Q: 如何调试节点？

```bash
# 使用开发模式
agentflow dev

# 查看日志输出
# 使用 ctx.log.debug() 记录调试信息
```

### Q: 如何处理异步操作？

所有节点 execute 函数都支持 async/await：

```typescript
async execute(ctx) {
  const data = await fetchData();
  const result = await processData(data);
  return { result };
}
```

### Q: 如何使用环境变量？

```typescript
async execute(ctx) {
  // 使用 secrets API 获取敏感配置
  const apiKey = await ctx.secrets.get("MY_API_KEY");
  
  // 或从环境变量获取（开发时）
  const debug = process.env.DEBUG === "true";
}
```

### Q: 发布时需要什么配置？

1. 确保 `manifest.json` 配置正确
2. 设置环境变量 `AGENTFLOW_PUBLISH_TOKEN`
3. 运行 `agentflow validate` 确保无错误
4. 运行 `agentflow publish`

### Q: 如何更新已发布的节点？

1. 更新 `manifest.json` 中的版本号
2. 更新 `package.json` 中的版本号
3. 运行 `agentflow publish`

---

## 更多资源

- [SDK 源码](../packages/sdk)
- [插件开发指南](../packages/sdk/src/plugin/PLUGIN_DEV_GUIDE.md)
- [示例节点](../packages/sdk/src/examples)
- [API 参考](../docs/api/API-REFERENCE.md)
