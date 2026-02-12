# ReverseAI 插件开发指南

本指南将帮助您开发 ReverseAI 插件，扩展平台功能。

## 目录

1. [快速开始](#快速开始)
2. [插件结构](#插件结构)
3. [Manifest 规范](#manifest-规范)
4. [插件 API](#插件-api)
5. [权限系统](#权限系统)
6. [自定义节点](#自定义节点)
7. [UI 扩展](#ui-扩展)
8. [测试与调试](#测试与调试)
9. [发布到市场](#发布到市场)
10. [最佳实践](#最佳实践)

---

## 快速开始

### 1. 创建插件项目

```bash
mkdir my-plugin && cd my-plugin
npm init -y
npm install @reverseai/sdk typescript tsup --save-dev
```

### 2. 配置 TypeScript

创建 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### 3. 创建 Manifest

创建 `manifest.json`:

```json
{
  "manifestVersion": 1,
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "我的第一个插件",
  "author": {
    "name": "Your Name"
  },
  "category": "utility",
  "main": "dist/index.js",
  "permissions": ["storage", "notifications"]
}
```

### 4. 编写插件代码

创建 `src/index.ts`:

```typescript
import type { PluginContext, PluginAPI, PluginModule } from '@reverseai/sdk/plugin'

export async function activate(context: PluginContext, api: PluginAPI): Promise<void> {
  context.log.info('插件已激活')

  // 注册命令
  const disposable = api.commands.registerCommand('my-plugin.hello', async () => {
    api.ui.showNotification({
      message: 'Hello from My Plugin!',
      type: 'success',
    })
  })

  context.subscriptions.push(disposable)
}

export async function deactivate(): Promise<void> {
  console.log('插件已停用')
}

const plugin: PluginModule = { activate, deactivate }
export default plugin
```

### 5. 构建并测试

```bash
npx tsup src/index.ts --format esm --dts
```

---

## 插件结构

标准插件目录结构：

```
my-plugin/
├── manifest.json        # 插件清单（必需）
├── package.json         # NPM 配置
├── tsconfig.json        # TypeScript 配置
├── src/
│   ├── index.ts         # 入口文件
│   ├── commands/        # 命令实现
│   └── nodes/           # 自定义节点
├── dist/                # 编译输出
├── assets/              # 静态资源
│   ├── icon.png         # 插件图标
│   └── banner.png       # 市场横幅
├── README.md            # 说明文档
└── CHANGELOG.md         # 更新日志
```

---

## Manifest 规范

### 必填字段

| 字段              | 类型   | 说明                               |
| ----------------- | ------ | ---------------------------------- |
| `manifestVersion` | number | 清单版本，当前为 `1`               |
| `id`              | string | 唯一标识符，小写字母、数字、连字符 |
| `name`            | string | 显示名称                           |
| `version`         | string | 语义化版本号 (x.y.z)               |
| `description`     | string | 简短描述                           |
| `author`          | object | 作者信息                           |
| `category`        | string | 分类                               |
| `main`            | string | 入口文件路径                       |

### 可选字段

| 字段               | 类型     | 说明           |
| ------------------ | -------- | -------------- |
| `icon`             | string   | 图标名称或路径 |
| `keywords`         | string[] | 搜索关键词     |
| `license`          | string   | 许可证         |
| `repository`       | string   | 仓库地址       |
| `permissions`      | string[] | 所需权限       |
| `nodes`            | array    | 自定义节点     |
| `settings`         | array    | 插件设置       |
| `contributes`      | object   | 贡献点         |
| `activationEvents` | string[] | 激活事件       |
| `dependencies`     | array    | 依赖的其他插件 |

### 分类列表

- `ai` - AI/机器学习
- `data` - 数据处理
- `integration` - 集成/连接器
- `utility` - 工具/实用
- `automation` - 自动化
- `analytics` - 分析/报表
- `communication` - 通信
- `development` - 开发工具
- `other` - 其他

### 完整示例

```json
{
  "manifestVersion": 1,
  "id": "advanced-http",
  "name": "Advanced HTTP",
  "version": "2.0.0",
  "description": "高级 HTTP 请求工具",
  "author": {
    "name": "ReverseAI Team",
    "email": "team@reverseai.dev",
    "url": "https://reverseai.dev"
  },
  "category": "integration",
  "icon": "globe",
  "keywords": ["http", "api", "rest", "request"],
  "license": "MIT",
  "repository": "https://github.com/reverseai/advanced-http",
  "main": "dist/index.js",
  "permissions": ["network", "storage", "notifications"],
  "nodes": [
    {
      "id": "http-request-advanced",
      "path": "dist/nodes/http-request.js"
    }
  ],
  "settings": [
    {
      "key": "defaultTimeout",
      "title": "默认超时",
      "type": "number",
      "default": 30000
    },
    {
      "key": "userAgent",
      "title": "User-Agent",
      "type": "string",
      "default": "ReverseAI/1.0"
    }
  ],
  "contributes": {
    "commands": [
      {
        "id": "advanced-http.testEndpoint",
        "title": "测试端点",
        "category": "HTTP"
      }
    ],
    "views": [
      {
        "id": "advanced-http.history",
        "name": "请求历史",
        "location": "panel"
      }
    ]
  },
  "activationEvents": ["onCommand:advanced-http.testEndpoint", "onNode:http-request-advanced"],
  "minAppVersion": "1.0.0"
}
```

---

## 插件 API

### PluginContext

激活时传入的上下文对象：

```typescript
interface PluginContext {
  pluginId: string // 插件 ID
  version: string // 插件版本
  extensionPath: string // 插件安装路径
  log: PluginLogger // 日志器
  subscriptions: Disposable[] // 订阅列表（自动清理）
}
```

### Commands API

```typescript
// 注册命令
const disposable = api.commands.registerCommand('my-plugin.doSomething', async (args) => {
  // 命令逻辑
})

// 执行命令
await api.commands.executeCommand('other-plugin.action', { data: 123 })

// 获取所有命令
const commands = api.commands.getCommands()
```

### Storage API

```typescript
// 存储数据
await api.storage.set('myKey', { count: 1 })

// 读取数据
const data = await api.storage.get<{ count: number }>('myKey')

// 删除数据
await api.storage.delete('myKey')

// 清空存储
await api.storage.clear()

// 获取所有键
const keys = await api.storage.keys()
```

### UI API

```typescript
// 显示通知
api.ui.showNotification({
  message: '操作成功',
  type: 'success', // 'info' | 'success' | 'warning' | 'error'
  duration: 3000,
})

// 显示消息
api.ui.showMessage('这是一条消息', 'info')

// 快速选择
const selected = await api.ui.showQuickPick(
  [
    { label: '选项1', description: '描述1' },
    { label: '选项2', description: '描述2' },
  ],
  {
    title: '请选择',
    placeholder: '搜索...',
  }
)

// 输入框
const input = await api.ui.showInputBox({
  title: '输入名称',
  placeholder: '请输入...',
  validateInput: (value) => {
    if (value.length < 3) return '至少3个字符'
    return undefined
  },
})

// 状态栏项
const statusBar = api.ui.createStatusBarItem({
  text: '$(sync~spin) 处理中...',
  tooltip: '正在处理数据',
})
statusBar.show()
// 完成后
statusBar.hide()
statusBar.dispose()
```

### Workflows API

```typescript
// 获取工作流列表
const workflows = await api.workflows.list()

// 获取单个工作流
const workflow = await api.workflows.get('workflow-id')

// 创建工作流
const newWorkflow = await api.workflows.create({
  name: '新工作流',
  description: '由插件创建',
})

// 执行工作流
const execution = await api.workflows.execute('workflow-id', {
  input: { data: 'value' },
})
```

### Events API

```typescript
// 订阅事件
const disposable = api.events.on('workflow:executed', (data) => {
  console.log('工作流执行完成:', data)
})

// 发送事件
api.events.emit('my-plugin:customEvent', { payload: 'data' })

// 一次性监听
api.events.once('app:ready', () => {
  console.log('应用已就绪')
})
```

---

## 权限系统

### 权限列表

| 权限             | 级别 | 说明         |
| ---------------- | ---- | ------------ |
| `storage`        | 安全 | 本地存储访问 |
| `notifications`  | 安全 | 发送通知     |
| `ui:sidebar`     | 安全 | 侧边栏 UI    |
| `ui:toolbar`     | 安全 | 工具栏按钮   |
| `ui:panel`       | 安全 | 创建面板     |
| `ui:modal`       | 安全 | 显示对话框   |
| `network`        | 敏感 | HTTP 请求    |
| `clipboard`      | 敏感 | 剪贴板访问   |
| `env`            | 敏感 | 环境变量     |
| `api:workflows`  | 敏感 | 工作流 API   |
| `api:executions` | 敏感 | 执行 API     |
| `api:users`      | 敏感 | 用户 API     |
| `secrets`        | 危险 | 密钥访问     |
| `filesystem`     | 危险 | 文件系统     |
| `shell`          | 危险 | Shell 命令   |

### 权限请求

在 manifest.json 中声明所需权限：

```json
{
  "permissions": ["network", "storage", "notifications"]
}
```

**注意**：

- 安全级别权限自动授予
- 敏感级别权限需要用户确认
- 危险级别权限需要特殊审批

---

## 自定义节点

### 节点定义

```typescript
import { defineNode, input, output } from '@reverseai/sdk'

export const myNode = defineNode({
  id: 'my-plugin.transform',
  name: '数据转换',
  description: '转换输入数据',
  category: 'data',
  version: '1.0.0',

  inputs: {
    data: input.string().required().description('输入数据'),
    format: input
      .select({
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'xml', label: 'XML' },
        ],
      })
      .default('json'),
  },

  outputs: {
    result: output.object().description('转换结果'),
    error: output.string().optional(),
  },

  async execute(inputs, context) {
    context.log.info('开始转换数据')
    context.reportProgress(0, '解析中...')

    try {
      // 转换逻辑
      const result = transform(inputs.data, inputs.format)

      context.reportProgress(100, '完成')
      return { result }
    } catch (error) {
      return {
        result: null,
        error: error.message,
      }
    }
  },
})
```

### 在 Manifest 中注册

```json
{
  "nodes": [
    {
      "id": "my-plugin.transform",
      "path": "dist/nodes/transform.js"
    }
  ]
}
```

---

## UI 扩展

### 贡献命令

```json
{
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.action",
        "title": "执行操作",
        "category": "My Plugin",
        "icon": "play"
      }
    ]
  }
}
```

### 贡献菜单

```json
{
  "contributes": {
    "menus": [
      {
        "command": "my-plugin.action",
        "location": "editor/context",
        "when": "nodeSelected"
      }
    ]
  }
}
```

### 贡献快捷键

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "my-plugin.action",
        "key": "ctrl+shift+a",
        "mac": "cmd+shift+a"
      }
    ]
  }
}
```

### 贡献视图

```json
{
  "contributes": {
    "views": [
      {
        "id": "my-plugin.panel",
        "name": "我的面板",
        "icon": "list",
        "location": "sidebar"
      }
    ]
  }
}
```

---

## 测试与调试

### 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import { createTestContext, NodeTester, assert } from '@reverseai/sdk/testing'
import { myNode } from './nodes/transform'

describe('Transform Node', () => {
  it('should transform JSON data', async () => {
    const tester = new NodeTester(myNode)

    const result = await tester.execute({
      data: '{"name": "test"}',
      format: 'json',
    })

    assert.success(result)
    assert.outputEquals(result, 'result', { name: 'test' })
  })
})
```

### 本地调试

1. 在开发模式下加载插件
2. 使用 `context.log` 输出调试信息
3. 检查开发者工具控制台

---

## 发布到市场

### 准备工作

1. 确保 `manifest.json` 完整正确
2. 添加 README.md 说明文档
3. 添加 CHANGELOG.md 更新日志
4. 准备图标和横幅图片

### 发布流程

```bash
# 构建
npm run build

# 打包
npm pack

# 使用 CLI 发布
reverseai plugin publish
```

### 版本更新

```bash
# 更新版本号
npm version patch  # 或 minor / major

# 重新发布
reverseai plugin publish
```

---

## 最佳实践

### 1. 错误处理

```typescript
try {
  await riskyOperation()
} catch (error) {
  context.log.error('操作失败', error)
  api.ui.showNotification({
    message: '操作失败，请重试',
    type: 'error',
  })
}
```

### 2. 资源清理

```typescript
export async function activate(context: PluginContext, api: PluginAPI) {
  // 所有订阅都添加到 subscriptions
  context.subscriptions.push(
    api.commands.registerCommand('...', () => {}),
    api.events.on('...', () => {})
  )
}

// deactivate 时自动清理
```

### 3. 性能优化

- 延迟加载大型依赖
- 使用缓存减少重复计算
- 避免同步阻塞操作
- 分批处理大量数据

### 4. 用户体验

- 提供清晰的错误消息
- 显示操作进度
- 支持取消长时间操作
- 添加合理的默认值

### 5. 安全性

- 最小权限原则
- 验证所有用户输入
- 不存储敏感信息明文
- 使用 HTTPS 请求

---

## 常见问题

### Q: 如何调试插件？

使用 `context.log` 输出日志，在开发者工具中查看。

### Q: 如何访问其他插件的功能？

使用 `api.commands.executeCommand` 调用其他插件的命令。

### Q: 插件数据存储在哪里？

使用 `api.storage` API，数据存储在用户本地。

### Q: 如何处理插件冲突？

确保使用唯一的 ID 和命令名称，遵循 `plugin-id.command` 命名规范。

---

## 更多资源

- [API 参考文档](./API_REFERENCE.md)
- [示例插件](./examples/)
- [GitHub 讨论区](https://github.com/reverseai/sdk/discussions)
- [问题反馈](https://github.com/reverseai/sdk/issues)
