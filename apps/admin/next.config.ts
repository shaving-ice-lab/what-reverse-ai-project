import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 性能优化：按需导入优化
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "recharts",
      "date-fns",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
    ],
  },
  // Webpack 配置：性能预算
  webpack: (config, { isServer }) => {
    // 仅在客户端构建时添加性能提示
    if (!isServer) {
      config.performance = {
        hints: process.env.NODE_ENV === "production" ? "warning" : false,
        // 性能预算：入口点最大 500KB
        maxEntrypointSize: 512000,
        // 性能预算：单个资源最大 300KB
        maxAssetSize: 307200,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
