# @agentflow/sdk

AgentFlow 自定义节点 SDK - 用于创建可在 AgentFlow 平台运行的自定义工作流节点。

## 安装

```bash
npm install @agentflow/sdk
# 或
pnpm add @agentflow/sdk
# 或
yarn add @agentflow/sdk
```

## 快速开始

### 1. 创建基础节点

```typescript
import { defineNode, input, output } from '@agentflow/sdk'

export default defineNode({
  id: 'text-transform',
  name: '文本转换',
  description: '将输入文本转换为大写或小写',
  icon: 'transform',
  category: 'data',
  version: '1.0.0',

  inputs: {
    text: input.string('输入文本').required().build(),
    mode: input
      .select('转换模式', [
        { label: '大写', value: 'upper' },
        { label: '小写', value: 'lower' },
      ])
      .default('upper')
      .build(),
  },

  outputs: {
    result: output.string('转换结果').build(),
  },

  async execute(ctx) {
    const { text, mode } = ctx.inputs
    ctx.log.info('开始转换', { text, mode })

    const result = mode === 'upper' ? text.toUpperCase() : text.toLowerCase()

    return { result }
  },
})
```

### 2. 使用输入构建器

SDK 提供了流畅的 API 来定义输入字段：

```typescript
import { input } from '@agentflow/sdk'

// 字符串输入
input.string('姓名').required().minLength(2).maxLength(50).placeholder('请输入姓名').build()

// 数字输入
input.number('年龄').min(0).max(150).default(18).build()

// 布尔输入
input
  .boolean('启用')
  .default(false)
  .switch() // 使用开关组件
  .build()

// 选择输入
input
  .select('类型', [
    { label: '选项 A', value: 'a' },
    { label: '选项 B', value: 'b' },
  ])
  .build()

// 对象输入
input
  .object('配置')
  .json() // 使用 JSON 编辑器
  .build()

// 数组输入
input.array('列表').default([]).build()

// 代码输入
input.string('代码').code().multiline().build()
```

### 3. 使用输出构建器

```typescript
import { output } from '@agentflow/sdk'

// 字符串输出
output.string('结果').build()

// 对象输出
output.object('数据').build()

// 可选输出
output.string('错误信息').optional().build()
```

### 4. 验证规则

```typescript
import { input, validators } from '@agentflow/sdk'

// 内置验证
input
  .string('邮箱')
  .email() // 邮箱格式验证
  .build()

input
  .string('网址')
  .url() // URL 格式验证
  .build()

// 使用预置验证器
input.string('手机号').validate(validators.phone()).build()

input.string('UUID').validate(validators.uuid()).build()

// 自定义验证
input
  .string('用户名')
  .custom((value) => /^[a-z0-9_]+$/.test(value), '只能包含小写字母、数字和下划线')
  .build()

// 枚举验证
input
  .string('状态')
  .validate(validators.oneOf(['active', 'inactive', 'pending']))
  .build()
```

### 5. 条件显示

```typescript
input
  .string('API 密钥')
  .showIf({
    field: 'useCustomApi',
    operator: 'equals',
    value: true,
  })
  .build()
```

## 执行上下文

节点执行函数接收一个上下文对象，包含以下功能：

```typescript
async execute(ctx) {
  // 获取输入值
  const { text, count } = ctx.inputs;

  // 日志记录
  ctx.log.debug('调试信息', { data });
  ctx.log.info('一般信息');
  ctx.log.warn('警告信息');
  ctx.log.error('错误信息');

  // 报告进度
  ctx.reportProgress(50, '处理中...');

  // 获取环境变量
  const apiUrl = ctx.getEnv('API_URL');

  // 获取密钥
  const apiKey = await ctx.getSecret('OPENAI_API_KEY');

  // HTTP 请求
  const response = await ctx.http.get('https://api.example.com/data');
  const result = await ctx.http.post('https://api.example.com/submit', { data });

  // 存储操作
  await ctx.storage.set('key', value);
  const cached = await ctx.storage.get('key');

  // 检查取消信号
  if (ctx.signal.aborted) {
    throw new Error('执行已取消');
  }

  return { result };
}
```

## 测试节点

