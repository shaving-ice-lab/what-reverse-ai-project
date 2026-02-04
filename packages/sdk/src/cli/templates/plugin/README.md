# {{projectName}}

AgentFlow 插件模板

## 功能

插件项目模板，支持：

- 包含多个节点
- 声明权限需求
- 使用共享存储
- 生命周期钩子

## 安装

```bash
npm install
```

## 项目结构

```
{{projectName}}/
├── src/
│   └── index.ts      # 插件入口，包含节点定义
├── assets/           # 静态资源（图标等）
├── manifest.json     # 插件清单
├── package.json
└── README.md
```

## 包含的节点

### 1. 问候节点

生成多语言问候消息。

**输入：**
- `name` - 姓名
- `language` - 语言（中/英/日）

**输出：**
- `greeting` - 问候语

### 2. 计数器节点

使用插件存储的计数器。

**输入：**
- `key` - 计数器键名
- `action` - 操作类型
- `amount` - 数量

**输出：**
- `value` - 当前值
- `previousValue` - 之前的值

## 权限说明

此插件请求以下权限：

| 权限 | 说明 |
|------|------|
| `storage:read` | 读取存储数据 |
| `storage:write` | 写入存储数据 |

## 开发

```bash
# 开发模式
npm run dev

# 运行测试
npm test

# 验证插件
npm run validate
```

## 发布

```bash
agentflow publish
```

## 许可证

MIT
