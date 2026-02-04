/**
 * Admin 性能预算配置
 * 
 * 用于 CI/CD 中的性能检查
 * 参考: https://web.dev/performance-budgets/
 */

module.exports = {
  // 资源大小预算（字节）
  resourceBudgets: {
    // JavaScript 预算
    javascript: {
      // 首屏 JS 最大 200KB (gzipped)
      firstParty: 200 * 1024,
      // 第三方 JS 最大 100KB (gzipped)
      thirdParty: 100 * 1024,
      // 总 JS 最大 350KB (gzipped)
      total: 350 * 1024,
    },
    // CSS 预算
    css: {
      // CSS 最大 50KB (gzipped)
      total: 50 * 1024,
    },
    // 图片预算
    images: {
      // 单张图片最大 200KB
      perImage: 200 * 1024,
      // 首屏图片总计最大 500KB
      aboveFold: 500 * 1024,
    },
    // 字体预算
    fonts: {
      // 字体总计最大 100KB
      total: 100 * 1024,
    },
  },

  // 性能指标预算
  metricBudgets: {
    // 首次内容绘制 (FCP) < 1.8s
    firstContentfulPaint: 1800,
    // 最大内容绘制 (LCP) < 2.5s
    largestContentfulPaint: 2500,
    // 首次输入延迟 (FID) < 100ms
    firstInputDelay: 100,
    // 累计布局偏移 (CLS) < 0.1
    cumulativeLayoutShift: 0.1,
    // 交互时间 (TTI) < 3.8s
    timeToInteractive: 3800,
    // 总阻塞时间 (TBT) < 200ms
    totalBlockingTime: 200,
  },

  // 页面级预算
  pageBudgets: {
    // 仪表盘首页
    '/': {
      javascript: 250 * 1024,
      firstContentfulPaint: 1500,
    },
    // 用户列表
    '/users': {
      javascript: 300 * 1024,
      firstContentfulPaint: 1800,
    },
    // 工单详情
    '/support/tickets/[id]': {
      javascript: 320 * 1024,
      firstContentfulPaint: 2000,
    },
  },

  // 构建分析阈值
  buildBudgets: {
    // 页面数量限制
    maxPages: 100,
    // 路由数量限制
    maxRoutes: 150,
    // 构建时间限制 (秒)
    maxBuildTime: 300,
    // 总包大小 (MB)
    maxTotalSize: 10,
  },

  // 警告阈值（达到预算的 80% 时警告）
  warningThreshold: 0.8,

  // 错误阈值（超过预算时报错）
  errorThreshold: 1.0,
};
