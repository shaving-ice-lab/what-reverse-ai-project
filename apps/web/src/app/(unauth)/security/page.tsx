"use client";

/**
 * 安全页面 - Manus 风格
 */

import Link from "next/link";
import {
  Shield,
  Lock,
  Key,
  Server,
  Eye,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Database,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 安全特性
const securityFeatures = [
  {
    icon: Lock,
    title: "数据加密",
    description: "所有数据传输使用 TLS 1.3 加密，敏感数据使用 AES-256 加密存储",
    items: ["传输加密", "存储加密", "密钥管理"],
  },
  {
    icon: Server,
    title: "基础设施安全",
    description: "企业级云基础设施，多区域部署，99.99% 可用性保障",
    items: ["多区域部署", "自动故障转移", "DDoS 防护"],
  },
  {
    icon: Database,
    title: "数据保护",
    description: "完善的数据备份和恢复机制，确保数据安全",
    items: ["自动备份", "灾难恢复", "数据隔离"],
  },
  {
    icon: Eye,
    title: "访问控制",
    description: "细粒度的权限管理，支持 SSO 和多因素认证",
    items: ["角色权限", "SSO 集成", "MFA 认证"],
  },
  {
    icon: FileCheck,
    title: "审计日志",
    description: "完整的操作审计日志，便于合规审查",
    items: ["操作日志", "登录记录", "变更追踪"],
  },
  {
    icon: AlertTriangle,
    title: "威胁检测",
    description: "实时监控和异常检测，快速响应安全事件",
    items: ["实时监控", "异常检测", "安全告警"],
  },
];

// 合规认证
const certifications = [
  { name: "SOC 2 Type II", description: "通过 SOC 2 Type II 安全审计", icon: "🛡️" },
  { name: "ISO 27001", description: "信息安全管理体系认证", icon: "📜" },
  { name: "GDPR", description: "符合欧盟数据保护法规", icon: "🇪🇺" },
  { name: "等保三级", description: "中国网络安全等级保护", icon: "🇨🇳" },
];

// 安全实践
const practices = [
  "定期安全审计和渗透测试",
  "安全开发生命周期 (SDL)",
  "漏洞披露和响应计划",
  "员工安全培训",
  "供应商安全评估",
  "数据访问最小化原则",
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Shield className="h-4 w-4" />
            企业级安全
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            您的数据安全
            <br />
            <span className="text-primary">是我们的首要任务</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            我们采用行业领先的安全措施和合规标准，确保您的数据受到最高级别的保护
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs/security">
              <Button size="lg" className="rounded-full">
                查看安全文档
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact?type=security">
              <Button size="lg" variant="outline" className="rounded-full">
                联系安全团队
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            合规认证
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="p-6 rounded-2xl bg-card border border-border text-center"
              >
                <span className="text-3xl mb-3 block">{cert.icon}</span>
                <h3 className="font-semibold text-foreground mb-1">{cert.name}</h3>
                <p className="text-sm text-muted-foreground">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            安全特性
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practices */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            安全实践
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {practices.map((practice) => (
              <div
                key={practice}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground">{practice}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            发现安全问题？
          </h2>
          <p className="text-muted-foreground mb-6">
            我们重视安全研究人员的贡献，欢迎负责任地报告安全漏洞
          </p>
          <Link href="mailto:security@agentflow.ai">
            <Button size="lg" variant="outline" className="rounded-full">
              报告安全问题
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
