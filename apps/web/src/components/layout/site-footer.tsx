"use client";

/**
 * SiteFooter - LobeHub Stylepage
 * Minimal, Modern, DarkTheme
 */

import Link from "next/link";
import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

// Footer LinkGroup
const footerSections = [
 {
 title: "Product",
 links: [
 { label: "Features", href: "/features" },
 { label: "PricingPlan", href: "/pricing" },
 { label: "Enterprise", href: "/enterprise" },
 { label: "Template Gallery", href: "/templates" },
 { label: "Change Log", href: "/whats-new" },
 ],
 },
 {
 title: "Resource",
 links: [
 { label: "Documentcenter", href: "/docs" },
 { label: "Developers", href: "/developers" },
 { label: "Blog", href: "/blog" },
 { label: "Help Center", href: "/help" },
 { label: "Community", href: "/community" },
 ],
 },
 {
 title: "Company",
 links: [
 { label: "AboutWe", href: "/about" },
 { label: "Mediacenter", href: "/press" },
 { label: "Partners", href: "/partners" },
 { label: "Contact Us", href: "/contact" },
 ],
 },
 {
 title: "Legal",
 links: [
 { label: "Terms of Service", href: "/terms" },
 { label: "Privacy Policy", href: "/privacy" },
 { label: "Securitycenter", href: "/security" },
 ],
 },
];

// Social MediaLink
const socialLinks = [
 {
 name: "GitHub",
 href: "https://github.com/agentflow",
 icon: (
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
 </svg>
 ),
 },
 {
 name: "Twitter",
 href: "https://twitter.com/agentflow",
 icon: (
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
 ),
 },
 {
 name: "Discord",
 href: "https://discord.gg/agentflow",
 icon: (
 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
 <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
 </svg>
 ),
 },
];

// Link(Used for minimal Variant)
const minimalLinks = [
 { label: "Document", href: "/docs" },
 { label: "Blog", href: "/blog" },
 { label: "", href: "/terms" },
 { label: "Privacy", href: "/privacy" },
 { label: "Contact", href: "/contact" },
];

interface SiteFooterProps {
 className?: string;
 variant?: "default" | "minimal";
}

export function SiteFooter({ className, variant = "default" }: SiteFooterProps) {
 if (variant === "minimal") {
 return (
 <footer className={cn("border-t border-border/30 bg-background py-8", className)}>
 <div className="max-w-6xl mx-auto px-6">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="text-[13px] text-foreground-lighter">
 © {new Date().getFullYear()} AgentFlow, Inc.
 </div>
 <nav className="flex flex-wrap justify-center gap-6">
 {minimalLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors duration-200"
 >
 {link.label}
 </Link>
 ))}
 </nav>
 </div>
 </div>
 </footer>
 );
 }

 return (
 <footer className={cn("border-t border-border/30 bg-background", className)}>
 <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
 {/* Main Footer Content */}
 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">
 {/* Brand Column */}
 <div className="col-span-2 md:col-span-4 lg:col-span-1">
 <Link href="/" className="inline-flex items-center gap-2 mb-5">
 <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
 <Workflow className="w-3.5 h-3.5 text-background" />
 </div>
 <span className="font-semibold text-foreground text-[15px]">AgentFlow</span>
 </Link>
 <p className="text-[13px] text-foreground-lighter leading-relaxed mb-6 max-w-xs">
 down1 AI WorkflowAutomationPlatform, leteachpersonallcanBuildSmartApp.
 </p>
 {/* Social Links */}
 <div className="flex items-center gap-2">
 {socialLinks.map((social) => (
 <a
 key={social.name}
 href={social.href}
 target="_blank"
 rel="noopener noreferrer"
 className="w-8 h-8 rounded-lg bg-surface-200/50 flex items-center justify-center text-foreground-lighter hover:text-foreground hover:bg-surface-300/50 transition-all duration-200"
 aria-label={social.name}
 >
 {social.icon}
 </a>
 ))}
 </div>
 </div>

 {/* Link Sections */}
 {footerSections.map((section) => (
 <div key={section.title}>
 <h3 className="text-[13px] font-medium text-foreground mb-4">{section.title}</h3>
 <ul className="space-y-2.5">
 {section.links.map((link) => (
 <li key={link.href}>
 <Link
 href={link.href}
 className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors duration-200"
 >
 {link.label}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>

 {/* Bottom Bar */}
 <div className="mt-16 pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="text-[12px] text-foreground-muted">
 © {new Date().getFullYear()} AgentFlow, Inc. All rights reserved.
 </div>
 <div className="flex items-center gap-4">
 <span className="text-[12px] text-foreground-muted">
 
 </span>
 </div>
 </div>
 </div>
 </footer>
 );
}

export default SiteFooter;
