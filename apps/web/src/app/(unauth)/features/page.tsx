'use client'

/**
 * FeaturesIntroductionPage - LobeHub Style
 */

import Link from 'next/link'
import {
  Bot,
  GitBranch,
  Puzzle,
  Layers,
  Shield,
  Globe,
  Zap,
  Clock,
  Users,
  Code,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Database,
  Lock,
  Settings,
  BarChart3,
  MessageSquare,
  Repeat,
  Terminal,
  Webhook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Core Features
const coreFeatures = [
  {
    icon: Bot,
    title: 'Smart AI Agent',
    description:
      'Smart agents powered by GPT-4, Claude 3, and other large language models that understand complex requirements and automatically execute multi-step tasks.',
    highlights: [
      'Natural Language Interaction',
      'Context Understanding',
      'Autonomous Decision Making',
    ],
  },
  {
    icon: GitBranch,
    title: 'Visual Workflow Editor',
    description:
      'Intuitive drag-and-drop editor that lets you build complex automation flows without writing any code.',
    highlights: ['Drag & Drop', 'Real-time Preview', 'Version Control'],
  },
  {
    icon: Puzzle,
    title: '100+ Integrations',
    description:
      'Seamlessly integrate with major SaaS services, databases, and APIs — all your work tools in one place.',
    highlights: ['One-Click Connect', 'OAuth Authentication', 'Custom Integrations'],
  },
  {
    icon: Layers,
    title: 'Template Marketplace',
    description:
      'Thousands of verified workflow templates covering various industries and scenarios, ready to deploy with one click.',
    highlights: ['Community Contributed', 'Quality Verified', 'Continuously Updated'],
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description:
      'SOC 2 Type II certified, end-to-end encryption, advanced permission management, and comprehensive audit logs.',
    highlights: ['Data Encryption', 'Role-Based Permissions', 'Audit Logs'],
  },
  {
    icon: Globe,
    title: 'Global Deployment',
    description:
      'Multi-region data center deployment ensuring low-latency access and 99.99% service availability.',
    highlights: ['Multi-Region Deployment', 'Auto Scaling', 'Disaster Recovery'],
  },
]

// Advanced Features
const advancedFeatures = [
  {
    icon: Repeat,
    title: 'Multi-Agent Collaboration',
    description: 'Multiple AI agents working together to handle complex multi-step tasks',
  },
  {
    icon: Terminal,
    title: 'Custom Code Nodes',
    description: 'Create custom logic nodes using JavaScript or Python',
  },
  {
    icon: Webhook,
    title: 'Webhook Trigger',
    description: 'Flexible Webhook support for easy integration with external systems',
  },
  {
    icon: Database,
    title: 'Data Transformation',
    description: 'Powerful data mapping and transformation capabilities for any data format',
  },
  {
    icon: BarChart3,
    title: 'Execution Analytics',
    description:
      'Detailed execution logs and performance analytics to optimize workflow efficiency',
  },
  {
    icon: Clock,
    title: 'Scheduled Tasks',
    description: 'Flexible Cron expression support for precise control over execution timing',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time multi-user collaborative editing with shared workflows and templates',
  },
  {
    icon: Lock,
    title: 'Sensitive Data Protection',
    description:
      'Encrypted credential storage with support for environment variables and key management',
  },
]

// AI Capabilities
const aiCapabilities = [
  {
    title: 'Natural Language Processing',
    description:
      'Understand and process various language tasks including text analysis, sentiment analysis, and entity extraction',
    icon: MessageSquare,
  },
  {
    title: 'Smart Decision Making',
    description:
      'Automatically make decisions based on context and select the optimal execution path',
    icon: Sparkles,
  },
  {
    title: 'Code Generation',
    description: 'Automatically generate code snippets to help developers improve efficiency',
    icon: Code,
  },
  {
    title: 'Data Analytics',
    description: 'Intelligently analyze data and generate insight reports',
    icon: BarChart3,
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powerful Features, Unlimited Possibilities</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            Built for Modern Teams
            <br />
            <span className="gradient-text-brand">AI Automation Platform</span>
          </h1>

          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            AgentFlow provides a complete automation solution, from simple task automation to
            complex enterprise-grade workflows, meeting all your needs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50"
              >
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>Core Features</h2>
            <p>A powerful and flexible feature set for building any automation scenario</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  'group p-6 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon className="w-5 h-5 text-foreground-light" />
                </div>

                <h3 className="text-[15px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[13px] text-foreground-lighter mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-center gap-2 text-[12px] text-foreground-lighter"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-foreground-light" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="lobe-badge mb-6">
                <Bot className="h-3.5 w-3.5" />
                <span>AI-Driven</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
                Powerful AI Capabilities
              </h2>
              <p className="text-foreground-light mb-8 leading-relaxed">
                Cutting-edge AI capabilities make your workflows smarter and more efficient.
                Supports multiple large language models including GPT-4, Claude 3, Qwen, and more.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {aiCapabilities.map((capability) => (
                  <div
                    key={capability.title}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface-100/30 border border-border/30"
                  >
                    <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center shrink-0">
                      <capability.icon className="w-4 h-4 text-foreground-light" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-foreground mb-1">
                        {capability.title}
                      </h4>
                      <p className="text-[12px] text-foreground-lighter leading-relaxed">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Demo Visual */}
            <div className="relative">
              <div className="rounded-2xl border border-border/30 bg-surface-100/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-foreground-light" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-foreground">AI Agent</h4>
                    <p className="text-[12px] text-foreground-lighter">Processing task...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-200/30 border border-border/20">
                    <p className="text-[11px] text-foreground-lighter mb-2 uppercase tracking-widest font-medium">
                      Input
                    </p>
                    <p className="text-[14px] text-foreground">
                      &quot;Analyze this sales report and identify key trends&quot;
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-200/30 border border-brand-300/30">
                    <p className="text-[11px] text-brand-500 mb-2 uppercase tracking-widest font-medium">
                      AI Output
                    </p>
                    <p className="text-[13px] text-foreground-light leading-relaxed">
                      Based on the analysis, sales grew 23% this quarter, mainly driven by the new
                      product line. We suggest focusing on regional growth opportunities...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>More Advanced Features</h2>
            <p>Advanced capabilities for professional users and enterprise requirements</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  'p-5 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/60 hover:border-border/60',
                  'transition-all duration-300'
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center mb-4">
                  <feature.icon className="w-4 h-4 text-foreground-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[12px] text-foreground-lighter leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-foreground-light mb-10">
            Start using AgentFlow for free and explore the unlimited possibilities of AI automation
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
