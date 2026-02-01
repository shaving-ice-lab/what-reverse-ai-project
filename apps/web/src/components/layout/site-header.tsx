"use client";

/**
 * SiteHeader - 公共页面头部导航组件
 * 
 * Manus 风格设计，统一所有公共页面的导航样式
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggleSimple } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

// 导航配置
const navItems = [
  { label: "功能", href: "/features" },
  { label: "模板", href: "/store" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
  { label: "博客", href: "/blog" },
];

// 更多链接
const moreLinks = [
  { label: "案例研究", href: "/case-studies" },
  { label: "更新日志", href: "/changelog" },
  { label: "招聘", href: "/careers" },
  { label: "系统状态", href: "/status" },
  { label: "关于我们", href: "/about" },
  { label: "联系我们", href: "/contact" },
];

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // 点击外部关闭更多菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50",
      "bg-background/80 backdrop-blur-xl",
      "border-b border-border/40",
      className
    )}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-primary text-primary-foreground",
              "shadow-lg shadow-primary/20",
              "transition-all duration-300",
              "group-hover:shadow-primary/40 group-hover:scale-105"
            )}>
              <Workflow className="h-[18px] w-[18px]" />
            </div>
            <span className="text-lg font-semibold text-foreground">AgentFlow</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "px-4 py-2 text-sm rounded-lg transition-colors",
                  isActive(item.href)
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1",
                  moreMenuOpen || moreLinks.some(l => isActive(l.href))
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                更多
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  moreMenuOpen && "rotate-180"
                )} />
              </button>
              
              {moreMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 py-2 rounded-xl bg-card border border-border shadow-lg z-50">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreMenuOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors",
                        isActive(link.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggleSimple />
            
            <Link 
              href="/login" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              登录
            </Link>
            
            <Link href="/register" className="hidden sm:block">
              <Button className={cn(
                "h-9 px-4",
                "bg-primary",
                "hover:bg-primary/90",
                "text-primary-foreground text-sm font-medium rounded-lg",
                "shadow-lg shadow-primary/20 hover:shadow-primary/30",
                "transition-all"
              )}>
                开始使用
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
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
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="px-6 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-3 text-sm rounded-lg transition-colors",
                  isActive(item.href)
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {/* More Links */}
            <div className="pt-3 mt-3 border-t border-border/40">
              <p className="px-4 py-2 text-xs text-muted-foreground font-medium">更多</p>
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 text-sm rounded-lg transition-colors",
                    isActive(link.href)
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="pt-4 mt-4 border-t border-border/40 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  登录
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className={cn(
                  "w-full",
                  "bg-primary",
                  "hover:bg-primary/90",
                  "text-primary-foreground"
                )}>
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
