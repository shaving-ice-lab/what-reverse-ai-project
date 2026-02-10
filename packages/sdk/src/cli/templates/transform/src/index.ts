/**
 * {{projectName}} - 数据转换节点
 *
 * 提供灵活的数据转换能力，支持 JSON 路径提取、映射、过滤等操作。
 */

import { defineNode, input, output } from '@agentflow/sdk'

type TransformOperation = 'extract' | 'map' | 'filter' | 'flatten' | 'group' | 'sort' | 'unique'

export default defineNode({
  id: '{{nodeId}}',
  name: '{{nodeName}}',
  description: '转换和处理 JSON 数据',
  icon: 'shuffle',
  category: 'data',
  version: '1.0.0',
  author: '{{author}}',
  tags: ['transform', 'data', 'json', 'mapping'],

  inputs: {
    data: input.json('输入数据').required().description('要转换的 JSON 数据').build(),

    operation: input
      .select('操作类型', [
        { value: 'extract', label: '提取字段' },
        { value: 'map', label: '映射转换' },
        { value: 'filter', label: '过滤数据' },
        { value: 'flatten', label: '展平数组' },
        { value: 'group', label: '分组聚合' },
        { value: 'sort', label: '排序' },
        { value: 'unique', label: '去重' },
      ])
      .default('extract')
      .description('选择要执行的转换操作')
      .build(),

    path: input
      .string('JSON 路径')
      .placeholder('data.items[0].name')
      .description('使用点号分隔的路径提取数据')
      .build(),

    mapping: input
      .json('映射规则')
      .description("字段映射规则，格式: { newField: 'oldField.path' }")
      .build(),

    filterExpression: input
      .string('过滤表达式')
      .placeholder("item.status === 'active'")
      .description('JavaScript 过滤表达式')
      .build(),

    sortField: input
      .string('排序字段')
      .placeholder('createdAt')
      .description('用于排序的字段名')
      .build(),

    sortOrder: input
      .select('排序顺序', [
        { value: 'asc', label: '升序' },
        { value: 'desc', label: '降序' },
      ])
      .default('asc')
      .description('排序方向')
      .build(),

    groupField: input
      .string('分组字段')
      .placeholder('category')
      .description('用于分组的字段名')
      .build(),
  },

  outputs: {
    result: output.json('转换结果').description('转换后的数据').build(),

    count: output.number('数据量').description('结果数据的数量').build(),

    success: output.boolean('是否成功').description('转换是否成功').build(),
  },

  async execute(ctx) {
    const { data, operation, path, mapping, filterExpression, sortField, sortOrder, groupField } =
      ctx.inputs

    ctx.log.info('开始数据转换', { operation })
    ctx.reportProgress(10, '分析数据...')

    let result: unknown = data
    const mappingRule: Record<string, string> = {}

    for (const [key, value] of Object.entries(mapping || {})) {
      mappingRule[key] = String(value)
    }

    try {
      switch (operation as TransformOperation) {
        case 'extract':
          result = extractPath(data, path || '')
          break

        case 'map':
          result = mapData(data, mappingRule)
          break

        case 'filter':
          result = filterData(data, filterExpression || 'true')
          break

        case 'flatten':
          result = flattenData(data)
          break

        case 'group':
          result = groupData(data, groupField || '')
          break

        case 'sort':
          result = sortData(data, sortField || '', sortOrder || 'asc')
          break

        case 'unique':
          result = uniqueData(data)
          break
      }

      ctx.reportProgress(100, '完成')
      ctx.log.info('转换完成', { resultType: typeof result })

      const count = Array.isArray(result) ? result.length : 1

      return {
        result,
        count,
        success: true,
      }
    } catch (error) {
      ctx.log.error('转换失败', { error: (error as Error).message })
      return {
        result: null,
        count: 0,
        success: false,
      }
    }
  },
})

// 辅助函数

function extractPath(data: unknown, path: string): unknown {
  if (!path) return data

  const parts = path.split('.')
  let current: unknown = data

  for (const part of parts) {
    // 处理数组索引 [0]
    const match = part.match(/^(\w+)\[(\d+)\]$/)
    if (match) {
      const [, key, index] = match
      current = (current as Record<string, unknown>)?.[key]
      current = (current as unknown[])?.[parseInt(index, 10)]
    } else {
      current = (current as Record<string, unknown>)?.[part]
    }

    if (current === undefined) return undefined
  }

  return current
}

function mapData(data: unknown, mapping: Record<string, string>): unknown {
  if (!Array.isArray(data)) {
    return mapSingle(data as Record<string, unknown>, mapping)
  }

  return data.map((item) => mapSingle(item as Record<string, unknown>, mapping))
}

function mapSingle(
  item: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [newKey, oldPath] of Object.entries(mapping)) {
    result[newKey] = extractPath(item, oldPath)
  }

  return result
}

function filterData(data: unknown, expression: string): unknown {
  if (!Array.isArray(data)) return data

  // 安全地创建过滤函数
  const filterFn = new Function('item', `return ${expression}`)
  return data.filter((item) => filterFn(item))
}

function flattenData(data: unknown): unknown[] {
  if (!Array.isArray(data)) return [data]
  return data.flat(Infinity)
}

function groupData(data: unknown, field: string): Record<string, unknown[]> {
  if (!Array.isArray(data)) return {}

  const groups: Record<string, unknown[]> = {}

  for (const item of data) {
    const key = String(extractPath(item, field) || 'undefined')
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }

  return groups
}

function sortData(data: unknown, field: string, order: string): unknown {
  if (!Array.isArray(data)) return data

  return [...data].sort((a, b) => {
    const aVal = extractPath(a, field)
    const bVal = extractPath(b, field)

    if (aVal === bVal) return 0
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'desc' ? bVal - aVal : aVal - bVal
    }

    const comparison = String(aVal).localeCompare(String(bVal))
    return order === 'desc' ? -comparison : comparison
  })
}

function uniqueData(data: unknown): unknown[] {
  if (!Array.isArray(data)) return [data]

  const seen = new Set<string>()
  return data.filter((item) => {
    const key = JSON.stringify(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
