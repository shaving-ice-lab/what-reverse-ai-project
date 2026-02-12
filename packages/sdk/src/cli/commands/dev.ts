/**
 * dev 命令 - 开发模式
 *
 * 提供热重载、实时测试、交互式调试功能
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { createTestContext } from '../../testing'

interface DevOptions {
  port?: number
  file?: string
  watch?: boolean
  interactive?: boolean
}

interface NodeModule {
  default?: unknown
  [key: string]: unknown
}

interface WatchState {
  currentNode: any | null
  lastError: Error | null
  testHistory: Array<{
    inputs: Record<string, unknown>
    output: unknown
    error?: string
    duration: number
    timestamp: Date
  }>
}

export async function devCommand(options: DevOptions): Promise<void> {
  const projectDir = process.cwd()
  const entryFile = options.file || findEntryFile(projectDir)
  const enableWatch = options.watch !== false
  const enableInteractive = options.interactive !== false

  if (!entryFile) {
    console.error('❌ 未找到入口文件')
    console.error('   请在 src/index.ts 或 src/index.js 创建节点定义')
    console.error('   或使用 -f 选项指定文件路径')
    process.exit(1)
  }

  console.log('\n🔧 ReverseAI 开发模式\n')
  console.log(`📁 项目目录: ${projectDir}`)
  console.log(`📄 入口文件: ${entryFile}`)
  console.log(`👀 文件监听: ${enableWatch ? '已启用' : '已禁用'}`)
  console.log(`🖥️  交互模式: ${enableInteractive ? '已启用' : '已禁用'}`)
  console.log('')

  const state: WatchState = {
    currentNode: null,
    lastError: null,
    testHistory: [],
  }

  // 初始加载
  await loadNode(entryFile, state)

  // 监听文件变化
  if (enableWatch) {
    setupFileWatcher(projectDir, entryFile, state)
  }

  // 交互式命令行
  if (enableInteractive) {
    await startInteractiveMode(state, entryFile)
  } else {
    // 非交互模式，保持进程运行
    console.log('💡 按 Ctrl+C 退出\n')
    await new Promise(() => {}) // 永久等待
  }
}

/**
 * 查找入口文件
 */
function findEntryFile(projectDir: string): string | null {
  const candidates = ['src/index.ts', 'src/index.js', 'index.ts', 'index.js', 'dist/index.js']

  for (const candidate of candidates) {
    const fullPath = path.join(projectDir, candidate)
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
  }

  return null
}

/**
 * 加载节点模块
 */
