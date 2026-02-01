"use client";

/**
 * 合作伙伴页面 - 展示合作伙伴计划和现有合作伙伴 * 

 * Manus 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  Handshake,

  ArrowRight,

  CheckCircle,

  Users,

  DollarSign,

  Zap,

  Globe,

  Award,

  Building2,

  BookOpen,

  HeadphonesIcon,

  Megaphone,

  Target,

  TrendingUp,

  Gift,

  Star,

  Shield,

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

    description: "销?AgentFlow 产品，赚取丰厚佣?", icon: DollarSign,

    benefits: [

      "最?30% 销售佣?,

      "专属定价和折?,

      "销售支持和培训",

      "联合营销资源",

    ],

    color: "primary",

  },

  {
    id: "integration",

    title: "技术集成伴", description: "将您的产品与 AgentFlow 深度集成",

    icon: Code,

    benefits: [

      "优先 API 访问",

      "技术支持团?,

      "联合产品开始,

      "集成市场展示",

    ],

    color: "#3B82F6",

  },

  {
    id: "consulting",

    title: "咨询服务伙伴",

    description: "为客户提?AgentFlow 实施服务",

    icon: Briefcase,

    benefits: [

      "认证培训计划",

      "实施项目引荐",

      "技术文档支?,

      "合作案例展示",

    ],

    color: "#8B5CF6",

  },

  {
    id: "affiliate",

    title: "联盟推广伙伴",

    description: "推广 AgentFlow，获得推荐奖励", icon: Megaphone,

    benefits: [

      "20% 推荐佣金",

      "专属推广链接",

      "营销素材支持",

      "实时数据追踪",

    ],

    color: "#F59E0B",

  },

];

// 合作伙伴权益

const partnerBenefits = [

  {
    icon: DollarSign", title: "丰厚收益",

    description: "极具竞争力的佣金比例和奖励计?,

  },

  {
    icon: BookOpen", title: "专业培训",

    description: "免费的产品培训和认证课程",

  },

  {
    icon: HeadphonesIcon,

    title: "专属支持",

    description: "专属客户经理和技术支持团?,

  },

  {
    icon: Megaphone", title: "联合营销",

    description: "共同参与市场活动和品牌推?,

  },

  {
    icon: Target", title: "商机共享",

    description: "优质客户线搜索和项目机会共?,

  },

  {
    icon: TrendingUp", title: "共同成长",

    description: "?AgentFlow 一起快速成?,

  },

];

// 现有合作伙伴展示

const featuredPartners = [

  { name: "阿里?", type: "技术合规, logo: "☁️" },

  { name: "腾讯?", type: "技术合规, logo: "🌐" },

  { name: "华为?", type: "技术合规, logo: "📱" },

  { name: "AWS", type: "技术合规, logo: "🔶" },

  { name: "微软 Azure", type: "技术合规, logo: "💠" },

  { name: "Google Cloud", type: "技术合规, logo: "🔵" },

];

// 成功案例数据

const successStats = [

  { value: "500+", label: "合作伙伴" },

  { value: "$10M+", label: "合作伙伴收入" },

  { value: "98%", label: "合作满意? },

  { value: "50+", label: "国家和地? },

];

// 常见问题

const faqs = [

  {
    question: "如何成为 AgentFlow 合作伙伴?", answer: "填写本页面的申请表单，我们的合作伙伴团队会在 2 个工作日内与您联系，讨论合作细节?,

  },

  {
    question: "合作伙伴需要付费吗?", answer: "基础合作伙伴计划是免费的。我们也提供高级合作伙伴计划，包含更多权益和支持?,

  },

  {
    question: "佣金如何结算?", answer: "佣金按月结算，支持银行转账、PayPal 等多种方式。最低起付金额为 $100?,

  },

  {
    question: "需要什么资质？",

    answer: "不同类型的合作伙伴有不同的要求，一般需要有相关行业经验或技术能力。详情请咨询我们的合作伙伴团队?,

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

    // 模拟提交

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);

    setIsSubmitted(true);

  };

  const handleInputChange = (field: string", value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">

        <SiteHeader />

        <div className="pt-32 pb-16 px-6">

          <div className="max-w-md mx-auto text-center">

            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">

              <CheckCircle className="w-10 h-10 text-primary" />

            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">

              申请已提交！

            </h1>

            <p className="text-muted-foreground mb-8">

              感谢您的申请！我们的合作伙伴团队会在 2 个工作日内与您联系?            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <Link href="/">

                <Button variant="outline" className="rounded-xl">

                  返回首页

                </Button>

              </Link>

              <Link href="/docs">

                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

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

      {/* 背景效果 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div

          className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"

          style={{
            background:

              "radial-gradient(circle, rgba(62,207,142,0.4) 0%, transparent 70%)",

          }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section */}

      <section className="pt-16 sm:pt-24 pb-12 px-6">

        <div className="max-w-6xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">

            <Handshake className="h-4 w-4" />

            合作伙伴计划

          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">

            ?AgentFlow

            <br />

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              共创未来

            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">

            加入 AgentFlow 合作伙伴生态系统，共同推动 AI 自动化的普及?            创造更大的商业价?          </p>

          {/* Success Stats */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">

            {successStats.map((stat) => (
              <div key={stat.label} className="text-center">

                <div className="text-3xl font-bold text-foreground">

                  {stat.value}

                </div>

                <div className="text-sm text-muted-foreground">{stat.label}</div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Partner Types */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">

              选择适合您的合作方式

            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">

              我们提供多种合作伙伴类型，满足不同业务需?            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {partnerTypes.map((type) => (
              <button

                key={type.id}

                onClick={() => setSelectedType(type.id)}

                className={cn(
                  "p-6 rounded-xl text-left transition-all duration-300",

                  "bg-card border-2",

                  selectedType === type.id

                    ? "border-primary shadow-lg"

                    : "border-border hover:border-primary/50"

                )}

              >

                <div

                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"

                  style={{ backgroundColor: `${type.color}15` }}

                >

                  <type.icon

                    className="w-6 h-6"

                    style={{ color: type.color }}

                  />

                </div>

                <h3 className="font-semibold text-foreground mb-2">

                  {type.title}

                </h3>

                <p className="text-sm text-muted-foreground mb-4">

                  {type.description}

                </p>

                <ul className="space-y-2">

                  {type.benefits.map((benefit) => (
                    <li

                      key={benefit}

                      className="flex items-center gap-2 text-sm text-muted-foreground"

                    >

                      <CheckCircle

                        className="w-4 h-4 shrink-0"

                        style={{ color: type.color }}

                      />

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

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">

              合作伙伴权益

            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">

              成为 AgentFlow 合作伙伴，享受全方位的支持和资源

            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {partnerBenefits.map((benefit) => (
              <div

                key={benefit.title}

                className={cn(
                  "flex items-start gap-4 p-6 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all duration-300"

                )}

              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

                  <benefit.icon className="w-6 h-6 text-primary" />

                </div>

                <div>

                  <h3 className="font-semibold text-foreground mb-1">

                    {benefit.title}

                  </h3>

                  <p className="text-sm text-muted-foreground">

                    {benefit.description}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Featured Partners */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">

              合作伙伴展示

            </h2>

            <p className="text-muted-foreground max-w-2xl mx-auto">

              与行业领先企业共同构?AI 自动化生?            </p>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">

            {featuredPartners.map((partner) => (
              <div

                key={partner.name}

                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30",

                  "transition-all duration-300"

                )}

              >

                <span className="text-4xl mb-3">{partner.logo}</span>

                <h4 className="font-medium text-foreground text-center">

                  {partner.name}

                </h4>

                <p className="text-xs text-muted-foreground">{partner.type}</p>

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

              <div className="p-8 rounded-2xl bg-card border border-border">

                <h2 className="text-xl font-bold text-foreground mb-2">

                  申请成为合作伙伴

                </h2>

                <p className="text-muted-foreground mb-6">

                  填写以下信息，我们会尽快与您联系

                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div>

                      <Label htmlFor="companyName" className="text-foreground">

                        公司名称 <span className="text-red-500">*</span>

                      </Label>

                      <Input

                        id="companyName"

                        type="text"

                        value={formData.companyName}

                        onChange={(e) => handleInputChange("companyName", e.target.value)}

                        required

                        className="mt-2 bg-background border-border rounded-xl"

                        placeholder="您的公司名称"

                      />

                    </div>

                    <div>

                      <Label htmlFor="contactName" className="text-foreground">

                        联系?<span className="text-red-500">*</span>

                      </Label>

                      <Input

                        id="contactName"

                        type="text"

                        value={formData.contactName}

                        onChange={(e) => handleInputChange("contactName", e.target.value)}

                        required

                        className="mt-2 bg-background border-border rounded-xl"

                        placeholder="您的姓名"

                      />

                    </div>

                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div>

                      <Label htmlFor="email" className="text-foreground">

                        邮箱 <span className="text-red-500">*</span>

                      </Label>

                      <Input

                        id="email"

                        type="email"

                        value={formData.email}

                        onChange={(e) => handleInputChange("email", e.target.value)}

                        required

                        className="mt-2 bg-background border-border rounded-xl"

                        placeholder="work@company.com"

                      />

                    </div>

                    <div>

                      <Label htmlFor="phone" className="text-foreground">

                        电话

                      </Label>

                      <Input

                        id="phone"

                        type="tel"

                        value={formData.phone}

                        onChange={(e) => handleInputChange("phone", e.target.value)}

                        className="mt-2 bg-background border-border rounded-xl"

                        placeholder="联系电话"

                      />

                    </div>

                  </div>

                  <div>

                    <Label htmlFor="website" className="text-foreground">

                      公司网站

                    </Label>

                    <Input

                      id="website"

                      type="url"

                      value={formData.website}

                      onChange={(e) => handleInputChange("website", e.target.value)}

                      className="mt-2 bg-background border-border rounded-xl"

                      placeholder="https://yourcompany.com"

                    />

                  </div>

                  <div>

                    <Label className="text-foreground mb-3 block">

                      合作类型 <span className="text-red-500">*</span>

                    </Label>

                    <div className="grid grid-cols-2 gap-3">

                      {partnerTypes.map((type) => (
                        <button

                          key={type.id}

                          type="button"

                          onClick={() => setSelectedType(type.id)}

                          className={cn(
                            "p-3 rounded-xl text-left text-sm transition-all",

                            "border",

                            selectedType === type.id

                              ? "bg-primary/10 border-primary"

                              : "bg-background border-border hover:border-primary/50"

                          )}

                        >

                          <span className="font-medium text-foreground">

                            {type.title}

                          </span>

                        </button>

                      ))}

                    </div>

                  </div>

                  <div>

                    <Label htmlFor="message" className="text-foreground">

                      补充说明

                    </Label>

                    <textarea

                      id="message"

                      value={formData.message}

                      onChange={(e) => handleInputChange("message", e.target.value)}

                      rows={4}

                      className={cn(
                        "w-full mt-2 px-4 py-3 rounded-xl",

                        "bg-background border border-border text-foreground text-sm",

                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",

                        "placeholder:text-muted-foreground resize-none"

                      )}

                      placeholder="请简要介绍您的公司和合作意向（可选）"

                    />

                  </div>

                  <Button

                    type="submit"

                    disabled={isSubmitting || !formData.companyName || !formData.contactName || !formData.email}

                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"

                  >

                    {isSubmitting ? (
                      <>

                        <div className="w-4 h-4 border-2 border-[#171717]/30 border-t-[#171717] rounded-full animate-spin mr-2" />

                        提交?..

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

                    className="p-4 rounded-xl bg-card border border-border"

                  >

                    <h4 className="font-medium text-foreground mb-2">

                      {faq.question}

                    </h4>

                    <p className="text-sm text-muted-foreground">{faq.answer}</p>

                  </div>

                ))}

              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">

                <h4 className="font-medium text-foreground mb-2">

                  需要更多帮助？

                </h4>

                <p className="text-sm text-muted-foreground mb-3">

                  联系我们的合作伙伴团?                </p>

                <a

                  href="mailto:partners@agentflow.ai"

                  className="text-sm text-primary hover:underline"

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

