# {{projectName}}

AgentFlow 自定义节点 - LLM 调用模板

## 功能

灵活的大语言模型调用节点，支持：

- 多种模型选择 (GPT-4, Claude 3 等)
- 自定义系统提示词
- 温度和 Top P 参数控制
- 流式输出
- Token 使用量统计

## 安装

```bash
npm install
```

## 使用示例

### 基础调用

```json
{
  "model": "gpt-4-turbo",
  "systemPrompt": "你是一个专业的文案写手。",
  "userPrompt": "请帮我写一段关于人工智能的介绍，200字左右。",
  "temperature": 0.7
}
```

### 代码生成

```json
{
  "model": "gpt-4",
  "systemPrompt": "你是一个资深的 TypeScript 开发者。请只输出代码，不要解释。",
  "userPrompt": "写一个 TypeScript 函数，实现数组去重。",
  "temperature": 0.3
}
```

## 输入参数

| 参数         | 类型     | 必填 | 默认值      | 说明        |
| ------------ | -------- | ---- | ----------- | ----------- |
| model        | select   | 否   | gpt-4-turbo | LLM 模型    |
| systemPrompt | textarea | 否   | -           | 系统提示词  |
| userPrompt   | textarea | 是   | -           | 用户提示词  |
| temperature  | number   | 否   | 0.7         | 温度 (0-2)  |
| maxTokens    | number   | 否   | 2048        | 最大 Token  |
| topP         | number   | 否   | 1           | Top P (0-1) |
| stream       | boolean  | 否   | true        | 流式输出    |

## 输出

| 字段             | 类型   | 说明       |
| ---------------- | ------ | ---------- |
| content          | string | 生成的内容 |
| model            | string | 使用的模型 |
| promptTokens     | number | 输入 Token |
| completionTokens | number | 生成 Token |
| totalTokens      | number | 总 Token   |
| finishReason     | string | 结束原因   |

## 许可证

MIT
