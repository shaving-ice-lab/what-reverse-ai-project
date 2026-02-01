/**
 * Vitest 性能测试配置
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 仅运行性能测试
    include: ['src/test/performance/**/*.perf.test.ts'],
    
    // 全局设置
    globals: true,
    
    // 测试环境
    environment: 'node',
    
    // 超时设置（性能测试可能需要更长时间）
    testTimeout: 60000,
    
    // 禁用并行运行以获得更稳定的性能数据
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    // 性能测试专用报告
    reporters: ['verbose'],
    
    // 输出配置
    outputFile: {
      json: 'test-results/performance.json',
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
