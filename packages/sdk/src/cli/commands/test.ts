/**
 * test 命令 - 运行节点测试
 */

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

interface TestOptions {
  watch?: boolean;
  coverage?: boolean;
  filter?: string;
}

export async function testCommand(options: TestOptions): Promise<void> {
  console.log("\n🧪 运行节点测试...\n");

  const cwd = process.cwd();

  // 检查是否有 package.json
  const hasPackageJson = fs.existsSync(path.join(cwd, "package.json"));

  if (!hasPackageJson) {
    console.error("❌ 未找到 package.json，请确保在节点项目目录中运行");
    process.exit(1);
  }

  // 构建 vitest 命令参数
  const args = ["vitest"];

  if (!options.watch) {
    args.push("run");
  }

  if (options.coverage) {
    args.push("--coverage");
  }

  if (options.filter) {
    args.push("--filter", options.filter);
  }

  const child = spawn("npx", args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ 测试通过!");
    } else {
      console.error(`\n❌ 测试失败 (exit code: ${code})`);
      process.exit(code || 1);
    }
  });
}
