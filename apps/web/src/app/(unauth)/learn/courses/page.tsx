'use client'

/**
 * LearnCoursePage - LobeHub Style Design
 */

import { useState } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Course Categories
const categories = [
  { id: 'all', name: 'All Courses' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'ai', name: 'AI' },
  { id: 'integration', name: 'Integration' },
]

// Course Data
const courses = [
  {
    id: 'getting-started',
    title: 'AgentFlow Getting Started Guide',
    description: 'Learn AgentFlow from scratch and master the basics of workflow creation',
    thumbnail: '/images/courses/getting-started.jpg',
    duration: '45 min',
    lessons: 8,
    level: 'beginner',
    rating: 4.9,
    students: 12500,
    instructor: 'AgentFlow Team',
    free: true,
    featured: true,
    topics: ['Basic Concepts', 'Interface Tour', 'First Workflow', 'Node Configuration'],
  },
  {
    id: 'ai-agent-mastery',
    title: 'AI Agent Complete Guide',
    description: 'Learn how to integrate and use AI agents in your workflows',
    thumbnail: '/images/courses/ai-agent.jpg',
    duration: '2 h',
    lessons: 15,
    level: 'intermediate',
    rating: 4.8,
    students: 8200,
    instructor: 'Li Ming',
    free: false,
    featured: true,
    topics: ['AI Model Selection', 'Prompt Engineering', 'Context Management', 'Output Parsing'],
  },
  {
    id: 'automation-workflows',
    title: 'Enterprise Automation in Practice',
    description:
      'Learn how to build enterprise-grade automation workflows and boost team productivity',
    thumbnail: '/images/courses/automation.jpg',
    duration: '3 h',
    lessons: 20,
    level: 'intermediate',
    rating: 4.7,
    students: 5600,
    instructor: 'Wang Fang',
    free: false,
    featured: false,
    topics: ['Flow Analytics', 'Error Handling', 'Monitoring & Alerts', 'Best Practices'],
  },
  {
    id: 'api-integration',
    title: 'API Integration Development',
    description: 'Master the AgentFlow API to implement custom integrations and automation',
    thumbnail: '/images/courses/api.jpg',
    duration: '2.5 h',
    lessons: 18,
    level: 'advanced',
    rating: 4.9,
    students: 3400,
    instructor: 'Zhang Hao',
    free: false,
    featured: false,
    topics: ['REST API', 'Webhook', 'SDK Usage', 'Custom Nodes'],
  },
  {
    id: 'data-processing',
    title: 'Data Processing and Transformation',
    description: 'Learn advanced techniques for data cleaning, transformation, and processing',
    thumbnail: '/images/courses/data.jpg',
    duration: '1.5 h',
    lessons: 12,
    level: 'intermediate',
    rating: 4.6,
    students: 4100,
    instructor: 'Liu Yang',
    free: true,
    featured: false,
    topics: ['JSON Processing', 'Data Mapping', 'Batch Operations', 'Data Validation'],
  },
  {
    id: 'security-compliance',
    title: 'Security and Compliance',
    description: 'Workflow security best practices and compliance requirements',
    thumbnail: '/images/courses/security.jpg',
    duration: '1 h',
    lessons: 10,
    level: 'advanced',
    rating: 4.8,
    students: 2800,
    instructor: 'Chen Jing',
    free: false,
    featured: false,
    topics: [
      'Authentication & Authorization',
      'Data Encryption',
      'Audit Logs',
      'Compliance Checks',
    ],
  },
]

