/**
 * {{projectName}} - 基础自定义节点
 *
 * 这是一个最小可运行的节点模板，展示了 AgentFlow SDK 的基本用法。
 */

import { defineNode, input, output } from '@agentflow/sdk'

export default defineNode({
  id: '{{nodeId}}',
  name: '{{nodeName}}',
  description: '自定义节点示例',
  icon: 'puzzle',
  category: 'custom',
  version: '1.0.0',
  author: '{{author}}',
  tags: ['custom', 'basic'],

  // 定义输入参数
  inputs: {
    message: input
      .string('输入消息')
      .required()
      .placeholder('请输入消息')
      .description('需要处理的消息内容')
      .build(),

    prefix: input.string('前缀').default('[处理后] ').description('添加到消息前面的前缀').build(),
  },

  // 定义输出
  outputs: {
    result: output.string('处理结果').description('处理后的消息').build(),

    timestamp: output.string('处理时间').description('处理完成的时间戳').build(),
  },

  // 执行逻辑
  async execute(ctx) {
    const { message, prefix } = ctx.inputs

    ctx.log.info('开始处理消息', { messageLength: message.length })
    ctx.reportProgress(50, '处理中...')

    // 模拟处理过程
    const result = `${prefix}${message}`
    const timestamp = new Date().toISOString()

    ctx.reportProgress(100, '完成')
    ctx.log.info('处理完成', { resultLength: result.length })

    return {
      result,
      timestamp,
    }
  },
})
