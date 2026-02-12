'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Database,
  Layout,
  Zap,
  Globe,
  Shield,
  Sparkles,
  ChevronRight,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Agent',
    description:
      'Describe what you want to build in natural language. The AI Agent understands your intent and creates everything automatically.',
  },
  {
    icon: Database,
    title: 'Instant Database',
    description:
      'Tables, columns, relations, and seed data — all generated from your description. Full SQL access when you need it.',
  },
  {
    icon: Layout,
    title: 'Auto-Generated UI',
    description:
      'Beautiful, responsive interfaces built from your data. Forms, tables, charts, and detail views — ready to use.',
  },
  {
    icon: Globe,
    title: 'One-Click Publish',
    description:
      'Go live instantly. Your app gets a public URL, authentication, and runtime data access — no deployment needed.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description:
      'Fine-grained access control per user. Define policies that automatically filter data based on who is logged in.',
  },
  {
    icon: Zap,
    title: 'Skills & Extensibility',
    description:
      'Extend the AI Agent with custom skills. Teach it domain-specific patterns to build exactly what you need.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Describe your app',
    description:
      'Tell the AI Agent what you want — "Build me a project management tool with tasks, team members, and deadlines."',
  },
  {
    step: '02',
    title: 'AI builds everything',
    description:
      'The agent creates your database schema, generates a complete UI with navigation, and wires up the data layer.',
  },
  {
    step: '03',
    title: 'Publish & share',
    description:
      'Hit publish and your app is live. Share the link, invite users, or embed it anywhere.',
  },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-linear-to-b from-primary/7 via-primary/3 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-linear-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-60 right-1/4 w-[300px] h-[300px] bg-linear-to-bl from-violet-500/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/12 mb-8 transition-all duration-700',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-medium text-primary">AI-Powered App Platform</span>
          </div>

          {/* Headline */}
          <h1
            className={cn(
              'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] mb-6 transition-all duration-700 delay-100',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Describe your app.
            <br />
            <span className="bg-linear-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
              AI builds it.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={cn(
              'max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 transition-all duration-700 delay-200',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            ReverseAI turns your ideas into live web applications. The AI Agent creates the
            database, generates the UI, and publishes — all from a single conversation.
          </p>

          {/* CTA Buttons */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-lg shadow-foreground/10"
              >
                Start Building Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full text-[15px] font-medium border-border/60 hover:bg-muted/50 gap-2"
              >
                <Play className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          </div>

          {/* Hero Visual — Terminal-like preview */}
          <div
            className={cn(
              'mt-16 md:mt-20 max-w-3xl mx-auto transition-all duration-1000 delay-500',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="rounded-2xl border border-border/50 bg-muted/30 backdrop-blur-sm shadow-2xl shadow-black/5 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[12px] text-muted-foreground font-mono">
                    ReverseAI Agent
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-6 md:p-8 space-y-4 font-mono text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] text-primary font-bold">U</span>
                  </div>
                  <p className="text-[14px] text-foreground leading-relaxed">
                    Build me a project tracker with tasks, deadlines, team members, and a dashboard
                    showing progress stats.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-[14px] text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      <span className="text-emerald-500">✓</span> Created tables:{' '}
                      <span className="text-foreground">tasks</span>,{' '}
                      <span className="text-foreground">team_members</span>,{' '}
                      <span className="text-foreground">projects</span>
                    </p>
                    <p>
                      <span className="text-emerald-500">✓</span> Generated UI: dashboard with
                      stats, task list, team view
                    </p>
                    <p>
                      <span className="text-emerald-500">✓</span> App published at{' '}
                      <span className="text-primary underline">your-app.reverseai.app</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Three steps. One conversation.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              No coding, no configuration files, no deployment pipelines.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((item, i) => (
              <div key={item.step} className="relative group">
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-6 top-8 w-5 h-5 text-border" />
                )}
                <div className="text-5xl font-bold text-muted-foreground/20 mb-4 tracking-tighter">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 border-t border-border/30 bg-muted/20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Everything you need, built in
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From database to deployment — a complete platform powered by AI.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border/40 bg-background/60 hover:bg-background hover:border-border/60 hover:shadow-lg hover:shadow-black/3 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-[16px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 md:py-28 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Ready to build?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start a conversation with the AI Agent and watch your app come to life.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 px-10 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-lg shadow-foreground/10"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
