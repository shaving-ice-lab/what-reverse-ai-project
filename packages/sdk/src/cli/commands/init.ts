/**
 * init 命令 - 初始化节点项目
 *
 * 支持从预设模板创建项目
 */

import * as fs from 'fs'
import * as path from 'path'

// 可用模板列表
const AVAILABLE_TEMPLATES = ['basic', 'http-request', 'llm', 'transform', 'plugin'] as const
type TemplateName = (typeof AVAILABLE_TEMPLATES)[number]

const TEMPLATE_DESCRIPTIONS: Record<TemplateName, string> = {
  basic: '基础节点模板 - 最小可运行节点',
  'http-request': 'HTTP 请求模板 - API 集成场景',
  llm: 'LLM 调用模板 - 大语言模型集成',
  transform: '数据转换模板 - JSON 数据处理',
  plugin: '插件模板 - 包含多个节点的插件项目',
}

interface InitOptions {
  template: string
  directory?: string
  typescript: boolean
  author?: string
}

export async function initCommand(name: string | undefined, options: InitOptions): Promise<void> {
  const projectName = name || 'my-reverseai-node'
  const targetDir = options.directory || projectName
  const templateName = (options.template || 'basic') as TemplateName
  const author = options.author || 'Your Name'

  // 验证模板名称
  if (!AVAILABLE_TEMPLATES.includes(templateName)) {
    console.error(`\n❌ 未知模板: ${templateName}`)
    console.log('\n可用模板:')
    for (const t of AVAILABLE_TEMPLATES) {
      console.log(`  - ${t}: ${TEMPLATE_DESCRIPTIONS[t]}`)
    }
    process.exit(1)
  }

  console.log(`\n🚀 初始化 ReverseAI 项目: ${projectName}`)
  console.log(`📦 使用模板: ${templateName} - ${TEMPLATE_DESCRIPTIONS[templateName]}\n`)

  // 检查目录是否存在
  if (fs.existsSync(targetDir)) {
    console.error(`❌ 目录 "${targetDir}" 已存在`)
    process.exit(1)
  }

  // 获取模板目录路径
  const templateDir = path.join(__dirname, '..', 'templates', templateName)

  // 检查是否使用文件模板（如果模板目录存在）
  if (fs.existsSync(templateDir)) {
    await copyTemplateFiles(templateDir, targetDir, {
      projectName,
      nodeId: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      nodeName: projectName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      author,
    })
  } else {
    // 回退到内置模板生成
    await generateFromBuiltinTemplate(
      targetDir,
      projectName,
      templateName,
      options.typescript,
      author
    )
  }

  console.log('✅ 项目创建成功!\n')
  console.log('下一步:')
  console.log(`  cd ${targetDir}`)
  console.log('  npm install')
  console.log('  npm run dev\n')
  console.log('更多命令:')
  console.log('  npm test          # 运行测试')
  console.log('  npm run validate  # 验证节点定义')
  console.log('  npm run build     # 构建项目')
  console.log('  reverseai publish # 发布到市场\n')
}

interface TemplateVars {
  projectName: string
  nodeId: string
  nodeName: string
  author: string
}

async function copyTemplateFiles(
  templateDir: string,
  targetDir: string,
  vars: TemplateVars
): Promise<void> {
  // 创建目标目录
  fs.mkdirSync(targetDir, { recursive: true })

  // 递归复制模板文件
  await copyDir(templateDir, targetDir, vars)

  // 处理 .template 后缀的文件
  renameTemplateFiles(targetDir)

  // 创建额外的配置文件
  createConfigFiles(targetDir, vars)
}

async function copyDir(src: string, dest: string, vars: TemplateVars): Promise<void> {
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      await copyDir(srcPath, destPath, vars)
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8')
      content = replaceTemplateVars(content, vars)
      fs.writeFileSync(destPath, content)
    }
  }
}

function replaceTemplateVars(content: string, vars: TemplateVars): string {
  return content
    .replace(/\{\{projectName\}\}/g, vars.projectName)
    .replace(/\{\{nodeId\}\}/g, vars.nodeId)
    .replace(/\{\{nodeName\}\}/g, vars.nodeName)
    .replace(/\{\{author\}\}/g, vars.author)
}

function renameTemplateFiles(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      renameTemplateFiles(fullPath)
    } else if (entry.name.endsWith('.template')) {
      const newPath = fullPath.replace(/\.template$/, '')
      fs.renameSync(fullPath, newPath)
    }
  }
}

function createConfigFiles(targetDir: string, vars: TemplateVars): void {
  // 创建 tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2022'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: 'dist',
      rootDir: 'src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  }

  fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

  // 创建 .gitignore
  fs.writeFileSync(
    path.join(targetDir, '.gitignore'),
    `node_modules/
dist/
.DS_Store
*.log
coverage/
.env
.env.local
`
  )

  // 创建测试目录和基础测试文件
  const testDir = path.join(targetDir, 'test')
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }

  const testContent = `/**
 * ${vars.projectName} 测试
 */

import { describe, it, expect } from "vitest";
import { createNodeTester, assert } from "@reverseai/sdk";
import node from "../src/index";

describe("${vars.nodeName}", () => {
  const tester = createNodeTester(node);

  it("应该正常执行", async () => {
    // TODO: 根据节点输入配置测试
    const result = await tester.execute({
      // 添加测试输入
    });

    // assert.success(result);
    expect(result).toBeDefined();
  });

  it("应该验证必填字段", async () => {
    // TODO: 添加验证测试
    expect(true).toBe(true);
  });
});
`

  fs.writeFileSync(path.join(testDir, 'index.test.ts'), testContent)
}

