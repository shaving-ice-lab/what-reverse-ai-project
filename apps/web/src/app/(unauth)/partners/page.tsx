"use client";

/**
 * 合作伙伴页面 - LobeHub 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  Handshake,
  ArrowRight,
  CheckCircle,
  DollarSign,
  BookOpen,
  HeadphonesIcon,
  Megaphone,
  Target,
  TrendingUp,
  Code,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 合作伙伴类型
const partnerTypes = [
  {
    id: "reseller",
    title: "分销合作伙伴",
    description: "销售 AgentFlow 产品，赚取丰厚佣金",
    icon: DollarSign,
    benefits: ["最高 30% 销售佣金", "专属定价与折扣", "销售支持与培训", "联合营销资源"],
    color: "#4e8fff",
  },
  {
    id: "integration",
    title: "技术集成伙伴",
    description: "将您的产品与 AgentFlow 深度集成",
    icon: Code,
    benefits: ["优先 API 访问", "专属技术支持", "联合产品发布", "集成市场展示"],
    color: "#3B82F6",
  },
  {
    id: "consulting",
    title: "咨询服务伙伴",
    description: "为客户提供 AgentFlow 实施与交付服务",
    icon: Briefcase,
    benefits: ["认证培训计划", "实施项目引荐", "技术文档支持", "合作案例展示"],
    color: "#8B5CF6",
  },
  {
    id: "affiliate",
    title: "联盟推广伙伴",
    description: "推广 AgentFlow，获得推荐奖励",
    icon: Megaphone,
    benefits: ["20% 推荐佣金", "专属推广链接", "营销素材支持", "实时数据追踪"],
    color: "#F59E0B",
  },
];

// 合作伙伴权益
const partnerBenefits = [
  { icon: DollarSign, title: "丰厚收益", description: "竞争力佣金比例与多层次奖励计划" },
  { icon: BookOpen, title: "专业培训", description: "免费的产品培训和认证课程" },
  { icon: HeadphonesIcon, title: "专属支持", description: "专属客户经理和技术支持团队" },
  { icon: Megaphone, title: "联合营销", description: "共同参与市场活动和品牌推广" },
  { icon: Target, title: "商机共享", description: "优质客户线索与项目机会共享" },
  { icon: TrendingUp, title: "共同成长", description: "与 AgentFlow 一起快速成长" },
];

// 现有合作伙伴展示
const featuredPartners = [
  { name: "阿里云", type: "技术合作", logo: "☁️" },
  { name: "腾讯云", type: "技术合作", logo: "🌐" },
  { name: "华为云", type: "技术合作", logo: "📱" },
  { name: "AWS", type: "技术合作", logo: "🔶" },
  { name: "微软 Azure", type: "技术合作", logo: "💠" },
  { name: "Google Cloud", type: "技术合作", logo: "🔵" },
];

// 成功案例数据
const successStats = [
  { value: "500+", label: "合作伙伴" },
  { value: "$10M+", label: "合作伙伴收入" },
  { value: "98%", label: "合作满意度" },
  { value: "50+", label: "国家和地区" },
];

// 常见问题
const faqs = [
  {
    question: "如何成为 AgentFlow 合作伙伴？",
    answer: "填写本页面的申请表单，我们的合作伙伴团队会在 2 个工作日内与您联系，讨论合作细节。",
  },
  {
    question: "合作伙伴需要付费吗？",
    answer: "基础合作伙伴计划免费。我们也提供高级合作伙伴计划，包含更多权益和支持。",
  },
  {
    question: "佣金如何结算？",
    answer: "佣金按月结算，支持银行转账、PayPal 等多种方式。最低起付金额为 $100。",
  },
  {
    question: "需要什么资质？",
    answer: "不同类型的合作伙伴有不同的要求，一般需要有相关行业经验或技术能力。详情请咨询我们的合作伙伴团队。",
  },
];

export default function PartnersPage() {
  const [selectedType, setSelectedType] = useState("reseller");
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-[#4e8fff]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#4e8fff]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">申请已提交！</h1>
            <p className="text-[13px] text-foreground-light mb-8">
              感谢您的申请！我们的合作伙伴团队会在 2 个工作日内与您联系。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="rounded-full border-border/50 text-foreground-light">
                  返回首页
                </Button>
              </Link>
              <Link href="/docs">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  查看文档
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Handshake className="h-4 w-4" />
            合作伙伴计划
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-6">
            与 AgentFlow
            <br />
            <span className="text-[#4e8fff]">共创未来</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-12">
            加入 AgentFlow 合作伙伴生态系统，共同推动 AI 自动化的普及，创造更大的商业价值
          </p>

          {/* Success Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {successStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">选择适合您的合作方式</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              我们提供多种合作伙伴类型，满足不同业务需求
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "p-6 rounded-2xl text-left transition-all duration-300",
                  "bg-surface-100/30 border-2",
                  selectedType === type.id
                    ? "border-[#4e8fff] shadow-lg"
                    : "border-border/30 hover:border-[#4e8fff]/50"
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${type.color}15` }}
                >
                  <type.icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{type.title}</h3>
                <p className="text-[13px] text-foreground-light mb-4">{type.description}</p>
                <ul className="space-y-2">
                  {type.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-[12px] text-foreground-lighter">
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: type.color }} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">合作伙伴权益</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              成为 AgentFlow 合作伙伴，享受全方位的支持和资源
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className={cn(
                  "flex items-start gap-4 p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-[#4e8fff]/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-[#4e8fff]/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-6 h-6 text-[#4e8fff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-[13px] text-foreground-light">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Partners */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">合作伙伴展示</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              与行业领先企业共同构建 AI 自动化生态
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {featuredPartners.map((partner) => (
              <div
                key={partner.name}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-[#4e8fff]/30",
                  "transition-all duration-300"
                )}
              >
                <span className="text-4xl mb-3">{partner.logo}</span>
                <h4 className="font-medium text-foreground text-center">{partner.name}</h4>
                <p className="text-[11px] text-foreground-lighter">{partner.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="p-8 rounded-2xl bg-surface-100/30 border border-border/30">
                <h2 className="text-[15px] font-bold text-foreground mb-2">申请成为合作伙伴</h2>
                <p className="text-[13px] text-foreground-light mb-6">填写以下信息，我们会尽快与您联系</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName" className="text-foreground text-[12px]">
                        公司名称 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="您的公司名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactName" className="text-foreground text-[12px]">
                        联系人 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange("contactName", e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="您的姓名"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-foreground text-[12px]">
                        邮箱 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="work@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-foreground text-[12px]">电话</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="联系电话"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-foreground text-[12px]">公司网站</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      className="mt-2 bg-background border-border/30 rounded-xl"
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground text-[12px] mb-3 block">
                      合作类型 <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {partnerTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={cn(
                            "p-3 rounded-xl text-left text-[12px] transition-all border",
                            selectedType === type.id
                              ? "bg-[#4e8fff]/10 border-[#4e8fff]"
                              : "bg-background border-border/30 hover:border-[#4e8fff]/50"
                          )}
                        >
                          <span className="font-medium text-foreground">{type.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-foreground text-[12px]">补充说明</Label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={4}
                      className={cn(
                        "w-full mt-2 px-4 py-3 rounded-xl",
                        "bg-background border border-border/30 text-foreground text-[13px]",
                        "focus:outline-none focus:ring-2 focus:ring-[#4e8fff]/20 focus:border-[#4e8fff]/50",
                        "placeholder:text-foreground-lighter resize-none"
                      )}
                      placeholder="请简要介绍您的公司和合作意向（可选）"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.companyName || !formData.contactName || !formData.email}
                    className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                        提交中...
                      </>
                    ) : (
                      <>
                        提交申请
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* FAQ */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-6">常见问题</h3>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="p-4 rounded-2xl bg-surface-100/30 border border-border/30"
                  >
                    <h4 className="font-medium text-foreground mb-2">{faq.question}</h4>
                    <p className="text-[13px] text-foreground-light">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-[#4e8fff]/10 border border-[#4e8fff]/20">
                <h4 className="font-medium text-foreground mb-2">需要更多帮助？</h4>
                <p className="text-[13px] text-foreground-light mb-3">联系我们的合作伙伴团队</p>
                <a
                  href="mailto:partners@agentflow.ai"
                  className="text-[13px] text-[#4e8fff] hover:underline"
                >
                  partners@agentflow.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
