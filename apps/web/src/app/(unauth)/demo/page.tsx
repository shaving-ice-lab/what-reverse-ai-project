"use client";

/**
 * 演示预约页面 - Manus 风格
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
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Play className="h-4 w-4" />
            免费产品演示
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            预约演示
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            让我们的产品专家为您展示 AgentFlow 如何帮助您的团队提升效率
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                  <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    预约成功！
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    我们的团队会在 1 个工作日内与您联系，确认演示时间。
                  </p>
                  <Link href="/">
                    <Button variant="outline">返回首页</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    填写信息
                  </h2>

                  {/* Demo Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
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
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/30"
                          )}
                        >
                          <div className="font-medium text-foreground text-sm mb-1">
                            {type.name}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {type.description}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-primary">
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
                        手机号码
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="138-xxxx-xxxx"
                      />
                    </div>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      公司规模
                    </label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
                    >
                      <option value="">请选择</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      您想了解什么？
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="请简单描述您的需求或问题（选填）"
                      rows={3}
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
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">
                  演示包含
                </h3>
                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats */}
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-4">
                  客户评价
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">98%</div>
                    <div className="text-sm text-muted-foreground">客户满意度</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">企业客户</div>
                  </div>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">
                  快速联系
                </h3>
                <div className="space-y-3 text-sm">
                  <a
                    href="mailto:sales@agentflow.ai"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    sales@agentflow.ai
                  </a>
                  <a
                    href="tel:400-888-8888"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
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

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
