"use client";

/**
 * SecurityPage - LobeHub Style
 */

import Link from "next/link";
import {
 Shield,
 Lock,
 Key,
 Server,
 Eye,
 FileCheck,
 AlertTriangle,
 CheckCircle,
 ArrowRight,
 Database,
 Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Security
const securityFeatures = [
 {
 icon: Lock,
 title: "Data Encryption",
 description: "All data transfers use TLS 1.3 encryption; sensitive data is stored with AES-256 encryption",
 items: ["Encryption in Transit", "Encryption at Rest", "Key Management"],
 },
 {
 icon: Server,
 title: "Infrastructure Security",
 description: "Enterprise-grade infrastructure with multi-region deployment and 99.99% availability guarantee",
 items: ["Multi-Region Deployment", "Automatic Failover", "DDoS Protection"],
 },
 {
 icon: Database,
 title: "Data Protection",
 description: "Advanced data backup and recovery mechanisms to ensure data safety",
 items: ["Automatic Backup", "Disaster Recovery", "Data Isolation"],
 },
 {
 icon: Eye,
 title: "Access Control",
 description: "Fine-grained permission management with SSO and multi-factor authentication support",
 items: ["Role-Based Permissions", "SSO Integration", "MFA Authentication"],
 },
 {
 icon: FileCheck,
 title: "Audit Log",
 description: "Comprehensive activity audit logs for compliance review",
 items: ["Activity Logs", "Login Records", "Change Tracking"],
 },
 {
 icon: AlertTriangle,
 title: "Threat Detection",
 description: "Real-time monitoring and anomaly detection for rapid security incident response",
 items: ["Real-time Monitoring", "Anomaly Detection", "Security Alerts"],
 },
];

// Compliance Certifications
const certifications = [
 { name: "SOC 2 Type II", description: "Passed SOC 2 Type II security audit", icon: "🛡️" },
 { name: "ISO 27001", description: "Information security management certification", icon: "📜" },
 { name: "GDPR", description: "European data protection compliance", icon: "🇪🇺" },
 { name: "MLPS Level 3", description: "Network security compliance", icon: "🇨🇳" },
];

// Security Practices
const practices = [
 "Regular security audits and penetration testing",
 "Security Development Lifecycle (SDL)",
 "Vulnerability disclosure and response plan",
 "Employee security awareness training",
 "Vendor security assessments",
 "Principle of least privilege for data access",
];

export default function SecurityPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 
 <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
 <div className="lobe-badge mb-8">
 <Shield className="h-3.5 w-3.5" />
 <span>Enterprise-Grade Security</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 Your Data Security
 <br />
 <span className="gradient-text-brand">Is Our Top Priority</span>
 </h1>

 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 We use industry-leading security measures and compliance standards to ensure your data receives the most advanced protection
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Link href="/docs/security">
 <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background h-12 px-8">
 View Security Documentation
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/contact?type=security">
 <Button size="lg" variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50 h-12 px-8">
 Contact Security Team
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Certifications */}
 <section className="py-16 px-6">
 <div className="max-w-5xl mx-auto">
 <div className="lobe-section-header">
 <h2>Compliance & Certifications</h2>
 <p>Industry-standard security certifications</p>
 </div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {certifications.map((cert) => (
 <div
 key={cert.name}
 className={cn(
 "p-6 rounded-2xl text-center",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <span className="text-3xl mb-3 block">{cert.icon}</span>
 <h3 className="text-[14px] font-semibold text-foreground mb-1">{cert.name}</h3>
 <p className="text-[12px] text-foreground-lighter">{cert.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Features */}
 <section className="py-20 px-6 bg-gradient-section">
 <div className="max-w-6xl mx-auto">
 <div className="lobe-section-header">
 <h2>Security Features</h2>
 <p>Comprehensive protection for your data and workflows</p>
 </div>
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {securityFeatures.map((feature) => (
 <div
 key={feature.title}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
 <feature.icon className="w-6 h-6 text-foreground-light" />
 </div>
 <h3 className="text-[15px] font-semibold text-foreground mb-2">
 {feature.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter mb-4 leading-relaxed">
 {feature.description}
 </p>
 <ul className="space-y-2">
 {feature.items.map((item) => (
 <li key={item} className="flex items-center gap-2 text-[13px]">
 <CheckCircle className="w-4 h-4 text-foreground-light" />
 <span className="text-foreground-lighter">{item}</span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Practices */}
 <section className="py-24 sm:py-32 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="lobe-section-header">
 <h2>Security Practices</h2>
 <p>How we keep your data safe</p>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 {practices.map((practice) => (
 <div
 key={practice}
 className="flex items-center gap-3 p-4 rounded-xl bg-surface-100/30 border border-border/30 hover:bg-surface-100/60 hover:border-border/60 transition-all duration-300"
 >
 <CheckCircle className="w-5 h-5 text-foreground-light shrink-0" />
 <span className="text-[14px] text-foreground">{practice}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Report */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
 <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
 <Shield className="w-5 h-5 text-background" />
 </div>
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
 Found a Security Issue?
 </h2>
 <p className="text-foreground-light mb-10">
 We value the contributions of security researchers and welcome responsible disclosure of security vulnerabilities
 </p>
 <Link href="mailto:security@agentflow.ai">
 <Button size="lg" variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50 h-12 px-8">
 Report a Security Issue
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
