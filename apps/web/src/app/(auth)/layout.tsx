/**
 * 认证页面布局 (登录/注册)
 * Manus 风格：支持亮色/暗色模式，极简居中布局
 */

import { RequireGuest } from "@/components/auth/auth-guard";
import { AuthHeader } from "@/components/layout/auth-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireGuest>
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden transition-colors duration-300">
        {/* 微妙网格背景 */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />
        
        {/* 顶部渐变遮罩 */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-10" />
        
        {/* 底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none z-10" />
        
        {/* 顶部导航栏 */}
        <AuthHeader />
        
        {/* 内容区域 */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center w-full px-6 py-12">
          {children}
        </div>
        
        {/* 底部信息 */}
        <div className="relative z-20 pb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="text-[13px] font-medium">AgentFlow</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground/40">
            <a href="/terms" className="hover:text-muted-foreground/60 transition-colors">服务条款</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-muted-foreground/60 transition-colors">隐私政策</a>
            <span>·</span>
            <span>©2026</span>
          </div>
        </div>
      </div>
    </RequireGuest>
  );
}
