"use client";

/**
 * InviteFriendsPage - Supabase Style
 * RecommendedRewardsSystem
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
 Gift,
 Copy,
 Check,
 Users,
 DollarSign,
 Zap,
 Mail,
 Twitter,
 Linkedin,
 MessageCircle,
 QrCode,
 ChevronRight,
 Star,
 Trophy,
 Target,
 ArrowRight,
 ExternalLink,
 Sparkles,
 Crown,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// RewardsRule

const rewardRules = [

 {
 title: "InviteSign Up",

 description: "FriendsViayou'sLinkSign Up",

 yourReward: "500 Credits",

 friendReward: "300 Credits",

 icon: Users,

 },

 {
 title: "FriendsUpgrade",

 description: "FriendsUpgradeasPaidUser",

 yourReward: "¥50 Cash",

 friendReward: "months 8 ",

 icon: Star,

 },

 {
 title: "ContinuousRewards",

 description: "FriendseachmonthsRenew",

 yourReward: "10% Split",

 friendReward: "-",

 icon: DollarSign,

 },

];

// InviteStatistics

const referralStats = {
 totalInvited: 12,

 registered: 8,

 upgraded: 3,

 totalEarnings: 350.00,

 pendingEarnings: 50.00,

 currentPoints: 4500,
};

const statCards = [
 {
 label: "alreadyInvite",
 value: referralStats.totalInvited,
 helper: `${referralStats.registered} alreadySign Up`,
 icon: Users,
 },
 {
 label: "alreadyUpgrade",
 value: referralStats.upgraded,
 helper: "PaidUser",
 icon: Star,
 },
 {
 label: "CumulativeRevenue",
 value: `¥${referralStats.totalEarnings.toFixed(0)}`,
 helper: `+¥${referralStats.pendingEarnings.toFixed(0)} pendingDistribute`,
 icon: DollarSign,
 highlight: true,
 },
 {
 label: "CreditsBalance",
 value: referralStats.currentPoints.toLocaleString(),
 helper: "canRedeem API Call",
 icon: Sparkles,
 highlight: true,
 },
];

const shareChannels = [
 { label: "Twitter", icon: Twitter },
 { label: "LinkedIn", icon: Linkedin },
 { label: "WeChat", icon: MessageCircle },
];

const redeemOptions = [
 {
 title: "1000 times API Call",
 cost: "2000 Credits",
 icon: Zap,
 },
 {
 title: "Pro Plan 1 months",
 cost: "10000 Credits",
 icon: Crown,
 },
];

// InviteRecord

const referralHistory = [

 {
 id: "1",

 name: "",

 email: "zhangming@example.com",

 status: "upgraded",

 registeredAt: "2026-01-20",

 reward: "¥50 + 500 Credits",

 },

 {
 id: "2",

 name: "Li Hua",

 email: "lihua@example.com",

 status: "registered",

 registeredAt: "2026-01-25",

 reward: "500 Credits",

 },

 {
 id: "3",

 name: "Wang Fang",

 email: "wangfang@example.com",

 status: "upgraded",

 registeredAt: "2026-01-15",

 reward: "¥50 + 500 Credits",

 },

 {
 id: "4",

 name: "Zhao Qiang",

 email: "zhaoqiang@example.com",

 status: "registered",

 registeredAt: "2026-01-28",

 reward: "500 Credits",

 },

 {
 id: "5",

 name: "Chen Hong",

 email: "chenhong@example.com",

 status: "pending",

 registeredAt: "2026-01-30",

 reward: "pendingDistribute",

 },

];

// Leaderboard

const leaderboard = [

 { rank: 1, name: "UserA***", invites: 156, reward: "¥2,800" },

 { rank: 2, name: "UserB***", invites: 134, reward: "¥2,340" },

 { rank: 3, name: "UserC***", invites: 98, reward: "¥1,680" },

 { rank: 4, name: "you", invites: 12, reward: "¥350", isCurrentUser: true },

 { rank: 5, name: "UserD***", invites: 10, reward: "¥280" },

];

// FetchStatusConfig

const getStatusConfig = (status: string) => {
 switch (status) {
 case "upgraded":

 return { label: "alreadyUpgrade", variant: "success" as const };

 case "registered":

 return { label: "alreadySign Up", variant: "secondary" as const };

 case "pending":

 return { label: "pendingConfirm", variant: "outline" as const };

 default:

 return { label: status, variant: "outline" as const };

 }
};

export default function ReferralPage() {
 const [copied, setCopied] = useState(false);

 const [inviteEmail, setInviteEmail] = useState("");

 const [sending, setSending] = useState(false);

 const referralCode = "REF-ABC123";

 const referralLink = `https://reverseai.com/r/${referralCode}`;

 // CopyLink

 const handleCopy = () => {
 navigator.clipboard.writeText(referralLink);

 setCopied(true);

 setTimeout(() => setCopied(false), 2000);

 };

 // SendInvite

 const handleSendInvite = async () => {
 if (!inviteEmail) return;

 setSending(true);

 await new Promise((resolve) => setTimeout(resolve, 1000));

 setSending(false);

 setInviteEmail("");

 };

 // CalculateProgress

 const milestoneTarget = 10;

 const milestoneProgress = referralStats.totalInvited % milestoneTarget;

 const progressToNextReward = (milestoneProgress / milestoneTarget) * 100;

 const invitesToNextReward = milestoneTarget - milestoneProgress;

 return (
 <PageContainer>
 <div className="page-section space-y-8">
 <PageHeader
 eyebrow="Referral"
 title="InviteFriends, ShareRewards"
 description="InviteFriendsJoin ReverseAI, methodcanObtainCredits, CashRewardsandmore'sCallQuota."
 icon={<Gift className="w-4 h-4" />}
 className="mb-0"
 actions={(
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 className="gap-1.5 border-border text-foreground-light hover:text-foreground"
 >
 ViewRule
 <ExternalLink className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="sm" className="text-foreground-muted">
 InviteRecord
 <ArrowRight className="w-4 h-4" />
 </Button>
 </div>
 )}
 />

 <div className="page-panel p-5">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-medium text-foreground">ExclusiveInvite Link</p>
 <p className="text-xs text-foreground-muted mt-1">InviteFriendsSign Upafter, SystemAutoRecordRewards</p>
 </div>
 <Badge variant="outline" size="sm" className="font-mono text-[11px]">
 {referralCode}
 </Badge>
 </div>

 <div className="mt-4 flex flex-col gap-3">
 <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
 <Input
 value={referralLink}
 readOnly
 variant="dark"
 inputSize="lg"
 className="font-mono text-[12px] sm:flex-1"
 />
 <div className="flex gap-2">
 <Button size="lg" onClick={handleCopy} className="sm:min-w-[120px]">
 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 {copied ? "alreadyCopy": "Copy"}
 </Button>
 <Button variant="outline" size="icon-lg" className="border-border">
 <QrCode className="w-4 h-4" />
 </Button>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
 <span className="text-xs text-foreground-muted">Shareto</span>
 {shareChannels.map((channel) => {
 const Icon = channel.icon;
 return (
 <Button
 key={channel.label}
 variant="outline"
 size="sm"
 className="gap-1.5 border-border text-foreground-light"
 >
 <Icon className="w-4 h-4" />
 {channel.label}
 </Button>
 );
 })}
 </div>
 </div>
 </div>

 <div className="page-grid sm:grid-cols-2 xl:grid-cols-4">
 {statCards.map((stat) => {
 const Icon = stat.icon;
 return (
 <div
 key={stat.label}
 className="page-panel p-4 transition-supabase animate-stagger-in hover:border-border-strong"
 >
 <div className="flex items-center justify-between">
 <span className="text-[12px] text-foreground-light">{stat.label}</span>
 <Icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div className="mt-3 text-2xl font-semibold text-foreground tabular-nums">{stat.value}</div>
 <p className={cn("mt-1 text-xs", stat.highlight ? "text-brand-500" : "text-foreground-muted")}>
 {stat.helper}
 </p>
 </div>
 );
 })}
 </div>

 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-sm font-medium text-foreground">RewardsRule</h2>
 <Button variant="ghost" size="sm" className="text-foreground-muted">
 CompleteRule
 <ExternalLink className="w-4 h-4" />
 </Button>
 </div>

 <div className="page-grid md:grid-cols-3">
 {rewardRules.map((rule, index) => {
 const Icon = rule.icon;
 return (
 <div
 key={rule.title}
 className="page-panel p-5 transition-supabase hover:border-border-strong"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-md bg-brand-200/70 border border-brand-400/40 flex items-center justify-center">
 <Icon className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">{rule.title}</h3>
 <p className="text-xs text-foreground-muted">{rule.description}</p>
 </div>
 </div>
 <span className="text-[10px] uppercase tracking-[0.2em] text-foreground-muted">
 Step 0{index + 1}
 </span>
 </div>

 <div className="mt-4 space-y-2 text-[13px]">
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">youObtain</span>
 <span className="font-medium text-brand-500">{rule.yourReward}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-light">FriendsObtain</span>
 <span className="font-medium text-foreground">{rule.friendReward}</span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="page-grid lg:grid-cols-[minmax(0,1fr)_360px]">
 <div className="space-y-6">
 <Tabs defaultValue="history">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-sm font-medium text-foreground">InviteRecord</h2>
 <TabsList variant="underline" showIndicator className="border-border">
 <TabsTrigger value="history" variant="underline">
 HistoryRecord
 </TabsTrigger>
 <TabsTrigger value="invite" variant="underline">
 EmailInvite
 </TabsTrigger>
 </TabsList>
 </div>

 <TabsContent value="history">
 <div className="page-panel overflow-hidden">
 <div className="page-panel-header px-4 py-3 flex items-center justify-between">
 <span className="text-xs text-foreground-muted">Recent 30 days</span>
 <Button variant="ghost" size="xs" className="text-foreground-muted">
 Export CSV
 </Button>
 </div>
 <table className="w-full text-left">
 <thead className="border-b border-border bg-surface-100/60">
 <tr>
 <th className="px-4 py-3 text-table-header">Friends</th>
 <th className="px-4 py-3 text-table-header">Status</th>
 <th className="px-4 py-3 text-table-header">Sign UpTime</th>
 <th className="px-4 py-3 text-table-header text-right">Rewards</th>
 </tr>
 </thead>
 <tbody>
 {referralHistory.map((item) => {
 const status = getStatusConfig(item.status);
 return (
 <tr
 key={item.id}
 className="border-b border-border last:border-0 hover:bg-surface-75 transition-supabase"
 >
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <Avatar className="w-8 h-8">
 <AvatarFallback className="bg-brand-200 text-brand-500 text-sm">
 {item.name.slice(0, 1)}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-medium text-foreground">{item.name}</p>
 <p className="text-xs text-foreground-muted">{item.email}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 <Badge variant={status.variant} size="sm">
 {status.label}
 </Badge>
 </td>
 <td className="px-4 py-3 text-sm text-foreground-muted tabular-nums">
 {item.registeredAt}
 </td>
 <td className="px-4 py-3 text-sm font-medium text-right text-foreground">
 {item.reward}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </TabsContent>

 <TabsContent value="invite">
 <div className="page-panel p-6 space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md border border-border bg-surface-200 flex items-center justify-center">
 <Mail className="w-4 h-4 text-foreground-light" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">ViaEmailInviteFriends</h3>
 <p className="text-xs text-foreground-muted">
 SupportBatchInvite, SystemwillaseachFriendsGenerateTrackLink
 </p>
 </div>
 </div>
 <div className="flex flex-col gap-2 sm:flex-row">
 <Input
 type="email"
 placeholder="friend@example.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 variant="dark"
 inputSize="lg"
 className="flex-1"
 />
 <Button
 onClick={handleSendInvite}
 disabled={!inviteEmail}
 loading={sending}
 loadingText="Send..."
 size="lg"
 className="sm:min-w-[140px]"
 >
 SendInvite
 </Button>
 </div>
 <p className="text-xs text-foreground-muted">
 multipleEmailPleaseuseCommaSeparator, mostmultipleSupport 20 Address
 </p>
 </div>
 </TabsContent>
 </Tabs>
 </div>

 <div className="space-y-6">
 <div className="page-panel p-5">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="w-9 h-9 rounded-md border border-brand-400/40 bg-brand-200/70 flex items-center justify-center">
 <Target className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">down1in</h3>
 <p className="text-xs text-foreground-muted">eachInvite 10 FriendsUnlockRewards</p>
 </div>
 </div>
 <Badge variant="primary" size="sm">
 In Progress
 </Badge>
 </div>
 <p className="mt-4 text-[13px] text-foreground-light">
 againInvite <span className="text-foreground font-medium">{invitesToNextReward}</span> personnowcanObtainoutsideRewards
 </p>
 <div className="mt-4 space-y-2">
 <Progress value={progressToNextReward} size="sm" variant="default" />
 <div className="flex items-center justify-between text-[12px] text-foreground-muted">
 <span className="tabular-nums">{milestoneProgress}/10</span>
 <span className="text-brand-500 font-medium">Rewards: ¥100</span>
 </div>
 </div>
 </div>

 <div className="page-panel p-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Trophy className="w-4 h-4 text-foreground-light" />
 <h3 className="text-sm font-medium text-foreground">currentmonthsLeaderboard</h3>
 </div>
 <Button variant="ghost" size="xs" className="text-foreground-muted">
 View all
 </Button>
 </div>
 <div className="mt-4 space-y-2">
 {leaderboard.map((user) => (
 <div
 key={user.rank}
 className={cn(
 "flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-supabase",
 user.isCurrentUser ? "bg-brand-200/60 border-brand-400/30" : "hover:bg-surface-75"
 )}
 >
 <div
 className={cn(
 "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
 user.rank === 1 && "bg-brand-500 text-background",
 user.rank === 2 && "bg-surface-300 text-foreground",
 user.rank === 3 && "bg-brand-400 text-foreground",
 user.rank > 3 && "bg-surface-200 text-foreground-muted"
 )}
 >
 {user.rank}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className={cn("text-sm font-medium truncate", user.isCurrentUser ? "text-brand-500" : "text-foreground")}>
 {user.name}
 </p>
 {user.isCurrentUser && (
 <Badge variant="primary" size="xs">
 you
 </Badge>
 )}
 </div>
 <p className="text-xs text-foreground-muted">{user.invites} personInvite</p>
 </div>
 <span className="text-sm font-medium text-foreground">{user.reward}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="page-panel p-5">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-brand-500" />
 <h3 className="text-sm font-medium text-foreground">CreditsRedeem</h3>
 </div>
 <p className="text-xs text-foreground-muted mt-1">
 UsageCreditsRedeemCallQuotaorAdvancedPlan
 </p>
 <div className="mt-4 space-y-2">
 {redeemOptions.map((option) => {
 const Icon = option.icon;
 return (
 <div
 key={option.title}
 className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2.5 transition-supabase hover:border-border-strong hover:bg-surface-100"
 >
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
 <Icon className="w-4 h-4 text-foreground-light" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">{option.title}</p>
 <p className="text-xs text-foreground-muted">{option.cost}</p>
 </div>
 </div>
 <ChevronRight className="w-4 h-4 text-foreground-muted" />
 </div>
 );
 })}
 </div>
 <Button variant="outline" className="w-full mt-4">
 View allRedeemOption
 <ArrowRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}

