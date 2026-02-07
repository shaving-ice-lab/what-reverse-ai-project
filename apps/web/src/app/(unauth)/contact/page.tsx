"use client";

/**
 * Contact UsPage - LobeHub Style
 */

import { useState } from "react";
import Link from "next/link";
import {
 Mail,
 Phone,
 MapPin,
 MessageSquare,
 Clock,
 Send,
 CheckCircle,
 Loader2,
 Building,
 HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Contactmethod
const contactMethods = [
 {
 icon: Mail,
 title: "SendEmail",
 description: "support@agentflow.ai",
 action: "SendEmail",
 href: "mailto:support@agentflow.ai",
 },
 {
 icon: MessageSquare,
 title: "OnlineSupport",
 description: "WorkTime 9:00-18:00",
 action: "StartConversation",
 href: "#chat",
 },
 {
 icon: Phone,
 title: "PhoneConsulting",
 description: "400-888-8888",
 action: "Phone",
 href: "tel:400-888-8888",
 },
];

// OfficeAddress
const offices = [
 {
 city: "Beijing",
 address: " xxx ",
 type: "totalsection",
 },
 {
 city: "on",
 address: "new xxx ",
 type: "section",
 },
];

// ConsultingType
const inquiryTypes = [
 { id: "general", label: "1Consulting" },
 { id: "sales", label: "SalesConsulting" },
 { id: "support", label: "TechnologySupport" },
 { id: "partnership", label: "Cooperation" },
];

export default function ContactPage() {
 const [formData, setFormData] = useState({
 name: "",
 email: "",
 company: "",
 type: "general",
 message: "",
 });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isSubmitted, setIsSubmitted] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 
 // MockSubmit
 await new Promise(resolve => setTimeout(resolve, 1500));
 
 setIsSubmitting(false);
 setIsSubmitted(true);
 };

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 
 <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
 <div className="lobe-badge mb-8">
 <Mail className="h-3.5 w-3.5" />
 <span>Contact Us</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 Contact Us
 </h1>
 <p className="text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed">
 haswhatIssueorSuggestion?We'sTeamAnytimeasyouProvideHelp.
 </p>
 </div>
 </section>

 {/* Contact Methods */}
 <section className="py-16 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="grid md:grid-cols-3 gap-4">
 {contactMethods.map((method) => (
 <a
 key={method.title}
 href={method.href}
 className={cn(
 "p-6 rounded-2xl text-center",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300 group"
 )}
 >
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
 <method.icon className="w-6 h-6 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-1">
 {method.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter mb-3">
 {method.description}
 </p>
 <span className="text-[13px] text-brand-500 font-medium">
 {method.action} →
 </span>
 </a>
 ))}
 </div>
 </div>
 </section>

 {/* Contact Form */}
 <section className="py-20 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto">
 <div className="grid lg:grid-cols-2 gap-12">
 {/* Form */}
 <div>
 <h2 className="text-2xl font-bold text-foreground mb-6">
 SendMessage
 </h2>

 {isSubmitted ? (
 <div className="p-8 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-center">
 <CheckCircle className="w-12 h-12 text-brand-500 mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-foreground mb-2">
 MessagealreadySend!
 </h3>
 <p className="text-foreground-lighter mb-4 text-[13px]">
 Wewillat 1-2 Business DayinReplyyou
 </p>
 <Button
 variant="outline"
 className="rounded-full border-border/50 hover:bg-surface-200/50"
 onClick={() => {
 setIsSubmitted(false);
 setFormData({
 name: "",
 email: "",
 company: "",
 type: "general",
 message: "",
 });
 }}
 >
 Send1Message
 </Button>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Name *
 </label>
 <Input
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="you'sName"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Email *
 </label>
 <Input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="your@email.com"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 CompanyName
 </label>
 <Input
 value={formData.company}
 onChange={(e) => setFormData({ ...formData, company: e.target.value })}
 placeholder="you'sCompany(select)"
 className="bg-surface-200/50 border-border/30"
 />
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 ConsultingType
 </label>
 <select
 value={formData.type}
 onChange={(e) => setFormData({ ...formData, type: e.target.value })}
 className="w-full h-10 px-3 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px]"
 >
 {inquiryTypes.map((type) => (
 <option key={type.id} value={type.id}>
 {type.label}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 MessageContent *
 </label>
 <textarea
 required
 value={formData.message}
 onChange={(e) => setFormData({ ...formData, message: e.target.value })}
 placeholder="PleaseDetailedDescriptionyou'sIssueorRequirements..."
 rows={5}
 className="w-full px-3 py-2 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px] resize-none"
 />
 </div>

 <Button
 type="submit"
 className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-background"
 disabled={isSubmitting}
 >
 {isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Send...
 </>
 ) : (
 <>
 <Send className="w-4 h-4 mr-2" />
 SendMessage
 </>
 )}
 </Button>
 </form>
 )}
 </div>

 {/* Info */}
 <div className="space-y-8">
 {/* Offices */}
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">
 OfficeAddress
 </h3>
 <div className="space-y-4">
 {offices.map((office) => (
 <div
 key={office.city}
 className="p-4 rounded-xl bg-surface-100/30 border border-border/30"
 >
 <div className="flex items-center gap-2 mb-2">
 <div className="w-7 h-7 rounded-lg bg-surface-200/80 flex items-center justify-center">
 <MapPin className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <span className="font-semibold text-foreground text-[14px]">
 {office.city}
 </span>
 {office.type === "totalsection" && (
 <span className="px-2 py-0.5 rounded-full bg-surface-200/80 text-foreground-lighter text-[10px] font-medium">
 HQ
 </span>
 )}
 </div>
 <p className="text-[12px] text-foreground-lighter pl-9">
 {office.address}
 </p>
 </div>
 ))}
 </div>
 </div>

 {/* Working Hours */}
 <div>
 <h3 className="text-lg font-semibold text-foreground mb-4">
 WorkTime
 </h3>
 <div className="p-4 rounded-xl bg-surface-100/30 border border-border/30">
 <div className="flex items-center gap-2 text-[13px]">
 <Clock className="w-4 h-4 text-foreground-light" />
 <span className="text-foreground">weeks1weeks5</span>
 <span className="text-foreground-lighter">9:00 - 18:00</span>
 </div>
 <p className="text-[11px] text-foreground-muted mt-2 pl-6">
 daycancanAdjust, UrgentIssuePleaseEmail
 </p>
 </div>
 </div>

 {/* Response Time */}
 <div className="p-4 rounded-xl bg-surface-100/30 border border-border/30">
 <h4 className="font-medium text-foreground mb-2 text-[14px]">
 Response Time
 </h4>
 <ul className="text-[13px] text-foreground-lighter space-y-1">
 <li>• 1Consulting: 1-2 Business Day</li>
 <li>• TechnologySupport: 24 hin</li>
 <li>• UrgentIssue: 4 hin</li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
