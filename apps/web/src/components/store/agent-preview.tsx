"use client";

/**
 * Agent Preview Component
 * 
 * Showcase Agent Preview before publishing
 */

import {
 Star,
 Download,
 Clock,
 Users,
 CheckCircle,
 Play,
 Heart,
 Share2,
 FileText,
 BarChart3,
 MessageSquare,
 Code2,
 Globe,
 TrendingUp,
 Sparkles,
 GraduationCap,
 Wallet,
 Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentCategory, PricingType } from "@/types/agent";

// Category Icon and Name Mapping
const categoryMap: Record<AgentCategory, { icon: typeof Bot; name: string }> = {
 content: { icon: FileText, name: "Content Creation" },
  data: { icon: BarChart3, name: "Data Processing" },
 customer: { icon: MessageSquare, name: "Customer Service" },
 productivity: { icon: Users, name: "Productivity" },
 developer: { icon: Code2, name: "Development Tools" },
 research: { icon: Globe, name: "Research & Analytics" },
 education: { icon: GraduationCap, name: "Education & Learning" },
 finance: { icon: Wallet, name: "Finance" },
 marketing: { icon: TrendingUp, name: "Marketing" },
 other: { icon: Sparkles, name: "Other" },
};

interface AgentPreviewProps {
 // Agent Data
 name: string;
 description: string;
 longDescription?: string;
 icon?: string;
 coverImage?: string;
 category: AgentCategory | null;
 tags: string[];
 pricingType: PricingType;
 price: number | null;
 screenshots?: string[];
 
 // Mock Data
 authorName?: string;
 
 // style
 variant?: "card" | "detail";
 className?: string;
}

export function AgentPreview({
 name,
 description,
 longDescription,
 icon,
 coverImage,
 category,
 tags,
 pricingType,
 price,
 screenshots = [],
 authorName = "you",
 variant = "card",
 className,
}: AgentPreviewProps) {
 const categoryInfo = category ? categoryMap[category] : null;
 const CategoryIcon = categoryInfo?.icon || Bot;

 // Card Preview
 if (variant === "card") {
 return (
 <div className={cn(
 "group relative rounded-2xl overflow-hidden",
 "bg-card border border-border",
 "transition-all duration-300",
 "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
 className
 )}>
 {/* face */}
 <div className="aspect-video bg-muted relative overflow-hidden">
 {coverImage ? (
 <img
 src={coverImage}
 alt={name || "Agent Preview"}
 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
 <Bot className="w-16 h-16 text-primary/30" />
 </div>
 )}
 
 {/* Price Tag */}
 <div className="absolute top-3 right-3">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-xs font-medium",
 pricingType === "free"
 ? "bg-emerald-500/90 text-white"
 : "bg-black/60 text-white backdrop-blur-sm"
 )}>
 {pricingType === "free" ? "Free": `${price || 0}`}
 </span>
 </div>
 </div>

 {/* Content */}
 <div className="p-5">
 {/* Header */}
 <div className="flex items-start gap-3 mb-3">
 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
 {icon || "🤖"}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
 {name || "Agent Name"}
 </h3>
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 {categoryInfo && (
 <span className="flex items-center gap-1">
 <CategoryIcon className="w-3.5 h-3.5" />
 {categoryInfo.name}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Description */}
 <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
 {description || "Agent description will be displayed here"}
 </p>

 {/* Statistics */}
 <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
 <span className="flex items-center gap-1">
 <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
 0.0
 </span>
 <span className="flex items-center gap-1">
 <Download className="w-3.5 h-3.5" />
 0
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3.5 h-3.5" />
 Just now
 </span>
 </div>

 {/* Tags */}
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {tags.slice(0, 3).map((tag) => (
 <span
 key={tag}
 className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
 >
 {tag}
 </span>
 ))}
 {tags.length > 3 && (
 <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
 +{tags.length - 3}
 </span>
 )}
 </div>
 )}
 </div>
 </div>
 );
 }

 // Detail Page Preview
 return (
 <div className={cn("space-y-6", className)}>
 {/* Hero Section */}
 <div className="flex flex-col lg:flex-row gap-6 items-start">
 {/* Agent Icon */}
 <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-4xl shrink-0">
 {icon || "🤖"}
 </div>

 {/* Agent Info */}
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 {categoryInfo && (
 <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
 {categoryInfo.name}
 </span>
 )}
 {pricingType === "free" && (
 <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
 Free
 </span>
 )}
 </div>

 <h1 className="text-2xl font-bold text-foreground mb-2">
 {name || "Agent Name"}
 </h1>

 <p className="text-muted-foreground mb-4">
 {description || "Agent description will be displayed here"}
 </p>

 {/* Stats */}
 <div className="flex flex-wrap items-center gap-4 mb-4">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
 {authorName.charAt(0)}
 </div>
 <span className="text-sm text-foreground">{authorName}</span>
 </div>
 <div className="flex items-center gap-1 text-yellow-500 text-sm">
 <Star className="w-4 h-4 fill-current" />
 <span className="font-medium">0.0</span>
 <span className="text-muted-foreground">(0 Reviews)</span>
 </div>
 <div className="flex items-center gap-1 text-muted-foreground text-sm">
 <Download className="w-4 h-4" />
 <span>0 Usage</span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-3">
 <Button
 className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
 disabled
 >
 <Play className="w-4 h-4 mr-2" />
 Use This Agent
 </Button>
 <Button variant="outline" disabled>
 <Heart className="w-4 h-4 mr-2" />
 Favorite
 </Button>
 <Button variant="ghost" size="icon" disabled>
 <Share2 className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>

 {/* Cover Image */}
 {coverImage && (
 <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
 <img
 src={coverImage}
 alt={name || "Agent Preview"}
 className="w-full h-full object-cover"
 />
 </div>
 )}

 {/* Screenshots */}
 {screenshots.length > 0 && (
 <div>
 <h3 className="text-sm font-medium text-foreground mb-3">Screenshot Preview</h3>
 <div className="grid grid-cols-3 gap-3">
 {screenshots.slice(0, 3).map((screenshot, index) => (
 <div
 key={index}
 className="aspect-video bg-muted rounded-lg overflow-hidden border border-border"
 >
 <img
 src={screenshot}
 alt={`Screenshot ${index + 1}`}
 className="w-full h-full object-cover"
 />
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Description */}
 {longDescription && (
 <div>
 <h3 className="text-sm font-medium text-foreground mb-3">Detailed Introduction</h3>
 <div className="p-4 rounded-xl bg-card border border-border">
 <p className="text-sm text-muted-foreground whitespace-pre-wrap">
 {longDescription}
 </p>
 </div>
 </div>
 )}

 {/* Tags */}
 {tags.length > 0 && (
 <div>
 <h3 className="text-sm font-medium text-foreground mb-3">Tags</h3>
 <div className="flex flex-wrap gap-2">
 {tags.map((tag) => (
 <span
 key={tag}
 className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Price Info */}
 {pricingType !== "free" && price && (
 <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-sm text-muted-foreground"></div>
 <div className="text-2xl font-bold text-foreground">{price}</div>
 </div>
 <Button
 className="bg-primary hover:bg-primary/90 text-primary-foreground"
 disabled
 >
 Purchase and Use
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}
