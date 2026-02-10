# {{projectName}}

AgentFlow 自定义节点 - 基础模板

## 功能

这是一个基础的自定义节点模板，展示了如何：

- 定义输入参数
- 定义输出结果
- 实现执行逻辑
- 使用日志和进度报告

## 安装

```bash
npm install
```

## 开发

```bash
# 开发模式（监听文件变化）
npm run dev

# 运行测试
npm test

# 验证节点定义
npm run validate
```

## 构建

```bash
npm run build
```

## 发布

```bash
# 发布到 AgentFlow 市场
agentflow publish
```

## 使用示例

```typescript
// 在工作流中使用此节点
{
  "id": "node-1",
  "type": "{{nodeId}}",
  "config": {
    "message": "Hello, World!",
    "prefix": "[处理后] "
  }
}
```

## 输入参数

| 参数    | 类型   | 必填 | 默认值      | 说明                 |
| ------- | ------ | ---- | ----------- | -------------------- |
| message | string | 是   | -           | 需要处理的消息内容   |
| prefix  | string | 否   | "[处理后] " | 添加到消息前面的前缀 |

## 输出

| 字段      | 类型   | 说明             |
| --------- | ------ | ---------------- |
| result    | string | 处理后的消息     |
| timestamp | string | 处理完成的时间戳 |

## 许可证

MIT
