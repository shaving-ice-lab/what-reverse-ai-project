"use client";

/**
 * 设置页面布局 - Supabase 风格双列布局
 * 左侧导航栏 + 右侧内容区域
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Key, 
  Cpu, 
  Settings, 
  Bell, 
  AlertTriangle, 
  Shield,
  Crown,
  CreditCard,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 设置导航配置
const settingsNavSections = [
  {
    title: "账户设置",
    items: [
      {
        label: "通用设置",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        label: "个人资料",
        href: "/dashboard/settings/profile",
        icon: User,
      },
      {
        label: "安全设置",
        href: "/dashboard/settings/security",
        icon: Shield,
      },
      {
        label: "通知设置",
        href: "/dashboard/settings/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "开发者",
    items: [
      {
        label: "API 密钥",
        href: "/dashboard/settings/api-keys",
        icon: Key,
        badge: "3",
      },
      {
        label: "本地 LLM",
        href: "/dashboard/settings/local-llm",
        icon: Cpu,
        badge: "Beta",
        badgeColor: "bg-brand-200 text-brand-500",
      },
    ],
  },
  {
    title: "账单",
    items: [
      {
        label: "订阅计划",
        href: "/dashboard/upgrade",
        icon: CreditCard,
        external: true,
      },
      {
        label: "使用量",
        href: "/dashboard/analytics",
        icon: BarChart3,
        external: true,
      },
    ],
  },
];

// 危险操作
const dangerItem = {
  label: "删除账户",
  href: "/dashboard/settings/delete-account",
  icon: AlertTriangle,
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 精确匹配或路径以 href 开头
  const isActive = (href: string) => {
    if (href === "/dashboard/settings") {
      return pathname === "/dashboard/settings" || pathname === "/dashboard/settings/preferences";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full overflow-hidden bg-background-studio">
      {/* 左侧导航栏 */}
      <aside className="w-[220px] shrink-0 border-r border-border bg-background-studio overflow-y-auto">
        {/* 标题 */}
        <div className="px-4 py-3 border-b border-border bg-surface-200/60">
          <h2 className="text-[12px] font-medium text-foreground">设置</h2>
        </div>

        {/* 导航菜单 */}
        <nav className="p-3 space-y-6">
          {settingsNavSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 py-2 page-caption">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-1.5 rounded-md text-[12px] transition-all group relative",
                        active
                          ? "bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-brand-500"
                          : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className={cn(
                          "w-4 h-4",
                          active ? "text-foreground" : "text-foreground-muted group-hover:text-foreground-light"
                        )} />
                        <span>{item.label}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium rounded",
                            item.badgeColor || "bg-surface-300 text-foreground-muted"
                          )}>
                            {item.badge}
                          </span>
                        )}
                        {item.external && (
                          <ExternalLink className="w-3 h-3 text-foreground-muted" />
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 危险操作 */}
          <div>
            <h3 className="px-3 py-2 page-caption">
              危险区域
            </h3>
            <Link
              href={dangerItem.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] transition-all relative",
                pathname === dangerItem.href
                  ? "bg-destructive-200 text-destructive before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-destructive"
                  : "text-destructive-400 hover:bg-destructive-200/50 hover:text-destructive"
              )}
            >
              <dangerItem.icon className="w-4 h-4" />
              <span>{dangerItem.label}</span>
            </Link>
          </div>
        </nav>

        {/* 底部升级提示 */}
        <div className="p-3 mt-auto border-t border-border">
          <div className="p-3 rounded-lg bg-surface-100 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-foreground">免费版</span>
            </div>
            <p className="text-[11px] text-foreground-muted mb-3">
              升级到专业版解锁更多功能
            </p>
            <Link 
              href="/dashboard/upgrade"
              className="block w-full text-center text-[11px] font-medium py-1.5 rounded-md bg-brand-500 text-background hover:bg-brand-600 transition-colors"
            >
              升级专业版
            </Link>
          </div>
        </div>
      </aside>

      {/* 右侧内容区域 */}
      <main className="flex-1 overflow-auto bg-background-studio">
        {children}
      </main>
    </div>
  );
}