// 回退：使用内置模板生成（保持向后兼容）
async function generateFromBuiltinTemplate(
  targetDir: string,
  projectName: string,
  templateName: TemplateName,
  useTypeScript: boolean,
  author: string
): Promise<void> {
  // 创建项目目录
  fs.mkdirSync(targetDir, { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true })
  fs.mkdirSync(path.join(targetDir, 'test'), { recursive: true })

  // 创建 package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `ReverseAI 自定义节点 - ${templateName} 模板`,
    main: useTypeScript ? 'dist/index.js' : 'src/index.js',
    types: useTypeScript ? 'dist/index.d.ts' : undefined,
    scripts: {
      build: useTypeScript ? 'tsup src/index.ts --format cjs,esm --dts' : "echo 'No build needed'",
      dev: useTypeScript
        ? 'tsup src/index.ts --format cjs,esm --dts --watch'
        : "echo 'No build needed'",
      test: 'vitest run',
      'test:watch': 'vitest',
      validate: 'reverseai validate',
    },
    keywords: ['reverseai', 'node', templateName],
    author,
    peerDependencies: {
      '@reverseai/sdk': '^0.1.0',
    },
    devDependencies: {
      '@reverseai/sdk': '^0.1.0',
      vitest: '^1.0.0',
      ...(useTypeScript
        ? {
            typescript: '^5.3.0',
            tsup: '^8.0.0',
            '@types/node': '^20.0.0',
          }
        : {}),
    },
  }

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  // 创建 TypeScript 配置
  if (useTypeScript) {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: 'dist',
        rootDir: 'src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    }

    fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))
  }

  // 创建节点文件
  const ext = useTypeScript ? 'ts' : 'js'
  const nodeTemplate = getNodeTemplateByType(projectName, templateName, useTypeScript, author)
  fs.writeFileSync(path.join(targetDir, 'src', `index.${ext}`), nodeTemplate)

  // 创建测试文件
  const testTemplate = getTestTemplate(useTypeScript)
  fs.writeFileSync(path.join(targetDir, 'test', `index.test.${ext}`), testTemplate)

  // 创建 README
  fs.writeFileSync(path.join(targetDir, 'README.md'), getReadmeTemplate(projectName, templateName))

  // 创建 .gitignore
  fs.writeFileSync(path.join(targetDir, '.gitignore'), getGitignoreTemplate())
}

function getNodeTemplateByType(
  name: string,
  templateType: TemplateName,
  useTypeScript: boolean,
  author: string
): string {
  const nodeName = name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const nodeId = name.toLowerCase().replace(/\s+/g, '-')

  // 基础模板（默认）
  const importStatement = useTypeScript
    ? `import { defineNode, input, output } from "@reverseai/sdk";`
    : `const { defineNode, input, output } = require("@reverseai/sdk");`

  const exportStatement = useTypeScript ? 'export default' : 'module.exports ='

  return `/**
 * ${nodeName} 节点
 * 模板类型: ${templateType}
 */

${importStatement}

${exportStatement} defineNode({
  id: "${nodeId}",
  name: "${nodeName}",
  description: "这是一个自定义节点",
  icon: "puzzle",
  category: "custom",
  version: "1.0.0",
  author: "${author}",
  tags: ["custom", "${templateType}"],

  inputs: {
    text: input.string("输入文本")
      .required()
      .placeholder("请输入文本")
      .description("需要处理的文本内容")
      .build(),
  },

  outputs: {
    result: output.string("处理结果")
      .description("处理后的文本")
      .build(),
  },

  async execute(ctx) {
    const { text } = ctx.inputs;

    ctx.log.info("开始处理", { inputLength: text.length });
    ctx.reportProgress(50, "处理中...");

    const result = text;

    ctx.reportProgress(100, "完成");
    ctx.log.info("处理完成");

    return { result };
  },
});
`
}

function getTestTemplate(useTypeScript: boolean): string {
  if (useTypeScript) {
    return `/**
 * 节点测试
 */

import { describe, it, expect } from "vitest";
import { createNodeTester, assert } from "@reverseai/sdk";
import node from "../src/index";

describe("自定义节点", () => {
  const tester = createNodeTester(node);

  it("应该正确执行", async () => {
    const result = await tester.execute({
      text: "Hello World",
    });

    assert.success(result);
    expect(result.output.result).toBeDefined();
  });
});
`
  }

  return `/**
 * 节点测试
 */

const { describe, it, expect } = require("vitest");
const { createNodeTester, assert } = require("@reverseai/sdk");
const node = require("../src/index");

describe("自定义节点", () => {
  const tester = createNodeTester(node);

  it("应该正确执行", async () => {
    const result = await tester.execute({
      text: "Hello World",
    });

    assert.success(result);
    expect(result.output.result).toBeDefined();
  });
});
`
}

function getReadmeTemplate(name: string, templateType: TemplateName): string {
  return `# ${name}

ReverseAI 自定义节点 - ${TEMPLATE_DESCRIPTIONS[templateType]}

## 安装

\`\`\`bash
npm install
\`\`\`

## 开发

\`\`\`bash
# 开发模式（监听文件变化）
npm run dev

# 运行测试
npm test

# 验证节点定义
npm run validate
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

## 发布

\`\`\`bash
reverseai publish
\`\`\`

## 许可证

MIT
`
}

function getGitignoreTemplate(): string {
  return `node_modules/
dist/
.DS_Store
*.log
coverage/
.env
.env.local
`
}

// 导出模板列表供其他命令使用
export { AVAILABLE_TEMPLATES, TEMPLATE_DESCRIPTIONS }
