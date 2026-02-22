import type { NextConfig } from 'next'

// Detect if building for Tauri desktop app
const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined

// Tauri module noop stub mappings for Web mode (using relative paths)
const tauriNoopAliases: Record<string, string> = !isTauriBuild
  ? {
      '@tauri-apps/api/core': './src/lib/tauri/noop-core.ts',
      '@tauri-apps/api/event': './src/lib/tauri/noop-event.ts',
      '@tauri-apps/plugin-os': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-dialog': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-fs': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-notification': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-shell': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-http': './src/lib/tauri/noop-plugin.ts',
      '@tauri-apps/plugin-store': './src/lib/tauri/noop-plugin.ts',
    }
  : {}

const nextConfig: NextConfig = {
  // Ignore ESLint errors during build (for testing, production should fix all errors)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Tauri desktop app requires static export
  ...(isTauriBuild && {
    output: 'export',
    // Disable image optimization for static export
    images: {
      unoptimized: true,
    },
    // Static export does not support trailing slash
    trailingSlash: false,
  }),

  // Turbopack config - map Tauri modules to noop stubs in Web mode
  turbopack: {
    resolveAlias: tauriNoopAliases,
  },

  // Enable experimental features
  experimental: {
    // React compiler optimization (optional)
    // reactCompiler: true,
  },

  // Image domain whitelist (Web mode)
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

  // Redirect rules (Web mode only)
  async redirects() {
    // Static export does not support redirects
    if (isTauriBuild) return []

    return []
  },

  // Rewrite rules — proxy storage file serving to backend
  async rewrites() {
    if (isTauriBuild) return []

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'
    const backendBase = apiUrl.replace(/\/api\/v1\/?$/, '')

    return [
      {
        source: '/storage/files/:objectId',
        destination: `${backendBase}/storage/files/:objectId`,
      },
    ]
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_IS_TAURI: isTauriBuild ? 'true' : 'false',
  },
}

export default nextConfig
