"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
 MessageSquare,
 Heart,
 Share2,
 Reply,
 User,
 Clock,
 TrendingUp,
 Award,
 Star,
 Flame,
 Crown,
 Medal,
 Trophy,
 ArrowUp,
 ArrowDown,
 Zap,
 Code2,
 GitBranch,
 Rocket,
} from "lucide-react";

// MockDiscussionData
const mockDiscussions = [
 {
 id: 1", author: "",
 avatar: "Z",
 title: "ifwhatoptimallargeScaleDataProcessWorkflow?",
 preview: "Ihas1needneedProcess 100 10000Data'sWorkflow, itembeforeRunTime, hasWhatoptimalSuggestion??",
 tags: ["canoptimal", "DataProcess"],
 likes: 42,
 replies: 18,
 time: "10 minbefore",
 isHot: true,
 },
 {
 id: 2,
 author: "Emily Chen",
 avatar: "E",
 title: "Share: I's AI SupportWorkflowTemplate",
 preview: "1weeksTime'sSupportWorkflow, SupportmultipleConversation, SentimentAnalyticsandAutoCategory, Sharetolarge...",
 tags: ["TemplateShare", "AI App"],
 likes: 89,
 replies: 34,
 time: "25 minbefore",
 isHot: true,
 },
 {
 id: 3,
 author: "Wang Lei",
 avatar: "W",
 title: "newAsk: Webhook TriggerConfig?",
 preview: "wantuse Webhook TriggerWorkflow, butis1nottoRequest, haspersoncanseeseeConfiginhasIssue??",
 tags: ["new", "Webhook"],
 likes: 12,
 replies: 8,
 time: "1 hbefore",
 isHot: false,
 },
 {
 id: 4,
 author: "Li Na",
 avatar: "L",
 title: "Enterprise-gradeDeployBest PracticesShare",
 preview: "WeCompanyUsage AgentFlow alreadyyears, Share1atProductionEnvironmentSummary'sExperience...",
 tags: ["Best Practices", "Enterprise"],
 likes: 156,
 replies: 67,
 time: "2 hbefore",
 isHot: true,
 },
 {
 id: 5,
 author: "Alex Liu",
 avatar: "A",
 title: "Feature Request: Support GraphQL Trigger",
 preview: "HopecanIncrease GraphQL Subscription asTriggerType, thisstylecanwithmoreandExistingSystemIntegration...",
 tags: ["FeaturesSuggestion"],
 likes: 28,
 replies: 12,
 time: "3 hbefore",
 isHot: false,
 },
];

export interface LiveDiscussionFeedProps extends React.HTMLAttributes<HTMLDivElement> {
 /** DisplayCount */
 limit?: number;
 /** isnoAutoRefresh */
 autoRefresh?: boolean;
 /** Refreshbetween(ms) */
 refreshInterval?: number;
}

