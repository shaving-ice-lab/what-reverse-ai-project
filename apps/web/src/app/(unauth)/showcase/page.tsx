"use client";

/**
 * Showcase Page - LobeHub Style Design
 */

import { useState } from "react";
import Link from "next/link";
import {
 Search,
 Star,
 Eye,
 ArrowRight,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Showcase Works
const showcaseItems = [
 {
 id: "1",
    title: "Smart Customer Support Automation",
    description: "24/7 automated customer response with multi-channel support, improving processing efficiency by 300%",
    author: "E-commerce Company",
 category: "Support",
 views: 12500,
 stars: 456,
 icon: "🤖",
 featured: true,
 },
 {
 id: "2",
    title: "GitHub PR Automated Review",
    description: "Automatically review pull requests, check code quality and standards, reducing manual review time",
    author: "DevOps Team",
 category: "Development",
 views: 8900,
 stars: 342,
 icon: "🔍",
 featured: true,
 },
 {
 id: "3",
    title: "Social Media Content Management",
    description: "Automatically publish content across multiple social media platforms with scheduled posting and data analytics",
    author: "Content Creator Team",
 category: "Marketing",
 views: 7600,
 stars: 289,
 icon: "📱",
 featured: false,
 },
 {
 id: "4",
    title: "Financial Report Automation",
    description: "Automatically aggregate financial data, generate standardized reports, and integrate seamlessly with ERP systems",
    author: "Finance Company",
 category: "Finance",
 views: 6700,
 stars: 234,
 icon: "📊",
 featured: true,
 },
 {
 id: "5",
    title: "Smart Bug Triage Bot",
    description: "Automatically categorize and assign bugs to the right developers, improving issue resolution efficiency",
    author: "Technology Team",
 category: "Development",
 views: 5400,
 stars: 198,
 icon: "🐛",
 featured: false,
 },
 {
 id: "6",
    title: "Sales Lead Auto-Scoring",
    description: "Automatically evaluate sales leads, prioritize high-value customers, and improve conversion rates",
    author: "Sales Team",
 category: "Sales",
 views: 4800,
 stars: 176,
 icon: "📈",
 featured: false,
 },
];

// Category
const categories = ["All", "Support", "Development", "Marketing", "Finance", "Sales"];

export default function ShowcasePage() {
 const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

 const filteredItems = showcaseItems.filter((item) => {
 const matchesSearch =
 item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 item.description.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory =
    activeCategory === "All" || item.category === activeCategory;
 return matchesSearch && matchesCategory;
 });

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Sparkles className="h-4 w-4" />
            Community Showcase
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Workflow Showcase
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-8">
            Explore outstanding workflows created by community members for inspiration and best practices
 </p>

 {/* Search */}
 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="Search workflows..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-12 h-12 rounded-full bg-surface-100/30 border-border/30"
 />
 </div>
 </div>
 </section>

 {/* Categories */}
 <section className="py-8 px-6">
 <div className="max-w-5xl mx-auto">
 <div className="flex flex-wrap justify-center gap-2">
 {categories.map((category) => (
 <button
 key={category}
 onClick={() => setActiveCategory(category)}
 className={cn(
 "px-4 py-2 rounded-full text-[12px] font-medium transition-all",
 activeCategory === category
 ? "bg-foreground text-background"
 : "bg-surface-100/30 text-foreground-lighter hover:text-foreground"
 )}
 >
 {category}
 </button>
 ))}
 </div>
 </div>
 </section>

 {/* Showcase Grid */}
 <section className="py-12 px-6">
 <div className="max-w-5xl mx-auto">
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredItems.map((item) => (
 <div
 key={item.id}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:border-[#4e8fff]/30 hover:shadow-lg",
 "transition-all duration-300 group"
 )}
 >
 <div className="flex items-start justify-between mb-4">
 <div className="w-12 h-12 rounded-xl bg-surface-100/50 flex items-center justify-center text-2xl">
 {item.icon}
 </div>
 {item.featured && (
 <span className="px-2 py-0.5 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[11px] font-medium">
 Featured
 </span>
 )}
 </div>

 <h3 className="font-semibold text-foreground mb-2 group-hover:text-[#4e8fff] transition-colors">
 {item.title}
 </h3>
 <p className="text-[13px] text-foreground-light mb-4 line-clamp-2">
 {item.description}
 </p>

 <div className="text-[11px] text-foreground-lighter mb-4">
 by {item.author}
 </div>

 <div className="flex items-center justify-between pt-4 border-t border-border/30">
 <div className="flex items-center gap-4 text-[11px] text-foreground-lighter">
 <span className="flex items-center gap-1">
 <Eye className="w-3.5 h-3.5" />
 {(item.views / 1000).toFixed(1)}k
 </span>
 <span className="flex items-center gap-1">
 <Star className="w-3.5 h-3.5" />
 {item.stars}
 </span>
 </div>
 <span className="px-2 py-0.5 rounded-full bg-surface-100/50 text-[11px] text-foreground-lighter">
 {item.category}
 </span>
 </div>
 </div>
 ))}
 </div>

 {filteredItems.length === 0 && (
 <div className="text-center py-16">
 <Sparkles className="w-12 h-12 text-foreground-lighter mx-auto mb-4" />
            <h3 className="text-[15px] font-medium text-foreground mb-2">No matching workflows found</h3>
            <p className="text-[13px] text-foreground-light">Try adjusting your filter or search keywords</p>
 </div>
 )}
 </div>
 </section>

 {/* CTA */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">Share Your Workflow</h2>
 <p className="text-[13px] text-foreground-light mb-6">Share your creations with the community and help more people improve their productivity</p>
 <Link href="/dashboard/workflows/new">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            Submit Your Work
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
