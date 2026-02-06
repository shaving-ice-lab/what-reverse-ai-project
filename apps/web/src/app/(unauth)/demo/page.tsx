"use client";

/**
 * 演示预约页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  Play,
  Building,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 演示类型
const demoTypes = [
  {
    id: "product",
    name: "产品演示",
    description: "了解 AgentFlow 的核心功能",
    duration: "30 分钟",
  },
  {
    id: "technical",
    name: "技术演示",
    description: "深入探讨 API、集成和技术架构",
    duration: "45 分钟",
  },
  {
    id: "enterprise",
    name: "企业方案",
    description: "了解企业级功能和定制方案",
    duration: "60 分钟",
  },
];

// 公司规模
const companySizes = [
  "1-10 人",
  "11-50 人",
  "51-200 人",
  "201-500 人",
  "500+ 人",
];

// 亮点
const highlights = [
  "免费演示，无任何隐藏费用",
  "专业产品顾问一对一讲解",
  "支持腾讯会议或 Zoom",
  "演示后提供详细资料",
];

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    companySize: "",
    demoType: "product",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <div className="lobe-badge mb-8">
            <Play className="h-3.5 w-3.5" />
            <span>免费产品演示</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            预约演示
          </h1>

          <p className="text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed">
            让我们的产品专家为您展示 AgentFlow 如何帮助您的团队提升效率
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6 bg-gradient-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-center">
                  <CheckCircle className="w-16 h-16 text-brand-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    预约成功！
                  </h2>
                  <p className="text-foreground-lighter mb-6 text-[13px]">
                    我们的团队会在 1 个工作日内与您联系，确认演示时间。
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50">返回首页</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    填写信息
                  </h2>

                  {/* Demo Type */}
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-3">
                      演示类型
                    </label>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {demoTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, demoType: type.id })}
                          className={cn(
                            "p-4 rounded-xl text-left transition-all",
                            "border",
                            formData.demoType === type.id
                              ? "border-foreground/60 bg-surface-200/50"
                              : "border-border/30 bg-surface-100/30 hover:border-border/60"
                          )}
                        >
                          <div className="font-medium text-foreground text-[13px] mb-1">
                            {type.name}
                          </div>
                          <div className="text-[11px] text-foreground-lighter mb-2">
                            {type.description}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-foreground-light">
                            <Clock className="w-3 h-3" />
                            {type.duration}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        姓名 *
                      </label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="您的姓名"
                        className="bg-surface-200/50 border-border/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        工作邮箱 *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="work@company.com"
                        className="bg-surface-200/50 border-border/30"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        手机号码
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="138-xxxx-xxxx"
                        className="bg-surface-200/50 border-border/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-2">
                        公司名称 *
                      </label>
                      <Input
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="您的公司"
                        className="bg-surface-200/50 border-border/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      公司规模
                    </label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px]"
                    >
                      <option value="">请选择</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      您想了解什么？
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="请简单描述您的需求或问题（选填）"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        预约演示
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Highlights */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <h3 className="text-[14px] font-semibold text-foreground mb-4">
                  演示包含
                </h3>
                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px]">
                      <CheckCircle className="w-4 h-4 text-foreground-light mt-0.5 shrink-0" />
                      <span className="text-foreground-lighter">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <h3 className="text-[14px] font-semibold text-foreground mb-4">
                  客户评价
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">98%</div>
                    <div className="text-[12px] text-foreground-lighter">客户满意度</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">500+</div>
                    <div className="text-[12px] text-foreground-lighter">企业客户</div>
                  </div>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <h3 className="text-[14px] font-semibold text-foreground mb-4">
                  快速联系
                </h3>
                <div className="space-y-3 text-[13px]">
                  <a
                    href="mailto:sales@agentflow.ai"
                    className="flex items-center gap-2 text-foreground-lighter hover:text-foreground-light transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    sales@agentflow.ai
                  </a>
                  <a
                    href="tel:400-888-8888"
                    className="flex items-center gap-2 text-foreground-lighter hover:text-foreground-light transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    400-888-8888
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
