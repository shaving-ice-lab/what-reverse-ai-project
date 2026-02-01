"use client";

/**
 * 媒体中心页面 - 新闻稿、媒体资源 * 

 * Manus 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  Newspaper,

  Download,

  ExternalLink,

  Calendar,

  ArrowRight,

  FileText,

  Image,

  Video,

  Mail,

  Building2,

  TrendingUp,

  Award,

  Users,

  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 新闻?const pressReleases = [

  {
    id: "1",

    title: "AgentFlow 完成 B 轮融资，估值达 5 亿美?", date: "2026-01-15",

    category: "融资",

    excerpt: "AgentFlow 宣布完成 5000 万美?B 轮融资，由红杉资本领投，将用于扩大研发团队和全球市场拓展示,

    featured: true,

  },

  {
    id: "2",

    title: "AgentFlow 推出企业版，服务全球 500 强企?", date: "2026-01-10",

    category: "产品",

    excerpt: "面向大型企业推出专属解决方案，提供私有化部署、SOC 2 认证和专属技术支持?,

    featured: true,

  },

  {
    id: "3",

    title: "AgentFlow 用户突破 100 万，月活跃用户增?300%",

    date: "2025-12-20",

    category: "里程?,

    excerpt: "平台注册用户突破百万大关，月活跃用户数同比增?300%，创下行业新纪录?,

    featured: false,

  },

  {
    id: "4",

    title: "AgentFlow 与阿里云达成战略合作",

    date: "2025-12-05",

    category: "合作",

    excerpt: "双方将在 AI 基础设施、模型服务等领域展开深度合作，共同推动企业智能化转型?,

    featured: false,

  },

  {
    id: "5",

    title: "AgentFlow 荣获 2025 年度最?AI 工具?", date: "2025-11-28",

    category: "荣誉",

    excerpt: "在全?AI 工具评选中脱颖而出，获得年度最?AI 工作流工具奖项?,

    featured: false,

  },

  {
    id: "6",

    title: "AgentFlow 开源核心引擎，获得 GitHub 万星",

    date: "2025-11-15",

    category: "开始,

    excerpt: "AgentFlow 将工作流执行引擎开源，上线仅一周即获得超过 10,000 ?GitHub Star?,

    featured: false,

  },

];

// 媒体资源

const mediaAssets = [

  {
    title: "Logo 资源?", description: "包含 SVG、PNG、PDF 格式的官?Logo",

    icon: Image,

    size: "4.2 MB",

    format: "ZIP",

  },

  {
    title: "品牌指南",

    description: "完整的品牌使用规范和视觉标准",

    icon: FileText,

    size: "2.8 MB",

    format: "PDF",

  },

  {
    title: "产品截图",

    description: "高清产品界面截图和演示图",

    icon: Image,

    size: "18.5 MB",

    format: "ZIP",

  },

  {
    title: "宣传视频",

    description: "产品介绍视频和功能演示", icon: Video,

    size: "156 MB",

    format: "MP4",

  },

];

// 媒体报道

const mediaCoverage = [

  {
    source: "36?,

    title: "AgentFlow：用 AI 重新定义工作流自动化",

    date: "2026-01-18",

    logo: "36Kr",

  },

  {
    source: "TechCrunch",

    title: "AgentFlow raises $50M to democratize AI automation",

    date: "2026-01-16",

    logo: "TC",

  },

  {
    source: "机器之心",

    title: "深度解析：AgentFlow 如何实现 AI Agent 的规模化应用",

    date: "2026-01-12",

    logo: "Synced",

  },

  {
    source: "虎嗅",

    title: "百万用户背后：AgentFlow 的增长密?", date: "2025-12-22",

    logo: "虎嗅",

  },

];

// 公司统计

const companyStats = [

  { label: "用户?", value: "100?", icon: Users },

  { label: "企业客户", value: "5000+", icon: Building2 },

  { label: "年增长率", value: "300%", icon: TrendingUp },

  { label: "行业奖项", value: "15+", icon: Award },

];

export default function PressPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "融资", "产品", "里程?, "合作", "荣誉", "开始];

  const filteredReleases = selectedCategory === "all"

    ? pressReleases

    : pressReleases.filter(r => r.category === selectedCategory);

  const featuredReleases = pressReleases.filter(r => r.featured);

  return (
    <div className="min-h-screen bg-background">

      {/* 背景效果 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div

          className="absolute top-[-10%] left-[30%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"

          style={{
            background: "radial-gradient(circle, rgba(62,207,142,0.4) 0%, transparent 70%)",

          }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section */}

      <section className="pt-16 sm:pt-24 pb-12 px-6">

        <div className="max-w-6xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">

            <Newspaper className="h-4 w-4" />

            媒体中心

          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">

            AgentFlow

            <br />

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              新闻与媒?            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">

            获取最新的公司新闻、产品发布和媒体资源

          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link href="#press-releases">

              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl">

                查看新闻?                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

            <Link href="#media-assets">

              <Button variant="outline" className="h-12 px-8 rounded-xl">

                <Download className="mr-2 w-4 h-4" />

                下载媒体资源

              </Button>

            </Link>

          </div>

        </div>

      </section>

      {/* Company Stats */}

      <section className="py-12 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            {companyStats.map((stat) => (
              <div

                key={stat.label}

                className="text-center p-6 rounded-xl bg-card border border-border"

              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">

                  <stat.icon className="w-6 h-6 text-primary" />

                </div>

                <div className="text-2xl font-bold text-foreground">{stat.value}</div>

                <div className="text-sm text-muted-foreground">{stat.label}</div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Featured News */}

      <section className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center gap-2 mb-8">

            <Sparkles className="w-5 h-5 text-primary" />

            <h2 className="text-xl font-bold text-foreground">最新动效/h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {featuredReleases.map((release) => (
              <Link key={release.id} href={`/press/${release.id}`}>

                <div

                  className={cn(
                    "p-6 rounded-xl h-full",

                    "bg-card border border-border",

                    "hover:border-primary/30 hover:shadow-lg",

                    "transition-all duration-300 group"

                  )}

                >

                  <div className="flex items-center gap-2 mb-4">

                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">

                      {release.category}

                    </span>

                    <span className="text-sm text-muted-foreground flex items-center gap-1">

                      <Calendar className="w-3 h-3" />

                      {release.date}

                    </span>

                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">

                    {release.title}

                  </h3>

                  <p className="text-muted-foreground line-clamp-2">

                    {release.excerpt}

                  </p>

                  <div className="mt-4 flex items-center text-primary text-sm">

                    阅读全文

                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>

      {/* Press Releases */}

      <section id="press-releases" className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

            <h2 className="text-2xl font-bold text-foreground">新闻?/h2>

            <div className="flex flex-wrap gap-2">

              {categories.map((cat) => (
                <button

                  key={cat}

                  onClick={() => setSelectedCategory(cat)}

                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",

                    selectedCategory === cat

                      ? "bg-primary text-primary-foreground"

                      : "bg-card border border-border text-muted-foreground hover:text-foreground"

                  )}

                >

                  {cat === "all" ? "全部" : cat}

                </button>

              ))}

            </div>

          </div>

          <div className="space-y-4">

            {filteredReleases.map((release) => (
              <Link key={release.id} href={`/press/${release.id}`}>

                <div

                  className={cn(
                    "flex items-center gap-6 p-5 rounded-xl",

                    "bg-card border border-border",

                    "hover:border-primary/30",

                    "transition-all duration-300 group"

                  )}

                >

                  <div className="hidden sm:flex items-center justify-center w-16 text-center">

                    <div>

                      <div className="text-2xl font-bold text-foreground">

                        {new Date(release.date).getDate()}

                      </div>

                      <div className="text-xs text-muted-foreground">

                        {new Date(release.date).toLocaleDateString("zh-CN", { month: "short" })}

                      </div>

                    </div>

                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-2 mb-1">

                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">

                        {release.category}

                      </span>

                    </div>

                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">

                      {release.title}

                    </h3>

                    <p className="text-sm text-muted-foreground truncate mt-1">

                      {release.excerpt}

                    </p>

                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>

      {/* Media Coverage */}

      <section className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-2xl font-bold text-foreground mb-8">媒体报道</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {mediaCoverage.map((item, index) => (
              <a

                key={index}

                href="#"

                target="_blank"

                rel="noopener noreferrer"

                className={cn(
                  "p-5 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all duration-300 group"

                )}

              >

                <div className="flex items-center justify-between mb-3">

                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">

                    {item.logo}

                  </div>

                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />

                </div>

                <p className="text-sm text-muted-foreground mb-2">{item.source}</p>

                <h4 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">

                  {item.title}

                </h4>

                <p className="text-xs text-muted-foreground mt-2">{item.date}</p>

              </a>

            ))}

          </div>

        </div>

      </section>

      {/* Media Assets */}

      <section id="media-assets" className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <h2 className="text-2xl font-bold text-foreground">媒体资源</h2>

            <Link href="/brand">

              <Button variant="outline" className="rounded-xl">

                查看品牌指南

                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {mediaAssets.map((asset) => (
              <div

                key={asset.title}

                className={cn(
                  "p-5 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30",

                  "transition-all duration-300"

                )}

              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">

                  <asset.icon className="w-6 h-6 text-primary" />

                </div>

                <h4 className="font-medium text-foreground mb-1">{asset.title}</h4>

                <p className="text-sm text-muted-foreground mb-4">{asset.description}</p>

                <div className="flex items-center justify-between">

                  <span className="text-xs text-muted-foreground">

                    {asset.size} ?{asset.format}

                  </span>

                  <Button variant="ghost" size="sm" className="h-8">

                    <Download className="w-4 h-4" />

                  </Button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Media Contact */}

      <section className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="p-8 rounded-2xl bg-card border border-border text-center">

            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />

            <h2 className="text-xl font-bold text-foreground mb-4">

              媒体联系

            </h2>

            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">

              如果您是媒体工作者，需要采访或获取更多信息，请联系我们的公关团?            </p>

            <a href="mailto:press@agentflow.ai">

              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

                <Mail className="mr-2 w-4 h-4" />

                press@agentflow.ai

              </Button>

            </a>

          </div>

        </div>

      </section>

      <SiteFooter />

    </div>

  );
}

