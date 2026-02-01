"use client";

/**
 * 成就与徽章系统页面 - Supabase Studio 风格
 * 展示用户获得的成就、进度和排行榜
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Award,
  Trophy,
  Star,
  Crown,
  Shield,
  Zap,
  Target,
  Flame,
  Rocket,
  Heart,
  Code,
  MessageSquare,
  Bot,
  FileText,
  Users,
  Clock,
  TrendingUp,
  Lock,
  Check,
  Sparkles,
  Medal,
  Gift,
  ChevronRight,
  Share2,
  Search,
  Filter,
} from "lucide-react";

// 成就分类
const categories = [
  { id: "all", name: "全部", count: 24 },
  { id: "workflow", name: "工作流", count: 6 },
  { id: "conversation", name: "对话", count: 5 },
  { id: "agent", name: "Agent", count: 4 },
  { id: "creative", name: "创意", count: 4 },
  { id: "social", name: "社交", count: 3 },
  { id: "special", name: "特殊", count: 2 },
];

// 稀有度配置
const rarityConfig = {
  common: {
    label: "普通",
    chip: "bg-surface-200 text-foreground-light border-border",
    icon: "text-foreground-muted",
    swatch: "bg-surface-200 border-border",
  },
  rare: {
    label: "稀有",
    chip: "bg-brand-200 text-brand-500 border-brand-400",
    icon: "text-brand-500",
    swatch: "bg-brand-200 border-brand-400",
  },
  epic: {
    label: "史诗",
    chip: "bg-surface-200 text-foreground border-border-strong",
    icon: "text-foreground",
    swatch: "bg-surface-200 border-border-strong",
  },
  legendary: {
    label: "传说",
    chip: "bg-surface-300 text-foreground border-border-strong",
    icon: "text-foreground",
    swatch: "bg-surface-300 border-border-strong",
  },
};

// 成就数据
const achievements = [
  // 工作流成就
  {
    id: "1",
    name: "自动化先锋",
    description: "创建第一个工作流",
    icon: Zap,
    category: "workflow",
    rarity: "common",
    unlocked: true,
    unlockedAt: "2025-12-15",
    progress: 100,
    xp: 50,
  },
  {
    id: "2",
    name: "流程大师",
    description: "创建 10 个工作流",
    icon: Trophy,
    category: "workflow",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-10",
    progress: 100,
    xp: 200,
  },
  {
    id: "3",
    name: "自动化狂人",
    description: "创建 50 个工作流",
    icon: Rocket,
    category: "workflow",
    rarity: "epic",
    unlocked: false,
    progress: 46,
    target: 50,
    xp: 500,
  },
  {
    id: "4",
    name: "效率冠军",
    description: "工作流累计执行 1000 次",
    icon: Crown,
    category: "workflow",
    rarity: "epic",
    unlocked: true,
    unlockedAt: "2026-01-25",
    progress: 100,
    xp: 500,
  },
  {
    id: "5",
    name: "稳定运行",
    description: "保持 99% 以上的工作流成功率",
    icon: Shield,
    category: "workflow",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-20",
    progress: 100,
    xp: 300,
  },
  {
    id: "6",
    name: "永动机",
    description: "工作流连续运行 30 天无故障",
    icon: Clock,
    category: "workflow",
    rarity: "legendary",
    unlocked: false,
    progress: 75,
    target: 30,
    xp: 1000,
  },
  // 对话成就
  {
    id: "7",
    name: "AI 探索者",
    description: "完成第一次 AI 对话",
    icon: MessageSquare,
    category: "conversation",
    rarity: "common",
    unlocked: true,
    unlockedAt: "2025-12-10",
    progress: 100,
    xp: 50,
  },
  {
    id: "8",
    name: "对话达人",
    description: "完成 100 次 AI 对话",
    icon: Sparkles,
    category: "conversation",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-15",
    progress: 100,
    xp: 200,
  },
  {
    id: "9",
    name: "AI 好友",
    description: "完成 1000 次 AI 对话",
    icon: Heart,
    category: "conversation",
    rarity: "epic",
    unlocked: false,
    progress: 65,
    target: 1000,
    xp: 500,
  },
  {
    id: "10",
    name: "模型收集者",
    description: "使用过 5 种以上不同的 AI 模型",
    icon: Medal,
    category: "conversation",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-18",
    progress: 100,
    xp: 300,
  },
  {
    id: "11",
    name: "深度思考者",
    description: "单次对话超过 50 轮",
    icon: Target,
    category: "conversation",
    rarity: "rare",
    unlocked: false,
    progress: 84,
    target: 50,
    xp: 250,
  },
  // Agent 成就
  {
    id: "12",
    name: "Agent 创造者",
    description: "创建第一个 AI Agent",
    icon: Bot,
    category: "agent",
    rarity: "common",
    unlocked: true,
    unlockedAt: "2026-01-05",
    progress: 100,
    xp: 100,
  },
  {
    id: "13",
    name: "Agent 专家",
    description: "创建 5 个 AI Agent",
    icon: Users,
    category: "agent",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-22",
    progress: 100,
    xp: 300,
  },
  {
    id: "14",
    name: "受欢迎的创作者",
    description: "Agent 被其他用户使用 100 次",
    icon: Star,
    category: "agent",
    rarity: "epic",
    unlocked: false,
    progress: 45,
    target: 100,
    xp: 500,
  },
  {
    id: "15",
    name: "Agent 大师",
    description: "创建一个获得 4.5+ 评分的 Agent",
    icon: Award,
    category: "agent",
    rarity: "legendary",
    unlocked: false,
    progress: 0,
    xp: 1000,
  },
  // 创意成就
  {
    id: "16",
    name: "内容创作者",
    description: "使用创意工坊生成 10 篇内容",
    icon: FileText,
    category: "creative",
    rarity: "common",
    unlocked: true,
    unlockedAt: "2026-01-12",
    progress: 100,
    xp: 100,
  },
  {
    id: "17",
    name: "代码生成器",
    description: "生成 1000 行以上代码",
    icon: Code,
    category: "creative",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-28",
    progress: 100,
    xp: 250,
  },
  {
    id: "18",
    name: "多才多艺",
    description: "使用所有创作类型各至少一次",
    icon: Sparkles,
    category: "creative",
    rarity: "rare",
    unlocked: false,
    progress: 75,
    target: 4,
    xp: 300,
  },
  {
    id: "19",
    name: "高产作家",
    description: "一天内生成 50 篇内容",
    icon: Flame,
    category: "creative",
    rarity: "epic",
    unlocked: false,
    progress: 32,
    target: 50,
    xp: 500,
  },
  // 社交成就
  {
    id: "20",
    name: "分享达人",
    description: "分享 10 个模板或工作流",
    icon: Share2,
    category: "social",
    rarity: "rare",
    unlocked: true,
    unlockedAt: "2026-01-20",
    progress: 100,
    xp: 200,
  },
  {
    id: "21",
    name: "社区贡献者",
    description: "分享的内容被使用 500 次",
    icon: Gift,
    category: "social",
    rarity: "epic",
    unlocked: false,
    progress: 35,
    target: 500,
    xp: 500,
  },
  {
    id: "22",
    name: "影响力大师",
    description: "分享的内容被使用 5000 次",
    icon: Crown,
    category: "social",
    rarity: "legendary",
    unlocked: false,
    progress: 7,
    target: 5000,
    xp: 2000,
  },
  // 特殊成就
  {
    id: "23",
    name: "创始用户",
    description: "早期注册用户",
    icon: Star,
    category: "special",
    rarity: "legendary",
    unlocked: true,
    unlockedAt: "2025-12-01",
    progress: 100,
    xp: 1000,
  },
  {
    id: "24",
    name: "连续登录王",
    description: "连续登录 30 天",
    icon: Flame,
    category: "special",
    rarity: "epic",
    unlocked: false,
    progress: 83,
    target: 30,
    xp: 500,
  },
];

// 用户统计
const userStats = {
  totalXP: 4250,
  level: 12,
  levelName: "效率达人",
  nextLevelXP: 5000,
  unlockedCount: 14,
  totalCount: 24,
  rank: 156,
};

export default function AchievementsPage() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"rarity" | "recent">("rarity");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // 筛选成就
  const filteredAchievements = achievements.filter((achievement) => {
    const matchesCategory =
      selectedCategory === "all" || achievement.category === selectedCategory;
    const matchesUnlocked = !showUnlockedOnly || achievement.unlocked;
    const matchesSearch =
      !normalizedQuery ||
      achievement.name.toLowerCase().includes(normalizedQuery) ||
      achievement.description.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesUnlocked && matchesSearch;
  });

  // 按稀有度排序（传说 > 史诗 > 稀有 > 普通）
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortMode === "recent") {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      const timeA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const timeB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.progress - a.progress;
    }

    // 先按是否解锁排序，解锁的在前
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    // 再按稀有度排序
    return (
      rarityOrder[a.rarity as keyof typeof rarityOrder] -
      rarityOrder[b.rarity as keyof typeof rarityOrder]
    );
  });

  const displayName = user?.displayName || user?.username || "你";
  const unlockRate = Math.round((userStats.unlockedCount / userStats.totalCount) * 100);
  const nextLevelNeed = Math.max(userStats.nextLevelXP - userStats.totalXP, 0);
  const levelProgress = Math.min((userStats.totalXP / userStats.nextLevelXP) * 100, 100);
  const categoryMap = categories.reduce<Record<string, string>>((acc, category) => {
    if (category.id !== "all") {
      acc[category.id] = category.name;
    }
    return acc;
  }, {});
  const rareAchievementCount = achievements.filter((achievement) =>
    ["rare", "epic", "legendary"].includes(achievement.rarity)
  ).length;
  const unlockedRareCount = achievements.filter((achievement) =>
    ["rare", "epic", "legendary"].includes(achievement.rarity) && achievement.unlocked
  ).length;
  const nextUnlocks = filteredAchievements
    .filter((achievement) => !achievement.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);
  const recentUnlocks = filteredAchievements
    .filter((achievement) => achievement.unlocked && achievement.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);

  return (
    <div className="page-section p-6 space-y-6">
      <div className="page-header">
        <div>
          <p className="page-caption">Achievements</p>
          <h1 className="page-title flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-500" />
            成就中心
          </h1>
          <p className="page-description">
            欢迎回来，{displayName} · 已解锁 {userStats.unlockedCount}/{userStats.totalCount} 项
          </p>
        </div>
        <div className="page-toolbar">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border text-foreground-light hover:text-foreground"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            分享成绩
          </Button>
          <Button className="h-8 bg-brand-500 hover:bg-brand-600 text-background">
            查看推荐任务
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="page-divider" />

      <div className="page-grid sm:grid-cols-2 xl:grid-cols-4">
        <div className="page-panel p-4">
          <div className="flex items-center justify-between page-caption">
            <span>当前等级</span>
            <span className="text-brand-500">LV {userStats.level}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-brand-500 text-background flex items-center justify-center text-lg font-semibold">
              {userStats.level}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{userStats.levelName}</p>
              <p className="text-xs text-foreground-muted">距离下一级还需 {nextLevelNeed} XP</p>
            </div>
          </div>
          <Progress value={levelProgress} size="xs" variant="default" className="mt-3" />
        </div>

        <div className="page-panel p-4">
          <div className="flex items-center justify-between page-caption">
            <span>累计经验</span>
            <span className="text-foreground-muted">Total XP</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-stat-number text-foreground tabular-nums">
              {userStats.totalXP}
            </span>
            <span className="text-xs text-foreground-muted">/ {userStats.nextLevelXP}</span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            距离下一级还需 {nextLevelNeed} XP
          </p>
          <Progress value={levelProgress} size="xs" className="mt-3" />
        </div>

        <div className="page-panel p-4">
          <div className="flex items-center justify-between page-caption">
            <span>全球排名</span>
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-stat-number text-foreground tabular-nums">
              #{userStats.rank}
            </span>
            <span className="text-xs text-foreground-muted">全球</span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">持续解锁稀有成就将提升排名</p>
        </div>

        <div className="page-panel p-4">
          <div className="flex items-center justify-between page-caption">
            <span>解锁进度</span>
            <span className="text-foreground-muted">{unlockRate}%</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-stat-number text-foreground tabular-nums">
              {userStats.unlockedCount}
            </span>
            <span className="text-xs text-foreground-muted">/ {userStats.totalCount}</span>
          </div>
          <Progress value={unlockRate} size="xs" className="mt-3" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row gap-6">
          <aside className="xl:w-72 space-y-4">
            <div className="page-panel p-4">
              <div className="flex items-center justify-between page-caption">
                <span>概览</span>
                <span>{unlockRate}% 解锁</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground-light">解锁率</span>
                  <span className="text-foreground font-medium">{unlockRate}%</span>
                </div>
                <Progress value={unlockRate} size="xs" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground-light">稀有及以上</span>
                  <span className="text-foreground font-medium">
                    {unlockedRareCount}/{rareAchievementCount}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted">
                  继续完成高难度任务以解锁更多稀有成就。
                </p>
              </div>
            </div>

            <div className="page-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="page-caption">分类</p>
                <span className="text-[11px] text-foreground-muted">
                  {filteredAchievements.length}/{achievements.length}
                </span>
              </div>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition-supabase",
                      selectedCategory === category.id
                        ? "bg-surface-200 text-foreground border border-border-strong"
                        : "text-foreground-light hover:text-foreground hover:bg-surface-100"
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-foreground-muted">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="page-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="page-caption">即将解锁</p>
                <span className="text-[11px] text-foreground-muted">{nextUnlocks.length} 项</span>
              </div>
              <div className="space-y-3">
                {nextUnlocks.length === 0 && (
                  <p className="text-xs text-foreground-muted">暂无待解锁成就</p>
                )}
                {nextUnlocks.map((achievement) => {
                  const Icon = achievement.icon;
                  const rarity = rarityConfig[achievement.rarity as keyof typeof rarityConfig];

                  return (
                    <div key={achievement.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md border border-border bg-surface-200/80 flex items-center justify-center shrink-0">
                            <Icon className={cn("w-4 h-4", rarity.icon)} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">
                              {achievement.name}
                            </p>
                            <p className="text-xs text-foreground-muted line-clamp-1">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-foreground-light tabular-nums shrink-0">
                          {achievement.progress}%
                        </span>
                      </div>
                      <Progress value={achievement.progress} size="xs" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="page-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="page-caption">最近解锁</p>
                <span className="text-[11px] text-foreground-muted">{recentUnlocks.length} 项</span>
              </div>
              <div className="space-y-2">
                {recentUnlocks.map((achievement) => {
                  const Icon = achievement.icon;
                  const rarity = rarityConfig[achievement.rarity as keyof typeof rarityConfig];

                  return (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border-muted bg-surface-75/60 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-md border border-border bg-surface-200/80 flex items-center justify-center shrink-0">
                          <Icon className={cn("w-4 h-4", rarity.icon)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {achievement.name}
                          </p>
                          <p className="text-xs text-foreground-muted">{achievement.unlockedAt}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-brand-500 shrink-0">
                        +{achievement.xp} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={cn(
                "w-full flex items-center justify-between rounded-md border px-3 py-2 text-[13px] transition-supabase",
                showUnlockedOnly
                  ? "border-brand-400 text-brand-500 bg-brand-200"
                  : "border-border text-foreground-light hover:text-foreground hover:bg-surface-100"
              )}
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {showUnlockedOnly ? "仅显示已解锁" : "显示全部成就"}
              </span>
              <span className="text-[11px]">{showUnlockedOnly ? "开" : "关"}</span>
            </button>
          </aside>

          <section className="flex-1 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <p className="page-caption">成就列表</p>
                <h2 className="text-card-title text-foreground">全部成就</h2>
                <p className="page-description">
                  当前显示 {sortedAchievements.length} 项 ·
                  {sortMode === "rarity" ? " 按稀有度排序" : " 按最近解锁排序"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Input
                  variant="search"
                  inputSize="sm"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索成就名称或描述"
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                  className="w-full sm:w-56"
                />
                <div className="inline-flex items-center rounded-md border border-border bg-surface-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setSortMode("rarity")}
                    aria-pressed={sortMode === "rarity"}
                    className={cn(
                      "px-3 py-1.5 text-[12px] font-medium rounded-md transition-supabase",
                      sortMode === "rarity"
                        ? "bg-surface-200 text-foreground"
                        : "text-foreground-light hover:text-foreground"
                    )}
                  >
                    稀有度优先
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortMode("recent")}
                    aria-pressed={sortMode === "recent"}
                    className={cn(
                      "px-3 py-1.5 text-[12px] font-medium rounded-md transition-supabase",
                      sortMode === "recent"
                        ? "bg-surface-200 text-foreground"
                        : "text-foreground-light hover:text-foreground"
                    )}
                  >
                    最近解锁
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAchievements.map((achievement) => {
                const rarity = rarityConfig[achievement.rarity as keyof typeof rarityConfig];
                const Icon = achievement.icon;
                const categoryLabel = categoryMap[achievement.category] || "其他";

                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "group relative rounded-md border p-4 transition-supabase",
                      achievement.unlocked
                        ? "bg-surface-100/80 hover:bg-surface-100 hover:border-border-strong"
                        : "bg-surface-75 border-border-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-md border flex items-center justify-center",
                            achievement.unlocked
                              ? "bg-surface-200/80 border-border"
                              : "bg-surface-200 border-border-muted"
                          )}
                        >
                          {achievement.unlocked ? (
                            <Icon className={cn("w-5 h-5", rarity.icon)} />
                          ) : (
                            <Lock className="w-5 h-5 text-foreground-muted" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                                rarity.chip
                              )}
                            >
                              {rarity.label}
                            </span>
                            <span className="text-[11px] text-foreground-muted">
                              {categoryLabel}
                            </span>
                          </div>

                          <h3
                            className={cn(
                              "mt-2 text-sm font-semibold",
                              achievement.unlocked ? "text-foreground" : "text-foreground-muted"
                            )}
                          >
                            {achievement.name}
                          </h3>
                          <p className="text-[13px] text-foreground-light">
                            {achievement.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium text-brand-500 shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{achievement.xp}
                      </div>
                    </div>

                    <div className="mt-4">
                      {achievement.unlocked ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-brand-500">
                            <Check className="w-3 h-3" />
                            已解锁
                          </span>
                          <span className="text-foreground-muted">
                            {achievement.unlockedAt}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground-muted">进度</span>
                            <span className="text-foreground font-medium">
                              {achievement.progress}%
                              {achievement.target && (
                                <span className="text-foreground-muted">
                                  {" "}({Math.round((achievement.progress / 100) * achievement.target)}/{achievement.target})
                                </span>
                              )}
                            </span>
                          </div>
                          <Progress value={achievement.progress} size="xs" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="page-panel p-5">
            <h3 className="text-card-title text-foreground mb-4">稀有度说明</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(rarityConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={cn("w-4 h-4 rounded-md border", config.swatch)} />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-foreground-muted">
                      {key === "common" && "基础成就"}
                      {key === "rare" && "需要一定努力"}
                      {key === "epic" && "较难获得"}
                      {key === "legendary" && "极其稀有"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="page-panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-brand-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h3 className="text-card-title text-foreground">继续保持</h3>
                  <p className="page-description">
                    你已完成 {unlockRate}% 的成就，距离下一枚徽章只差一步。
                  </p>
                </div>
              </div>
              <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                查看推荐任务
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
