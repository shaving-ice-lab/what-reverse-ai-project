#!/usr/bin/env node
/**
 * Bundle 分析与性能预算检查脚本
 * 
 * 用法:
 *   pnpm build:analyze   # 生成分析报告
 *   node scripts/analyze-bundle.mjs  # 检查性能预算
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, '..', '.next');
const CONFIG_PATH = path.join(__dirname, '..', 'performance.config.js');

// ANSI 颜色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getPercentage(value, budget) {
  return ((value / budget) * 100).toFixed(1);
}

function getStatusColor(percentage) {
  if (percentage >= 100) return colors.red;
  if (percentage >= 80) return colors.yellow;
  return colors.green;
}

async function loadConfig() {
  try {
    const config = await import(CONFIG_PATH);
    return config.default;
  } catch {
    console.warn(`${colors.yellow}警告: 未找到性能配置文件，使用默认值${colors.reset}`);
    return {
      resourceBudgets: {
        javascript: { total: 350 * 1024 },
        css: { total: 50 * 1024 },
      },
      warningThreshold: 0.8,
      errorThreshold: 1.0,
    };
  }
}

function getBuildManifest() {
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('构建清单不存在。请先运行 pnpm build');
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function getStaticDir() {
  const staticDir = path.join(BUILD_DIR, 'static');
  if (!fs.existsSync(staticDir)) {
    throw new Error('静态目录不存在。请先运行 pnpm build');
  }
  return staticDir;
}

function calculateChunkSizes(staticDir) {
  const chunks = {
    js: { firstParty: 0, thirdParty: 0, total: 0 },
    css: { total: 0 },
  };

  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (stat.isFile()) {
        const size = stat.size;
        
        if (file.endsWith('.js')) {
          chunks.js.total += size;
          // 简单区分第一方和第三方（基于文件路径）
          if (filePath.includes('node_modules') || filePath.includes('_vendor')) {
            chunks.js.thirdParty += size;
          } else {
            chunks.js.firstParty += size;
          }
        } else if (file.endsWith('.css')) {
          chunks.css.total += size;
        }
      }
    }
  };

  walkDir(staticDir);
  return chunks;
}

function printHeader(title) {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + '  ' + title + colors.reset);
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

function printBudgetCheck(name, value, budget, unit = '') {
  const percentage = getPercentage(value, budget);
  const color = getStatusColor(percentage);
  const status = percentage >= 100 ? '❌' : percentage >= 80 ? '⚠️' : '✅';
  
  console.log(
    `  ${status} ${name.padEnd(25)} ` +
    `${color}${formatBytes(value).padStart(10)}${colors.reset} / ` +
    `${formatBytes(budget)} (${percentage}%)`
  );
}

function printSummary(results) {
  printHeader('分析摘要');
  
  const failed = results.filter(r => r.percentage >= 100);
  const warnings = results.filter(r => r.percentage >= 80 && r.percentage < 100);
  const passed = results.filter(r => r.percentage < 80);
  
  console.log(`  ${colors.green}✅ 通过: ${passed.length}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️ 警告: ${warnings.length}${colors.reset}`);
  console.log(`  ${colors.red}❌ 失败: ${failed.length}${colors.reset}`);
  
  if (failed.length > 0) {
    console.log('\n' + colors.red + '超出预算的项目:' + colors.reset);
    failed.forEach(r => {
      console.log(`  - ${r.name}: ${formatBytes(r.value)} (预算: ${formatBytes(r.budget)})`);
    });
  }
  
  return failed.length === 0;
}

async function main() {
  console.log(colors.blue + '\n🔍 Admin Bundle 分析工具\n' + colors.reset);
  
  try {
    const config = await loadConfig();
    const staticDir = getStaticDir();
    const chunks = calculateChunkSizes(staticDir);
    const results = [];
    
    // JavaScript 检查
    printHeader('JavaScript Bundle 分析');
    
    if (config.resourceBudgets?.javascript) {
      const jsBudgets = config.resourceBudgets.javascript;
      
      if (jsBudgets.total) {
        printBudgetCheck('JS 总大小', chunks.js.total, jsBudgets.total);
        results.push({
          name: 'JS 总大小',
          value: chunks.js.total,
          budget: jsBudgets.total,
          percentage: getPercentage(chunks.js.total, jsBudgets.total),
        });
      }
      
      if (jsBudgets.firstParty) {
        printBudgetCheck('第一方 JS', chunks.js.firstParty, jsBudgets.firstParty);
        results.push({
          name: '第一方 JS',
          value: chunks.js.firstParty,
          budget: jsBudgets.firstParty,
          percentage: getPercentage(chunks.js.firstParty, jsBudgets.firstParty),
        });
      }
      
      if (jsBudgets.thirdParty) {
        printBudgetCheck('第三方 JS', chunks.js.thirdParty, jsBudgets.thirdParty);
        results.push({
          name: '第三方 JS',
          value: chunks.js.thirdParty,
          budget: jsBudgets.thirdParty,
          percentage: getPercentage(chunks.js.thirdParty, jsBudgets.thirdParty),
        });
      }
    }
    
    // CSS 检查
    printHeader('CSS Bundle 分析');
    
    if (config.resourceBudgets?.css?.total) {
      printBudgetCheck('CSS 总大小', chunks.css.total, config.resourceBudgets.css.total);
      results.push({
        name: 'CSS 总大小',
        value: chunks.css.total,
        budget: config.resourceBudgets.css.total,
        percentage: getPercentage(chunks.css.total, config.resourceBudgets.css.total),
      });
    }
    
    // 总结
    const success = printSummary(results);
    
    console.log('\n' + colors.cyan + '─'.repeat(60) + colors.reset);
    console.log(colors.blue + '💡 提示:' + colors.reset);
    console.log('  - 运行 ANALYZE=true pnpm build 生成详细报告');
    console.log('  - 分析报告位于 .next/analyze/');
    console.log(colors.cyan + '─'.repeat(60) + colors.reset + '\n');
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error(colors.red + '错误: ' + error.message + colors.reset);
    process.exit(1);
  }
}

main();