export function LiveDiscussionFeed({
 limit = 5,
 autoRefresh = true,
 refreshInterval = 30000,
 className,
 ...props
}: LiveDiscussionFeedProps) {
 const [discussions, setDiscussions] = useState(mockDiscussions.slice(0, limit));
 const [newCount, setNewCount] = useState(0);

 // MockReal-timeUpdate
 useEffect(() => {
 if (!autoRefresh) return;

 const interval = setInterval(() => {
 setNewCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
 }, refreshInterval);

 return () => clearInterval(interval);
 }, [autoRefresh, refreshInterval]);

 const handleRefresh = () => {
 // MockLoadnewContent
 setDiscussions([...mockDiscussions].sort(() => Math.random() - 0.5).slice(0, limit));
 setNewCount(0);
 };

 return (
 <div className={cn("", className)} {...props}>
 {/* newMessageTip */}
 {newCount > 0 && (
 <button
 onClick={handleRefresh}
 className="w-full mb-4 py-2 px-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
 >
 <Zap className="w-4 h-4" />
 {newCount} newDiscussion, ClickRefresh
 </button>
 )}

 {/* DiscussionList */}
 <div className="space-y-4">
 {discussions.map((discussion, index) => (
 <div
 key={discussion.id}
 className={cn(
 "p-4 rounded-xl border transition-all cursor-pointer group",
 "bg-card hover:bg-card/80 border-border hover:border-primary/30",
 "hover:shadow-lg hover:shadow-primary/5"
 )}
 style={{
 animation: `slideInUp 0.4s ease-out ${index * 0.1}s both`,
 }}
 >
 <div className="flex items-start gap-3">
 {/* Avatar */}
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white font-semibold shrink-0">
 {discussion.avatar}
 </div>

 <div className="flex-1 min-w-0">
 {/* TitleandTags */}
 <div className="flex items-start justify-between gap-2 mb-1">
 <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
 {discussion.isHot && (
 <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
 )}
 {discussion.title}
 </h4>
 </div>

 {/* Preview */}
 <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
 {discussion.preview}
 </p>

 {/* FooterInfo */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <User className="w-3 h-3" />
 {discussion.author}
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {discussion.time}
 </span>
 </div>
 <div className="flex items-center gap-3 text-xs">
 <span className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
 <Heart className="w-3 h-3" />
 {discussion.likes}
 </span>
 <span className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
 <MessageSquare className="w-3 h-3" />
 {discussion.replies}
 </span>
 </div>
 </div>

 {/* Tags */}
 <div className="flex items-center gap-2 mt-2">
 {discussion.tags.map((tag) => (
 <span
 key={tag}
 className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 <style jsx>{`
 @keyframes slideInUp {
 from {
 opacity: 0;
 transform: translateY(20px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }
 `}</style>
 </div>
 );
}

// LeaderboardData
const mockLeaderboard = [
 { rank: 1", name: "Li Ming", avatar: "L", score: 12580, change: 2, badge: "crown", workflows: 156, contributions: 89 },
 { rank: 2, name: "Sarah Wang", avatar: "S", score: 11240, change: -1, badge: "medal", workflows: 134, contributions: 76 },
 { rank: 3, name: "", avatar: "Z", score: 10890, change: 1, badge: "trophy", workflows: 128, contributions: 71 },
 { rank: 4, name: "Mike Chen", avatar: "M", score: 9650, change: 0, badge: "star", workflows: 112, contributions: 64 },
 { rank: 5, name: "Wang Fang", avatar: "W", score: 8920, change: 3, badge: "star", workflows: 98, contributions: 58 },
 { rank: 6, name: "David Liu", avatar: "D", score: 8450, change: -2, badge: "star", workflows: 89, contributions: 52 },
 { rank: 7, name: "Chen Jing", avatar: "C", score: 7890, change: 1, badge: "star", workflows: 82, contributions: 47 },
 { rank: 8, name: "Emma Zhang", avatar: "E", score: 7320, change: 0, badge: "star", workflows: 75, contributions: 42 },
];

export interface AnimatedLeaderboardProps extends React.HTMLAttributes<HTMLDivElement> {
 /** DisplayCount */
 limit?: number;
 /** isnoDisplayAnimation */
 animated?: boolean;
 /** LeaderboardType */
 type?: "contributors" | "workflows" | "overall";
}

export function AnimatedLeaderboard({
 limit = 8,
 animated = true,
 type = "overall",
 className,
 ...props
}: AnimatedLeaderboardProps) {
 const [isVisible, setIsVisible] = useState(!animated);
 const [hoveredRank, setHoveredRank] = useState<number | null>(null);

 useEffect(() => {
 if (animated) {
 const timer = setTimeout(() => setIsVisible(true), 300);
 return () => clearTimeout(timer);
 }
 }, [animated]);

 const getBadgeIcon = (badge: string) => {
 switch (badge) {
 case "crown":
 return <Crown className="w-4 h-4 text-yellow-500" />;
 case "medal":
 return <Medal className="w-4 h-4 text-muted-foreground" />;
 case "trophy":
 return <Trophy className="w-4 h-4 text-amber-600" />;
 default:
 return <Star className="w-4 h-4 text-primary" />;
 }
 };

 const getRankStyle = (rank: number) => {
 if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
 if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
 if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
 return "bg-card border-border";
 };

 return (
 <div className={cn("", className)} {...props}>
 <div className="space-y-2">
 {mockLeaderboard.slice(0, limit).map((user, index) => (
 <div
 key={user.rank}
 className={cn(
 "flex items-center gap-4 p-3 rounded-xl border transition-all",
 getRankStyle(user.rank),
 hoveredRank === user.rank && "scale-[1.02] shadow-lg"
 )}
 style={{
 opacity: isVisible ? 1 : 0,
 transform: isVisible ? "translateX(0)" : "translateX(-20px)",
 transition: `all 0.4s ease-out ${index * 0.08}s`,
 }}
 onMouseEnter={() => setHoveredRank(user.rank)}
 onMouseLeave={() => setHoveredRank(null)}
 >
 {/* Ranking */}
 <div className={cn(
 "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
 user.rank === 1 && "bg-yellow-500 text-black",
 user.rank === 2 && "bg-gray-400 text-black",
 user.rank === 3 && "bg-amber-600 text-white",
 user.rank > 3 && "bg-muted text-muted-foreground"
 )}>
 {user.rank}
 </div>

 {/* Avatar */}
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center text-white font-semibold">
 {user.avatar}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-foreground">{user.name}</span>
 {getBadgeIcon(user.badge)}
 </div>
 <div className="flex items-center gap-3 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <GitBranch className="w-3 h-3" />
 {user.workflows} Workflow
 </span>
 <span className="flex items-center gap-1">
 <Code2 className="w-3 h-3" />
 {user.contributions} Contribution
 </span>
 </div>
 </div>

 {/* countand */}
 <div className="text-right">
 <div className="font-bold text-foreground">{user.score.toLocaleString()}</div>
 <div className={cn(
 "flex items-center justify-end gap-0.5 text-xs",
 user.change > 0 && "text-emerald-500",
 user.change < 0 && "text-red-500",
 user.change === 0 && "text-muted-foreground"
 )}>
 {user.change > 0 && <ArrowUp className="w-3 h-3" />}
 {user.change < 0 && <ArrowDown className="w-3 h-3" />}
 {user.change !== 0 && Math.abs(user.change)}
 {user.change === 0 && "—"}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
