'use client'

/**
 * Enterprise Page - LobeHub Style Design
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  Users,
  Building,
  Zap,
  Lock,
  Headphones,
  BarChart3,
  Globe,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Enterprise Features
const features = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'SOC 2 Type II certification, end-to-end encryption, and comprehensive audit logs',
    highlights: ['SOC 2 Certified', 'Data Encryption', 'Audit Logs'],
  },
  {
    icon: Globe,
    title: 'Private Deployment',
    description: 'Supports private cloud and on-premise deployment with full data sovereignty',
    highlights: ['Private Cloud', 'On-Premise', 'Data Localization'],
  },
  {
    icon: Lock,
    title: 'Advanced Permission Management',
    description: 'Fine-grained permission control with SSO and SCIM support',
    highlights: ['SSO Sign-In', 'SCIM Sync', 'Role-Based Permissions'],
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Dedicated customer success manager with 24/7 technical support',
    highlights: ['Dedicated Account Manager', 'Priority Response', 'Training Services'],
  },
  {
    icon: Zap,
    title: 'Unlimited Scalability',
    description: 'Unlimited workflows, unlimited executions, unlimited team members',
    highlights: ['Unlimited Workflows', 'Unlimited Executions', 'Unlimited Members'],
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Detailed usage reports and business insights',
    highlights: ['Usage Reports', 'Performance Analytics', 'Business Insights'],
  },
]

// Customer Case Studies
const caseStudies = [
  {
    company: 'Major E-Commerce Platform',
    industry: 'E-commerce',
    result: 'Support Efficiency Improved by 300%',
    quote: 'AgentFlow helped us reduce support response time from 30 minutes to 2 minutes.',
  },
  {
    company: 'Financial Institution',
    industry: 'Finance',
    result: 'Risk Response Improved 10x',
    quote: 'Automated risk control workflows enable us to respond to market changes in real time.',
  },
  {
    company: 'Manufacturing Enterprise',
    industry: 'Manufacturing',
    result: 'Production Efficiency Improved by 150%',
    quote: "Through workflow automation, we've significantly reduced operational costs.",
  },
]

// Plan Comparison
const comparison = [
  { feature: 'Workflow Count', standard: '50', enterprise: 'Unlimited' },
  { feature: 'Team Members', standard: '10', enterprise: 'Unlimited' },
  { feature: 'Executions', standard: '10,000/month', enterprise: 'Unlimited' },
  { feature: 'Private Deployment', standard: 'No', enterprise: 'Yes' },
  { feature: 'SSO Sign-In', standard: 'No', enterprise: 'Yes' },
  { feature: 'Dedicated Support', standard: 'No', enterprise: 'Yes' },
  { feature: 'SLA Guarantee', standard: '99.9%', enterprise: '99.99%' },
]

export default function EnterprisePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Building className="h-4 w-4" />
            Enterprise-Grade Solutions
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Built for Enterprise
            <br />
            <span className="text-[#4e8fff]">Automation Platform</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
            Get enterprise-grade security, private deployment, dedicated support, and unlimited
            scalability
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#contact">
              <Button
                size="lg"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                Contact Sales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-border/50 text-foreground-light hover:text-foreground"
              >
                Schedule a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="lobe-section-header text-center mb-12">Enterprise-Grade Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  'p-6 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-[#4e8fff]/30 hover:shadow-lg',
                  'transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-[#4e8fff]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#4e8fff]" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[13px] text-foreground-light mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[12px]">
                      <CheckCircle className="w-4 h-4 text-[#4e8fff]" />
                      <span className="text-foreground-lighter">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="lobe-section-header text-center mb-12">Enterprise vs Standard</h2>
          <div className="rounded-2xl border border-border/30 overflow-hidden bg-surface-100/30">
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-border/30 bg-surface-100/50">
              <div className="font-medium text-foreground text-[13px]">Features</div>
              <div className="font-medium text-foreground text-center text-[13px]">Standard</div>
              <div className="font-medium text-[#4e8fff] text-center text-[13px]">Enterprise</div>
            </div>
            {comparison.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 gap-4 p-4 border-b border-border/30 last:border-0"
              >
                <div className="text-foreground text-[13px]">{row.feature}</div>
                <div className="text-foreground-lighter text-center text-[13px]">
                  {row.standard}
                </div>
                <div className="text-[#4e8fff] font-medium text-center text-[13px]">
                  {row.enterprise}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="lobe-section-header text-center mb-12">Customer Case Studies</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study) => (
              <div
                key={study.company}
                className="p-6 rounded-2xl bg-surface-100/30 border border-border/30"
              >
                <div className="text-[12px] text-[#4e8fff] font-medium mb-2">{study.industry}</div>
                <h3 className="font-semibold text-foreground mb-2">{study.company}</h3>
                <div className="text-2xl font-bold text-[#4e8fff] mb-4">{study.result}</div>
                <p className="text-[13px] text-foreground-light italic">
                  &ldquo;{study.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-16 px-6 bg-gradient-section">
        <div className="max-w-2xl mx-auto">
          <h2 className="lobe-section-header text-center mb-4">Contact Enterprise Sales</h2>
          <p className="text-[13px] text-foreground-light text-center mb-8">
            Fill out the form below and we&apos;ll contact you within 1 business day
          </p>

          {isSubmitted ? (
            <div className="p-8 rounded-2xl bg-[#4e8fff]/5 border border-[#4e8fff]/20 text-center">
              <CheckCircle className="w-12 h-12 text-[#4e8fff] mx-auto mb-4" />
              <h3 className="text-[15px] font-semibold text-foreground mb-2">
                Submitted Successfully!
              </h3>
              <p className="text-[13px] text-foreground-light">
                Our sales team will be in touch soon
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-2">
                    Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="bg-surface-100/30 border-border/30 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-2">
                    Work Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="work@company.com"
                    className="bg-surface-100/30 border-border/30 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Your company"
                    className="bg-surface-100/30 border-border/30 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="138-xxxx-xxxx"
                    className="bg-surface-100/30 border-border/30 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  Requirements
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please briefly describe your requirements"
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-surface-100/30 border border-border/30 text-foreground text-[13px] resize-none placeholder:text-foreground-lighter focus:outline-none focus:ring-2 focus:ring-[#4e8fff]/20 focus:border-[#4e8fff]/50"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Inquiry'
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
