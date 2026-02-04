declare module "@next/bundle-analyzer" {
  import type { NextConfig } from "next";
  const bundleAnalyzer: (options: { enabled?: boolean }) => (config: NextConfig) => NextConfig;
  export default bundleAnalyzer;
}
