/**
 * 示例节点：HTTP 请求
 *
 * 演示 HTTP 客户端使用、错误处理、密钥管理
 */

import { defineNode, input, output, ExecutionError } from '../index'

export const httpRequestNode = defineNode({
  id: 'http-request',
  name: 'HTTP 请求',
  description: '发送 HTTP 请求并获取响应',
  icon: 'globe',
  category: 'integration',
  version: '1.0.0',
  author: 'ReverseAI',
  tags: ['HTTP', 'API', '网络'],

  inputs: {
    url: input
      .string('请求 URL')
      .required()
      .url('请输入有效的 URL')
      .placeholder('https://api.example.com/data')
      .build(),

    method: input
      .select('请求方法', [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' },
      ])
      .default('GET')
      .build(),

    headers: input
      .object('请求头')
      .json()
      .default({})
      .description('自定义请求头，JSON 格式')
      .build(),

    body: input
      .object('请求体')
      .json()
      .showIf({ field: 'method', operator: 'notEquals', value: 'GET' })
      .description('请求体数据，JSON 格式')
      .build(),

    timeout: input
      .number('超时时间')
      .default(30000)
      .min(1000)
      .max(300000)
      .description('请求超时时间（毫秒）')
      .build(),

    useAuth: input.boolean('使用认证').default(false).description('是否使用 API 密钥认证').build(),

    authHeader: input
      .string('认证头名称')
      .default('Authorization')
      .showIf({ field: 'useAuth', operator: 'equals', value: true })
      .build(),

    authSecretKey: input
      .string('密钥名称')
      .placeholder('API_KEY')
      .showIf({ field: 'useAuth', operator: 'equals', value: true })
      .description('存储在密钥管理中的密钥名称')
      .build(),
  },

  outputs: {
    data: output.any('响应数据').description('HTTP 响应的数据内容').build(),

    status: output.number('状态码').description('HTTP 响应状态码').build(),

    headers: output.object('响应头').description('HTTP 响应头').build(),
  },

  async execute(ctx) {
    const { url, method, headers, body, timeout, useAuth, authHeader, authSecretKey } = ctx.inputs

    ctx.log.info('准备发送 HTTP 请求', { url, method })
    ctx.reportProgress(10, '准备请求...')

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((headers as Record<string, string>) || {}),
    }

    // 处理认证
    if (useAuth && authSecretKey) {
      ctx.reportProgress(20, '获取认证信息...')
      const secret = await ctx.getSecret(authSecretKey)
      if (!secret) {
        throw new ExecutionError(`未找到密钥: ${authSecretKey}`, { secretKey: authSecretKey })
      }
      requestHeaders[authHeader || 'Authorization'] = secret
    }

    ctx.reportProgress(40, '发送请求...')

    try {
      const response = await ctx.http.request({
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url,
        headers: requestHeaders,
        data: method !== 'GET' ? body : undefined,
        timeout,
      })

      ctx.reportProgress(100, '完成')
      ctx.log.info('请求成功', { status: response.status })

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error) {
      ctx.log.error('请求失败', { error: String(error) })
      throw new ExecutionError(
        `HTTP 请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { url, method }
      )
    }
  },
})
