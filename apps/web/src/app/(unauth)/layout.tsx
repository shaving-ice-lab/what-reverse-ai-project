"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  Code2,
  CreditCard,
  FileText,
  Gift,
  Handshake,
  HelpCircle,
  Home,
  LifeBuoy,
  Mail,
  Newspaper,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navSections = [
  {
    title: "起步",
    items: [
      { label: "首页", href: "/", icon: Home },
      { label: "功能", href: "/features", icon: Sparkles },
      { label: "用例", href: "/use-cases", icon: Target },
      { label: "模板库", href: "/templates", icon: BookOpen },
    ],
  },
  {
    title: "产品",
    items: [
      { label: "应用商店", href: "/store", icon: ShoppingCart },
      { label: "定价", href: "/pricing", icon: CreditCard },
      { label: "企业版", href: "/enterprise", icon: Building2 },
      { label: "产品路线", href: "/roadmap", icon: Target },
    ],
  },
  {
    title: "资源",
    items: [
      { label: "文档中心", href: "/docs", icon: FileText },
      { label: "开发者", href: "/developers", icon: Code2 },
      { label: "博客", href: "/blog", icon: Newspaper },
      { label: "活动与直播", href: "/events", icon: Calendar },
      { label: "案例研究", href: "/case-studies", icon: Award },
      { label: "展示廊", href: "/showcase", icon: Sparkles },
    ],
  },
  {
    title: "社区与信任",
    items: [
      { label: "社区", href: "/community", icon: Users },
      { label: "合作伙伴", href: "/partners", icon: Handshake },
      { label: "推荐计划", href: "/referral-program", icon: Gift },
      { label: "安全中心", href: "/security", icon: ShieldCheck },
    ],
  },
  {
    title: "支持",
    items: [
      { label: "帮助中心", href: "/help", icon: LifeBuoy },
      { label: "FAQ", href: "/faq", icon: HelpCircle },
      { label: "支持与工单", href: "/support", icon: LifeBuoy },
      { label: "隐私政策", href: "/privacy", icon: Shield },
      { label: "服务条款", href: "/terms", icon: FileText },
      { label: "联系我们", href: "/contact", icon: Mail },
    ],
  },
];

export default function UnauthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/runtime")) {
    return <>{children}</>;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-studio text-foreground">
      <aside className="relative hidden w-[232px] shrink-0 border-r border-border bg-background-alternative/90 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-border to-transparent" />
        <div className="relative flex h-full w-full flex-col gap-6 px-4 py-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/90 text-background shadow-lg shadow-brand-500/20 transition-transform duration-200 group-hover:-translate-y-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">AgentFlow</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-foreground-muted">
                Public Atlas
              </p>
            </div>
          </Link>

          <div className="rounded-lg border border-border bg-surface-100/70 px-3 py-2 text-[11px] text-foreground-light">
            以仪表盘的秩序感重塑公开页面，清晰并带有节奏。
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground-muted">
                  {section.title}
                </p>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors",
                          active
                            ? "bg-surface-100/80 text-foreground"
                            : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 text-foreground-muted group-hover:text-foreground" />
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href="/login">
                登录
                <span className="text-[10px] text-foreground-muted">已有账号</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="w-full justify-between">
              <Link href="/register">
                开始使用
                <span className="text-[10px] text-background-studio/80">免费试用</span>
              </Link>
            </Button>
            <Link
              href="/dashboard"
              className="block rounded-md border border-border px-2.5 py-2 text-[11px] text-foreground-light transition-colors hover:border-border-strong hover:text-foreground"
            >
              进入控制台
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="dashboard-shell" data-layout="standard">
          <div className="dashboard-content">
            <div className="dashboard-page">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