SDK 提供完整的测试框架：

```typescript
import { createNodeTester, assert, runTestSuite } from '@agentflow/sdk'
import myNode from './my-node'

// 方式 1: 使用测试器
const tester = createNodeTester(myNode)

const result = await tester
  .withEnv({ API_URL: 'https://test.api.com' })
  .withSecrets({ API_KEY: 'test-key' })
  .execute({ text: 'hello', count: 3 })

// 断言
assert.success(result)
assert.outputEquals(result, { result: 'hellohellohello' })
assert.hasLog(result, 'info', '处理中')

// 方式 2: 运行测试套件
const suiteResult = await runTestSuite(myNode, [
  {
    name: '基础转换测试',
    inputs: { text: 'hello', mode: 'upper' },
    expected: { result: 'HELLO' },
  },
  {
    name: '空输入应该失败',
    inputs: { text: '', mode: 'upper' },
    shouldFail: true,
  },
])

console.log(`通过: ${suiteResult.passed}, 失败: ${suiteResult.failed}`)
```

## 验证

```typescript
import { validateAllInputs, validateNodeDefinition } from '@agentflow/sdk'

// 验证输入值
const result = validateAllInputs(node.inputs, {
  text: 'hello',
  count: 5,
})

if (!result.valid) {
  console.log('验证错误:', result.errors)
}

// 验证节点定义
const defResult = validateNodeDefinition({
  id: 'my-node',
  name: '我的节点',
  // ...
})
```

## 错误处理

```typescript
import { ExecutionError, ConfigurationError } from '@agentflow/sdk';

async execute(ctx) {
  // 抛出执行错误
  if (!ctx.inputs.text) {
    throw new ExecutionError('文本不能为空', { field: 'text' });
  }

  // 抛出配置错误
  const apiKey = await ctx.getSecret('API_KEY');
  if (!apiKey) {
    throw new ConfigurationError('未配置 API 密钥');
  }

  // ...
}
```

## 类型安全

SDK 提供完整的 TypeScript 支持：

```typescript
import { defineNode, input, output, NodeExecutionContext } from '@agentflow/sdk'

// 输入输出类型会自动推断
const node = defineNode({
  // ...
  inputs: {
    text: input.string('文本').required().build(),
    count: input.number('数量').default(1).build(),
  },
  outputs: {
    result: output.string('结果').build(),
  },
  async execute(ctx) {
    // ctx.inputs.text 类型为 string
    // ctx.inputs.count 类型为 number
    // 返回值必须包含 result: string
    return { result: ctx.inputs.text.repeat(ctx.inputs.count) }
  },
})
```

## API 参考

### defineNode(config)

定义一个新节点。

**参数:**

- `config.id` - 节点唯一标识符
- `config.name` - 节点显示名称
- `config.description` - 节点描述
- `config.icon` - 节点图标
- `config.category` - 节点类别
- `config.version` - 节点版本
- `config.inputs` - 输入定义
- `config.outputs` - 输出定义
- `config.execute` - 执行函数

### input

输入字段构建器工厂。

**方法:**

- `input.string(label)` - 字符串输入
- `input.number(label)` - 数字输入
- `input.boolean(label)` - 布尔输入
- `input.object(label)` - 对象输入
- `input.array(label)` - 数组输入
- `input.select(label, options)` - 选择输入
- `input.file(label)` - 文件输入
- `input.image(label)` - 图片输入
- `input.json(label)` - JSON 输入
- `input.any(label)` - 任意类型输入

### output

输出字段构建器工厂。

**方法:**

- `output.string(label)` - 字符串输出
- `output.number(label)` - 数字输出
- `output.boolean(label)` - 布尔输出
- `output.object(label)` - 对象输出
- `output.array(label)` - 数组输出

### validators

预置验证器。

**验证器:**

- `validators.email()` - 邮箱格式
- `validators.url()` - URL 格式
- `validators.uuid()` - UUID 格式
- `validators.phone()` - 手机号格式
- `validators.positiveInteger()` - 正整数
- `validators.notEmpty()` - 非空字符串
- `validators.oneOf(values)` - 枚举值
- `validators.jsonObject()` - JSON 对象

## 许可证

MIT
