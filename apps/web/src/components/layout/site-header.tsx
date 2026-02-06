"use client";

/**
 * SiteHeader - LobeHub 风格公共页面头部导航
 * 玻璃拟态、简约、现代
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Workflow,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Target,
  BookOpen,
  ShoppingCart,
  CreditCard,
  Building2,
  FileText,
  Code2,
  Newspaper,
  Calendar,
  Award,
  Users,
  Handshake,
  Gift,
  LifeBuoy,
  HelpCircle,
  Shield,
  Mail,
  Github,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggleSimple } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

// ===== 主导航 =====
const mainNavItems = [
  { label: "功能", href: "/features" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
];

// ===== 下拉菜单分组 =====
const dropdownMenus = [
  {
    label: "产品",
    items: [
      { label: "功能介绍", href: "/features", icon: Sparkles, desc: "探索完整功能列表" },
      { label: "用例", href: "/use-cases", icon: Target, desc: "查看行业应用场景" },
      { label: "模板库", href: "/templates", icon: BookOpen, desc: "浏览工作流模板" },
      { label: "应用商店", href: "/store", icon: ShoppingCart, desc: "发现更多集成" },
      { label: "定价", href: "/pricing", icon: CreditCard, desc: "查看方案和价格" },
      { label: "企业版", href: "/enterprise", icon: Building2, desc: "企业级解决方案" },
    ],
  },
  {
    label: "资源",
    items: [
      { label: "文档中心", href: "/docs", icon: FileText, desc: "快速入门指南" },
      { label: "开发者", href: "/developers", icon: Code2, desc: "API 和 SDK" },
      { label: "博客", href: "/blog", icon: Newspaper, desc: "最新动态和教程" },
      { label: "活动与直播", href: "/events", icon: Calendar, desc: "线上线下活动" },
      { label: "案例研究", href: "/case-studies", icon: Award, desc: "客户成功故事" },
      { label: "学习课程", href: "/learn/courses", icon: BookOpen, desc: "系统学习教程" },
    ],
  },
  {
    label: "社区",
    items: [
      { label: "社区", href: "/community", icon: Users, desc: "加入开发者社区" },
      { label: "合作伙伴", href: "/partners", icon: Handshake, desc: "合作伙伴计划" },
      { label: "推荐计划", href: "/referral-program", icon: Gift, desc: "推荐奖励" },
      { label: "支持与工单", href: "/support", icon: LifeBuoy, desc: "获取技术支持" },
      { label: "帮助中心", href: "/help", icon: HelpCircle, desc: "常见问题解答" },
      { label: "联系我们", href: "/contact", icon: Mail, desc: "联系销售团队" },
    ],
  },
];

// ===== 移动端完整菜单 =====
const mobileMenuSections = [
  {
    title: "产品",
    items: [
      { label: "功能", href: "/features" },
      { label: "用例", href: "/use-cases" },
      { label: "模板库", href: "/templates" },
      { label: "应用商店", href: "/store" },
      { label: "定价", href: "/pricing" },
      { label: "企业版", href: "/enterprise" },
    ],
  },
  {
    title: "资源",
    items: [
      { label: "文档中心", href: "/docs" },
      { label: "开发者", href: "/developers" },
      { label: "博客", href: "/blog" },
      { label: "活动与直播", href: "/events" },
      { label: "案例研究", href: "/case-studies" },
      { label: "学习课程", href: "/learn/courses" },
    ],
  },
  {
    title: "社区与支持",
    items: [
      { label: "社区", href: "/community" },
      { label: "合作伙伴", href: "/partners" },
      { label: "推荐计划", href: "/referral-program" },
      { label: "支持与工单", href: "/support" },
      { label: "帮助中心", href: "/help" },
      { label: "联系我们", href: "/contact" },
    ],
  },
];

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isDropdownActive = (items: { href: string }[]) =>
    items.some((item) => isActive(item.href));

  // 滚动检测
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 点击外部关闭下拉菜单
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    },
    [openDropdown]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // 路由变化时关闭菜单
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-2xl saturate-150 border-b border-border/40"
          : "bg-transparent",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-xl",
                "bg-foreground text-background",
                "transition-all duration-300",
                "group-hover:scale-105"
              )}
            >
              <Workflow className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              AgentFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* 主链接 */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-foreground-light hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* 分类下拉菜单 */}
            {dropdownMenus.map((menu) => (
              <div
                key={menu.label}
                className="relative"
                ref={(el) => {
                  dropdownRefs.current[menu.label] = el;
                }}
              >
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === menu.label ? null : menu.label
                    )
                  }
                  className={cn(
                    "px-3 py-1.5 text-[13px] rounded-lg transition-all duration-200 flex items-center gap-1",
                    openDropdown === menu.label ||
                      isDropdownActive(menu.items)
                      ? "text-foreground"
                      : "text-foreground-light hover:text-foreground"
                  )}
                >
                  {menu.label}
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      openDropdown === menu.label && "rotate-180"
                    )}
                  />
                </button>

                {openDropdown === menu.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 py-2 rounded-2xl bg-surface-100/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/40 z-50">
                    {menu.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 transition-all duration-200 mx-1 rounded-xl",
                            isActive(item.href)
                              ? "text-foreground bg-surface-200/80"
                              : "text-foreground-light hover:text-foreground hover:bg-surface-200/50"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-surface-300/50 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{item.label}</div>
                            <div className="text-[11px] text-foreground-lighter mt-0.5">{item.desc}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggleSimple />

            {/* GitHub Star */}
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px]",
                "text-foreground-light hover:text-foreground transition-all duration-200"
              )}
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">Star</span>
            </a>

            <Link
              href="/login"
              className="text-[13px] text-foreground-light hover:text-foreground transition-all duration-200 hidden sm:block px-3 py-1.5"
            >
              登录
            </Link>

            <Link href="/register" className="hidden sm:block">
              <Button
                className={cn(
                  "h-8 px-5",
                  "bg-foreground",
                  "hover:bg-foreground/90",
                  "text-background text-[13px] font-medium rounded-full",
                  "transition-all duration-200"
                )}
              >
                开始使用
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-foreground-light hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-2xl border-t border-border/30 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-6 py-6 space-y-2">
            {mobileMenuSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 py-2 text-[11px] text-foreground-lighter font-medium uppercase tracking-widest">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2.5 text-[14px] rounded-xl transition-all duration-200",
                      isActive(item.href)
                        ? "text-foreground bg-surface-200/50"
                        : "text-foreground-light hover:text-foreground hover:bg-surface-100/50"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 border-t border-border/20" />
              </div>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full rounded-full h-10 border-border/50 text-foreground">
                  登录
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  className={cn(
                    "w-full rounded-full h-10",
                    "bg-foreground",
                    "hover:bg-foreground/90",
                    "text-background font-medium"
                  )}
                >
                  开始使用
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
