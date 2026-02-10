'use client'

/**
 * Home - AgentFlow page
 * LobeHub Style: Dark Theme, Large Whitespace, Gradient Decoration, Modern Design
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Workflow,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Sparkles,
  Bot,
  GitBranch,
  Layers,
  CheckCircle,
  Star,
  Users,
  Code,
  Puzzle,
  MessageSquare,
  Rocket,
  Settings,
  Database,
  ChevronDown,
  Building2,
  ShoppingCart,
  GraduationCap,
  HeartPulse,
  Plus,
  Minus,
  TrendingUp,
  Github,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

// Core Features
const features = [
  {
    icon: Bot,
    title: 'Smart AI Agent',
    description:
      'Smart agents powered by large language models that automatically understand requirements and execute complex tasks',
  },
  {
    icon: GitBranch,
    title: 'Visual Workflow Builder',
    description: 'Drag-and-drop editing to easily build and manage automation workflows',
  },
  {
    icon: Puzzle,
    title: 'Rich Integrations',
    description: 'Seamless integration with 100+ popular services and APIs',
  },
  {
    icon: Layers,
    title: 'Template Marketplace',
    description: 'Thousands of verified workflow templates ready for one-click deployment',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 certified, end-to-end encryption, and advanced permission management',
  },
  {
    icon: Globe,
    title: 'Global Deployment',
    description: 'Multi-region deployment, low-latency access, and 99.99% uptime guarantee',
  },
]

// Data Statistics
const stats = [
  { value: '50,000+', label: 'Active Users' },
  { value: '1M+', label: 'Workflows Executed' },
  { value: '99.99%', label: 'Service Uptime' },
  { value: '100+', label: 'Integrations' },
]

// Workflow Steps
const workflowSteps = [
  {
    step: 1,
    title: 'Describe Your Requirements',
    description: 'Use natural language to tell AI what you want to accomplish',
    icon: MessageSquare,
  },
  {
    step: 2,
    title: 'AI Generates Workflow',
    description: 'Smart assistant automatically designs the workflow architecture',
    icon: Bot,
  },
  {
    step: 3,
    title: 'Visual Adjustments',
    description: 'Fine-tune and optimize the flow through drag-and-drop editing',
    icon: Settings,
  },
  {
    step: 4,
    title: 'One-Click Deploy',
    description: 'Deploy to the cloud with automatic trigger execution',
    icon: Rocket,
  },
]

// Customer Reviews
const testimonials = [
  {
    content:
      'AgentFlow transformed how we work. Data processing tasks that used to take a team an entire week now only take minutes.',
    author: 'Zhang Wei',
    role: 'CTO',
    company: 'Startup',
    avatar: 'Z',
  },
  {
    content:
      'The visual editor is amazing — it allows colleagues with no programming background to quickly create automation flows.',
    author: 'Li Hua',
    role: 'Product Manager',
    company: 'E-commerce Platform',
    avatar: 'L',
  },
  {
    content:
      'The intelligence of the AI Agent exceeded our expectations — it can understand our business logic and provide optimization suggestions.',
    author: 'Wang Fang',
    role: 'Operations Director',
    company: 'Financial Services',
    avatar: 'W',
  },
  {
    content:
      "The template marketplace has a massive selection of workflows. Using them directly satisfies 80% of our needs — it's incredibly convenient.",
    author: 'Chen Wei',
    role: 'Freelancer',
    company: 'Independent',
    avatar: 'C',
  },
  {
    content:
      'Enterprise-grade security assurance gave us the confidence to migrate our core business workflows to AgentFlow.',
    author: 'Zhao Li',
    role: 'Security Lead',
    company: 'Enterprise Corp',
    avatar: 'ZL',
  },
  {
    content:
      'The customer support team is incredibly responsive — every issue gets resolved within 24 hours.',
    author: 'Sun Qiang',
    role: 'IT Manager',
    company: 'Manufacturing Co.',
    avatar: 'S',
  },
]

// Partners / Customers
const partners = [
  { name: 'TechCorp', logo: 'TC' },
  { name: 'InnovateLabs', logo: 'IL' },
  { name: 'DataFlow', logo: 'DF' },
  { name: 'CloudNine', logo: 'C9' },
  { name: 'AIVentures', logo: 'AV' },
  { name: 'SmartSystems', logo: 'SS' },
  { name: 'FutureTech', logo: 'FT' },
  { name: 'DigitalWave', logo: 'DW' },
]

// Use Case Scenarios
const useCases = [
  {
    icon: ShoppingCart,
    title: 'E-commerce Operations',
    description: 'Automated order processing, inventory management, and customer notifications',
    metrics: 'Efficiency improved by 300%',
  },
  {
    icon: Building2,
    title: 'Enterprise Office',
    description: 'Approval workflows, daily scheduling, and report generation',
    metrics: 'Saves 40 hours/week',
  },
  {
    icon: TrendingUp,
    title: 'Marketing Automation',
    description: 'Multi-channel content publishing, data analytics, and lead follow-up',
    metrics: 'Conversion rate improved by 150%',
  },
  {
    icon: HeartPulse,
    title: 'Healthcare',
    description: 'Appointment management, patient tracking, and data archiving',
    metrics: 'Process efficiency improved by 200%',
  },
  {
    icon: GraduationCap,
    title: 'Education & Training',
    description: 'Course management, notifications, and certificate distribution',
    metrics: 'Management efficiency improved by 250%',
  },
  {
    icon: Shield,
    title: 'Financial Services',
    description: 'Risk control reviews, report generation, and compliance checks',
    metrics: 'Risk reduced by 60%',
  },
]

// FAQ Data
const faqs = [
  {
    question: 'What size companies is AgentFlow suitable for?',
    answer:
      'AgentFlow is suitable for companies of all sizes. From individual users to large enterprises, we offer flexible plans. The free version is great for individuals and small teams getting started, while the enterprise version provides advanced features, larger usage limits, and dedicated support.',
  },
  {
    question: 'Do I need programming skills to use AgentFlow?',
    answer:
      "Not at all! AgentFlow's visual editor lets anyone create workflows through drag-and-drop. Additionally, our AI assistant can automatically generate workflows based on natural language descriptions.",
  },
  {
    question: 'How is data security ensured?',
    answer:
      'We take data security very seriously. AgentFlow is SOC 2 Type II certified, all data transfers use TLS 1.3 encryption, and data at rest is protected with AES-256 encryption.',
  },
  {
    question: 'Can AgentFlow integrate with existing systems?',
    answer:
      'Absolutely! AgentFlow supports native integration with 100+ popular services, including Slack, Microsoft Teams, Notion, GitHub, and more. It also supports integration with any custom system via Webhooks and APIs.',
  },
  {
    question: 'What are the limitations of the free trial?',
    answer:
      'The free trial lasts 14 days, during which you can access all professional features with no credit card required. After the trial ends, you can continue using the free tier or upgrade to a paid plan.',
  },
  {
    question: 'How can I get technical support?',
    answer:
      'We provide multiple support channels: online documentation and tutorials, community forums, and email support (24-hour response time). Paid users also receive priority technical support, and enterprise users get a dedicated account manager.',
  },
]

// Integration Service Icons
const integrations = [
  'OpenAI',
  'Claude',
  'Slack',
  'Feishu',
  'GitHub',
  'Notion',
  'Shopify',
  'Stripe',
  'MySQL',
  'PostgreSQL',
  'Redis',
  'AWS',
]

// Supported Models
const aiModels = [
  { name: 'OpenAI', label: 'GPT-4' },
  { name: 'Anthropic', label: 'Claude' },
  { name: 'Google', label: 'Gemini' },
  { name: 'Meta', label: 'LLaMA' },
  { name: 'Mistral', label: 'Mistral' },
  { name: 'Ollama', label: 'Ollama' },
]

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  useEffect(() => {
    setIsLoaded(true)
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length)
    }, 3000)
    return () => clearInterval(stepInterval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader />

      {/* ============================================
 HERO SECTION - LobeHub Style
 ============================================ */}
      <section className="relative pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28 overflow-hidden">
        {/* Gradient Background Decoration */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial pointer-events-none opacity-60" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* News Badge */}
          <Link
            href="/blog"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10',
              'bg-surface-200/60 border border-border/50',
              'text-[13px] text-foreground-light',
              'hover:bg-surface-300/60 transition-all duration-300',
              'transition-all duration-700',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-500 text-[11px] font-medium">
              News
            </span>
            <span>AI Agent 2.0 is here — smarter and more powerful than ever</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {/* Main Title */}
          <h1
            className={cn(
              'text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]',
              'transition-all duration-700 delay-100',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <span className="text-foreground">Built for you</span>
            <br />
            <span className="gradient-text-brand">The Super Individual</span>
          </h1>

          {/* Subtitle */}
          <p
            className={cn(
              'text-lg sm:text-xl text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed',
              'transition-all duration-700 delay-200',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            AgentFlow assembles your AI team: Flexibly customize smart agent features based on your
            personalized requirements, solve problems, boost productivity, and explore new ways to
            work
          </p>

          {/* CTA Button */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-4',
              'transition-all duration-700 delay-300',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Link href="/register">
              <Button
                className={cn(
                  'h-12 px-8 rounded-full text-[15px] font-medium',
                  'bg-foreground text-background',
                  'hover:bg-foreground/90',
                  'transition-all duration-200',
                  'shadow-lg shadow-white/5'
                )}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'h-12 px-8 rounded-full text-[15px] font-medium',
                'bg-surface-200/50 border border-border/50 text-foreground',
                'hover:bg-surface-300/50 hover:border-border-strong',
                'transition-all duration-200',
                'inline-flex items-center gap-2'
              )}
            >
              <Github className="w-4 h-4" />
              GitHub
              <span className="text-foreground-lighter text-[13px]">15K+</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
 Overview Tags Card - LobeHub Style
 ============================================ */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Model Support Banner */}
          <div className="flex items-center justify-center gap-2 mb-16 flex-wrap">
            <span className="text-[13px] text-foreground-lighter mr-2">Powered by</span>
            {aiModels.map((model) => (
              <div
                key={model.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100/50 border border-border/30 text-[12px] text-foreground-light"
              >
                <div className="w-4 h-4 rounded-full bg-surface-300 flex items-center justify-center text-[8px] font-bold">
                  {model.name[0]}
                </div>
                {model.label}
              </div>
            ))}
          </div>

          {/* Data Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Card Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className={cn(
                    'group relative p-6 rounded-2xl',
                    'bg-surface-100/30 border border-border/30',
                    'hover:bg-surface-100/60 hover:border-border/60',
                    'transition-all duration-300'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-foreground-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] text-foreground-lighter leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
 Workflow - LobeHub Style
 ============================================ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <div className="lobe-badge mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              From idea to production in <span className="gradient-text-brand">just 4 steps</span>
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              No coding required — describe your needs in natural language and let AI handle the
              rest
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon
              const isActive = idx === activeStep
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    'relative p-6 rounded-2xl text-left transition-all duration-500',
                    isActive
                      ? 'bg-surface-200/80 border border-border/60 shadow-lg shadow-black/20'
                      : 'bg-surface-100/20 border border-transparent hover:bg-surface-100/40 hover:border-border/20'
                  )}
                >
                  {/* Step Number */}
                  <div
                    className={cn(
                      'text-[11px] font-medium uppercase tracking-widest mb-4 transition-colors duration-300',
                      isActive ? 'text-brand-500' : 'text-foreground-muted'
                    )}
                  >
                    Step {step.step}
                  </div>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300',
                      isActive
                        ? 'bg-foreground text-background'
                        : 'bg-surface-200/80 text-foreground-light'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-[13px] text-foreground-lighter leading-relaxed">
                    {step.description}
                  </p>

                  {/* Progress Bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-300/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/60 animate-[progressBar_3s_linear]"
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
 Usage Scenarios - LobeHub Style
 ============================================ */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Use Cases
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              From tool to partner — fully unleash the power of AI automation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, idx) => {
              const Icon = useCase.icon
              return (
                <div
                  key={idx}
                  className={cn(
                    'group p-6 rounded-2xl',
                    'bg-surface-100/30 border border-border/30',
                    'hover:bg-surface-100/60 hover:border-border/60',
                    'transition-all duration-300'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-foreground-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1">
                    {useCase.title}
                  </h3>
                  <p className="text-[13px] text-foreground-lighter mb-3 leading-relaxed">
                    {useCase.description}
                  </p>
                  <div className="text-[12px] font-medium text-brand-500">{useCase.metrics}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
 Integration Service - LobeHub Model Scroll Style
 ============================================ */}
      <section className="py-24 sm:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              100+ Integrations, <span className="gradient-text-brand">Seamlessly Connected</span>
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              Seamlessly integrate with the tools you already use
            </p>
          </div>
        </div>

        {/* Scrolling Logos */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex animate-scroll">
            {[...integrations, ...integrations].map((name, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3 px-6 py-4 mx-3 rounded-xl shrink-0',
                  'bg-surface-100/30 border border-border/20'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center text-[11px] font-bold text-foreground-lighter">
                  {name[0]}
                </div>
                <span className="text-[13px] text-foreground-light whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
 User Reviews - LobeHub Style
 ============================================ */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              A Community Built on User Stories
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              Real feedback from real users
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-6 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:bg-surface-100/50 hover:border-border/50',
                  'transition-all duration-300'
                )}
              >
                <p className="text-[14px] text-foreground-light leading-relaxed mb-5">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center text-[12px] font-bold text-foreground-light">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-[12px] text-foreground-lighter">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
 Brand - LobeHub Style
 ============================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[13px] text-foreground-muted text-center mb-10 uppercase tracking-widest font-medium">
            Trusted by Leading Teams
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="text-foreground-muted hover:text-foreground-lighter transition-colors duration-200"
              >
                <span className="text-lg font-semibold tracking-tight">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
 FAQ - LobeHub Style
 ============================================ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">FAQ</h2>
            <p className="text-foreground-light">
              Don't see the answer you're looking for? {''}
              <Link href="/contact" className="text-foreground hover:underline underline-offset-4">
                Contact Us
              </Link>
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-xl border transition-all duration-200',
                  openFAQ === idx
                    ? 'border-border/60 bg-surface-100/30'
                    : 'border-transparent hover:bg-surface-100/20'
                )}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'shrink-0 w-6 h-6 rounded-full bg-surface-200/80 flex items-center justify-center transition-transform duration-200',
                      openFAQ === idx && 'rotate-45'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5 text-foreground-light" />
                  </div>
                </button>
                {openFAQ === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-[14px] text-foreground-lighter leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/support"
              className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors"
            >
              Community Support
            </Link>
            <Link
              href="/contact"
              className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors"
            >
              Email Support
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
 Footer CTA - LobeHub Style
 ============================================ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            AgentFlow
          </h2>
          <p className="text-xl sm:text-2xl text-foreground-light mb-4 font-medium">
            Empower yourself to do more
          </p>
          <p className="text-foreground-lighter mb-10 max-w-lg mx-auto">
            Empower your team. Your smart agents, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200">
                Try for Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 rounded-full text-[15px] font-medium bg-surface-200/50 border border-border/50 text-foreground hover:bg-surface-300/50 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
