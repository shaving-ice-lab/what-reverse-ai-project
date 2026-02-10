/**
 * validate 命令 - 验证节点定义
 */

import * as fs from 'fs'
import * as path from 'path'
import { validateNodeDefinition } from '../../validation'

interface ValidateOptions {
  file?: string
  strict?: boolean
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  console.log('\n🔍 验证节点定义...\n')

  const cwd = process.cwd()

  // 确定要验证的文件
  let filePath: string

  if (options.file) {
    filePath = path.isAbsolute(options.file) ? options.file : path.join(cwd, options.file)
  } else {
    // 尝试查找默认文件
    const possiblePaths = [
      path.join(cwd, 'src', 'index.ts'),
      path.join(cwd, 'src', 'index.js'),
      path.join(cwd, 'dist', 'index.js'),
      path.join(cwd, 'index.ts'),
      path.join(cwd, 'index.js'),
    ]

    const existingPath = possiblePaths.find((p) => fs.existsSync(p))
    if (!existingPath) {
      console.error('❌ 未找到节点文件，请使用 --file 指定文件路径')
      process.exit(1)
    }
    filePath = existingPath
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    process.exit(1)
  }

  console.log(`📄 验证文件: ${path.relative(cwd, filePath)}\n`)

  try {
    // 动态导入节点模块
    // 注意：这需要文件已经被编译或可以直接执行
    let nodeModule: unknown

    // 检查是否需要编译
    if (filePath.endsWith('.ts')) {
      console.log('⚠️  检测到 TypeScript 文件，请先运行 npm run build\n')

      // 尝试加载编译后的文件
      const distPath = filePath.replace('/src/', '/dist/').replace('.ts', '.js')
      if (fs.existsSync(distPath)) {
        filePath = distPath
        console.log(`📄 使用编译后的文件: ${path.relative(cwd, filePath)}\n`)
      } else {
        console.error('❌ 请先编译项目: npm run build')
        process.exit(1)
      }
    }

    // 使用 require 加载模块
    try {
      nodeModule = require(filePath)
    } catch (e) {
      console.error(`❌ 无法加载模块: ${e instanceof Error ? e.message : e}`)
      process.exit(1)
    }

    // 获取默认导出
    const nodeDefinition = (nodeModule as { default?: unknown }).default || nodeModule

    if (!nodeDefinition || typeof nodeDefinition !== 'object') {
      console.error('❌ 无效的节点导出，请确保导出 defineNode() 的结果')
      process.exit(1)
    }

    // 验证节点定义
    const result = validateNodeDefinition(nodeDefinition as Record<string, unknown>)

    if (result.valid) {
      console.log('✅ 节点定义验证通过!\n')

      // 显示节点信息
      const node = nodeDefinition as Record<string, unknown>
      console.log('📋 节点信息:')
      console.log(`   ID: ${node.id}`)
      console.log(`   名称: ${node.name}`)
      console.log(`   版本: ${node.version}`)
      console.log(`   类别: ${node.category}`)
      console.log(`   描述: ${node.description}`)

      const inputs = node.inputs as Record<string, unknown> | undefined
      const outputs = node.outputs as Record<string, unknown> | undefined

      if (inputs) {
        console.log(`   输入: ${Object.keys(inputs).join(', ')}`)
      }
      if (outputs) {
        console.log(`   输出: ${Object.keys(outputs).join(', ')}`)
      }

      // 严格模式额外检查
      if (options.strict) {
        const warnings: string[] = []

        if (!node.author) {
          warnings.push('缺少 author 字段')
        }
        if (!node.tags || (node.tags as string[]).length === 0) {
          warnings.push('缺少 tags 字段')
        }
        if (!node.description || (node.description as string).length < 10) {
          warnings.push('description 过短')
        }

        if (warnings.length > 0) {
          console.log('\n⚠️  严格模式警告:')
          warnings.forEach((w) => console.log(`   - ${w}`))
        }
      }

      console.log('')
    } else {
      console.error('❌ 节点定义验证失败:\n')
      result.errors.forEach((error) => {
        console.error(`   ❌ ${error.field}: ${error.message}`)
      })
      console.log('')
      process.exit(1)
    }
  } catch (error) {
    console.error(`❌ 验证过程出错: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}
