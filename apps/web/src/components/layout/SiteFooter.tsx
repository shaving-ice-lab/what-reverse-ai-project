"use client";

/**
 * SiteFooter - 公共页面页脚
 * Manus 风格：简约、专业
 */

import Link from "next/link";
import { cn } from "@/lib/utils";

// Footer 链接分组
const footerSections = [
  {
    title: "产品",
    links: [
      { label: "功能特性", href: "/features" },
      { label: "定价方案", href: "/pricing" },
      { label: "企业版", href: "/enterprise" },
      { label: "集成", href: "/integrations" },
      { label: "更新日志", href: "/changelog" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "文档中心", href: "/docs" },
      { label: "开发者", href: "/developers" },
      { label: "博客", href: "/blog" },
      { label: "帮助中心", href: "/help" },
      { label: "社区", href: "/community" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "招聘", href: "/careers" },
      { label: "媒体中心", href: "/press" },
      { label: "合作伙伴", href: "/partners" },
      { label: "联系我们", href: "/contact" },
    ],
  },
  {
    title: "法律",
    links: [
      { label: "服务条款", href: "/terms" },
      { label: "隐私政策", href: "/privacy" },
      { label: "安全中心", href: "/security" },
      { label: "品牌资源", href: "/brand" },
    ],
  },
];

// 社交媒体链接
const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/agentflow",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    href: "https://twitter.com/agentflow",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Discord",
    href: "https://discord.gg/agentflow",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@agentflow",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

// 简化链接（用于 minimal 变体）
const minimalLinks = [
  { label: "文档", href: "/docs" },
  { label: "博客", href: "/blog" },
  { label: "状态", href: "/status" },
  { label: "条款", href: "/terms" },
  { label: "隐私", href: "/privacy" },
  { label: "联系", href: "/contact" },
];

interface SiteFooterProps {
  className?: string;
  variant?: "default" | "minimal";
}

export function SiteFooter({ className, variant = "default" }: SiteFooterProps) {
  if (variant === "minimal") {
    return (
      <footer className={cn("border-t border-border bg-background py-8", className)}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-sm text-foreground-light">
              © {new Date().getFullYear()} AgentFlow. All rights reserved.
            </div>
            <nav className="flex flex-wrap justify-center gap-6">
              {minimalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-foreground-light hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t border-border bg-background", className)}>
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AF</span>
              </div>
              <span className="font-semibold text-foreground">AgentFlow</span>
            </Link>
            <p className="text-sm text-foreground-light mb-6 max-w-xs">
              下一代 AI 工作流自动化平台，让每个人都能构建智能应用。
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-light hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-foreground-light">
            © {new Date().getFullYear()} AgentFlow Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/status"
              className="text-sm text-foreground-light hover:text-foreground transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              系统正常
            </Link>
            <span className="text-foreground-light/30">|</span>
            <span className="text-sm text-foreground-light">
              🌐 简体中文
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
