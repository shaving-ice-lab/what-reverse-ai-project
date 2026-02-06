"use client";

/**
 * 学习课程页面 - LobeHub 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Play,
  Clock,
  Star,
  Users,
  ArrowRight,
  BookOpen,
  Video,
  Award,
  Search,
  Lock,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 课程分类
const categories = [
  { id: "all", name: "全部课程" },
  { id: "beginner", name: "入门" },
  { id: "intermediate", name: "进阶" },
  { id: "advanced", name: "高级" },
  { id: "ai", name: "AI 专题" },
  { id: "integration", name: "集成" },
];

// 课程数据
const courses = [
  {
    id: "getting-started",
    title: "AgentFlow 入门指南",
    description: "从零开始学习 AgentFlow，掌握工作流创建的基础知识",
    thumbnail: "/images/courses/getting-started.jpg",
    duration: "45 分钟",
    lessons: 8,
    level: "beginner",
    rating: 4.9,
    students: 12500,
    instructor: "AgentFlow 团队",
    free: true,
    featured: true,
    topics: ["基础概念", "界面介绍", "第一个工作流", "节点配置"],
  },
  {
    id: "ai-agent-mastery",
    title: "AI Agent 完全指南",
    description: "深入学习如何在工作流中集成和使用 AI Agent",
    thumbnail: "/images/courses/ai-agent.jpg",
    duration: "2 小时",
    lessons: 15,
    level: "intermediate",
    rating: 4.8,
    students: 8200,
    instructor: "李明",
    free: false,
    featured: true,
    topics: ["AI 模型选择", "Prompt 工程", "上下文管理", "输出解析"],
  },
  {
    id: "automation-workflows",
    title: "企业自动化实战",
    description: "学习如何构建企业级自动化工作流，提升团队效率",
    thumbnail: "/images/courses/automation.jpg",
    duration: "3 小时",
    lessons: 20,
    level: "intermediate",
    rating: 4.7,
    students: 5600,
    instructor: "王芳",
    free: false,
    featured: false,
    topics: ["流程分析", "错误处理", "监控告警", "最佳实践"],
  },
  {
    id: "api-integration",
    title: "API 集成开发",
    description: "掌握 AgentFlow API，实现自定义集成和自动化",
    thumbnail: "/images/courses/api.jpg",
    duration: "2.5 小时",
    lessons: 18,
    level: "advanced",
    rating: 4.9,
    students: 3400,
    instructor: "张伟",
    free: false,
    featured: false,
    topics: ["REST API", "Webhook", "SDK 使用", "自定义节点"],
  },
  {
    id: "data-processing",
    title: "数据处理与转换",
    description: "学习数据清洗、转换和处理的高级技巧",
    thumbnail: "/images/courses/data.jpg",
    duration: "1.5 小时",
    lessons: 12,
    level: "intermediate",
    rating: 4.6,
    students: 4100,
    instructor: "刘洋",
    free: true,
    featured: false,
    topics: ["JSON 处理", "数据映射", "批量操作", "数据验证"],
  },
  {
    id: "security-compliance",
    title: "安全与合规",
    description: "了解工作流安全最佳实践和合规要求",
    thumbnail: "/images/courses/security.jpg",
    duration: "1 小时",
    lessons: 10,
    level: "advanced",
    rating: 4.8,
    students: 2800,
    instructor: "陈静",
    free: false,
    featured: false,
    topics: ["认证授权", "数据加密", "审计日志", "合规检查"],
  },
];

// 学习路径
const learningPaths = [
  {
    id: "beginner",
    title: "初学者路径",
    description: "适合刚接触 AgentFlow 的新用户",
    courses: 4,
    duration: "6 小时",
    color: "#4e8fff",
  },
  {
    id: "developer",
    title: "开发者路径",
    description: "面向需要 API 集成的开发者",
    courses: 5,
    duration: "10 小时",
    color: "#3B82F6",
  },
  {
    id: "enterprise",
    title: "企业用户路径",
    description: "企业级自动化与团队协作",
    courses: 6,
    duration: "12 小时",
    color: "#8B5CF6",
  },
];

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === "all" || course.level === selectedCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredCourses = courses.filter((c) => c.featured);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <GraduationCap className="h-4 w-4" />
            学习中心
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            掌握 AI 工作流
            <br />
            <span className="text-[#4e8fff]">从入门到精通</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
            通过系统化的视频课程和实践项目，快速提升您的 AgentFlow 技能
          </p>

          {/* 搜索 */}
          <div className="max-w-xl mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-lighter" />
            <Input
              placeholder="搜索课程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-4 rounded-full bg-surface-100/30 border-border/30 text-[15px]"
            />
          </div>

          {/* 统计 */}
          <div className="flex flex-wrap justify-center gap-8 text-[12px]">
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Video className="w-4 h-4 text-[#4e8fff]" />
              <span><strong className="text-foreground">{courses.length}</strong> 门课程</span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Users className="w-4 h-4 text-[#4e8fff]" />
              <span><strong className="text-foreground">50,000+</strong> 学员</span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Clock className="w-4 h-4 text-[#4e8fff]" />
              <span><strong className="text-foreground">15+</strong> 小时内容</span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Award className="w-4 h-4 text-[#4e8fff]" />
              <span><strong className="text-foreground">4.8</strong> 平均评分</span>
            </div>
          </div>
        </div>
      </section>

      {/* 学习路径 */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <h2 className="lobe-section-header mb-6">推荐学习路径</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {learningPaths.map((path) => (
              <Link
                key={path.id}
                href={`/learn/path/${path.id}`}
                className={cn(
                  "group p-5 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-[#4e8fff]/30 hover:shadow-lg",
                  "transition-all"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${path.color}15` }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: path.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-[#4e8fff] transition-colors">
                      {path.title}
                    </h3>
                    <p className="text-[11px] text-foreground-lighter">
                      {path.courses} 门课程 · {path.duration}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-foreground-light">{path.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 精选课程 */}
      {!searchQuery && selectedCategory === "all" && (
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-[#4e8fff]" />
              <h2 className="lobe-section-header">精选课程</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn/courses/${course.id}`}
                  className={cn(
                    "group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl",
                    "bg-surface-100/30 border border-[#4e8fff]/30",
                    "hover:shadow-lg hover:shadow-[#4e8fff]/10",
                    "transition-all"
                  )}
                >
                  {/* 缩略图 */}
                  <div className="relative w-full sm:w-48 h-32 rounded-xl bg-surface-100/50 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4e8fff]/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-[#4e8fff] ml-1" />
                      </div>
                    </div>
                    {course.free && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
                        免费
                      </span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-[#4e8fff] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-[13px] text-foreground-light mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-foreground-lighter">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {course.lessons} 节课
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {course.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 课程分类和列表 */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-medium transition-all",
                  selectedCategory === category.id
                    ? "bg-foreground text-background"
                    : "bg-surface-100/30 border border-border/30 text-foreground-lighter hover:text-foreground"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 课程网格 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/learn/courses/${course.id}`}
                className={cn(
                  "group flex flex-col rounded-2xl overflow-hidden",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-[#4e8fff]/30 hover:shadow-lg",
                  "transition-all"
                )}
              >
                {/* 缩略图 */}
                <div className="relative h-40 bg-surface-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4e8fff]/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-[#4e8fff] ml-1" />
                    </div>
                  </div>
                  {course.free ? (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
                      免费
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-foreground-lighter" />
                    </span>
                  )}
                </div>

                {/* 内容 */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full",
                      course.level === "beginner" && "bg-emerald-400/10 text-emerald-400",
                      course.level === "intermediate" && "bg-[#4e8fff]/10 text-[#4e8fff]",
                      course.level === "advanced" && "bg-purple-400/10 text-purple-400"
                    )}>
                      {course.level === "beginner" ? "入门" : course.level === "intermediate" ? "进阶" : "高级"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#4e8fff] transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-[13px] text-foreground-light mb-4 flex-1 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {course.lessons} 节
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[12px]">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-foreground">{course.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="w-12 h-12 text-foreground-lighter mx-auto mb-4" />
              <h3 className="text-[15px] font-medium text-foreground mb-2">没有找到相关课程</h3>
              <p className="text-[13px] text-foreground-light mb-6">尝试使用其他关键词或选择其他分类</p>
              <Button
                variant="outline"
                className="rounded-full border-border/50 text-foreground-light"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                查看全部课程
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4e8fff] to-[#2563eb] p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                开始您的学习之旅
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                加入超过 50,000 名学员，一起掌握 AI 工作流的强大能力
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/learn/path/beginner">
                  <Button className="h-12 px-8 bg-white hover:bg-white/90 text-[#4e8fff] font-medium rounded-full">
                    开始学习
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-full"
                  >
                    免费注册
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
