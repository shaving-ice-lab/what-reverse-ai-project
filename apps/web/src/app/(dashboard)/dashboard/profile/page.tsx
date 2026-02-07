"use client";

/**
 * UserpersoncenterPage - Supabase Style
 * ShowcaseUserInfo, ActivityStatistics, AchievementBadge, RecentActivityetc
 */

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
 Settings,
 Edit3,
 Calendar,
 MapPin,
 Link as LinkIcon,
 Twitter,
 Github,
 Linkedin,
 Mail,
 Zap,
 MessageSquare,
 Bot,
 FileText,
 Award,
 Clock,
 ChevronRight,
 ExternalLink,
 Copy,
 Check,
 Sparkles,
 Target,
 Flame,
 Trophy,
 Crown,
 Shield,
 Heart,
 Bookmark,
 Share2,
 MoreHorizontal,
 Activity,
 BarChart3,
 Image as ImageIcon,
 Code,
 PenTool,
 Layers,
} from "lucide-react";

import {
 DropdownMenu,

 DropdownMenuContent,

 DropdownMenuItem,

 DropdownMenuTrigger,

 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/dashboard/page-layout";

// UserStatisticsData - Supabase Style

const userStats = [
 { label: "Workflow", value: 23, icon: Zap, color: "text-brand-500", bgColor: "bg-brand-200/60" },
 { label: "Conversation", value: 156, icon: MessageSquare, color: "text-foreground-light", bgColor: "bg-surface-200" },
 { label: "Agent", value: 8, icon: Bot, color: "text-foreground-light", bgColor: "bg-surface-200" },
 { label: "Document", value: 42, icon: FileText, color: "text-brand-500", bgColor: "bg-brand-200/60" },
];

// AchievementBadge - Supabase Style

const achievements = [

 { id: "1", name: "User", description: "EarlySign UpUser", icon: Crown, color: "text-brand-500", bgColor: "bg-brand-200", unlocked: true },

 { id: "2", name: "Workflowlarge", description: "Create 20+ Workflow", icon: Zap, color: "text-brand-500", bgColor: "bg-brand-200", unlocked: true },

 { id: "3", name: "AI Exploreuser", description: "Usage 3 typewithon AI Model", icon: Sparkles, color: "text-foreground-light", bgColor: "bg-surface-200", unlocked: true },

 { id: "4", name: "CommunityContributionuser", description: "ShareTemplatebyUsage 100+ times", icon: Heart, color: "text-brand-500", bgColor: "bg-brand-200", unlocked: true },

 { id: "5", name: "rate", description: "Continuous 30 daysUsagePlatform", icon: Flame, color: "text-brand-500", bgColor: "bg-brand-200", unlocked: false },

 { id: "6", name: "Code", description: "GenerateCode 1000+ row", icon: Code, color: "text-brand-500", bgColor: "bg-brand-200", unlocked: false },

];

// RecentActivity

const recentActivities = [

 { id: "1", type: "workflow", title: "Created Workflow: Customer Feedback Process", time: "2 hours ago", icon: Zap },

 { id: "2", type: "conversation", title: "Completed GPT-4 Conversation", time: "3 hours ago", icon: MessageSquare },

 { id: "3", type: "agent", title: "Updated Agent: Email Assistant", time: "Yesterday", icon: Bot },

 { id: "4", type: "template", title: "Shared Template: Data Analytics Report", time: "2 days ago", icon: Layers },

 { id: "5", type: "creative", title: "Generated Marketing Copy", time: "3 days ago", icon: PenTool },

 { id: "6", type: "workflow", title: "Ran Workflow: Daily Summary", time: "1 week ago", icon: Zap },

];

// Favorite'sContent

const savedItems = [

 { id: "1", title: "AutomationEmailReplyTemplate", type: "template", icon: Layers, uses: 1234 },

 { id: "2", title: "DatacanvisualWorkflow", type: "workflow", icon: BarChart3, uses: 567 },

 { id: "3", title: "ContentCreativeAssistant", type: "agent", icon: Bot, uses: 890 },

 { id: "4", title: "Social Media", type: "workflow", icon: Calendar, uses: 456 },

];

// canTags

const skillTags = [

 "Automation", "DataAnalytics", "AI Conversation", "ContentCreative", "WorkflowDesign", "API Integration", "EmailProcess", "CustomerService"

];

// ContributionData (MockPast12weeks'sData)

const contributionData = Array.from({ length: 84 }, (_, i) => ({
 day: i, value: Math.floor(Math.random() * 5), // 0-4 'sActive
}));

export default function ProfilePage() {
 const { user } = useAuthStore();

 const [copied, setCopied] = useState(false);

 const [activeTab, setActiveTab] = useState("overview");

 // CopyUserID

 const copyUserId = () => {
 navigator.clipboard.writeText(user?.id || "");

 setCopied(true);

 setTimeout(() => setCopied(false), 2000);

 };

 // CalculateUseretcProgress

 const levelProgress = 75;

 const currentLevel = 12;

 const pointsToNextLevel = 250;

 return (
 <PageContainer fullWidth>

 {/* TopfaceRegion */}
 <div className="relative h-44 md:h-52 overflow-hidden border-b border-border bg-linear-to-br from-surface-75 via-surface-100 to-surface-200">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(62,207,142,0.18),transparent_45%)]" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(62,207,142,0.12),transparent_55%)]" />
 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.15] mix-blend-screen" />
 <div className="absolute inset-0 bg-linear-to-t from-background-studio/60 via-transparent to-transparent" />

 {/* EditfaceButton */}
 <button className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-md border border-border/70 bg-surface-75/80 px-3 py-1.5 text-[11px] font-medium text-foreground-light backdrop-blur transition-colors hover:bg-surface-200 hover:text-foreground">
 <ImageIcon className="w-3.5 h-3.5" />
 moreface
 </button>
 </div>

 {/* UserInfoCard */}

 <div className="max-w-6xl mx-auto -mt-16 relative px-6">
 <div className="page-panel overflow-hidden">

 <div className="p-6 pb-6">
 <div className="flex flex-col md:flex-row md:items-end gap-6">
 {/* Avatar */}
 <div className="relative -mt-20 md:-mt-24">
 <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-surface-100">
 <AvatarImage src={user?.avatar} />
 <AvatarFallback className="bg-brand-500 text-background text-2xl font-semibold">
 {user?.displayName?.charAt(0) || user?.username?.charAt(0) || "U"}
 </AvatarFallback>
 </Avatar>
 <button className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-light shadow-sm transition-colors hover:bg-surface-200 hover:text-foreground">
 <Edit3 className="w-3.5 h-3.5" />
 </button>
 {/* OnlineStatus */}
 <div className="absolute bottom-3 right-0 w-4 h-4 rounded-full bg-brand-500 ring-4 ring-surface-100" />
 </div>

 {/* UserInfo */}
 <div className="flex-1">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div className="min-w-0">
 <p className="page-caption">Profile</p>
 <div className="flex flex-wrap items-center gap-3 mt-1">
 <h1 className="text-2xl font-semibold text-foreground">
 {user?.displayName || user?.username || "User"}
 </h1>
 <span className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-200/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
 Pro
 </span>
 {achievements.some(a => a.id === "1" && a.unlocked) && (
 <Crown className="w-4 h-4 text-brand-500" />
 )}
 </div>
 <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-foreground-light">
 <span>@{user?.username || "username"}</span>
 <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-foreground-muted" />
 <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-200/80 px-2 py-1 font-mono text-[11px] text-foreground-muted">
 <span>{user?.id ? `${user?.id.slice(0, 8)}...` : "user_******"}</span>
 <button
 onClick={copyUserId}
 className="rounded border border-transparent p-1 text-foreground-muted transition-colors hover:border-border hover:bg-surface-100 hover:text-foreground"
 title="CopyUser ID"
 >
 {copied ? <Check className="w-3 h-3 text-brand-500" /> : <Copy className="w-3 h-3" />}
 </button>
 </div>
 </div>
 </div>

 {/* ActionButton */}
 <div className="flex items-center gap-2">
 <Link href="/dashboard/settings/profile">
 <Button size="sm" className="bg-brand-500 text-background hover:bg-brand-600">
 <Edit3 className="w-4 h-4 mr-2" />
 EditMaterials
 </Button>
 </Link>
 <Button
 variant="outline"
 size="sm"
 className="border-border bg-surface-100 text-foreground-light hover:text-foreground"
 >
 <Share2 className="w-4 h-4 mr-2" />
 Share
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="border-border bg-surface-100 text-foreground-light hover:text-foreground"
 >
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem>
 <ExternalLink className="w-4 h-4 mr-2" />
 ViewPublicmainpage
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem>
 <Settings className="w-4 h-4 mr-2" />
 AccountSettings
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>

 {/* UserBio */}
 <p className="text-[13px] text-foreground-light mt-3 max-w-2xl">
 {user?.bio || "AI Automationuser, FocusatImproveWorkrateandExploreSmartResolvePlan."}
 </p>

 {/* Info */}
 <div className="flex flex-wrap items-center gap-2 mt-4 text-[12px] text-foreground-light">
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-100/80 px-3 py-1">
 <MapPin className="w-3.5 h-3.5" />
 Beijing
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-100/80 px-3 py-1">
 <Calendar className="w-3.5 h-3.5" />
 2025 years 6 monthsJoin
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-100/80 px-3 py-1">
 <LinkIcon className="w-3.5 h-3.5" />
 <a href="#" className="text-brand-500 hover:text-brand-600 hover:underline underline-offset-4">
 agentflow.ai/u/demo
 </a>
 </span>
 </div>

 {/* SocialLink */}
 <div className="flex items-center gap-2 mt-4">
 <a
 href="#"
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground"
 >
 <Github className="w-4 h-4" />
 </a>
 <a
 href="#"
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground"
 >
 <Twitter className="w-4 h-4" />
 </a>
 <a
 href="#"
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground"
 >
 <Linkedin className="w-4 h-4" />
 </a>
 <a
 href="#"
 className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground"
 >
 <Mail className="w-4 h-4" />
 </a>
 </div>
 </div>
 </div>
 </div>

 {/* StatisticsData */}

 <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x border-t border-border bg-surface-75/40">
 {userStats.map((stat) => (
 <div
 key={stat.label}
 className="group p-4 md:p-5 transition-colors hover:bg-surface-100/70"
 >
 <div className="flex items-center gap-3">
 <div className={cn("h-9 w-9 rounded-md border border-border/70 flex items-center justify-center", stat.bgColor)}>
 <stat.icon className={cn("h-4 w-4", stat.color)} />
 </div>
 <div>
 <p className="text-[20px] leading-none font-semibold text-foreground group-hover:text-brand-500 transition-colors">
 {stat.value}
 </p>
 <p className="text-[11px] text-foreground-light">{stat.label}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 </div>

 {/* mainContentRegion */}

 <div className="mt-6 pb-12">

 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
 <TabsList className="w-fit rounded-lg border border-border bg-surface-100/80 p-1">
 <TabsTrigger
 value="overview"
 className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-foreground-light data-[state=active]:bg-surface-200 data-[state=active]:text-foreground"
 >
 Overview
 </TabsTrigger>
 <TabsTrigger
 value="activity"
 className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-foreground-light data-[state=active]:bg-surface-200 data-[state=active]:text-foreground"
 >
 Activity
 </TabsTrigger>
 <TabsTrigger
 value="achievements"
 className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-foreground-light data-[state=active]:bg-surface-200 data-[state=active]:text-foreground"
 >
 Achievement
 </TabsTrigger>
 <TabsTrigger
 value="saved"
 className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-foreground-light data-[state=active]:bg-surface-200 data-[state=active]:text-foreground"
 >
 Favorite
 </TabsTrigger>
 </TabsList>

 {/* Overview Tab */}

 <TabsContent value="overview" className="space-y-6 animate-fade-in">

 <div className="page-grid md:grid-cols-3">

 {/* Left side - etcandContribution */}

 <div className="md:col-span-2 space-y-6">

 {/* etcCard */}

 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Trophy className="w-4 h-4 text-brand-500" />
 <h3 className="page-panel-title">Useretc</h3>
 </div>
 <span className="text-xs text-foreground-light">
 stillneed {pointsToNextLevel} ExperienceUpgrade
 </span>
 </div>

 <div className="p-6">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-14 h-14 rounded-md bg-brand-500 flex items-center justify-center text-background text-xl font-semibold shadow-sm">
 {currentLevel}
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between text-[13px] mb-2">
 <span className="text-foreground font-medium">Lv.{currentLevel} rateperson</span>
 <span className="text-foreground-muted">Lv.{currentLevel + 1}</span>
 </div>
 <Progress value={levelProgress} className="h-1.5 bg-surface-200" />
 <p className="text-xs text-foreground-light mt-2">
 CurrentExperience 1,750 / 2,000
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 text-xs text-foreground-light">
 <Flame className="w-4 h-4 text-brand-500" />
 <span>currentweeksActive: Continuous 5 days</span>
 <span className="text-brand-500 font-medium">🔥 Maintainhead!</span>
 </div>
 </div>
 </div>

 {/* Contribution */}

 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-brand-500" />
 <h3 className="page-panel-title">ActiveContribution</h3>
 </div>
 <span className="text-xs text-foreground-light">Past 12 weeks</span>
 </div>

 <div className="p-6">
 <div className="grid grid-cols-12 gap-1.5">
 {contributionData.map((item, index) => (
 <div
 key={index}
 className={cn(
 "w-full aspect-square rounded-sm transition-colors",
 item.value === 0 && "bg-surface-200",
 item.value === 1 && "bg-brand-200/40",
 item.value === 2 && "bg-brand-200/70",
 item.value === 3 && "bg-brand-500/70",
 item.value === 4 && "bg-brand-500"
 )}
 title={`Active: ${item.value}`}
 />
 ))}
 </div>

 <div className="flex items-center justify-end gap-2 mt-3 text-xs text-foreground-muted">
 <span>few</span>
 <div className="flex gap-1">
 <div className="w-3 h-3 rounded-sm bg-surface-200" />
 <div className="w-3 h-3 rounded-sm bg-brand-200/40" />
 <div className="w-3 h-3 rounded-sm bg-brand-200/70" />
 <div className="w-3 h-3 rounded-sm bg-brand-500/70" />
 <div className="w-3 h-3 rounded-sm bg-brand-500" />
 </div>
 <span>multiple</span>
 </div>
 </div>
 </div>

 {/* canTags */}

 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center gap-2">
 <Target className="w-4 h-4 text-foreground-light" />
 <h3 className="page-panel-title">canTags</h3>
 </div>
 </div>

 <div className="p-6">
 <div className="flex flex-wrap gap-2">
 {skillTags.map((tag) => (
 <span
 key={tag}
 className="px-3 py-1 rounded-full border border-border/80 bg-surface-200/70 text-[12px] text-foreground-light hover:bg-brand-200/60 hover:text-brand-500 cursor-pointer transition-colors"
 >
 {tag}
 </span>
 ))}
 <button className="px-3 py-1 rounded-full border border-dashed border-border text-[12px] text-foreground-muted hover:border-brand-500 hover:text-brand-500 transition-colors">
 + Addcan
 </button>
 </div>
 </div>
 </div>

 </div>

 {/* Right side - AchievementFeatured */}

 <div className="space-y-6">

 {/* AchievementShowcase */}

 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Award className="w-4 h-4 text-foreground-light" />
 <h3 className="page-panel-title">AchievementBadge</h3>
 </div>
 <Link href="#" className="text-xs text-brand-500 hover:text-brand-600 hover:underline underline-offset-4">
 View all
 </Link>
 </div>

 <div className="p-6">
 <div className="page-grid grid-cols-3 gap-3">

 {achievements.slice(0, 6).map((achievement) => (
 <div
 key={achievement.id}
 className={cn(
 "aspect-square rounded-md flex items-center justify-center relative group cursor-pointer transition-all",
 achievement.unlocked
 ? cn(achievement.bgColor, "hover:scale-105")
 : "bg-surface-200 opacity-50"
 )}
 title={achievement.name}
 >
 <achievement.icon className={cn(
 "w-8 h-8",
 achievement.unlocked ? achievement.color : "text-foreground-muted"
 )} />
 {!achievement.unlocked && (
 <div className="absolute inset-0 flex items-center justify-center bg-surface-200 rounded-md">
 <Shield className="w-4 h-4 text-foreground-muted" />
 </div>
 )}
 </div>
 ))}
 </div>

 <p className="text-xs text-foreground-muted mt-4 text-center">
 alreadyUnlock {achievements.filter(a => a.unlocked).length}/{achievements.length} Achievement
 </p>
 </div>
 </div>

 {/* RecentActivity */}

 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-foreground-light" />
 <h3 className="page-panel-title">RecentActivity</h3>
 </div>
 </div>

 <div className="p-6">
 <div className="space-y-3">
 {recentActivities.slice(0, 4).map((activity) => (
 <div key={activity.id} className="flex items-start gap-3 group cursor-pointer">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <activity.icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[13px] text-foreground truncate group-hover:text-brand-500 transition-colors">
 {activity.title}
 </p>
 <p className="text-xs text-foreground-muted">{activity.time}</p>
 </div>
 </div>
 ))}
 </div>

 <button
 onClick={() => setActiveTab("activity")}
 className="w-full mt-4 py-2 text-xs font-medium text-brand-500 hover:bg-brand-200/60 rounded-md transition-colors"
 >
 View allActivity
 </button>
 </div>
 </div>

 </div>

 </div>

 </TabsContent>

 {/* Activity Tab */}

 <TabsContent value="activity" className="space-y-4 animate-fade-in">
 <div className="page-panel overflow-hidden">
 <div className="page-panel-header">
 <div>
 <p className="page-panel-title">allsectionActivity</p>
 <p className="page-panel-description">RecentUpdate {recentActivities.length} </p>
 </div>
 </div>

 <div className="divide-y divide-border">
 {recentActivities.map((activity) => (
 <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-surface-75 transition-colors">
 <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 <activity.icon className="w-5 h-5 text-foreground-muted" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[13px] font-medium text-foreground">{activity.title}</p>
 <p className="text-xs text-foreground-muted mt-1">{activity.time}</p>
 </div>
 <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
 </div>
 ))}
 </div>
 </div>
 </TabsContent>

 {/* Achievement Tab */}

 <TabsContent value="achievements" className="space-y-6 animate-fade-in">
 <div className="page-panel">
 <div className="page-panel-header">
 <div>
 <p className="page-panel-title">allsectionAchievement</p>
 <p className="page-panel-description">
 alreadyUnlock {achievements.filter(a => a.unlocked).length}/{achievements.length} Achievement
 </p>
 </div>
 </div>

 <div className="p-6">
 <div className="page-grid md:grid-cols-2 lg:grid-cols-3">
 {achievements.map((achievement) => (
 <div
 key={achievement.id}
 className={cn(
 "p-6 rounded-md border transition-supabase",
 achievement.unlocked
 ? "bg-surface-100 border-border hover:border-border-strong cursor-pointer"
 : "bg-surface-75 border-border opacity-60"
 )}
 >
 <div className="flex items-start gap-4">
 <div className={cn(
 "w-14 h-14 rounded-md flex items-center justify-center shrink-0",
 achievement.unlocked ? achievement.bgColor : "bg-surface-200"
 )}>
 <achievement.icon className={cn(
 "w-7 h-7",
 achievement.unlocked ? achievement.color : "text-foreground-muted"
 )} />
 </div>
 <div className="flex-1">
 <h4 className={cn(
 "font-semibold mb-1",
 achievement.unlocked ? "text-foreground" : "text-foreground-muted"
 )}>
 {achievement.name}
 </h4>
 <p className="text-[13px] text-foreground-light">{achievement.description}</p>
 {achievement.unlocked && (
 <p className="text-xs text-brand-500 mt-2">✓ alreadyUnlock</p>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </TabsContent>

 {/* Favorite Tab */}

 <TabsContent value="saved" className="space-y-4 animate-fade-in">
 <div className="page-panel">
 <div className="page-panel-header">
 <div>
 <p className="page-panel-title">FavoriteContent</p>
 <p className="page-panel-description"> {savedItems.length} Content</p>
 </div>
 </div>

 <div className="p-6">
 <div className="page-grid md:grid-cols-2">
 {savedItems.map((item) => (
 <div
 key={item.id}
 className="p-4 rounded-lg bg-surface-100 border border-border hover:border-border-strong hover:bg-surface-75 transition-supabase cursor-pointer group"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-md bg-surface-200 flex items-center justify-center shrink-0 group-hover:bg-brand-200/60 transition-colors">
 <item.icon className="w-6 h-6 text-foreground-muted group-hover:text-brand-500 transition-colors" />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-foreground group-hover:text-brand-500 transition-colors">
 {item.title}
 </h4>
 <p className="text-[13px] text-foreground-light mt-1 flex items-center gap-2">
 <span className="capitalize">{item.type}</span>
 <span></span>
 <span>{item.uses.toLocaleString()} timesUsage</span>
 </p>
 </div>
 <Bookmark className="w-4 h-4 text-brand-500 fill-brand-500 shrink-0" />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </TabsContent>

 </Tabs>

 </div>

 </div>

 </PageContainer>

 );
}

