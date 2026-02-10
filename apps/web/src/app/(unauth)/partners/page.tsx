'use client'

/**
 * PartnersPage - LobeHub Style Design
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Handshake,
  ArrowRight,
  CheckCircle,
  DollarSign,
  BookOpen,
  HeadphonesIcon,
  Megaphone,
  Target,
  TrendingUp,
  Code,
  Briefcase,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Partner Types
const partnerTypes = [
  {
    id: 'reseller',
    title: 'Partners',
    description: 'Sell AgentFlow products and earn commissions',
    icon: DollarSign,
    benefits: [
      'Up to 30% sales commission',
      'Exclusive pricing and discounts',
      'Sales support and training',
      'Joint marketing resources',
    ],
    color: '#4e8fff',
  },
  {
    id: 'integration',
    title: 'Technology Integration Partner',
    description: 'Deeply integrate your product with AgentFlow',
    icon: Code,
    benefits: [
      'Priority API access',
      'Exclusive technical support',
      'Joint product launches',
      'Integration marketplace showcase',
    ],
    color: '#3B82F6',
  },
  {
    id: 'consulting',
    title: 'Consulting Service Partner',
    description: 'Provide AgentFlow implementation and delivery services to customers',
    icon: Briefcase,
    benefits: [
      'Certified training programs',
      'Project referrals',
      'Technical documentation support',
      'Co-branded case study showcases',
    ],
    color: '#8B5CF6',
  },
  {
    id: 'affiliate',
    title: 'Affiliate Partner',
    description: 'Promote AgentFlow and earn referral rewards',
    icon: Megaphone,
    benefits: [
      '20% referral commission',
      'Exclusive promotional links',
      'Marketing support',
      'Real-time data tracking',
    ],
    color: '#F59E0B',
  },
]

// Partner Benefits
const partnerBenefits = [
  {
    icon: DollarSign,
    title: 'Revenue Sharing',
    description: 'Competitive commission rates and multi-tier reward programs',
  },
  {
    icon: BookOpen,
    title: 'Professional Training',
    description: 'Free product training and certification courses',
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Support',
    description: 'Dedicated account manager and technical support team',
  },
  {
    icon: Megaphone,
    title: 'Joint Marketing',
    description: 'Co-marketing campaigns and brand promotion',
  },
  {
    icon: Target,
    title: 'Lead Sharing',
    description: 'Quality customer leads and project referrals',
  },
  { icon: TrendingUp, title: 'Growth', description: 'Grow together with AgentFlow' },
]

// Existing Partners Showcase
const featuredPartners = [
  { name: 'Alibaba Cloud', type: 'Technology Partner', logo: '☁️' },
  { name: 'Tencent Cloud', type: 'Technology Partner', logo: '🌐' },
  { name: 'Huawei Cloud', type: 'Technology Partner', logo: '📱' },
  { name: 'AWS', type: 'Technology Partner', logo: '🔶' },
  { name: 'Microsoft Azure', type: 'Technology Partner', logo: '💠' },
  { name: 'Google Cloud', type: 'Technology Partner', logo: '🔵' },
]

// Success Stats
const successStats = [
  { value: '500+', label: 'Partners' },
  { value: '$10M+', label: 'Partner Earnings' },
  { value: '98%', label: 'Partner Satisfaction' },
  { value: '50+', label: 'Countries' },
]

// FAQ
const faqs = [
  {
    question: 'How do I become an AgentFlow partner?',
    answer:
      'Fill out the application form on this page. Our partnerships team will contact you within 2 business days to discuss collaboration opportunities.',
  },
  {
    question: 'Is there a cost to become a partner?',
    answer:
      'The basic partnership plan is free. We also offer advanced partnership plans with additional benefits and support.',
  },
  {
    question: 'How are commissions settled?',
    answer:
      'Commissions are settled monthly via bank transfer, PayPal, and other payment methods. The minimum payout threshold is $100.',
  },
  {
    question: 'What are the requirements?',
    answer:
      'Different partnership types have different requirements, but generally you need relevant industry experience or technical capabilities. Please contact our partnerships team for details.',
  },
]

export default function PartnersPage() {
  const [selectedType, setSelectedType] = useState('reseller')
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 pb-16 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-[#4e8fff]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#4e8fff]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Application Submitted!</h1>
            <p className="text-[13px] text-foreground-light mb-8">
              Thank you for your interest! Our partnerships team will contact you within 2 business
              days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button
                  variant="outline"
                  className="rounded-full border-border/50 text-foreground-light"
                >
                  Back to Home
                </Button>
              </Link>
              <Link href="/docs">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  View Documentation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Handshake className="h-4 w-4" />
            Partner Program
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-6">
            Partner with AgentFlow
            <br />
            <span className="text-[#4e8fff]">Shape the Future</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-12">
            Join the AgentFlow partner ecosystem, seize the AI automation opportunity, and create
            greater value together
          </p>

          {/* Success Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {successStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">Choose the Right Partnership Model</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              We offer multiple partnership types to meet diverse business needs
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  'p-6 rounded-2xl text-left transition-all duration-300',
                  'bg-surface-100/30 border-2',
                  selectedType === type.id
                    ? 'border-[#4e8fff] shadow-lg'
                    : 'border-border/30 hover:border-[#4e8fff]/50'
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${type.color}15` }}
                >
                  <type.icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{type.title}</h3>
                <p className="text-[13px] text-foreground-light mb-4">{type.description}</p>
                <ul className="space-y-2">
                  {type.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-center gap-2 text-[12px] text-foreground-lighter"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: type.color }} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">Partner Benefits</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              As an AgentFlow partner, enjoy comprehensive support and resources
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className={cn(
                  'flex items-start gap-4 p-6 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-[#4e8fff]/30 hover:shadow-lg',
                  'transition-all duration-300'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-[#4e8fff]/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-6 h-6 text-[#4e8fff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-[13px] text-foreground-light">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Partners */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="lobe-section-header mb-4">Partner Showcase</h2>
            <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
              Building the AI automation ecosystem with industry-leading enterprises
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {featuredPartners.map((partner) => (
              <div
                key={partner.name}
                className={cn(
                  'flex flex-col items-center justify-center p-6 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-[#4e8fff]/30',
                  'transition-all duration-300'
                )}
              >
                <span className="text-4xl mb-3">{partner.logo}</span>
                <h4 className="font-medium text-foreground text-center">{partner.name}</h4>
                <p className="text-[11px] text-foreground-lighter">{partner.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="p-8 rounded-2xl bg-surface-100/30 border border-border/30">
                <h2 className="text-[15px] font-bold text-foreground mb-2">
                  Apply to Become a Partner
                </h2>
                <p className="text-[13px] text-foreground-light mb-6">
                  Fill in the information below and we will contact you
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName" className="text-foreground text-[12px]">
                        Company Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactName" className="text-foreground text-[12px]">
                        Contact Person <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => handleInputChange('contactName', e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-foreground text-[12px]">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="work@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-foreground text-[12px]">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="mt-2 bg-background border-border/30 rounded-xl"
                        placeholder="Contact phone"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-foreground text-[12px]">
                      Company Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="mt-2 bg-background border-border/30 rounded-xl"
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground text-[12px] mb-3 block">
                      Partnership Type <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {partnerTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={cn(
                            'p-3 rounded-xl text-left text-[12px] transition-all border',
                            selectedType === type.id
                              ? 'bg-[#4e8fff]/10 border-[#4e8fff]'
                              : 'bg-background border-border/30 hover:border-[#4e8fff]/50'
                          )}
                        >
                          <span className="font-medium text-foreground">{type.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-foreground text-[12px]">
                      Additional Details
                    </Label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                      className={cn(
                        'w-full mt-2 px-4 py-3 rounded-xl',
                        'bg-background border border-border/30 text-foreground text-[13px]',
                        'focus:outline-none focus:ring-2 focus:ring-[#4e8fff]/20 focus:border-[#4e8fff]/50',
                        'placeholder:text-foreground-lighter resize-none'
                      )}
                      placeholder="Please introduce your company and partnership interests (optional)"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !formData.companyName ||
                      !formData.contactName ||
                      !formData.email
                    }
                    className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* FAQ */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-6">FAQ</h3>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="p-4 rounded-2xl bg-surface-100/30 border border-border/30"
                  >
                    <h4 className="font-medium text-foreground mb-2">{faq.question}</h4>
                    <p className="text-[13px] text-foreground-light">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-[#4e8fff]/10 border border-[#4e8fff]/20">
                <h4 className="font-medium text-foreground mb-2">Need More Help?</h4>
                <p className="text-[13px] text-foreground-light mb-3">
                  Contact our partnerships team
                </p>
                <a
                  href="mailto:partners@agentflow.ai"
                  className="text-[13px] text-[#4e8fff] hover:underline"
                >
                  partners@agentflow.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
