"use client";

/**
 * 故障自助指南 - LobeHub 风格
 */

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  FileText,
  Shield,
  Wrench,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

const quickChecks = [
  "确认当前账号是否拥有对应 Workspace 权限",
  "检查 API Key 或连接器凭证是否过期/被吊销",
  "查看执行日志是否存在超时或限流提示",
  "核对触发器与 Webhook 配置是否被禁用",
];

const troubleshootingSections = [
  {
    icon: Wrench,
    title: "工作流执行失败",
    description: "节点执行异常、输入不完整或权限不足导致的失败",
    steps: [
      "在执行记录中查看失败节点与错误信息",
      "确认输入参数是否缺失或格式不正确",
      "检查目标应用的访问策略与配额",
      "必要时降低并发或开启重试",
    ],
  },
  {
    icon: CloudOff,
    title: "Webhook 没有触发",
    description: "第三方事件未能触发或回调失败",
    steps: [
      "检查 Webhook URL 是否可公网访问",
      "确认回调签名密钥与事件类型",
      "查看日志是否被防火墙或限流拦截",
      "尝试用测试事件重新触发",
    ],
  },
  {
    icon: Shield,
    title: "权限与安全阻塞",
    description: "成员角色或安全策略导致操作受限",
    steps: [
      "确认成员是否为 owner/admin 角色",
      "检查 Workspace 的访问策略与安全设置",
      "验证 OAuth/SSO 配置是否失效",
      "如涉及敏感数据，请准备审计日志",
    ],
  },
  {
    icon: AlertTriangle,
    title: "运行时限流与失败",
    description: "请求过量或运行时异常导致不可用",
    steps: [
      "查看访问统计与限流事件",
      "检查是否达到计划配额阈值",
      "适当放宽 rate_limit 或升级套餐",
      "必要时切换备用模型或地区",
    ],
  },
];

const nextActions = [
  {
    title: "FAQ 常见问题",
    description: "高频问题快速解答",
    href: "/faq",
  },
  {
    title: "帮助中心目录",
    description: "按主题浏览完整文档",
    href: "/help",
  },
  {
    title: "提交工单",
    description: "获取支持团队帮助",
    href: "/support",
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <Wrench className="h-3.5 w-3.5" />
            <span>故障排查</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            故障自助指南
          </h1>
          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            按步骤快速定位问题，缩短恢复时间。
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
            <Input
              placeholder="搜索故障关键字..."
              className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
            />
          </div>
        </div>
      </section>

      {/* Quick Checks */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
            <h2 className="text-[15px] font-semibold text-foreground">快速自检清单</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {quickChecks.map((item) => (
              <div
                key={item}
                className={cn(
                  "p-4 rounded-2xl",
                  "bg-surface-100/30 border border-border/30"
                )}
              >
                <div className="flex items-start gap-2 text-[13px] text-foreground-lighter">
                  <span className="mt-0.5 text-brand-500">•</span>
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshooting Sections */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-5xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>常见场景排查</h2>
            <p>按场景快速定位和解决问题</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {troubleshootingSections.map((section) => (
              <div
                key={section.title}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-foreground-light" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">{section.title}</h3>
                    <p className="text-[12px] text-foreground-lighter">{section.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-[13px] text-foreground-lighter">
                  {section.steps.map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500/60 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Actions */}
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-brand-500" />
            <h2 className="text-[15px] font-semibold text-foreground">下一步行动</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nextActions.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "p-5 rounded-2xl group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-foreground-lighter">{item.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/support">
              <Button className="h-10 px-6 rounded-full text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90">
                提交工单
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="h-10 px-6 rounded-full text-[13px] border-border/50 hover:bg-surface-200/50">
                返回帮助中心
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
