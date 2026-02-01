"use client";

/**
 * 使用场景页面 - 展示不同行业和场景的应用案例

 * Manus 风格：极简、大留白、流畅动效 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,

  ArrowRight,

  CheckCircle,

  Building2,

  ShoppingCart,

  Stethoscope,

  GraduationCap,

  Landmark,

  Factory,

  Plane,

  Utensils,

  Bot,

  FileText,

  Mail,

  BarChart3,

  Users,

  Zap,

  Shield,

  Clock,

  TrendingUp,

  Play,

  Quote,

  ChevronRight,

  Sparkles,

  Star,

  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 行业分类

const industries = [

  { id: "all", label: "全部行业", icon: Target },

  { id: "tech", label: "科技互联?", icon: Bot },

  { id: "ecommerce", label: "电商零售", icon: ShoppingCart },

  { id: "finance", label: "金融保险", icon: Landmark },

  { id: "healthcare", label: "医疗健康", icon: Stethoscope },

  { id: "education", label: "教育培训", icon: GraduationCap },

  { id: "manufacturing", label: "制造业", icon: Factory },

  { id: "enterprise", label: "企业服务", icon: Building2 },

];

// 使用场景数据

const useCases = [

  {
    id: "customer-service",

    title: "智能客服系统",

    subtitle: "7x24 小时智能客服，提升客户满意度",

    description: "使用 AI 大模型构建智能客服系统，自动回答常见问题、理解用户意图、智能转接人工，大幅提升客服效率和用户体验?,

    industry: "tech",

    icon: "🤖",

    color: "from-emerald-500 to-teal-600",

    stats: [

      { label: "响应速度提升", value: "95%" },

      { label: "人工成本降低", value: "60%" },

      { label: "客户满意?", value: "4.8/5" },

    ],

    features: [

      "多轮对话理解，精准识别用户意?,

      "知识库检搜索，准确回答专业问题",

      "情感分析，智能识别负面情?,

      "无缝转接人工，复杂问题快速处理,

      "多渠道接入，统一管理所有咨?,

    ],

    testimonial: {
      content: "部署 AgentFlow 智能客服后，我们的首次响应时间从 5 分钟降到?10 秒，客户满意度显著提升?", author: "李明",

      role: "客服总监",

      company: "某科技公司",

    },

    relatedTemplates: ["智能客服", "FAQ 机器?, "工单分类"],

  },

  {
    id: "content-generation",

    title: "内容自动化生?,

    subtitle: "AI 驱动的内容生产线，日产百?", description: "结合 GPT-4 等大模型，自动化生成营销文案、产品描述、社交媒体内容，并支持多平台一键发布局,

    industry: "ecommerce",

    icon: "✍️",

    color: "from-blue-500 to-indigo-600",

    stats: [

      { label: "内容产出提升", value: "20x" },

      { label: "创作成本降低", value: "80%" },

      { label: "SEO 排名提升", value: "150%" },

    ],

    features: [

      "基于关键词自动生?SEO 优化内容",

      "多种内容风格模板，一键切?,

      "自动配图和排版优?,

      "多平台同步发?,

      "数据反馈驱动内容优化",

    ],

    testimonial: {
      content: "以前一周写 10 篇文章，现在一天就能产?50 篇高质量内容，而且 SEO 效果更好?", author: "王芳",

      role: "内容运营总监",

      company: "某电商平?,

    },

    relatedTemplates: ["内容生成?, "SEO 文章", "社交媒体"],

  },

  {
    id: "data-processing",

    title: "数据自动化处理,

    subtitle: "告别手动处理，数据流转全自动",

    description: "自动化数据采集、清洗、转换和分析，将分散在各系统的数据整合统一，实现数据驱动决策略,

    industry: "finance",

    icon: "📊",

    color: "from-purple-500 to-violet-600",

    stats: [

      { label: "处理效率提升", value: "500%" },

      { label: "数据准确?", value: "99.9%" },

      { label: "报表生成时间", value: "-90%" },

    ],

    features: [

      "多源数据自动采集和同?,

      "智能数据清洗和去?,

      "自定义数据转换规?,

      "自动生成可视化报?,

      "异常数据实时预警",

    ],

    testimonial: {
      content: "原来需?3 个人做一周的报表，现在全自动生成，我们可以专注于数据分析和决策略", author: "张强",

      role: "数据分析经理",

      company: "某金融机?,

    },

    relatedTemplates: ["数据同步", "报表生成", "ETL 管道"],

  },

  {
    id: "document-processing",

    title: "文档智能处理",

    subtitle: "OCR + AI，文档处理全自动",

    description: "自动识别、提取、分类各类文档信息，包括合同、发票、简历等，大幅提升文档处理效率?,

    industry: "enterprise",

    icon: "📄",

    color: "from-orange-500 to-red-600",

    stats: [

      { label: "处理速度提升", value: "800%" },

      { label: "识别准确?", value: "98%" },

      { label: "人工审核减少", value: "75%" },

    ],

    features: [

      "支持 PDF、图片、Word 等多种格?,

      "OCR 识别 + AI 语义理解",

      "自动提取关键信息字段",

      "智能分类和归?,

      "与业务系统无缝对?,

    ],

    testimonial: {
      content: "每天处理上千份合同，以前需?5 个人，现在只需?1 人复?AI 的处理结果?", author: "赵静",

      role: "法务经理",

      company: "某大型企?,

    },

    relatedTemplates: ["合同审核", "发票识别", "简历筛?],

  },

  {
    id: "email-automation",

    title: "邮件智能管理",

    subtitle: "告别邮件焦虑，收发处理全自动",

    description: "自动分类收件箱、提取关键信息、生成回复建议、定时发送营销邮件，彻底解放邮件处理时间?,

    industry: "enterprise",

    icon: "📧",

    color: "from-cyan-500 to-blue-600",

    stats: [

      { label: "邮件处理效率", value: "+400%" },

      { label: "回复及时?", value: "99%" },

      { label: "每日节省时间", value: "3h" },

    ],

    features: [

      "智能邮件分类和优先级排序",

      "自动提取邮件关键信息",

      "AI 生成回复建议",

      "定时批量发送营销邮件",

      "邮件追踪和效果分支,

    ],

    testimonial: {
      content: "以前每天?3 小时处理邮件，现在只需?30 分钟?AI 整理好的摘要和建议?", author: "陈明",

      role: "销售总监",

      company: "?B2B 企业",

    },

    relatedTemplates: ["邮件分类", "营销邮件", "邮件追踪"],

  },

  {
    id: "sales-automation",

    title: "销售流程自动化",

    subtitle: "从线搜索到成交，全程自动跟?", description: "自动化销售线搜索管理、客户跟进、合同生成，让销售团队专注于高价值客户沟通?,

    industry: "enterprise",

    icon: "💼",

    color: "from-green-500 to-emerald-600",

    stats: [

      { label: "线搜索转化率提?", value: "45%" },

      { label: "销售周期缩?", value: "30%" },

      { label: "人均产出提升", value: "60%" },

    ],

    features: [

      "线搜索自动评分和分支,

      "智能客户跟进提醒",

      "自动生成销售报价和合同",

      "销售数据实时分支,

      "?CRM 系统深度集成",

    ],

    testimonial: {
      content: "销售团队现在可以把 80% 的时间用在客户沟通上，而不是填写各种表格和报告?", author: "刘洋",

      role: "销?VP",

      company: "?SaaS 公司",

    },

    relatedTemplates: ["线搜索管理", "客户跟进", "报价生成"],

  },

  {
    id: "hr-automation",

    title: "HR 流程自动效,

    subtitle: "招聘到离职，全生命周期自动化",

    description: "自动化简历筛选、面试安排、入职办理、考勤统计?HR 流程，提升人力资源管理效率?,

    industry: "enterprise",

    icon: "👥",

    color: "from-pink-500 to-rose-600",

    stats: [

      { label: "招聘效率提升", value: "300%" },

      { label: "入职流程时间", value: "-70%" },

      { label: "HR 事务性工具", value: "-60%" },

    ],

    features: [

      "AI 简历智能筛选和评分",

      "自动安排面试日程",

      "入职流程全自动办?,

      "考勤异常自动提醒",

      "员工数据自动分析报告",

    ],

    testimonial: {
      content: "以前筛?1000 份简历需要一周，现在 AI 半小时就能筛选出最匹配的候选人?", author: "周琳",

      role: "HRBP 负责?,

      company: "某互联网公司",

    },

    relatedTemplates: ["简历筛?, "面试安排", "入职流程"],

  },

  {
    id: "monitoring-alerting",

    title: "监控预警系统",

    subtitle: "7x24 智能监控，异常秒级响?", description: "实时监控业务指标、系统状态、舆情动态，智能识别异常并自动触发告警和处理流程?,

    industry: "tech",

    icon: "🔔",

    color: "from-red-500 to-orange-600",

    stats: [

      { label: "异常发现时间", value: "<1min" },

      { label: "误报率降?", value: "80%" },

      { label: "故障恢复加?", value: "50%" },

    ],

    features: [

      "多维度指标实时监?,

      "AI 智能异常检?,

      "多渠道告警通知",

      "自动触发应急流?,

      "根因分析辅助决策",

    ],

    testimonial: {
      content: "以前故障发现平均?15 分钟，现在系统异?30 秒内就能收到告警并自动处理?", author: "孙伟",

      role: "运维负责?,

      company: "某云服务?,

    },

    relatedTemplates: ["系统监控", "舆情监控", "库存预警"],

  },

  {
    id: "medical-assistant",

    title: "医疗辅助诊断",

    subtitle: "AI 辅助，提升诊疗效率和准确?", description: "辅助医生进行病历分析、影像识别、用药建议，提升诊疗效率，减少误诊风险?,

    industry: "healthcare",

    icon: "🏥",

    color: "from-teal-500 to-cyan-600",

    stats: [

      { label: "诊断效率提升", value: "200%" },

      { label: "漏诊率降?", value: "40%" },

      { label: "患者满意度", value: "4.9/5" },

    ],

    features: [

      "电子病历智能分析",

      "辅助影像诊断",

      "用药冲突检?,

      "智能预问?,

      "随访管理自动效,

    ],

    testimonial: {
      content: "AI 辅助系统帮助我们将门诊效率提升了一倍，同时诊断准确性也有明显提升?", author: "王医?,

      role: "主任医师",

      company: "某三甲医?,

    },

    relatedTemplates: ["病历分析", "预问?, "随访管理"],

  },

  {
    id: "education-assistant",

    title: "智能教育助手",

    subtitle: "个性化学习，AI 陪伴成长",

    description: "基于学生学习数据，提供个性化学习路径、智能答疑、自动批改作业等教育辅助服务?,

    industry: "education",

    icon: "📚",

    color: "from-indigo-500 to-purple-600",

    stats: [

      { label: "学习效率提升", value: "40%" },

      { label: "教师备课时间", value: "-50%" },

      { label: "学生满意?", value: "4.7/5" },

    ],

    features: [

      "个性化学习路径规划",

      "AI 智能答疑",

      "作业自动批改和反?,

      "学情分析报告",

      "智能排课和资源推?,

    ],

    testimonial: {
      content: "AI 助手让每个学生都能获得个性化的学习指导，老师可以把更多时间用于重点辅导航", author: "李老师",

      role: "教研主任",

      company: "某教育机?,

    },

    relatedTemplates: ["智能答疑", "作业批改", "学情分析"],

  },

  {
    id: "supply-chain",

    title: "供应链智能优?,

    subtitle: "需求预?+ 智能调度，降本增?", description: "基于历史数据和市场趋势，智能预测需求、优化库存、自动调度物流，提升供应链效率?,

    industry: "manufacturing",

    icon: "🚚",

    color: "from-amber-500 to-orange-600",

    stats: [

      { label: "库存成本降低", value: "25%" },

      { label: "缺货率降?", value: "60%" },

      { label: "物流效率提升", value: "35%" },

    ],

    features: [

      "销量智能预?,

      "库存自动补货",

      "物流路径优化",

      "供应商智能管理,

      "供应链风险预?,

    ],

    testimonial: {
      content: "AI 预测让我们的库存周转率提升了 30%，同时缺货情况大幅减少?", author: "钱?,

      role: "供应链总监",

      company: "某零售企?,

    },

    relatedTemplates: ["需求预?, "库存管理", "物流调度"],

  },

  {
    id: "financial-analysis",

    title: "财务智能分析",

    subtitle: "自动对账、智能报表、风险预?", description: "自动化财务数据处理、报表生成、风险分析，让财务团队从繁琐工作中解放出来?,

    industry: "finance",

    icon: "💰",

    color: "from-yellow-500 to-amber-600",

    stats: [

      { label: "对账效率提升", value: "1000%" },

      { label: "报表生成时间", value: "-95%" },

      { label: "风险识别准确?", value: "96%" },

    ],

    features: [

      "多银行账户自动对?,

      "财务报表自动生成",

      "现金流预测分支,

      "异常交易自动预警",

      "税务合规自动检?,

    ],

    testimonial: {
      content: "月末结账?5 天缩短到半天，财务团队终于有时间做真正有价值的分析工作了?", author: "孙财?,

      role: "财务总监",

      company: "某集团公?,

    },

    relatedTemplates: ["自动对账", "财务报表", "费用审核"],

  },

];

// 成功指标

const successMetrics = [

  { icon: TrendingUp", label: "平均效率提升", value: "300%" },

  { icon: Clock, label: "节省时间", value: "10h/? },

  { icon: Shield, label: "错误率降?", value: "90%" },

  { icon: Users, label: "服务客户", value: "5000+" },

];

// 快速实施步?const quickStartSteps = [

  {
    step: 1", title: "选择场景",

    description: "?12+ 场景中选择最适合的，或自定义场景",

  },

  {
    step: 2,

    title: "使用模板",

    description: "基于预制模板快速搭建，无需从零开始,

  },

  {
    step: 3", title: "配置参数",

    description: "根据业务需求调整参数和规则",

  },

  {
    step: 4,

    title: "测试运行",

    description: "在测试环境验证效果后上线",

  },

];

// 行业采用?const industryAdoption = [

  { industry: "科技互联?, rate: 92, growth: "+15%" },

  { industry: "电商零售", rate: 85, growth: "+22%" },

  { industry: "金融保险", rate: 78, growth: "+18%" },

  { industry: "医疗健康", rate: 65, growth: "+35%" },

  { industry: "教育培训", rate: 72, growth: "+28%" },

  { industry: "制造业", rate: 58, growth: "+40%" },

];

// 实施建议

const implementationTips = [

  {
    title: "从小场景开始", description: "先选择一个小场景验证效果，再逐步扩展到更多场?", icon: "🎯",

  },

  {
    title: "数据质量是关?", description: "确保输入数据的质量，垃圾进垃圾出在自动化中尤为明?", icon: "📊",

  },

  {
    title: "设置人工复核节点",

    description: "关键决策点设置人工复核，建立信任后逐步放开",

    icon: "?,

  },

  {
    title: "持续优化迭代",

    description: "根据运行数据不断优化流程，自动化是持续改进的过程",

    icon: "🔄",

  },

];

// 热门组合

const popularCombinations = [

  {
    title: "内容营销套件",

    scenes: ["内容生成", "SEO 优化", "多平台发?],

    savings: "80%",

  },

  {
    title: "客户服务中心",

    scenes: ["智能客服", "工单处理", "满意度分支],

    savings: "60%",

  },

  {
    title: "销售加速器",

    scenes: ["线搜索管理", "邮件自动效, "报表生成"],

    savings: "50%",

  },

];

export default function UseCasesPage() {
  const [activeIndustry, setActiveIndustry] = useState("all");

  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

  }, []);

  const filteredCases = useCases.filter(
    (item) => activeIndustry === "all" || item.industry === activeIndustry

  );

  return (
    <div className="min-h-screen bg-background">

      {/* Manus 风格背景 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/20)]" />

        <div 

          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px] opacity-[0.12]"

          style={{ background: 'radial-gradient(circle, rgba(62,207,142,0.5) 0%, transparent 60%)' }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section - Manus 风格 */}

      <section className="pt-20 sm:pt-32 pb-16 px-6">

        <div className="max-w-4xl mx-auto text-center">

          {/* 标签 */}

          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",

            "bg-muted border border-border",

            "text-sm text-muted-foreground font-medium mb-8",

            "transition-all duration-500",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            <Layers className="h-3.5 w-3.5" />

            Use Cases

          </div>

          {/* 主标签*/}

          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6",

            "transition-all duration-700 delay-100",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            Explore

            <br />

            <span className="text-primary">possibilities</span>

          </h1>

          {/* 副标签*/}

          <p className={cn(
            "text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-16",

            "transition-all duration-700 delay-200",

            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"

          )}>

            了解各行各业如何使用 AgentFlow 实现自动效          </p>

          {/* 成功指标 */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">

            {successMetrics.map((metric) => (
              <div key={metric.label} className="text-center">

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">

                  <metric.icon className="w-6 h-6 text-primary" />

                </div>

                <div className="text-2xl font-bold text-foreground">{metric.value}</div>

                <div className="text-sm text-muted-foreground">{metric.label}</div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 行业筛?*/}

      <section className="py-8 px-6 border-y border-border/40 bg-muted/20 sticky top-16 z-40 backdrop-blur-lg">

        <div className="max-w-7xl mx-auto">

          <div className="flex flex-wrap items-center justify-center gap-2">

            {industries.map((industry) => (
              <button

                key={industry.id}

                onClick={() => setActiveIndustry(industry.id)}

                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",

                  activeIndustry === industry.id

                    ? "bg-primary text-primary-foreground"

                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"

                )}

              >

                <industry.icon className="w-4 h-4" />

                {industry.label}

              </button>

            ))}

          </div>

        </div>

      </section>

      {/* 使用场景列表 */}

      <section className="py-16 px-6">

        <div className="max-w-7xl mx-auto">

          <div className="grid gap-8">

            {filteredCases.map((useCase, index) => (
              <div

                key={useCase.id}

                className={cn(
                  "rounded-lg overflow-hidden",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all duration-300"

                )}

              >

                {/* 主要内容 */}

                <div className="p-6 sm:p-8">

                  <div className="flex flex-col lg:flex-row gap-8">

                    {/* 左侧信息 */}

                    <div className="flex-1">

                      <div className="flex items-start gap-4 mb-4">

                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0",

                          "bg-gradient-to-br", useCase.color

                        )}>

                          {useCase.icon}

                        </div>

                        <div>

                          <h3 className="text-xl font-bold text-foreground mb-1">

                            {useCase.title}

                          </h3>

                          <p className="text-primary font-medium">{useCase.subtitle}</p>

                        </div>

                      </div>

                      <p className="text-muted-foreground mb-6 leading-relaxed">

                        {useCase.description}

                      </p>

                      {/* 统计数据 */}

                      <div className="grid grid-cols-3 gap-4 mb-6">

                        {useCase.stats.map((stat) => (
                          <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/50">

                            <div className="text-xl font-bold text-primary">{stat.value}</div>

                            <div className="text-xs text-muted-foreground">{stat.label}</div>

                          </div>

                        ))}

                      </div>

                      {/* 展开/收起功能 */}

                      <button

                        onClick={() => setExpandedCase(expandedCase === useCase.id ? null : useCase.id)}

                        className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"

                      >

                        {expandedCase === useCase.id ? "收起详情" : "查看详情"}

                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",

                          expandedCase === useCase.id && "rotate-90"

                        )} />

                      </button>

                    </div>

                    {/* 右侧客户评价 */}

                    <div className="lg:w-80 shrink-0">

                      <div className="p-5 rounded-xl bg-muted/30 border border-border">

                        <Quote className="w-8 h-8 text-primary/30 mb-3" />

                        <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">

                          "{useCase.testimonial.content}"

                        </p>

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">

                            {useCase.testimonial.author[0]}

                          </div>

                          <div>

                            <div className="font-medium text-foreground text-sm">

                              {useCase.testimonial.author}

                            </div>

                            <div className="text-xs text-muted-foreground">

                              {useCase.testimonial.role} · {useCase.testimonial.company}

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* 展开的详情?*/}

                {expandedCase === useCase.id && (
                  <div className="px-6 sm:px-8 pb-8 pt-0 border-t border-border">

                    <div className="grid md:grid-cols-2 gap-8 pt-6">

                      {/* 核心功能 */}

                      <div>

                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">

                          <Zap className="w-4 h-4 text-primary" />

                          核心功能

                        </h4>

                        <ul className="space-y-3">

                          {useCase.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">

                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />

                              {feature}

                            </li>

                          ))}

                        </ul>

                      </div>

                      {/* 相关模板 */}

                      <div>

                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">

                          <Sparkles className="w-4 h-4 text-primary" />

                          推荐模板

                        </h4>

                        <div className="flex flex-wrap gap-2 mb-6">

                          {useCase.relatedTemplates.map((template) => (
                            <Link key={template} href={`/store?search=${encodeURIComponent(template)}`}>

                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">

                                {template}

                                <ArrowRight className="w-3 h-3" />

                              </span>

                            </Link>

                          ))}

                        </div>

                        <div className="flex gap-3">

                          <Link href={`/store?category=${useCase.id}`}>

                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

                              浏览相关模板

                              <ArrowRight className="ml-2 w-4 h-4" />

                            </Button>

                          </Link>

                          <Link href="/contact">

                            <Button variant="outline" className="rounded-xl">

                              咨询解决方案

                            </Button>

                          </Link>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 行业采用?*/}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">

              各行业自动化采用?            </h2>

            <p className="text-muted-foreground">

              基于 2025 年行业调研数?            </p>

          </div>

          <div className="space-y-4">

            {industryAdoption.map((item) => (
              <div

                key={item.industry}

                className="p-4 rounded-xl bg-card border border-border"

              >

                <div className="flex items-center justify-between mb-2">

                  <span className="font-medium text-foreground">{item.industry}</span>

                  <div className="flex items-center gap-3">

                    <span className="text-primary text-sm font-medium">{item.growth}</span>

                    <span className="font-bold text-foreground">{item.rate}%</span>

                  </div>

                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">

                  <div 

                    className="h-full bg-primary rounded-full transition-all duration-500"

                    style={{ width: `${item.rate}%` }}

                  />

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 热门组合 */}

      <section className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">

              <Star className="h-4 w-4" />

              热门组合

            </div>

            <h2 className="text-2xl font-bold text-foreground">

              场景组合，效果更?            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {popularCombinations.map((combo) => (
              <div

                key={combo.title}

                className={cn(
                  "p-6 rounded-lg",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all duration-300"

                )}

              >

                <h3 className="font-semibold text-foreground mb-3">{combo.title}</h3>

                <div className="flex flex-wrap gap-2 mb-4">

                  {combo.scenes.map((scene) => (
                    <span

                      key={scene}

                      className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground"

                    >

                      {scene}

                    </span>

                  ))}

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-muted-foreground">预计成本节省</span>

                  <span className="text-lg font-bold text-primary">{combo.savings}</span>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 快速开始*/}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">

              快速开始            </h2>

            <p className="text-muted-foreground">

              4 步启动你的自动化之旅

            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {quickStartSteps.map((step) => (
              <div

                key={step.step}

                className="p-5 rounded-xl bg-card border border-border text-center"

              >

                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mx-auto mb-3">

                  {step.step}

                </div>

                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>

                <p className="text-sm text-muted-foreground">{step.description}</p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 实施建议 */}

      <section className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">

              <Sparkles className="h-4 w-4" />

              实施建议

            </div>

            <h2 className="text-2xl font-bold text-foreground">

              成功实施的关?            </h2>

          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {implementationTips.map((tip) => (
              <div

                key={tip.title}

                className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border"

              >

                <div className="text-3xl shrink-0">{tip.icon}</div>

                <div>

                  <h3 className="font-semibold text-foreground mb-1">{tip.title}</h3>

                  <p className="text-sm text-muted-foreground">{tip.description}</p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">

                没有找到你的场景?              </h2>

              <p className="text-white/80 mb-8 max-w-lg mx-auto">

                AgentFlow 支持构建任何自动化场景，联系我们获取定制化解决方案              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">

                <Link href="/contact">

                  <Button className="h-11 px-6 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl">

                    联系我们

                    <ArrowRight className="ml-2 w-4 h-4" />

                  </Button>

                </Link>

                <Link href="/store">

                  <Button variant="outline" className="h-11 px-6 border-white/30 text-white hover:bg-white/10 rounded-xl">

                    浏览模板商店

                  </Button>

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Footer */}

      <SiteFooter />

    </div>

  );
}

