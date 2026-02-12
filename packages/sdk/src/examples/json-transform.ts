/**
 * 示例节点：JSON 转换
 *
 * 演示 JSON 数据处理、JSONPath 查询、数据映射
 */

import { defineNode, input, output, ExecutionError } from '../index'

export const jsonTransformNode = defineNode({
  id: 'json-transform',
  name: 'JSON 转换',
  description: '对 JSON 数据进行转换和提取',
  icon: 'code',
  category: 'data',
  version: '1.0.0',
  author: 'ReverseAI',
  tags: ['JSON', '数据', '转换'],

  inputs: {
    data: input.object('输入数据').required().json().description('需要处理的 JSON 数据').build(),

    operation: input
      .select('操作类型', [
        { label: '提取字段', value: 'extract', description: '从 JSON 中提取指定字段' },
        { label: '过滤数组', value: 'filter', description: '过滤数组中的元素' },
        { label: '映射数组', value: 'map', description: '转换数组中的每个元素' },
        { label: '合并对象', value: 'merge', description: '合并多个对象' },
        { label: '扁平化', value: 'flatten', description: '将嵌套数组扁平化' },
      ])
      .default('extract')
      .build(),

    path: input
      .string('字段路径')
      .placeholder('user.profile.name')
      .showIf({ field: 'operation', operator: 'equals', value: 'extract' })
      .description('使用点号分隔的路径，如: data.items[0].name')
      .build(),

    filterExpression: input
      .string('过滤表达式')
      .placeholder('item.age > 18')
      .showIf({ field: 'operation', operator: 'equals', value: 'filter' })
      .description('JavaScript 表达式，item 代表数组元素')
      .build(),

    mapExpression: input
      .string('映射表达式')
      .placeholder('{ name: item.name, id: item.id }')
      .showIf({ field: 'operation', operator: 'equals', value: 'map' })
      .description('JavaScript 表达式，返回新的元素格式')
      .build(),

    mergeData: input
      .object('合并数据')
      .json()
      .showIf({ field: 'operation', operator: 'equals', value: 'merge' })
      .description('要合并的额外数据')
      .build(),

    depth: input
      .number('扁平化深度')
      .default(1)
      .min(1)
      .max(10)
      .showIf({ field: 'operation', operator: 'equals', value: 'flatten' })
      .description('数组扁平化的深度')
      .build(),
  },

  outputs: {
    result: output.any('处理结果').description('转换后的数据').build(),

    success: output.boolean('是否成功').build(),
  },

  async execute(ctx) {
    const { data, operation, path, filterExpression, mapExpression, mergeData, depth } = ctx.inputs

    ctx.log.info('开始 JSON 转换', { operation })
    ctx.reportProgress(20, '处理中...')

    try {
      let result: unknown

      switch (operation) {
        case 'extract':
          result = extractByPath(data, path || '')
          break

        case 'filter':
          if (!Array.isArray(data)) {
            throw new Error('过滤操作需要数组数据')
          }
          result = filterArray(data, filterExpression || 'true')
          break

        case 'map':
          if (!Array.isArray(data)) {
            throw new Error('映射操作需要数组数据')
          }
          result = mapArray(data, mapExpression || 'item')
          break

        case 'merge':
          result = { ...(data as object), ...((mergeData as object) || {}) }
          break

        case 'flatten':
          if (!Array.isArray(data)) {
            throw new Error('扁平化操作需要数组数据')
          }
          result = flattenArray(data, depth || 1)
          break

        default:
          result = data
      }

      ctx.reportProgress(100, '完成')
      ctx.log.info('转换成功')

      return {
        result,
        success: true,
      }
    } catch (error) {
      ctx.log.error('转换失败', { error: String(error) })
      throw new ExecutionError(
        `JSON 转换失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation }
      )
    }
  },
})

/**
 * 按路径提取数据
 */
function extractByPath(data: unknown, path: string): unknown {
  if (!path) return data

  const parts = path.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }

    // 处理数组索引，如 items[0]
    const match = part.match(/^(\w+)\[(\d+)\]$/)
    if (match) {
      const [, key, index] = match
      current = (current as Record<string, unknown>)[key]
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }

  return current
}

/**
 * 过滤数组
 */
function filterArray(arr: unknown[], expression: string): unknown[] {
  // 简单的表达式解析（生产环境应使用安全的沙箱）
  return arr.filter((item) => {
    try {
      const fn = new Function('item', `return ${expression}`)
      return fn(item)
    } catch {
      return true
    }
  })
}

/**
 * 映射数组
 */
function mapArray(arr: unknown[], expression: string): unknown[] {
  return arr.map((item) => {
    try {
      const fn = new Function('item', `return ${expression}`)
      return fn(item)
    } catch {
      return item
    }
  })
}

/**
 * 扁平化数组
 */
function flattenArray(arr: unknown[], depth: number): unknown[] {
  return arr.flat(depth)
}
