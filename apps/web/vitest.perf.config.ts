/**
 * Vitest PerformanceTestConfiguration
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // OnlyRunPerformanceTest
    include: ['src/test/performance/**/*.perf.test.ts'],

    // globalSettings
    globals: true,

    // Testenvironment
    environment: 'node',

    // TimeoutSettings(PerformanceTestcancanneedneedmorelongTime)
    testTimeout: 60000,

    // DisableParallelRunwithgetgetmorestablePerformanceData
    fileParallelism: false,

    // PerformanceTestdedicatedusereport
    reporters: ['verbose'],

    // OutputConfiguration
    outputFile: {
      json: 'test-results/performance.json',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
