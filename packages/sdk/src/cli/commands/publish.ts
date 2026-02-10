/**
 * publish 命令 - 发布节点/插件到 AgentFlow 市场
 */

import * as fs from 'fs'
import * as path from 'path'
import { spawnSync } from 'child_process'
import { PublisherClient } from '../../plugin/marketplace'
import type { PluginManifest } from '../../plugin/types'
import { validateManifest } from '../../plugin/manifest'

interface PublishOptions {
  registry?: string
  token?: string
  manifest?: string
  skipBuild?: boolean
}

/**
 * 发布节点/插件
 */
export async function publishCommand(options: PublishOptions): Promise<void> {
  console.log('\n🚀 发布节点到 AgentFlow...\n')

  const cwd = process.cwd()
  const manifestPath = options.manifest
    ? path.resolve(cwd, options.manifest)
    : path.join(cwd, 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ 未找到 manifest 文件: ${manifestPath}`)
    process.exit(1)
  }

  // 读取并解析 manifest
  let manifest: PluginManifest
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    manifest = JSON.parse(content) as PluginManifest
  } catch (error) {
    console.error('❌ 解析 manifest 失败:', error)
    process.exit(1)
  }

  // 校验 manifest
  const manifestResult = validateManifest(manifest)
  if (!manifestResult.valid) {
    console.error('❌ Manifest 验证失败:\n')
    manifestResult.errors.forEach((err) => {
      console.error(`   - [${err.code}] ${err.field}: ${err.message}`)
    })
    process.exit(1)
  }

  if (manifestResult.warnings.length > 0) {
    console.warn('⚠️  Manifest 警告:')
    manifestResult.warnings.forEach((warn) => {
      console.warn(`   - [${warn.code}] ${warn.field}: ${warn.message}`)
    })
    console.log('')
  }

  // 构建项目
  if (!options.skipBuild) {
    console.log('🔨 执行构建脚本 (npm run build)...\n')
    const buildResult = spawnSync('npm', ['run', 'build'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    })

    if (buildResult.status !== 0) {
      console.error('❌ 构建失败，已终止发布流程')
      process.exit(buildResult.status ?? 1)
    }
  } else {
    console.log('⏭️  跳过构建步骤\n')
  }

  // 打包
  console.log('📦 打包发布包 (npm pack)...\n')
  const packResult = spawnSync('npm', ['pack', '--json'], {
    cwd,
    encoding: 'utf-8',
    shell: true,
  })

  if (packResult.status !== 0) {
    console.error('❌ 打包失败，已终止发布流程')
    process.exit(packResult.status ?? 1)
  }

  let tarballName: string | undefined
  try {
    const parsed = JSON.parse(packResult.stdout.trim())
    tarballName = parsed?.[0]?.filename || parsed?.[0]
  } catch (error) {
    console.error('❌ 解析 npm pack 输出失败:', error)
    process.exit(1)
  }

  if (!tarballName) {
    console.error('❌ 未找到生成的压缩包名称')
    process.exit(1)
  }

  const tarballPath = path.join(cwd, tarballName)
  if (!fs.existsSync(tarballPath)) {
    console.error(`❌ 压缩包不存在: ${tarballPath}`)
    process.exit(1)
  }

  // 读取发布包
  const tarballBuffer = fs.readFileSync(tarballPath)
  const packageFile = tarballBuffer.buffer.slice(
    tarballBuffer.byteOffset,
    tarballBuffer.byteOffset + tarballBuffer.byteLength
  )

  // 读取附加文件
  const readmePath = path.join(cwd, 'README.md')
  const changelogPath = path.join(cwd, 'CHANGELOG.md')

  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : undefined
  const changelog = fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf-8')
    : undefined

  const registry =
    options.registry ||
    process.env.AGENTFLOW_MARKETPLACE_URL ||
    process.env.AGENTFLOW_PUBLISH_URL ||
    process.env.AGENTFLOW_API_BASE
  const token =
    options.token ||
    process.env.AGENTFLOW_PUBLISH_TOKEN ||
    process.env.AGENTFLOW_API_TOKEN ||
    process.env.AGENTFLOW_TOKEN

  if (!registry) {
    console.error('❌ 未配置发布地址，请使用 --registry 或设置 AGENTFLOW_MARKETPLACE_URL 环境变量')
    cleanupTarball(tarballPath)
    process.exit(1)
  }

  if (!token) {
    console.error('❌ 未提供访问令牌，请使用 --token 或设置 AGENTFLOW_PUBLISH_TOKEN 环境变量')
    cleanupTarball(tarballPath)
    process.exit(1)
  }

  console.log(`🌐 发布目标: ${registry}`)

  const publisher = new PublisherClient({
    baseUrl: registry,
    apiKey: token,
  })

  const result = await publisher.publish({
    manifest,
    packageFile,
    readme,
    changelog,
  })

  cleanupTarball(tarballPath)

  if (!result.success) {
    console.error(`❌ 发布失败: ${result.error || '未知错误'}`)
    if (result.warnings?.length) {
      console.error('⚠️  警告信息:')
      result.warnings.forEach((w) => console.error(`   - ${w}`))
    }
    process.exit(1)
  }

  console.log('✅ 发布成功!')
  if (result.pluginId) {
    console.log(`   插件 ID: ${result.pluginId}`)
  }
  if (result.version) {
    console.log(`   版本: ${result.version}`)
  }
  if (result.warnings?.length) {
    console.warn('⚠️  发布警告:')
    result.warnings.forEach((w) => console.warn(`   - ${w}`))
  }
}

function cleanupTarball(tarballPath: string): void {
  try {
    if (fs.existsSync(tarballPath)) {
      fs.unlinkSync(tarballPath)
    }
  } catch {
    // 忽略清理失败
  }
}
