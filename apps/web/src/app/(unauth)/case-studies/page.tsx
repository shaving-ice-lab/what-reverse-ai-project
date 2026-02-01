"use client";

/**
 * 案例研究页面 - Manus 风格
 */

import Link from "next/link";
import {
  Building,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Quote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 案例数据
const caseStudies = [
  {
    id: "1",
    company: "某大型电商平台",
    industry: "电商",
    logo: "🛒",
    title: "智能客服自动化系统",
    description: "通过部署 AI 驱动的智能客服系统，将客户响应时间从 30 分钟缩短到 2 分钟，客服效率提升 300%。",
    results: [
      { metric: "响应时间", value: "-93%", description: "从 30 分钟到 2 分钟" },
      { metric: "客服效率", value: "+300%", description: "处理能力提升 3 倍" },
      { metric: "客户满意度", value: "+45%", description: "NPS 显著提升" },
    ],
    quote: "AgentFlow 帮助我们彻底改变了客服运营模式，现在我们的小团队可以处理过去 5 倍的客户咨询。",
    author: "客服总监",
    featured: true,
  },
  {
    id: "2",
    company: "某知名金融机构",
    industry: "金融",
    logo: "🏦",
    title: "自动化风控流程",
    description: "实现风险监控和预警的全自动化，风控响应速度提升 10 倍，大幅降低人工审核成本。",
    results: [
      { metric: "响应速度", value: "10x", description: "实时风险预警" },
      { metric: "审核成本", value: "-60%", description: "减少人工介入" },
      { metric: "准确率", value: "99.5%", description: "AI 辅助决策" },
    ],
    quote: "自动化的风控流程让我们能够实时响应市场变化，这在金融行业是至关重要的。",
    author: "首席风险官",
    featured: true,
  },
  {
    id: "3",
    company: "某制造企业",
    industry: "制造",
    logo: "🏭",
    title: "供应链自动化管理",
    description: "打通 ERP、MES 和 WMS 系统，实现供应链全流程自动化，库存周转率提升 40%。",
    results: [
      { metric: "供应链效率", value: "+150%", description: "端到端自动化" },
      { metric: "库存周转", value: "+40%", description: "智能库存管理" },
      { metric: "运营成本", value: "-35%", description: "减少人工操作" },
    ],
    quote: "AgentFlow 帮助我们打通了各个系统的数据孤岛，真正实现了供应链的数字化转型。",
    author: "供应链总监",
    featured: false,
  },
  {
    id: "4",
    company: "某 SaaS 公司",
    industry: "科技",
    logo: "💻",
    title: "销售线索自动化",
    description: "自动化销售线索评分和分配，销售团队效率提升 200%，转化率提高 35%。",
    results: [
      { metric: "销售效率", value: "+200%", description: "自动化线索处理" },
      { metric: "转化率", value: "+35%", description: "精准客户画像" },
      { metric: "响应时间", value: "-80%", description: "快速跟进" },
    ],
    quote: "现在我们的销售团队可以专注于高价值客户，而不是花时间在线索筛选上。",
    author: "销售 VP",
    featured: false,
  },
];

// 行业列表
const industries = ["全部", "电商", "金融", "制造", "科技", "医疗", "教育"];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            真实客户案例
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            客户案例
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            了解各行业领先企业如何使用 AgentFlow 实现业务自动化，提升效率
          </p>
        </div>
      </section>

      {/* Featured Cases */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-8">精选案例</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {caseStudies
              .filter((c) => c.featured)
              .map((study) => (
                <div
                  key={study.id}
                  className={cn(
                    "p-6 rounded-2xl",
                    "bg-card border border-border",
                    "hover:border-primary/30 hover:shadow-lg",
                    "transition-all duration-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {study.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {study.company}
                      </h3>
                      <span className="text-xs text-primary">{study.industry}</span>
                    </div>
                  </div>

                  <h4 className="text-lg font-medium text-foreground mb-2">
                    {study.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {study.description}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {study.results.map((result) => (
                      <div key={result.metric}>
                        <div className="text-xl font-bold text-primary">
                          {result.value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.metric}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 mb-4">
                    <Quote className="w-4 h-4 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground italic mb-2">
                      "{study.quote}"
                    </p>
                    <p className="text-xs text-foreground">— {study.author}</p>
                  </div>

                  <Link href={`/case-studies/${study.id}`}>
                    <Button variant="outline" className="w-full">
                      查看详情
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* All Cases */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-8">所有案例</h2>
          <div className="space-y-4">
            {caseStudies.map((study) => (
              <Link
                key={study.id}
                href={`/case-studies/${study.id}`}
                className={cn(
                  "block p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                      {study.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {study.company}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          {study.industry}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {study.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {study.results.slice(0, 2).map((result) => (
                      <div key={result.metric} className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {result.value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.metric}
                        </div>
                      </div>
                    ))}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            想成为下一个成功案例？
          </h2>
          <p className="text-muted-foreground mb-6">
            联系我们，了解 AgentFlow 如何帮助您的业务实现自动化
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/demo">
              <Button size="lg" className="rounded-full">
                预约演示
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="rounded-full">
                联系销售
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
