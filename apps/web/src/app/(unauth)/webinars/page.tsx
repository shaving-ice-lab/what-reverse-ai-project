"use client";

/**
 * Webinars Page - LobeHub StyleDesign
 */

import Link from "next/link";
import { Video, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function WebinarsPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-5xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Video className="h-4 w-4" />
 Learn
 </div>
 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 Webinars
 </h1>
 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 WewillonlinePublicandlineonWorkshopwillContent.CurrentPagefirstProvideEntryandSubscriptionmethod.
 </p>
 </div>
 </section>

 {/* Content */}
 <main className="max-w-5xl mx-auto px-6 py-16 space-y-10">
 <div className="grid sm:grid-cols-2 gap-4">
 <div className="p-5 rounded-2xl bg-surface-100/30 border border-border/30">
 <h2 className="text-[15px] font-semibold text-foreground">Getting StartedPublic</h2>
 <p className="text-[13px] text-foreground-light mt-1">
 Quick AgentFlow 'sCoreConcept, WorkflowDesignandPublish.
 </p>
 </div>
 <div className="p-5 rounded-2xl bg-surface-100/30 border border-border/30">
 <h2 className="text-[15px] font-semibold text-foreground">Advanced</h2>
 <p className="text-[13px] text-foreground-light mt-1">
 API Integration, Webhook, canandProductionBest Practices.
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <Link href="/newsletter">
 <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 SubscriptionUpdate
 </Button>
 </Link>
 <Link href="/docs/getting-started">
 <Button variant="outline" className="rounded-full border-border/50 text-foreground-light hover:text-foreground">
 <BookOpen className="mr-2 w-4 h-4" />
 ViewDocument
 </Button>
 </Link>
 </div>
 </main>

 <SiteFooter />
 </div>
 );
}
