/**
 * init 命令 - 初始化节点项目
 */

import * as fs from "fs";
import * as path from "path";

interface InitOptions {
  template: string;
  directory?: string;
  typescript: boolean;
}

export async function initCommand(name: string | undefined, options: InitOptions): Promise<void> {
  const projectName = name || "my-agentflow-node";
  const targetDir = options.directory || projectName;
  const useTypeScript = options.typescript;

  console.log(`\n🚀 初始化 AgentFlow 节点项目: ${projectName}\n`);

  // 检查目录是否存在
  if (fs.existsSync(targetDir)) {
    console.error(`❌ 目录 "${targetDir}" 已存在`);
    process.exit(1);
  }

  // 创建项目目录
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "test"), { recursive: true });

  // 创建 package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "AgentFlow 自定义节点",
    main: useTypeScript ? "dist/index.js" : "src/index.js",
    types: useTypeScript ? "dist/index.d.ts" : undefined,
    scripts: {
      build: useTypeScript ? "tsup src/index.ts --format cjs,esm --dts" : "echo 'No build needed'",
      dev: useTypeScript ? "tsup src/index.ts --format cjs,esm --dts --watch" : "echo 'No build needed'",
      test: "vitest run",
      "test:watch": "vitest",
      validate: "agentflow validate",
    },
    keywords: ["agentflow", "node", "workflow"],
    peerDependencies: {
      "@agentflow/sdk": "^0.1.0",
    },
    devDependencies: {
      "@agentflow/sdk": "^0.1.0",
      vitest: "^1.0.0",
      ...(useTypeScript ? {
        typescript: "^5.3.0",
        tsup: "^8.0.0",
        "@types/node": "^20.0.0",
      } : {}),
    },
  };

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // 创建 TypeScript 配置
  if (useTypeScript) {
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2022"],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: "dist",
        rootDir: "src",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    fs.writeFileSync(
      path.join(targetDir, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  // 创建节点文件
  const ext = useTypeScript ? "ts" : "js";
  const nodeTemplate = useTypeScript ? getTypeScriptNodeTemplate(projectName) : getJavaScriptNodeTemplate(projectName);
  fs.writeFileSync(path.join(targetDir, "src", `index.${ext}`), nodeTemplate);

  // 创建测试文件
  const testTemplate = useTypeScript ? getTypeScriptTestTemplate() : getJavaScriptTestTemplate();
  fs.writeFileSync(path.join(targetDir, "test", `index.test.${ext}`), testTemplate);

  // 创建 README
  fs.writeFileSync(path.join(targetDir, "README.md"), getReadmeTemplate(projectName));

  // 创建 .gitignore
  fs.writeFileSync(path.join(targetDir, ".gitignore"), getGitignoreTemplate());

  console.log("✅ 项目创建成功!\n");
  console.log("下一步:");
  console.log(`  cd ${targetDir}`);
  console.log("  npm install");
  console.log("  npm run dev\n");
}

function getTypeScriptNodeTemplate(name: string): string {
  const nodeName = name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const nodeId = name.toLowerCase().replace(/\s+/g, "-");

  return `/**
 * ${nodeName} 节点
 */

import { defineNode, input, output } from "@agentflow/sdk";

export default defineNode({
  id: "${nodeId}",
  name: "${nodeName}",
  description: "这是一个自定义节点",
  icon: "puzzle",
  category: "custom",
  version: "1.0.0",
  author: "Your Name",
  tags: ["custom"],

  inputs: {
    text: input.string("输入文本")
      .required()
      .placeholder("请输入文本")
      .description("需要处理的文本内容")
      .build(),

    uppercase: input.boolean("转大写")
      .default(false)
      .description("是否将文本转换为大写")
      .build(),
  },

  outputs: {
    result: output.string("处理结果")
      .description("处理后的文本")
      .build(),

    length: output.number("文本长度")
      .description("处理后文本的字符数")
      .build(),
  },

  async execute(ctx) {
    const { text, uppercase } = ctx.inputs;

    ctx.log.info("开始处理文本", { textLength: text.length });
    ctx.reportProgress(50, "处理中...");

    let result = text;
    if (uppercase) {
      result = text.toUpperCase();
    }

    ctx.reportProgress(100, "完成");
    ctx.log.info("处理完成", { resultLength: result.length });

    return {
      result,
      length: result.length,
    };
  },
});
`;
}

function getJavaScriptNodeTemplate(name: string): string {
  const nodeName = name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const nodeId = name.toLowerCase().replace(/\s+/g, "-");

  return `/**
 * ${nodeName} 节点
 */

const { defineNode, input, output } = require("@agentflow/sdk");

module.exports = defineNode({
  id: "${nodeId}",
  name: "${nodeName}",
  description: "这是一个自定义节点",
  icon: "puzzle",
  category: "custom",
  version: "1.0.0",
  author: "Your Name",
  tags: ["custom"],

  inputs: {
    text: input.string("输入文本")
      .required()
      .placeholder("请输入文本")
      .description("需要处理的文本内容")
      .build(),

    uppercase: input.boolean("转大写")
      .default(false)
      .description("是否将文本转换为大写")
      .build(),
  },

  outputs: {
    result: output.string("处理结果")
      .description("处理后的文本")
      .build(),

    length: output.number("文本长度")
      .description("处理后文本的字符数")
      .build(),
  },

  async execute(ctx) {
    const { text, uppercase } = ctx.inputs;

    ctx.log.info("开始处理文本", { textLength: text.length });
    ctx.reportProgress(50, "处理中...");

    let result = text;
    if (uppercase) {
      result = text.toUpperCase();
    }

    ctx.reportProgress(100, "完成");
    ctx.log.info("处理完成", { resultLength: result.length });

    return {
      result,
      length: result.length,
    };
  },
});
`;
}

function getTypeScriptTestTemplate(): string {
  return `/**
 * 节点测试
 */

import { describe, it, expect } from "vitest";
import { createNodeTester, assert } from "@agentflow/sdk";
import node from "../src/index";

describe("自定义节点", () => {
  const tester = createNodeTester(node);

  it("应该正确处理文本", async () => {
    const result = await tester.execute({
      text: "Hello World",
      uppercase: false,
    });

    assert.success(result);
    expect(result.output.result).toBe("Hello World");
    expect(result.output.length).toBe(11);
  });

  it("应该正确转换为大写", async () => {
    const result = await tester.execute({
      text: "Hello World",
      uppercase: true,
    });

    assert.success(result);
    expect(result.output.result).toBe("HELLO WORLD");
  });

  it("应该验证必填字段", async () => {
    const result = await tester.execute({
      text: "",
      uppercase: false,
    });

    // 空字符串应该通过（因为不是 null/undefined）
    assert.success(result);
  });

  it("应该记录日志", async () => {
    const result = await tester.execute({
      text: "test",
      uppercase: false,
    });

    assert.success(result);
    assert.hasLog(result, "info", "开始处理文本");
    assert.hasLog(result, "info", "处理完成");
  });

  it("应该报告进度", async () => {
    const result = await tester.execute({
      text: "test",
      uppercase: false,
    });

    assert.success(result);
    expect(result.progressReports.length).toBeGreaterThan(0);
  });
});
`;
}

function getJavaScriptTestTemplate(): string {
  return `/**
 * 节点测试
 */

const { describe, it, expect } = require("vitest");
const { createNodeTester, assert } = require("@agentflow/sdk");
const node = require("../src/index");

describe("自定义节点", () => {
  const tester = createNodeTester(node);

  it("应该正确处理文本", async () => {
    const result = await tester.execute({
      text: "Hello World",
      uppercase: false,
    });

    assert.success(result);
    expect(result.output.result).toBe("Hello World");
    expect(result.output.length).toBe(11);
  });

  it("应该正确转换为大写", async () => {
    const result = await tester.execute({
      text: "Hello World",
      uppercase: true,
    });

    assert.success(result);
    expect(result.output.result).toBe("HELLO WORLD");
  });
});
`;
}

function getReadmeTemplate(name: string): string {
  return `# ${name}

AgentFlow 自定义节点

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

## 使用

在 AgentFlow 中导入此节点即可使用。

## 许可证

MIT
`;
}

function getGitignoreTemplate(): string {
  return `node_modules/
dist/
.DS_Store
*.log
coverage/
`;
}
