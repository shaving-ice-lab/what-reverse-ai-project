'use client'

/**
 * Privacy Policy Page - LobeHub Style Design
 */

import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-32 sm:pt-40 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[15px] sm:text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-[13px] text-foreground-lighter mb-8">Last Updated: February 2, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                1. Information Collection
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                We collect information you provide when using our services, including:
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Account Information: Name, Email, Password</li>
                <li>Usage Data: Workflow Configurations, Execution Records</li>
                <li>Device Information: Browser Type, IP Address, Device Identifier</li>
                <li>Third-Party Integration Data: Data from services you authorize and connect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                2. Information Usage
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Providing and maintaining our services</li>
                <li>Improving user experience</li>
                <li>Sending service notifications and updates</li>
                <li>Analyzing usage trends and optimizing performance</li>
                <li>Preventing fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                3. Information Sharing
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                We will not sell your personal information. We may share information in the
                following circumstances:
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>With your consent</li>
                <li>In cooperation with service providers (e.g., hosting, payment processing)</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with business transfers or mergers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                4. Public Access and Sharing
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                When you choose to make apps and content publicly accessible or share them, related
                information may be visible to the public or specific audiences.
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>
                  Please avoid including sensitive personal information or data in public content
                </li>
                <li>
                  The visibility of public content depends on your configuration; we do not provide
                  default privacy protection for such content
                </li>
                <li>You can disable public access or sharing at any time to reduce exposure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                5. AI-Generated Content and Automated Processing
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                To provide AI features, we process the prompts, inputs, and generated results you
                submit.
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>
                  Content may be shared with model service providers for generation and security
                  review
                </li>
                <li>
                  We follow the principle of minimal data processing for AI-related data and
                  minimize sensitive information
                </li>
                <li>
                  If you need stricter control over specific data, please consider using private
                  access mode
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">6. Data Security</h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                We take multiple security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Encryption in Transit: All data transfers use TLS encryption</li>
                <li>Encryption at Rest: Sensitive data is stored with AES-256 encryption</li>
                <li>Access Control: Strict internal access permission management</li>
                <li>Regular Audits: Security audits and penetration testing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">7. Data Retention</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                We will retain your information for as long as needed to provide our services. After
                account deletion, we will delete your personal data within 30 days, but may retain
                anonymized statistical data.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">8. Your Rights</h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                You have the right to:{' '}
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Access and obtain a copy of your data</li>
                <li>Correct any inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Object to data processing activities</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">9. Cookie Policy</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                We use cookies and similar technologies to enhance user experience, analyze usage
                patterns, and personalize content. You can manage your cookie preferences through
                your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                If you have any privacy-related questions, please contact us:
              </p>
              <ul className="list-none text-[13px] text-foreground-light mt-2 space-y-1">
                <li>Email: privacy@agentflow.ai</li>
                <li>Address: Beijing</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
