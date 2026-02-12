/**
 * {{projectName}} - ReverseAI 插件
 *
 * 插件可以包含多个节点、提供共享功能、并请求特定权限。
 */

import { definePlugin, defineNode, input, output } from '@reverseai/sdk'

// 定义插件包含的节点
const node1 = defineNode({
  id: '{{nodeId}}-greeting',
  name: '问候节点',
  description: '生成个性化问候消息',
  icon: 'hand-wave',
  category: 'custom',
  version: '1.0.0',
  author: '{{author}}',
  tags: ['greeting', 'message'],

  inputs: {
    name: input.string('姓名').required().placeholder('请输入姓名').build(),

    language: input
      .select('语言', [
        { value: 'zh', label: '中文' },
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
      ])
      .default('zh')
      .build(),
  },

  outputs: {
    greeting: output.string('问候语').build(),
  },

  async execute(ctx) {
    const { name, language } = ctx.inputs

    const greetings: Record<string, string> = {
      zh: `你好，${name}！欢迎使用 ReverseAI。`,
      en: `Hello, ${name}! Welcome to ReverseAI.`,
      ja: `こんにちは、${name}さん！ReverseAI へようこそ。`,
    }

    return {
      greeting: greetings[language] || greetings.zh,
    }
  },
})

const node2 = defineNode({
  id: '{{nodeId}}-counter',
  name: '计数器节点',
  description: '使用插件存储实现的计数器',
  icon: 'hash',
  category: 'custom',
  version: '1.0.0',
  author: '{{author}}',
  tags: ['counter', 'storage'],

  inputs: {
    key: input.string('计数器键名').default('default-counter').build(),

    action: input
      .select('操作', [
        { value: 'increment', label: '增加' },
        { value: 'decrement', label: '减少' },
        { value: 'reset', label: '重置' },
        { value: 'get', label: '获取' },
      ])
      .default('increment')
      .build(),

    amount: input.number('数量').default(1).min(1).build(),
  },

  outputs: {
    value: output.number('当前值').build(),
    previousValue: output.number('之前的值').build(),
  },

  async execute(ctx) {
    const { key, action, amount } = ctx.inputs

    // 使用插件存储获取当前值
    const previousValue = (await ctx.cache.get<number>(key)) || 0
    let value = previousValue

    switch (action) {
      case 'increment':
        value = previousValue + amount
        break
      case 'decrement':
        value = Math.max(0, previousValue - amount)
        break
      case 'reset':
        value = 0
        break
      case 'get':
        // 保持不变
        break
    }

    // 保存新值
    if (action !== 'get') {
      await ctx.cache.set(key, value)
    }

    ctx.log.info('计数器操作', { action, previousValue, value })

    return {
      value,
      previousValue,
    }
  },
})

// 导出插件定义
export default definePlugin({
  id: '{{nodeId}}',
  name: '{{projectName}}',
  description: '包含多个实用节点的 ReverseAI 插件',
  version: '1.0.0',
  author: '{{author}}',

  // 声明所需权限
  permissions: ['storage:read', 'storage:write'],

  // 注册节点
  nodes: [node1, node2],

  // 插件初始化（可选）
  async onLoad(ctx) {
    ctx.log.info('插件已加载')
  },

  // 插件卸载（可选）
  async onUnload(ctx) {
    ctx.log.info('插件已卸载')
  },
})

// 同时导出单独的节点，方便单独使用
export { node1 as greetingNode, node2 as counterNode }
