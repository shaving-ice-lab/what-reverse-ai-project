"use client";

/**
 * 联系我们页面 - Manus 风格
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
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            联系我们
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            有任何问题或建议？我们的团队随时为您提供帮助。
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {method.description}
                </p>
                <span className="text-sm text-primary font-medium">
                  {method.action} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                发送消息
              </h2>

              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    消息已发送！
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    我们会在 1-2 个工作日内回复您
                  </p>
                  <Button
                    variant="outline"
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
                        邮箱 *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      公司名称
                    </label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="您的公司（选填）"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      咨询类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
                    >
                      {inquiryTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      消息内容 *
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="请详细描述您的问题或需求..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
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
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {office.city}
                        </span>
                        {office.type === "总部" && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
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
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-foreground">周一至周五</span>
                    <span className="text-muted-foreground">9:00 - 18:00</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pl-6">
                    节假日可能调整，紧急问题请发邮件
                  </p>
                </div>
              </div>

              {/* Response Time */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-foreground mb-2">
                  响应时间
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 一般咨询：1-2 个工作日</li>
                  <li>• 技术支持：24 小时内</li>
                  <li>• 紧急问题：4 小时内</li>
                </ul>
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
