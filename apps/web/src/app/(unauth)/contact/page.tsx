"use client";

/**
 * 联系我们页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  Building,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 联系方式
const contactMethods = [
  {
    icon: Mail,
    title: "发送邮件",
    description: "support@agentflow.ai",
    action: "发送邮件",
    href: "mailto:support@agentflow.ai",
  },
  {
    icon: MessageSquare,
    title: "在线客服",
    description: "工作时间 9:00-18:00",
    action: "开始对话",
    href: "#chat",
  },
  {
    icon: Phone,
    title: "电话咨询",
    description: "400-888-8888",
    action: "拨打电话",
    href: "tel:400-888-8888",
  },
];

// 办公室地址
const offices = [
  {
    city: "北京",
    address: "海淀区中关村科技园 xxx 号",
    type: "总部",
  },
  {
    city: "上海",
    address: "浦东新区张江高科技园区 xxx 号",
    type: "分部",
  },
];

// 咨询类型
const inquiryTypes = [
  { id: "general", label: "一般咨询" },
  { id: "sales", label: "销售咨询" },
  { id: "support", label: "技术支持" },
  { id: "partnership", label: "商务合作" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    type: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 模拟提交
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
            <Mail className="h-3.5 w-3.5" />
            <span>Contact Us</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            联系我们
          </h1>
          <p className="text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed">
            有任何问题或建议？我们的团队随时为您提供帮助。
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300 group"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <method.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-[12px] text-foreground-lighter mb-3">
                  {method.description}
                </p>
                <span className="text-[13px] text-brand-500 font-medium">
                  {method.action} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                发送消息
              </h2>

              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-center">
                  <CheckCircle className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    消息已发送！
                  </h3>
                  <p className="text-foreground-lighter mb-4 text-[13px]">
                    我们会在 1-2 个工作日内回复您
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full border-border/50 hover:bg-surface-200/50"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        type: "general",
                        message: "",
                      });
                    }}
                  >
                    发送另一条消息
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        邮箱 *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="bg-surface-200/50 border-border/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      公司名称
                    </label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="您的公司（选填）"
                      className="bg-surface-200/50 border-border/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      咨询类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px]"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      消息内容 *
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="请详细描述您的问题或需求..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        发送消息
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="space-y-8">
              {/* Offices */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  办公地址
                </h3>
                <div className="space-y-4">
                  {offices.map((office) => (
                    <div
                      key={office.city}
                      className="p-4 rounded-xl bg-surface-100/30 border border-border/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-surface-200/80 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-foreground-light" />
                        </div>
                        <span className="font-semibold text-foreground text-[14px]">
                          {office.city}
                        </span>
                        {office.type === "总部" && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-200/80 text-foreground-lighter text-[10px] font-medium">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-foreground-lighter pl-9">
                        {office.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  工作时间
                </h3>
                <div className="p-4 rounded-xl bg-surface-100/30 border border-border/30">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Clock className="w-4 h-4 text-foreground-light" />
                    <span className="text-foreground">周一至周五</span>
                    <span className="text-foreground-lighter">9:00 - 18:00</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-2 pl-6">
                    节假日可能调整，紧急问题请发邮件
                  </p>
                </div>
              </div>

              {/* Response Time */}
              <div className="p-4 rounded-xl bg-surface-100/30 border border-border/30">
                <h4 className="font-medium text-foreground mb-2 text-[14px]">
                  响应时间
                </h4>
                <ul className="text-[13px] text-foreground-lighter space-y-1">
                  <li>• 一般咨询：1-2 个工作日</li>
                  <li>• 技术支持：24 小时内</li>
                  <li>• 紧急问题：4 小时内</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
