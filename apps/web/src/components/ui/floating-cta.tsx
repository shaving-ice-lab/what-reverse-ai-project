"use client";

/**
 * FloatingCTA - 浮动快速操作按钮
 * 
 * 悬浮在页面右下角，提供快速咨询入口
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  X,
  HelpCircle,
  FileText,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Sparkles,
    label: "免费试用",
    description: "立即开始使用",
    href: "/register",
    color: "bg-primary text-primary-foreground",
  },
  {
    icon: HelpCircle,
    label: "帮助中心",
    description: "查看常见问题",
    href: "/docs",
    color: "bg-blue-500 text-white",
  },
  {
    icon: FileText,
    label: "产品演示",
    description: "预约产品演示",
    href: "/contact?type=demo",
    color: "bg-purple-500 text-white",
  },
  {
    icon: Mail,
    label: "联系我们",
    description: "获取更多帮助",
    href: "/contact",
    color: "bg-orange-500 text-white",
  },
];

export function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 滚动超过 300px 后显示浮动按钮
      if (window.scrollY > 300) {
        setHasScrolled(true);
        setIsVisible(true);
      } else {
        setHasScrolled(false);
        // 如果菜单打开状态，保持可见
        if (!isOpen) {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // 始终在首页显示，但初始位置靠下
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3",
        "transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      )}
    >
      {/* 展开的快捷操作菜单 */}
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {quickActions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl",
              "bg-card/95 backdrop-blur-xl border border-border",
              "shadow-lg shadow-black/10",
              "hover:border-primary/30 hover:shadow-xl",
              "transition-all duration-200 group"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: isOpen ? "slideInRight 200ms ease-out both" : "none",
            }}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                action.color
              )}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* 主按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/30",
          "hover:shadow-xl hover:shadow-primary/40 hover:scale-105",
          "transition-all duration-300",
          isOpen && "rotate-180 bg-card text-foreground border border-border shadow-black/10"
        )}
        aria-label={isOpen ? "关闭快捷菜单" : "打开快捷菜单"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        
        {/* 脉冲动画效果 */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
        )}
      </button>

      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingCTA;
