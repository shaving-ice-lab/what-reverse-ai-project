"use client";

/**
 * 企业版页面 - Manus 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Building,
  Zap,
  Lock,
  Headphones,
  BarChart3,
  Globe,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 企业特性
const features = [
  {
    icon: Shield,
    title: "企业级安全",
    description: "SOC 2 Type II 认证，端到端加密，完善的审计日志",
    highlights: ["SOC 2 认证", "数据加密", "审计日志"],
  },
  {
    icon: Globe,
    title: "私有化部署",
    description: "支持私有云和混合云部署，数据完全掌控",
    highlights: ["私有云", "混合云", "数据本地化"],
  },
  {
    icon: Lock,
    title: "高级权限管理",
    description: "细粒度的权限控制，支持 SSO 和 SCIM",
    highlights: ["SSO 登录", "SCIM 同步", "角色权限"],
  },
  {
    icon: Headphones,
    title: "专属支持",
    description: "专属客户成功经理，7x24 技术支持",
    highlights: ["专属客户经理", "优先响应", "培训服务"],
  },
  {
    icon: Zap,
    title: "无限扩展",
    description: "无限工作流、无限执行次数、无限团队成员",
    highlights: ["无限工作流", "无限执行", "无限成员"],
  },
  {
    icon: BarChart3,
    title: "高级分析",
    description: "详细的使用报告和业务洞察",
    highlights: ["使用报告", "性能分析", "业务洞察"],
  },
];

// 客户案例
const caseStudies = [
  {
    company: "某大型电商平台",
    industry: "电商",
    result: "客服效率提升 300%",
    quote: "AgentFlow 帮助我们将客服响应时间从 30 分钟缩短到 2 分钟。",
  },
  {
    company: "某知名金融机构",
    industry: "金融",
    result: "风控响应提升 10 倍",
    quote: "自动化的风控流程让我们能够实时响应市场变化。",
  },
  {
    company: "某制造企业",
    industry: "制造",
    result: "供应链效率提升 150%",
    quote: "通过工作流自动化，我们大幅降低了运营成本。",
  },
];

// 对比表
const comparison = [
  { feature: "工作流数量", standard: "50 个", enterprise: "无限" },
  { feature: "团队成员", standard: "10 人", enterprise: "无限" },
  { feature: "执行次数", standard: "10 万次/月", enterprise: "无限" },
  { feature: "私有化部署", standard: "否", enterprise: "是" },
  { feature: "SSO 登录", standard: "否", enterprise: "是" },
  { feature: "专属支持", standard: "否", enterprise: "是" },
  { feature: "SLA 保障", standard: "99.9%", enterprise: "99.99%" },
];

export default function EnterprisePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Building className="h-4 w-4" />
            企业级解决方案
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            为企业打造的
            <br />
            <span className="text-primary">自动化平台</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            获得企业级安全、私有化部署、专属支持和无限扩展能力
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#contact">
              <Button size="lg" className="rounded-full">
                联系销售
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="rounded-full">
                预约演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            企业级功能
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
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
                  {feature.highlights.map((item) => (
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

      {/* Comparison */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            企业版 vs 标准版
          </h2>
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-border bg-muted/50">
              <div className="font-medium text-foreground">功能</div>
              <div className="font-medium text-foreground text-center">标准版</div>
              <div className="font-medium text-primary text-center">企业版</div>
            </div>
            {comparison.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 gap-4 p-4 border-b border-border last:border-0"
              >
                <div className="text-foreground">{row.feature}</div>
                <div className="text-muted-foreground text-center">{row.standard}</div>
                <div className="text-primary font-medium text-center">{row.enterprise}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            客户案例
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study) => (
              <div
                key={study.company}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="text-sm text-primary font-medium mb-2">
                  {study.industry}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {study.company}
                </h3>
                <div className="text-2xl font-bold text-primary mb-4">
                  {study.result}
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{study.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-16 px-6 bg-muted/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-4">
            联系企业销售团队
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            填写表单，我们会在 1 个工作日内与您联系
          </p>

          {isSubmitted ? (
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                提交成功！
              </h3>
              <p className="text-muted-foreground">
                我们的销售团队会尽快与您联系
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    姓名 *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    工作邮箱 *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="work@company.com"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    公司名称 *
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="您的公司"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    联系电话
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="138-xxxx-xxxx"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  需求描述
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="请简单描述您的需求"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground resize-none"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交咨询"
                )}
              </Button>
            </form>
          )}
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
