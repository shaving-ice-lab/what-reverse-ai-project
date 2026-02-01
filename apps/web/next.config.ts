import type { NextConfig } from "next";

// 检测是否为 Tauri 桌面应用构建
const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig: NextConfig = {
  // 构建时忽略 ESLint 错误（用于测试，生产环境应该修复所有错误）
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 构建时忽略 TypeScript 错误
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Tauri 桌面应用需要静态导出
  ...(isTauriBuild && {
    output: 'export',
    // 静态导出时禁用图片优化
    images: {
      unoptimized: true,
    },
    // 静态导出不支持 trailing slash
    trailingSlash: false,
  }),
  
  // 启用实验性功能
  experimental: {
    // React 编译器优化 (可选)
    // reactCompiler: true,
  },
  
  // 图片域名白名单 (Web 模式)
  ...(!isTauriBuild && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
        },
        {
          protocol: 'https',
          hostname: '*.cloudflare.com',
        },
      ],
    },
  }),
  
  // 重定向规则 (仅 Web 模式)
  async redirects() {
    // 静态导出不支持重定向
    if (isTauriBuild) return [];
    
    return [];
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_IS_TAURI: isTauriBuild ? 'true' : 'false',
  },
};

export default nextConfig;
