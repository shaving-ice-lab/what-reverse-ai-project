#!/usr/bin/env node
/**
 * AgentFlow SDK CLI
 *
 * 命令行工具用于创建、构建、测试和发布自定义节点
 */

import { Command } from 'commander'
import { initCommand } from './commands/init'
import { buildCommand } from './commands/build'
import { testCommand } from './commands/test'
import { validateCommand } from './commands/validate'
import { publishCommand } from './commands/publish'
import { devCommand } from './commands/dev'
import { VERSION } from '../index'

const program = new Command()

program.name('agentflow').description('AgentFlow SDK CLI - 创建和管理自定义节点').version(VERSION)

// 初始化项目
program
  .command('init [name]')
  .description('初始化新的节点项目')
  .option('-t, --template <template>', '项目模板', 'basic')
  .option('-d, --directory <dir>', '目标目录')
  .option('--typescript', '使用 TypeScript', true)
  .option('--no-typescript', '使用 JavaScript')
  .action(initCommand)

// 开发模式
program
  .command('dev')
  .description('启动开发模式（热重载 + 交互式测试）')
  .option('-p, --port <port>', '开发服务器端口', '3100')
  .option('-f, --file <file>', '入口文件路径')
  .option('--no-watch', '禁用文件监听')
  .option('--no-interactive', '禁用交互模式')
  .action((opts) => {
    devCommand(opts).catch((error) => {
      console.error('❌ 开发模式启动失败:', error)
      process.exit(1)
    })
  })

// 构建节点
program
  .command('build')
  .description('构建节点项目')
  .option('-w, --watch', '监听文件变化')
  .option('-o, --output <dir>', '输出目录', 'dist')
  .option('--minify', '压缩输出')
  .action(buildCommand)

// 测试节点
program
  .command('test')
  .description('运行节点测试')
  .option('-w, --watch', '监听文件变化')
  .option('-c, --coverage', '生成覆盖率报告')
  .option('-f, --filter <pattern>', '过滤测试文件')
  .action(testCommand)

// 验证节点
program
  .command('validate')
  .description('验证节点定义')
  .option('-f, --file <file>', '节点文件路径')
  .option('--strict', '严格模式')
  .action(validateCommand)

// 发布节点
program
  .command('publish')
  .description('发布节点/插件到 AgentFlow 市场')
  .option('-r, --registry <url>', '市场 API 地址，也可通过环境变量 AGENTFLOW_MARKETPLACE_URL 配置')
  .option('-t, --token <token>', '发布令牌，可通过环境变量 AGENTFLOW_PUBLISH_TOKEN 配置')
  .option('-m, --manifest <path>', '自定义 manifest 路径，默认使用项目根目录的 manifest.json')
  .option('--skip-build', '跳过构建步骤')
  .action((opts) => {
    publishCommand(opts).catch((error) => {
      console.error('❌ 发布过程中发生错误:', error)
      process.exit(1)
    })
  })

// 解析命令
program.parse()
