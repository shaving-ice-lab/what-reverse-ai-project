/**
 * build 命令 - 构建节点项目
 */

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

interface BuildOptions {
  watch?: boolean;
  output: string;
  minify?: boolean;
}

export async function buildCommand(options: BuildOptions): Promise<void> {
  console.log("\n🔨 构建节点项目...\n");

  const cwd = process.cwd();

  // 检查是否有 TypeScript 配置
  const hasTsConfig = fs.existsSync(path.join(cwd, "tsconfig.json"));
  const hasPackageJson = fs.existsSync(path.join(cwd, "package.json"));

  if (!hasPackageJson) {
    console.error("❌ 未找到 package.json，请确保在节点项目目录中运行");
    process.exit(1);
  }

  // 读取 package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));

  // 检查是否有构建脚本
  if (packageJson.scripts?.build) {
    console.log("📦 使用项目构建脚本...\n");

    const args = options.watch ? ["run", "dev"] : ["run", "build"];
    
    const child = spawn("npm", args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ 构建完成!");
      } else {
        console.error(`\n❌ 构建失败 (exit code: ${code})`);
        process.exit(code || 1);
      }
    });

    return;
  }

  // 如果没有构建脚本，使用默认的 tsup
  if (hasTsConfig) {
    console.log("📦 使用 tsup 构建...\n");

    const args = [
      "tsup",
      "src/index.ts",
      "--format", "cjs,esm",
      "--dts",
      "--out-dir", options.output,
    ];

    if (options.watch) {
      args.push("--watch");
    }

    if (options.minify) {
      args.push("--minify");
    }

    const child = spawn("npx", args, {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("\n✅ 构建完成!");
      } else {
        console.error(`\n❌ 构建失败 (exit code: ${code})`);
        process.exit(code || 1);
      }
    });
  } else {
    // JavaScript 项目，直接复制文件
    console.log("📦 复制 JavaScript 文件...\n");

    const srcDir = path.join(cwd, "src");
    const outDir = path.join(cwd, options.output);

    if (!fs.existsSync(srcDir)) {
      console.error("❌ 未找到 src 目录");
      process.exit(1);
    }

    // 创建输出目录
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // 复制文件
    copyDir(srcDir, outDir);

    console.log("✅ 构建完成!");
  }
}

function copyDir(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
