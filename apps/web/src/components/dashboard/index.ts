/**
 * Dashboard 组件导出
 */

// 核心功能组件
export { NotificationPanel, NotificationBell } from "./notification-panel";
export { CommandPalette, useCommandPalette } from "./command-palette";
export { QuickTasksPanel } from "./quick-tasks-panel";
export { FloatingAssistant } from "./floating-assistant";
export { KeyboardShortcutsGuide, useKeyboardShortcuts } from "./keyboard-shortcuts-guide";
export {
  StatCard,
  MiniStatCard,
  ProgressStatCard,
  CompareStatCard,
  StatGrid,
  LiveStatCard,
} from "./stat-cards";

// 聊天增强组件
export {
  AIMessageBubble,
  UserMessageBubble,
  TypingIndicator,
  SuggestedReplies,
  ContextIndicator,
} from "./chat-enhancements";

// 可选导出 - 如果存在的话
export { OnboardingGuide, OnboardingTrigger } from "./onboarding-guide";
export { QuickSearchCommand } from "./quick-search-command";
export { WorkflowAnalyticsPie } from "./workflow-analytics-pie";
export { ExecutionTrendChart } from "./execution-trend-chart";
export { LiveExecutionMonitor } from "./live-execution-monitor";
export { NotificationCenter } from "./notification-center";
export { TaskPanel } from "./task-panel";
export { PerformanceInsights } from "./performance-insights";
export { AIUsageCard } from "./ai-usage-card";
export { ExecutionHistoryPanel } from "./execution-history-panel";
