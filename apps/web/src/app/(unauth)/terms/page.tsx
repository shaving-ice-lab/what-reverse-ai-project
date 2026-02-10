'use client'

/**
 * Terms of Service Page - LobeHub Style Design
 */

import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-32 sm:pt-40 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[15px] sm:text-3xl font-bold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-[13px] text-foreground-lighter mb-8">Last Updated: February 2, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                1. Service Description
              </h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                AgentFlow is an AI-driven workflow automation platform that provides visual editing,
                AI agents, third-party service integrations, and more. By using our services, you
                agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                2. Account Registration
              </h2>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>You must provide real and accurate registration information</li>
                <li>You are responsible for your account&apos;s security</li>
                <li>You are responsible for all activity under your account</li>
                <li>You should notify us immediately upon discovering any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">3. Acceptable Use</h2>
              <p className="text-[13px] text-foreground-light mb-4">You agree not to: </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Use the service for any illegal purpose</li>
                <li>Infringe on others&apos; intellectual property or privacy</li>
                <li>Attempt or conduct network attacks</li>
                <li>Send spam emails or engage in fraudulent activities</li>
                <li>Disrupt or damage the normal operation of services</li>
                <li>Access other users&apos; data without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                4. Intellectual Property
              </h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                The intellectual property of the AgentFlow platform and its content belongs to us.
                The intellectual property of workflows and content you create belongs to you. You
                grant us a limited license to operate the service as needed.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                5. Public Content Responsibility
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                Publicly accessible apps and content are created by and the responsibility of the
                publishing user. We only provide the technology platform and showcase channel.
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>
                  Publishers must ensure content is legal, compliant, and does not infringe on
                  third-party rights
                </li>
                <li>
                  Users should independently assess risks before using publicly accessible content
                </li>
                <li>
                  If you discover infringing or violating content, please contact legal@agentflow.ai
                  for timely processing
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                6. AI-Generated Content
              </h2>
              <p className="text-[13px] text-foreground-light mb-4 leading-relaxed">
                AI-generated content on the platform may contain errors or be incomplete.
              </p>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>
                  AI-generated content is for reference only and does not constitute professional
                  advice or a guarantee
                </li>
                <li>
                  Before making important decisions, please conduct your own independent and
                  professional evaluation
                </li>
                <li>
                  Do not use AI-generated content directly for healthcare, legal, financial, or
                  other high-risk scenarios
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">7. Paid Services</h2>
              <ul className="list-disc pl-6 text-[13px] text-foreground-light space-y-2 leading-relaxed">
                <li>Paid subscriptions are billed according to the billing cycle you select</li>
                <li>Prices are subject to change; we will notify you 30 days in advance</li>
                <li>
                  After cancellation, service continues until the end of the current billing cycle
                </li>
                <li>Please refer to the Pricing page for our refund policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">8. Service Changes</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                We may update, modify, or change service features at any time. For significant
                changes, we will notify users in advance.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">9. Disclaimer</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                The service is provided &ldquo;as is&rdquo; without any warranties of any kind. We
                do not guarantee that the service will be uninterrupted or error-free. To the
                maximum extent permitted by law, we are not liable for any indirect, incidental, or
                consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                Our maximum liability to you shall not exceed the total amount you have paid to us
                in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">11. Modifications</h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                We reserve the right to modify these terms. Significant modifications will be
                notified 30 days in advance. Continued use of the service constitutes your
                acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground mb-4">
                12. Contact Information
              </h2>
              <p className="text-[13px] text-foreground-light leading-relaxed">
                If you have any questions, please contact us:
              </p>
              <ul className="list-none text-[13px] text-foreground-light mt-2 space-y-1">
                <li>Email: legal@agentflow.ai</li>
                <li>Phone: 400-888-8888</li>
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
