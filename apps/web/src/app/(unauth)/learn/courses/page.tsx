"use client";

/**
 * 学习课程页面

 * Manus 风格：简约、专业、教育导航 */

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,

  Play,

  Clock,

  Star,

  Users,

  ChevronRight,

  ArrowRight,

  BookOpen,

  Video,

  Award,

  Filter,

  Search,

  CheckCircle,

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

    description: "从零开始学?AgentFlow，掌握工作流创建的基础知识",

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

    topics: ["AI 模型选择", "Prompt 工程", "上下文管理, "输出解析"],

  },

  {
    id: "automation-workflows",

    title: "企业自动化实?", description: "学习如何构建企业级自动化工作流，提升团队效率",

    thumbnail: "/images/courses/automation.jpg",

    duration: "3 小时",

    lessons: 20,

    level: "intermediate",

    rating: 4.7,

    students: 5600,

    instructor: "王芳",

    free: false,

    featured: false,

    topics: ["流程分析", "错误处理", "监控告警", "最佳实?],

  },

  {
    id: "api-integration",

    title: "API 集成开始", description: "掌握 AgentFlow API，实现自定义集成和自动化",

    thumbnail: "/images/courses/api.jpg",

    duration: "2.5 小时",

    lessons: 18,

    level: "advanced",

    rating: 4.9,

    students: 3400,

    instructor: "张伟",

    free: false,

    featured: false,

    topics: ["REST API", "Webhook", "SDK 使用", "自定义节?],

  },

  {
    id: "data-processing",

    title: "数据处理与转?", description: "学习数据清洗、转换和处理的高级技?,

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

    title: "安全与合规", description: "了解工作流安全最佳实践和合规要求",

    thumbnail: "/images/courses/security.jpg",

    duration: "1 小时",

    lessons: 10,

    level: "advanced",

    rating: 4.8,

    students: 2800,

    instructor: "陈静",

    free: false,

    featured: false,

    topics: ["认证授权", "数据加密", "审计日志", "合规检?],

  },

];

// 学习路径

const learningPaths = [

  {
    id: "beginner",

    title: "初学者路径", description: "适合刚接?AgentFlow 的新用户",

    courses: 4,

    duration: "6 小时",

    color: "primary",

  },

  {
    id: "developer",

    title: "开发者路径", description: "面向需?API 集成的开发?,

    courses: 5", duration: "10 小时",

    color: "#3B82F6",

  },

  {
    id: "enterprise",

    title: "企业用户路径",

    description: "企业级自动化和团队协?,

    courses: 6", duration: "12 小时",

    color: "#8B5CF6",

  },

];

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");

  // 筛选课?  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === "all" || course.level === selectedCategory;

    const matchesSearch =

      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||

      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;

  });

  // 精选课?  const featuredCourses = courses.filter((c) => c.featured);

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

            <GraduationCap className="h-4 w-4" />

            学习中心

          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">

            掌握 AI 工作?            <br />

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              从入门到精?            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">

            通过系统化的视频课程和实践项目，快速提升您?AgentFlow 技?          </p>

          {/* 搜搜索 */}

          <div className="max-w-xl mx-auto relative mb-8">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

            <Input

              placeholder="搜搜索课程..."

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              className="h-14 pl-12 pr-4 rounded-xl bg-card border-border text-lg"

            />

          </div>

          {/* 统计 */}

          <div className="flex flex-wrap justify-center gap-8 text-sm">

            <div className="flex items-center gap-2 text-muted-foreground">

              <Video className="w-4 h-4 text-primary" />

              <span><strong className="text-foreground">{courses.length}</strong> 门课?/span>

            </div>

            <div className="flex items-center gap-2 text-muted-foreground">

              <Users className="w-4 h-4 text-primary" />

              <span><strong className="text-foreground">50,000+</strong> 学员</span>

            </div>

            <div className="flex items-center gap-2 text-muted-foreground">

              <Clock className="w-4 h-4 text-primary" />

              <span><strong className="text-foreground">15+</strong> 小时内容</span>

            </div>

            <div className="flex items-center gap-2 text-muted-foreground">

              <Award className="w-4 h-4 text-primary" />

              <span><strong className="text-foreground">4.8</strong> 平均评分</span>

            </div>

          </div>

        </div>

      </section>

      {/* 学习路径 */}

      <section className="py-12 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-xl font-bold text-foreground mb-6">推荐学习路径</h2>

          <div className="grid md:grid-cols-3 gap-4">

            {learningPaths.map((path) => (
              <Link

                key={path.id}

                href={`/learn/path/${path.id}`}

                className={cn(
                  "group p-5 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

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

                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">

                      {path.title}

                    </h3>

                    <p className="text-xs text-muted-foreground">

                      {path.courses} 门课?· {path.duration}

                    </p>

                  </div>

                </div>

                <p className="text-sm text-muted-foreground">

                  {path.description}

                </p>

              </Link>

            ))}

          </div>

        </div>

      </section>

      {/* 精选课?*/}

      {!searchQuery && selectedCategory === "all" && (
        <section className="py-16 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="flex items-center gap-2 mb-6">

              <Star className="w-5 h-5 text-primary" />

              <h2 className="text-xl font-bold text-foreground">精选课?/h2>

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {featuredCourses.map((course) => (
                <Link

                  key={course.id}

                  href={`/learn/courses/${course.id}`}

                  className={cn(
                    "group flex flex-col sm:flex-row gap-4 p-4 rounded-xl",

                    "bg-card border border-primary/30",

                    "hover:shadow-lg hover:shadow-primary/10",

                    "transition-all"

                  )}

                >

                  {/* 缩略?*/}

                  <div className="relative w-full sm:w-48 h-32 rounded-lg bg-muted overflow-hidden shrink-0">

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center">

                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">

                        <Play className="w-5 h-5 text-primary ml-1" />

                      </div>

                    </div>

                    {course.free && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium">

                        免费

                      </span>

                    )}

                  </div>

                  {/* 信息 */}

                  <div className="flex-1">

                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">

                      {course.title}

                    </h3>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">

                      {course.description}

                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">

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

      {/* 课程分类和列表*/}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          {/* 分类筛?*/}

          <div className="flex flex-wrap gap-2 mb-8">

            {categories.map((category) => (
              <button

                key={category.id}

                onClick={() => setSelectedCategory(category.id)}

                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",

                  selectedCategory === category.id

                    ? "bg-primary text-primary-foreground"

                    : "bg-card border border-border text-muted-foreground hover:text-foreground"

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
                  "group flex flex-col rounded-xl overflow-hidden",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all"

                )}

              >

                {/* 缩略?*/}

                <div className="relative h-40 bg-muted">

                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center">

                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">

                      <Play className="w-6 h-6 text-primary ml-1" />

                    </div>

                  </div>

                  {course.free ? (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium">

                      免费

                    </span>

                  ) : (
                    <span className="absolute top-3 right-3">

                      <Lock className="w-4 h-4 text-muted-foreground" />

                    </span>

                  )}

                </div>

                {/* 内容 */}

                <div className="p-5 flex-1 flex flex-col">

                  <div className="mb-2">

                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",

                      course.level === "beginner" && "bg-green-500/10 text-green-500",

                      course.level === "intermediate" && "bg-blue-500/10 text-blue-500",

                      course.level === "advanced" && "bg-purple-500/10 text-purple-500"

                    )}>

                      {course.level === "beginner" ? "入门" : course.level === "intermediate" ? "进阶" : "高级"}

                    </span>

                  </div>

                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">

                    {course.title}

                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">

                    {course.description}

                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">

                      <span className="flex items-center gap-1">

                        <Clock className="w-3 h-3" />

                        {course.duration}

                      </span>

                      <span className="flex items-center gap-1">

                        <Video className="w-3 h-3" />

                        {course.lessons} ?                      </span>

                    </div>

                    <div className="flex items-center gap-1 text-sm">

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

              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

              <h3 className="text-lg font-medium text-foreground mb-2">

                没有找到相关课程

              </h3>

              <p className="text-muted-foreground mb-6">

                尝试使用其他关键词或选择其他分类

              </p>

              <Button

                variant="outline"

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

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">

                <Zap className="w-8 h-8 text-white" />

              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">

                开始您的学习之?              </h2>

              <p className="text-white/80 mb-8 max-w-md mx-auto">

                加入超过 50,000 名学员，一起掌?AI 工作流的强大能力

              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                <Link href="/learn/path/beginner">

                  <Button className="h-12 px-8 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl">

                    开始学?                    <ArrowRight className="ml-2 h-4 w-4" />

                  </Button>

                </Link>

                <Link href="/register">

                  <Button

                    variant="outline"

                    className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-xl"

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

