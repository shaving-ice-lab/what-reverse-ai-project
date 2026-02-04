"use client";

/**
 * 全局异常页 - 500/运行时错误
 * Manus 风格：极简、大留白、优雅动效
 * 提供重试、返回首页与联系支持入口
 */

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Home,
  ArrowLeft,
  Copy,
  Check,
  Bug,
  Server,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 快速链接 - Manus 风格
const quickLinks = [
  { name: "首页", href: "/", icon: Home },
  { name: "状态", href: "/status", icon: Server },
  { name: "帮助", href: "/help", icon: HelpCircle },
];

// 恢复建议
const recoverySuggestions = [
  { icon: RefreshCw, text: "刷新页面重试当前操作" },
  { icon: Wifi, text: "检查网络连接是否正常" },
  { icon: Server, text: "稍后再试，服务可能暂时繁忙" },
];

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // 日志记录错误
    console.error("Global error:", error);
  }, [error]);

  const handleCopyError = async () => {
    const errorInfo = `Error: ${error.message || "Unknown error"}\nDigest: ${error.digest || "N/A"}\nTime: ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(errorInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败静默处理
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <SiteHeader />

      {/* Manus 风格背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/20)]" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] opacity-[0.15]"
          style={{
            background:
              "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Main Content - Manus 风格 */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* 500 数字 - 极简风格 */}
          <div
            className={cn(
              "mb-8",
              "transition-all duration-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="text-[140px] sm:text-[180px] font-black leading-none text-destructive/10 select-none">
              500
            </div>
          </div>

          {/* 图标 */}
          <div
            className={cn(
              "w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6",
              "transition-all duration-700 delay-75",
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>

          {/* 标题 */}
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-bold text-foreground mb-4",
              "transition-all duration-700 delay-100",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Something went wrong
          </h1>

          {/* 描述 */}
          <p
            className={cn(
              "text-muted-foreground mb-10",
              "transition-all duration-700 delay-200",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            抱歉，页面遇到了意外错误。我们已记录此问题，请尝试刷新页面或稍后再试。
          </p>

          {/* 主要操作 - Manus 风格按钮 */}
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-3 justify-center mb-10",
              "transition-all duration-700 delay-300",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Button
              onClick={reset}
              className="h-11 px-6 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full"
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              重试
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                className="h-11 px-6 rounded-full border-border hover:border-foreground/20"
              >
                <Home className="mr-2 w-4 h-4" />
                返回首页
              </Button>
            </Link>
            <Button
              variant="outline"
              className="h-11 px-6 rounded-full border-border hover:border-foreground/20"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              返回上一页
            </Button>
          </div>

          {/* 错误摘要（如果有） */}
          {error.digest && (
            <div
              className={cn(
                "mb-8 p-4 rounded-xl bg-muted/50 border border-border",
                "transition-all duration-700 delay-350",
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-left min-w-0">
                  <Bug className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    错误代码: {error.digest}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={handleCopyError}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* 恢复建议 */}
          <div
            className={cn(
              "mb-8 p-5 rounded-2xl bg-card border border-border text-left",
              "transition-all duration-700 delay-400",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">
              您可以尝试
            </h3>
            <ul className="space-y-2">
              {recoverySuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <suggestion.icon className="w-4 h-4 text-destructive/70 shrink-0" />
                  <span>{suggestion.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 快速链接 - Manus 风格 */}
          <div
            className={cn(
              "pt-8 border-t border-border",
              "transition-all duration-700 delay-450",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-sm text-muted-foreground mb-6">
              或访问以下页面
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full",
                      "bg-card border border-border",
                      "hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5",
                      "transition-all duration-200 group"
                    )}
                  >
                    <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    <span className="text-sm font-medium text-foreground">
                      {link.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 帮助提示 - Manus 风格 */}
          <div
            className={cn(
              "mt-12 p-6 rounded-2xl bg-card border border-border",
              "transition-all duration-700 delay-500",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">
                  问题仍未解决？
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  如果问题持续出现，请联系我们的支持团队，附上错误代码以便快速定位问题
                </p>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-8 px-4 border-border hover:border-destructive/30"
                  >
                    联系支持
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
