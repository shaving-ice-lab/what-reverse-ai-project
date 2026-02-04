"use client";

/**
 * 应用市场页面 - Manus 风格
 * - 公开路由：/store
 * - 已登录用户：自动进入 /dashboard/store（统一 Dashboard 布局）
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketplaceStoreContent } from "@/components/store/marketplace-store-content";
import { useAuthStore } from "@/stores/useAuthStore";

export default function StorePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (isAuthenticated) {
      router.replace("/dashboard/store");
    }
  }, [isAuthenticated, isInitialized, isLoading, router]);

  if (isInitialized && !isLoading && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <MarketplaceStoreContent variant="public" />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