// Learning Paths
const learningPaths = [
  {
    id: 'beginner',
    title: 'Beginner Path',
    description: 'Perfect for new AgentFlow users',
    courses: 4,
    duration: '6 h',
    color: '#4e8fff',
  },
  {
    id: 'developer',
    title: 'Developer Path',
    description: 'For developers who need API integrations',
    courses: 5,
    duration: '10 h',
    color: '#3B82F6',
  },
  {
    id: 'enterprise',
    title: 'Enterprise Path',
    description: 'Enterprise-grade automation and team collaboration',
    courses: 6,
    duration: '12 h',
    color: '#8B5CF6',
  },
]

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = selectedCategory === 'all' || course.level === selectedCategory
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredCourses = courses.filter((c) => c.featured)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <GraduationCap className="h-4 w-4" />
            Learning Center
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Master AI Workflow
            <br />
            <span className="text-[#4e8fff]">From Beginner to Expert</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
            Quickly improve your AgentFlow skills through systematic video courses and hands-on
            exercises
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-lighter" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 pr-4 rounded-full bg-surface-100/30 border-border/30 text-[15px]"
            />
          </div>

          {/* Statistics */}
          <div className="flex flex-wrap justify-center gap-8 text-[12px]">
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Video className="w-4 h-4 text-[#4e8fff]" />
              <span>
                <strong className="text-foreground">{courses.length}</strong> Courses
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Users className="w-4 h-4 text-[#4e8fff]" />
              <span>
                <strong className="text-foreground">50,000+</strong> Students
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Clock className="w-4 h-4 text-[#4e8fff]" />
              <span>
                <strong className="text-foreground">15+</strong> Hours of Content
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground-lighter">
              <Award className="w-4 h-4 text-[#4e8fff]" />
              <span>
                <strong className="text-foreground">4.8</strong> Average Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <h2 className="lobe-section-header mb-6">Recommended Learning Paths</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {learningPaths.map((path) => (
              <Link
                key={path.id}
                href={`/learn/path/${path.id}`}
                className={cn(
                  'group p-5 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-[#4e8fff]/30 hover:shadow-lg',
                  'transition-all'
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
                      {path.courses} Courses · {path.duration}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-foreground-light">{path.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-[#4e8fff]" />
              <h2 className="lobe-section-header">Featured Courses</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/learn/courses/${course.id}`}
                  className={cn(
                    'group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl',
                    'bg-surface-100/30 border border-[#4e8fff]/30',
                    'hover:shadow-lg hover:shadow-[#4e8fff]/10',
                    'transition-all'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-48 h-32 rounded-xl bg-surface-100/50 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4e8fff]/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-[#4e8fff] ml-1" />
                      </div>
                    </div>
                    {course.free && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Info */}
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
                        {course.lessons} lessons
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

      {/* Course Categories and List */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-[12px] font-medium transition-all',
                  selectedCategory === category.id
                    ? 'bg-foreground text-background'
                    : 'bg-surface-100/30 border border-border/30 text-foreground-lighter hover:text-foreground'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/learn/courses/${course.id}`}
                className={cn(
                  'group flex flex-col rounded-2xl overflow-hidden',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-[#4e8fff]/30 hover:shadow-lg',
                  'transition-all'
                )}
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-surface-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4e8fff]/10 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-[#4e8fff] ml-1" />
                    </div>
                  </div>
                  {course.free ? (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
                      Free
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-foreground-lighter" />
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span
                      className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-full',
                        course.level === 'beginner' && 'bg-emerald-400/10 text-emerald-400',
                        course.level === 'intermediate' && 'bg-[#4e8fff]/10 text-[#4e8fff]',
                        course.level === 'advanced' && 'bg-purple-400/10 text-purple-400'
                      )}
                    >
                      {course.level === 'beginner'
                        ? 'Beginner'
                        : course.level === 'intermediate'
                          ? 'Intermediate'
                          : 'Advanced'}
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
                        {course.lessons} lessons
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
              <h3 className="text-[15px] font-medium text-foreground mb-2">
                No matching courses found
              </h3>
              <p className="text-[13px] text-foreground-light mb-6">
                Try using different keywords or selecting another category
              </p>
              <Button
                variant="outline"
                className="rounded-full border-border/50 text-foreground-light"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
              >
                View All Courses
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
                Start Your Learning Journey
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Join over 50,000 learners and master the full power of AI workflows
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/learn/path/beginner">
                  <Button className="h-12 px-8 bg-white hover:bg-white/90 text-[#4e8fff] font-medium rounded-full">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-full"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
