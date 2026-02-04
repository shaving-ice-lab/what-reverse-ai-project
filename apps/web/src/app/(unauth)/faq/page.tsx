"use client";

/**
 * 常见问题页面 - Manus 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Zap,
  CreditCard,
  Shield,
  Settings,
  Users,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// FAQ 分类
const categories = [
  { id: "all", name: "全部", icon: HelpCircle },
  { id: "getting-started", name: "入门使用", icon: Zap },
  { id: "billing", name: "账单与订阅", icon: CreditCard },
  { id: "security", name: "安全与隐私", icon: Shield },
  { id: "technical", name: "技术问题", icon: Settings },
  { id: "troubleshooting", name: "故障排查", icon: AlertTriangle },
];

// FAQ 数据
const faqs = [
  {
    category: "getting-started",
    question: "什么是 AgentFlow？",
    answer: "AgentFlow 是一个 AI 驱动的工作流自动化平台，帮助用户通过可视化编辑器和智能 AI Agent 快速构建、部署和管理自动化工作流。无需编程知识，即可实现复杂的业务自动化。",
  },
  {
    category: "getting-started",
    question: "如何开始使用 AgentFlow？",
    answer: "开始使用非常简单：1. 注册免费账户；2. 在模板市场选择一个模板，或从零开始创建工作流；3. 使用可视化编辑器配置工作流节点；4. 设置触发条件并激活工作流。我们还提供详细的文档和视频教程帮助您快速上手。",
  },
  {
    category: "getting-started",
    question: "需要编程知识吗？",
    answer: "不需要。AgentFlow 提供可视化的拖拽式编辑器，无需编写任何代码即可创建复杂的工作流。当然，如果您有编程背景，可以使用我们的 API 和 SDK 进行更高级的定制。",
  },
  {
    category: "billing",
    question: "可以免费试用吗？",
    answer: "是的！专业版和团队版都提供 14 天免费试用，无需绑定信用卡。试用期间您可以体验所有付费功能。试用期结束后，您可以选择订阅付费版本或降级到免费版。",
  },
  {
    category: "billing",
    question: "支持哪些支付方式？",
    answer: "我们支持多种支付方式：信用卡（Visa、MasterCard、American Express）、支付宝、微信支付、企业对公转账（企业客户）。所有支付均通过安全的第三方支付平台处理。",
  },
  {
    category: "billing",
    question: "如何取消订阅？",
    answer: "您可以随时取消订阅，无需支付任何取消费用。取消后，您的付费功能将在当前计费周期结束后停止，账户会自动降级到免费版本。您的数据将被保留，如需删除请联系我们。",
  },
  {
    category: "security",
    question: "数据安全如何保障？",
    answer: "数据安全是我们的首要任务。我们采取多层安全措施：所有数据传输使用 TLS 加密、敏感数据使用 AES-256 加密存储、SOC 2 Type II 认证、GDPR 合规、定期安全审计和渗透测试、严格的内部访问控制。",
  },
  {
    category: "security",
    question: "数据存储在哪里？",
    answer: "我们的数据中心位于中国境内，使用阿里云和腾讯云的基础设施。对于有特殊合规要求的企业客户，我们提供私有化部署选项，数据可以存储在您自己的服务器上。",
  },
  {
    category: "technical",
    question: "支持哪些集成？",
    answer: "我们支持 100+ 主流服务的集成，包括：通讯（Slack、飞书、钉钉、微信）、项目管理（Notion、Asana、Jira、Linear）、开发工具（GitHub、GitLab、Vercel）、数据库（MySQL、PostgreSQL、MongoDB）、AI 服务（OpenAI、Anthropic、通义千问）。还支持自定义 Webhook 和 API 集成。",
  },
  {
    category: "technical",
    question: "有 API 限制吗？",
    answer: "是的，不同版本有不同的 API 限制：免费版 100 次/分钟、专业版 500 次/分钟、团队版 2000 次/分钟、企业版自定义限制。如果您需要更高的限制，请联系我们的销售团队。",
  },
  {
    category: "troubleshooting",
    question: "工作流执行失败如何快速定位？",
    answer: "建议先查看执行记录中的失败节点与错误信息，确认输入参数是否缺失或格式不正确，再检查目标应用的访问策略与配额。必要时降低并发或开启重试以缩短恢复时间。",
  },
  {
    category: "troubleshooting",
    question: "Webhook 收不到事件回调怎么办？",
    answer: "请确认 Webhook URL 可公网访问且未被防火墙拦截，核对签名密钥与事件类型是否匹配，再使用测试事件触发。也可在日志中查看回调失败原因。",
  },
  {
    category: "troubleshooting",
    question: "运行时提示限流或超时如何处理？",
    answer: "优先检查访问频率是否超过当前计划配额，必要时调整 rate_limit 策略或升级套餐。同时可减少并发或启用重试来缓解高峰期超时。",
  },
  {
    category: "troubleshooting",
    question: "如何提交工单并跟踪响应 SLA？",
    answer: "进入支持中心提交工单，系统会自动分级并给出响应 SLA。您可以在工单回执中查看预计响应时间与当前状态。",
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            常见问题
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            快速找到您需要的答案
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索问题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                没有找到相关问题
              </h3>
              <p className="text-muted-foreground">
                尝试使用其他关键词搜索
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl border transition-all",
                    expandedIndex === index
                      ? "bg-card border-primary/30"
                      : "bg-card border-border hover:border-primary/20"
                  )}
                >
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-medium text-foreground">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                        expandedIndex === index && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedIndex === index && (
                    <div className="px-5 pb-5">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Help */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            还有其他问题？
          </h2>
          <p className="text-muted-foreground mb-6">
            联系我们的支持团队获取帮助
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button className="rounded-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                联系支持
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" className="rounded-full">
                查看文档
              </Button>
            </Link>
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