async function loadNode(filePath: string, state: WatchState): Promise<boolean> {
  console.log(`\n📦 加载节点: ${path.basename(filePath)}`)

  try {
    // 清除模块缓存以支持热重载
    const absolutePath = path.resolve(filePath)
    delete require.cache[absolutePath]

    // 对于 TypeScript 文件，需要特殊处理
    const ext = path.extname(filePath)
    let nodeModule: NodeModule

    if (ext === '.ts') {
      // 检查是否有编译后的文件
      const jsPath = filePath.replace(/\.ts$/, '.js')
      const distPath = filePath.replace(/^src\//, 'dist/').replace(/\.ts$/, '.js')

      if (fs.existsSync(distPath)) {
        delete require.cache[path.resolve(distPath)]
        nodeModule = require(path.resolve(distPath))
      } else if (fs.existsSync(jsPath)) {
        delete require.cache[path.resolve(jsPath)]
        nodeModule = require(path.resolve(jsPath))
      } else {
        // 尝试使用 ts-node 或 esbuild-register
        try {
          require('esbuild-register/dist/node').register()
        } catch {
          try {
            require('ts-node/register')
          } catch {
            console.error('⚠️  无法加载 TypeScript 文件')
            console.error('   请先运行 npm run build 或安装 esbuild-register / ts-node')
            state.lastError = new Error('Cannot load TypeScript file')
            return false
          }
        }
        nodeModule = require(absolutePath)
      }
    } else {
      nodeModule = require(absolutePath)
    }

    // 获取节点定义
    const node = (nodeModule.default || nodeModule) as {
      id?: string
      name?: string
      version?: string
      category?: string
      execute?: unknown
      inputs?: Record<string, { type?: string; required?: boolean }>
      outputs?: Record<string, { type?: string }>
    }

    if (!node || !node.id || typeof node.execute !== 'function') {
      console.error('❌ 无效的节点定义')
      console.error('   确保导出了有效的 defineNode() 结果')
      state.lastError = new Error('Invalid node definition')
      return false
    }

    state.currentNode = node
    state.lastError = null

    console.log(`✅ 节点加载成功`)
    printNodeInfo(node)
    return true
  } catch (error) {
    console.error(`❌ 加载节点失败: ${(error as Error).message}`)
    state.lastError = error as Error
    return false
  }
}

/**
 * 打印节点信息
 */
function printNodeInfo(node: any): void {
  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│ 📌 ${node.name.padEnd(44)} │`)
  console.log('├─────────────────────────────────────────────────┤')
  console.log(`│ ID: ${node.id.padEnd(42)} │`)
  console.log(`│ 版本: ${node.version.padEnd(40)} │`)
  console.log(`│ 类别: ${node.category.padEnd(40)} │`)
  console.log('├─────────────────────────────────────────────────┤')

  const inputKeys = Object.keys(node.inputs || {})
  const outputKeys = Object.keys(node.outputs || {})

  console.log(`│ 输入 (${inputKeys.length}):`.padEnd(50) + '│')
  for (const key of inputKeys) {
    const input = node.inputs[key]
    const required = input.required ? ' *' : ''
    console.log(`│   • ${key}: ${input.type}${required}`.padEnd(48) + '│')
  }

  console.log(`│ 输出 (${outputKeys.length}):`.padEnd(50) + '│')
  for (const key of outputKeys) {
    const output = node.outputs[key]
    console.log(`│   • ${key}: ${output.type}`.padEnd(48) + '│')
  }

  console.log('└─────────────────────────────────────────────────┘')
  console.log('')
}

/**
 * 设置文件监听
 */
function setupFileWatcher(projectDir: string, entryFile: string, state: WatchState): void {
  const srcDir = path.join(projectDir, 'src')
  const watchDir = fs.existsSync(srcDir) ? srcDir : projectDir

  console.log(`👀 监听目录: ${watchDir}\n`)

  let debounceTimer: NodeJS.Timeout | null = null

  fs.watch(watchDir, { recursive: true }, (_eventType, filename) => {
    if (!filename) return
    if (!filename.endsWith('.ts') && !filename.endsWith('.js')) return
    if (filename.includes('node_modules')) return

    // 防抖处理
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      console.log(`\n🔄 检测到文件变化: ${filename}`)
      loadNode(entryFile, state)
    }, 300)
  })
}

/**
 * 启动交互式模式
 */
async function startInteractiveMode(state: WatchState, entryFile: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log('────────────────────────────────────────────────────')
  console.log('📝 交互式命令:')
  console.log('   test [json]  - 执行节点测试（输入 JSON 格式参数）')
  console.log('   info         - 显示节点信息')
  console.log('   reload       - 重新加载节点')
  console.log('   history      - 查看测试历史')
  console.log('   clear        - 清除测试历史')
  console.log('   help         - 显示帮助')
  console.log('   exit/quit    - 退出')
  console.log('────────────────────────────────────────────────────\n')

  const prompt = () => {
    rl.question('reverseai> ', async (input) => {
      const trimmed = input.trim()
      if (!trimmed) {
        prompt()
        return
      }

      const [command, ...args] = trimmed.split(/\s+/)
      const argStr = args.join(' ')

      switch (command.toLowerCase()) {
        case 'test':
        case 'run':
          await executeTest(state, argStr)
          break

        case 'info':
        case 'i':
          if (state.currentNode) {
            printNodeInfo(state.currentNode)
          } else {
            console.log('❌ 未加载节点')
          }
          break

        case 'reload':
        case 'r':
          await loadNode(entryFile, state)
          break

        case 'history':
        case 'h':
          printTestHistory(state)
          break

        case 'clear':
        case 'c':
          state.testHistory = []
          console.log('✅ 测试历史已清除')
          break

        case 'help':
        case '?':
          printHelp()
          break

        case 'exit':
        case 'quit':
        case 'q':
          console.log('\n👋 再见!\n')
          rl.close()
          process.exit(0)
          break

        default:
          // 尝试解析为 JSON 并执行测试
          if (trimmed.startsWith('{')) {
            await executeTest(state, trimmed)
          } else {
            console.log(`❓ 未知命令: ${command}`)
            console.log("   输入 'help' 查看可用命令")
          }
      }

      prompt()
    })
  }

  prompt()
}

/**
 * 执行测试
 */
async function executeTest(state: WatchState, inputStr: string): Promise<void> {
  if (!state.currentNode) {
    console.log('❌ 未加载节点')
    return
  }

  let inputs: Record<string, unknown>

  if (!inputStr) {
    // 使用默认值
    inputs = state.currentNode.getDefaultConfig?.() || {}
    console.log('💡 使用默认输入值')
  } else {
    try {
      inputs = JSON.parse(inputStr)
    } catch (error) {
      console.log(`❌ JSON 解析失败: ${(error as Error).message}`)
      console.log('   示例: test {"text": "Hello", "count": 5}')
      return
    }
  }

  console.log('\n🚀 执行测试...')
  console.log(`   输入: ${JSON.stringify(inputs)}`)

  const startTime = Date.now()

  try {
    // 验证输入
    const validation = state.currentNode.validateInputs(inputs)
    if (!validation.valid) {
      console.log('\n❌ 输入验证失败:')
      for (const error of validation.errors) {
        console.log(`   • ${error.field}: ${error.message}`)
      }
      return
    }

    // 创建测试上下文
    const ctx = createTestContext(inputs)

    // 执行节点
    const output = await state.currentNode.execute(ctx)
    const duration = Date.now() - startTime

    // 记录历史
    state.testHistory.push({
      inputs,
      output,
      duration,
      timestamp: new Date(),
    })

    console.log('\n✅ 执行成功')
    console.log(`   耗时: ${duration}ms`)
    console.log(`   输出: ${JSON.stringify(output, null, 2)}`)

    // 显示日志
    if (ctx.logger.logs.length > 0) {
      console.log('\n📋 日志:')
      for (const log of ctx.logger.logs) {
        const icon = {
          debug: '🔍',
          info: 'ℹ️ ',
          warn: '⚠️ ',
          error: '❌',
        }[log.level]
        console.log(`   ${icon} [${log.level}] ${log.message}`)
      }
    }

    // 显示进度报告
    if (ctx.progressReports.length > 0) {
      console.log('\n📊 进度报告:')
      for (const report of ctx.progressReports) {
        console.log(`   ${report.progress}% ${report.message || ''}`)
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime

    state.testHistory.push({
      inputs,
      output: null,
      error: (error as Error).message,
      duration,
      timestamp: new Date(),
    })

    console.log(`\n❌ 执行失败: ${(error as Error).message}`)
    if ((error as Error).stack) {
      console.log('\n堆栈跟踪:')
      console.log((error as Error).stack)
    }
  }

  console.log('')
}

/**
 * 打印测试历史
 */
function printTestHistory(state: WatchState): void {
  if (state.testHistory.length === 0) {
    console.log('📭 暂无测试历史')
    return
  }

  console.log(`\n📜 测试历史 (共 ${state.testHistory.length} 条):\n`)

  for (let i = 0; i < state.testHistory.length; i++) {
    const record = state.testHistory[i]
    const status = record.error ? '❌' : '✅'
    const time = record.timestamp.toLocaleTimeString()

    console.log(`${i + 1}. ${status} [${time}] ${record.duration}ms`)
    console.log(`   输入: ${JSON.stringify(record.inputs)}`)
    if (record.error) {
      console.log(`   错误: ${record.error}`)
    } else {
      console.log(`   输出: ${JSON.stringify(record.output)}`)
    }
    console.log('')
  }
}

/**
 * 打印帮助信息
 */
function printHelp(): void {
  console.log(`
📖 ReverseAI Dev 命令帮助

命令列表:
  test [json]   执行节点测试
                示例: test {"text": "Hello", "count": 5}
                省略参数将使用默认值

  info, i       显示当前节点信息

  reload, r     重新加载节点文件

  history, h    查看测试历史记录

  clear, c      清除测试历史

  help, ?       显示此帮助信息

  exit, quit, q 退出开发模式

快捷方式:
  直接输入 JSON 会自动执行测试
  例如: {"text": "test"}

提示:
  • 文件变化会自动重新加载节点
  • 使用 Ctrl+C 强制退出
`)
}
