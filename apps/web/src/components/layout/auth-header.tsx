"use client";

/**
 * AuthHeader - 认证页面头部导航组件
 * 
 * 精简版导航，包含 Logo 和主题切换按钮
 */

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggleSimple } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface AuthHeaderProps {
  className?: string;
}

export function AuthHeader({ className }: AuthHeaderProps) {
  return (
    <header className={cn(
      "relative z-50 w-full",
      className
    )}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg",
              "bg-foreground text-background",
              "transition-all duration-200",
              "group-hover:scale-105"
            )}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold text-foreground">AgentFlow</span>
          </Link>
          
          {/* 主题切换按钮 */}
          <ThemeToggleSimple />
        </div>
      </div>
    </header>
  );
}

export default AuthHeader;
