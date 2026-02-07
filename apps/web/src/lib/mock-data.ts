/**
 * MockDataFile
 * Used forDevelopmentTestandDemo
 */

// ============================================
// WorkflowTemplateData
// ============================================

export interface WorkflowTemplate {
 id: string;
 name: string;
 description: string;
 icon: string;
 category: string;
 difficulty: "beginner" | "intermediate" | "advanced";
 estimatedTime: number;
 nodeCount: number;
 useCount: number;
 tags: string[];
 featured: boolean;
 official: boolean;
}

export const workflowTemplates: WorkflowTemplate[] = [
 {
 id: "wt-1",
 name: "EmailAutoCategoryProcess",
 description: "Autoforto'sEmailProceedCategory, andBased onTypeExecutenot'sProcessFlow",
 icon: "📧",
 category: "productivity",
 difficulty: "beginner",
 estimatedTime: 5,
 nodeCount: 4,
 useCount: 15234,
 tags: ["Email", "Automation", "Category"],
 featured: true,
 official: true,
 },
 {
 id: "wt-2",
 name: "Social MediaContentPublish",
 description: "ScheduledPublishContenttomultipleSocial MediaPlatform, Support",
 icon: "📱",
 category: "marketing",
 difficulty: "intermediate",
 estimatedTime: 10,
 nodeCount: 6,
 useCount: 12456,
 tags: ["Social Media", "Marketing", "AutoPublish"],
 featured: true,
 official: true,
 },
 {
 id: "wt-3",
 name: "CustomerFeedbackSentimentAnalytics",
 description: "Usage AI AnalyticsCustomerFeedbackSentiment, AutoCategoryascurrentlyface, , face",
 icon: "🎯",
 category: "customer",
 difficulty: "intermediate",
 estimatedTime: 8,
 nodeCount: 5,
 useCount: 8934,
 tags: ["CustomerService", "AI", "SentimentAnalytics"],
 featured: true,
 official: false,
 },
 {
 id: "wt-4",
 name: "GitHub Issue AutoProcess",
 description: "AutoMark, AllocateandReply GitHub Issues",
 icon: "🐙",
 category: "developer",
 difficulty: "advanced",
 estimatedTime: 15,
 nodeCount: 8,
 useCount: 7654,
 tags: ["GitHub", "Development", "Automation"],
 featured: false,
 official: true,
 },
 {
 id: "wt-5",
 name: "SalesDatadayGenerate",
 description: "eachdaysAutototalSalesData, GeneratecanvisualReportConcurrencyEmail",
 icon: "📊",
 category: "data",
 difficulty: "intermediate",
 estimatedTime: 12,
 nodeCount: 7,
 useCount: 6543,
 tags: ["DataAnalytics", "Report", "Automation"],
 featured: true,
 official: true,
 },
 {
 id: "wt-6",
 name: "newUserWelcomeFlow",
 description: "newUserSign UpafterAutoSendWelcomeEmailandGuideContent",
 icon: "👋",
 category: "marketing",
 difficulty: "beginner",
 estimatedTime: 5,
 nodeCount: 3,
 useCount: 5432,
 tags: ["UserGuide", "Email", "Automation"],
 featured: false,
 official: true,
 },
 {
 id: "wt-7",
 name: "CompetitorPriceMonitor",
 description: "PeriodicCompetitorPrice, PricetimeAutoAlert",
 icon: "💰",
 category: "research",
 difficulty: "advanced",
 estimatedTime: 20,
 nodeCount: 9,
 useCount: 4321,
 tags: ["CompetitorAnalytics", "Monitor", "Alert"],
 featured: false,
 official: false,
 },
 {
 id: "wt-8",
 name: "AI ContentReview",
 description: "Usage AI ReviewUserGenerateContent, FilterViolationInfo",
 icon: "🛡️",
 category: "content",
 difficulty: "intermediate",
 estimatedTime: 10,
 nodeCount: 5,
 useCount: 3987,
 tags: ["ContentReview", "AI", "Security"],
 featured: true,
 official: true,
 },
];

// ============================================
// Agent StoreData
// ============================================

export interface StoreAgent {
 id: string;
 name: string;
 description: string;
 icon: string;
 category: string;
 author: {
 name: string;
 avatar: string;
 verified: boolean;
 };
 rating: number;
 reviews: number;
 downloads: number;
 price: number | "free";
 tags: string[];
 featured: boolean;
 capabilities: string[];
 models: string[];
 version: string;
 updatedAt: string;
}

export const storeAgents: StoreAgent[] = [
 {
 id: "agent-1",
 name: "SmartWritingAssistant Pro",
 description: "Based onmostnew AI Model'sSmartWritingAssistant, SupportmultipletypeStyle, canGenerateArticle, Copy, Reportetc",
 icon: "✍️",
 category: "writing",
 author: { name: "AICreativeWorkshop", avatar: "", verified: true },
 rating: 4.9,
 reviews: 2456,
 downloads: 45678,
 price: "free",
 tags: ["Writing", "AI", "Copy", "Creative"],
 featured: true,
 capabilities: ["Writing", "multipleLanguageSupport", "StyleCustomize", "SEO optimal"],
 models: ["GPT-4", "Claude 3"],
 version: "2.1.0",
 updatedAt: "2026-01-28",
 },
 {
 id: "agent-2",
 name: "DataAnalyticslarge",
 description: "1DataAnalyticsResolvePlan, SupportDataClean, Analytics, canvisualandReportGenerate",
 icon: "📊",
 category: "analytics",
 author: { name: "DataLab", avatar: "", verified: true },
 rating: 4.8,
 reviews: 1892,
 downloads: 32456,
 price: 29,
 tags: ["DataAnalytics", "canvisual", "Report", "BI"],
 featured: true,
 capabilities: ["DataClean", "StatisticsAnalytics", "ChartGenerate", "TrendPredict"],
 models: ["GPT-4"],
 version: "1.8.5",
 updatedAt: "2026-01-25",
 },
 {
 id: "agent-3",
 name: "CodeReviewExpert",
 description: "AutoReviewCode, DetectatIssue, ProvideoptimalSuggestionandBest Practices",
 icon: "🔍",
 category: "development",
 author: { name: "DevTools Pro", avatar: "", verified: true },
 rating: 4.7,
 reviews: 1234,
 downloads: 28765,
 price: 49,
 tags: ["CodeReview", "", "Security", "optimal"],
 featured: false,
 capabilities: ["StaticAnalytics", "SecurityScan", "canDetect", "CodeStandard"],
 models: ["GPT-4", "Claude 3"],
 version: "3.0.2",
 updatedAt: "2026-01-20",
 },
 {
 id: "agent-4",
 name: "SmartSupportBot",
 description: "7x24hSmartSupport, SupportmultipleConversation, Intent RecognitionandKnowledge BaseQ&A",
 icon: "🤖",
 category: "customer-service",
 author: { name: "ServiceAI", avatar: "", verified: false },
 rating: 4.6,
 reviews: 987,
 downloads: 19876,
 price: "free",
 tags: ["Support", "Conversation", "FAQ", "Support"],
 featured: true,
 capabilities: ["multipleConversation", "Intent Recognition", "SentimentAnalytics", "Knowledge Base"],
 models: ["GPT-3.5", "GPT-4"],
 version: "2.5.1",
 updatedAt: "2026-01-22",
 },
 {
 id: "agent-5",
 name: "Marketing CopyGenerate",
 description: "QuickGenerateConversion Rate'sMarketing Copy, SupportmultiplePlatformAdaptand A/B Test",
 icon: "📢",
 category: "marketing",
 author: { name: "GrowthHack", avatar: "", verified: true },
 rating: 4.8,
 reviews: 876,
 downloads: 15432,
 price: 19,
 tags: ["Marketing", "Copy", "", "Advertising"],
 featured: false,
 capabilities: ["multiplePlatformAdapt", "A/B Test", "optimal", "AudienceAnalytics"],
 models: ["GPT-4"],
 version: "1.5.0",
 updatedAt: "2026-01-18",
 },
 {
 id: "agent-6",
 name: "TranslateandLocalAssistant",
 description: "ProfessionalTranslateTool, Support100+Language, MaintainStyleand",
 icon: "🌍",
 category: "translation",
 author: { name: "LangBridge", avatar: "", verified: true },
 rating: 4.9,
 reviews: 2134,
 downloads: 38765,
 price: "free",
 tags: ["Translate", "multipleLanguage", "Local", "International"],
 featured: true,
 capabilities: ["100+Language", "Term", "StyleMaintain", "BatchTranslate"],
 models: ["GPT-4", "Claude 3"],
 version: "4.2.0",
 updatedAt: "2026-01-30",
 },
];

// ============================================
// ConversationHistoryData
// ============================================

export interface ConversationItem {
 id: string;
 title: string;
 preview: string;
 model: string;
 createdAt: string;
 updatedAt: string;
 messageCount: number;
 starred: boolean;
 pinned: boolean;
 folder: string | null;
 tags: string[];
}

export const conversationHistory: ConversationItem[] = [
 {
 id: "conv-1",
 title: "CreateAutomationEmailWorkflow",
 preview: "'s, IcomeyouDesignthisEmailAutomationWorkflow.firstWeneedneedOKTriggerCondition...",
 model: "GPT-4",
 createdAt: "2026-01-31T10:30:00Z",
 updatedAt: "Just now",
 messageCount: 24,
 starred: true,
 pinned: true,
 folder: "WorkflowDesign",
 tags: ["Automation", "Email"],
 },
 {
 id: "conv-2",
 title: "AnalyticsSalesDataandGenerateReport",
 preview: "Based onyouProvide'sData, ICompletedAnalytics.withdownismainneedDiscover: 1) SalescompareGrowth...",
 model: "GPT-4",
 createdAt: "2026-01-30T15:20:00Z",
 updatedAt: "2hbefore",
 messageCount: 18,
 starred: true,
 pinned: false,
 folder: "DataAnalytics",
 tags: ["Data", "Report"],
 },
 {
 id: "conv-3",
 title: "optimal React Componentcan",
 preview: "letIcomeAnalytics1downthisComponent'scanIssue.mainneedhaswithdowncanwithoptimal...",
 model: "Claude 3",
 createdAt: "2026-01-30T09:15:00Z",
 updatedAt: "5hbefore",
 messageCount: 32,
 starred: false,
 pinned: false,
 folder: "CodeDevelopment",
 tags: ["React", "canoptimal"],
 },
 {
 id: "conv-4",
 title: "WriteProductPublishAnnouncement",
 preview: "withdownisIasyouWrite'sProductPublishAnnouncementDraft, mainneedFeaturesHighlightandUservalue...",
 model: "GPT-4",
 createdAt: "2026-01-29T14:00:00Z",
 updatedAt: "Yesterday",
 messageCount: 12,
 starred: false,
 pinned: false,
 folder: "ContentCreative",
 tags: ["Marketing", "Copy"],
 },
 {
 id: "conv-5",
 title: "DesignDatabaseArchitecture",
 preview: "Based onyou'sRequirements, ISuggestionusewithdownDatabaseArchitectureDesign.mainneedConsiderExtendandQuerycan...",
 model: "GPT-4",
 createdAt: "2026-01-28T11:30:00Z",
 updatedAt: "2daysbefore",
 messageCount: 28,
 starred: false,
 pinned: false,
 folder: "TechnologyDesign",
 tags: ["Database", "Architecture"],
 },
];

// ============================================
// UserActivityData
// ============================================

export interface ActivityItem {
 id: string;
 type: string;
 title: string;
 description: string;
 timestamp: string;
 timeAgo: string;
 status: "success" | "error" | "warning" | "pending";
 metadata?: Record<string, string | number>;
}

export const recentActivities: ActivityItem[] = [
 {
 id: "act-1",
 type: "workflow_executed",
 title: "ExecuteWorkflow: CustomerFeedbackAutoProcess",
 description: "WorkflowExecuteSuccess, Process 15 Feedback",
 timestamp: "2026-01-31T10:30:00Z",
 timeAgo: "5 minbefore",
 status: "success",
 metadata: { duration: "12s", records: 15 },
 },
 {
 id: "act-2",
 type: "conversation_started",
 title: "StartnewConversation",
 description: "Usage GPT-4 ModelStartnewConversation",
 timestamp: "2026-01-31T10:15:00Z",
 timeAgo: "20 minbefore",
 status: "success",
 metadata: { model: "GPT-4", messages: 8 },
 },
 {
 id: "act-3",
 type: "workflow_created",
 title: "CreateWorkflow: EmailAutoCategory",
 description: "Createnew'sAutomationWorkflow",
 timestamp: "2026-01-31T09:45:00Z",
 timeAgo: "50 minbefore",
 status: "success",
 metadata: { nodes: 6, triggers: 1 },
 },
 {
 id: "act-4",
 type: "workflow_executed",
 title: "ExecuteWorkflow: DataSync",
 description: "WorkflowExecuteFailed: API ConnectTimeout",
 timestamp: "2026-01-31T09:30:00Z",
 timeAgo: "1 hbefore",
 status: "error",
 metadata: { error: "Connection timeout" },
 },
 {
 id: "act-5",
 type: "agent_created",
 title: "Create Agent: WritingAssistant",
 description: "Createnew's AI Agent",
 timestamp: "2026-01-31T09:00:00Z",
 timeAgo: "1.5 hbefore",
 status: "success",
 metadata: { model: "GPT-4", capabilities: 3 },
 },
];

// ============================================
// StatisticsData
// ============================================

export interface DashboardStats {
 totalConversations: number;
 totalWorkflows: number;
 totalAgents: number;
 totalFiles: number;
 apiCalls: number;
 tokensUsed: number;
 activeWorkflows: number;
 successRate: number;
}

export const dashboardStats: DashboardStats = {
 totalConversations: 156,
 totalWorkflows: 24,
 totalAgents: 8,
 totalFiles: 45,
 apiCalls: 156800,
 tokensUsed: 2800000,
 activeWorkflows: 12,
 successRate: 98.5,
};

// ============================================
// Quick ActionsData
// ============================================

export interface QuickAction {
 id: string;
 title: string;
 description: string;
 icon: string;
 href: string;
 shortcut?: string;
 category: string;
}

export const quickActions: QuickAction[] = [
 {
 id: "qa-1",
 title: "CreateConversation",
 description: "Startnew's AI Conversation",
 icon: "MessageSquare",
 href: "/dashboard/conversations",
 shortcut: "⌘ N",
 category: "Create",
 },
 {
 id: "qa-2",
 title: "CreateWorkflow",
 description: "CreateAutomationWorkflow",
 icon: "Zap",
 href: "/dashboard/workflows/new",
 shortcut: "⌘ W",
 category: "Create",
 },
 {
 id: "qa-3",
 title: "Create Agent",
 description: "CreateCustom AI Assistant",
 icon: "Bot",
 href: "/dashboard/my-agents/new",
 category: "Create",
 },
 {
 id: "qa-4",
 title: "UploadFile",
 description: "UploadFiletoKnowledge Base",
 icon: "Upload",
 href: "/dashboard/files",
 category: "Manage",
 },
 {
 id: "qa-5",
 title: "Template Gallery",
 description: "BrowseWorkflowTemplate",
 icon: "LayoutGrid",
 href: "/dashboard/template-gallery",
 category: "Browse",
 },
 {
 id: "qa-6",
 title: "Settings",
 description: "ManageAccountSettings",
 icon: "Settings",
 href: "/dashboard/settings",
 shortcut: "⌘ ,",
 category: "Settings",
 },
];

// ============================================
// Help/FAQ Data
// ============================================

export interface FAQItem {
 id: string;
 question: string;
 answer: string;
 category: string;
 helpful: number;
}

export const faqItems: FAQItem[] = [
 {
 id: "faq-1",
 question: "ifwhatCreateI's#1Workflow?",
 answer: "You can create a workflow with these steps: 1) Go to the Workflows page, 2) Click the Create Workflow button, 3) Drag and drop nodes to build the flow in the editor, 4) Configure each node's parameters, 5) Save and test the workflow.",
 category: "Getting StartedGuide",
 helpful: 234,
 },
 {
 id: "faq-2",
 question: "Agent andWorkflowhasWhat?",
 answer: "Agent is1Smart AI Assistant, canwithUnderstandNaturalLanguageandmainDecisionExecuteTask.WorkflowthenisDefinition'sAutomationFlow, byFixedStepExecute.Agent moreFlexible, Workflowmorecan.",
 category: "FeaturesDescription",
 helpful: 189,
 },
 {
 id: "faq-3",
 question: "ifwhatConfig API Key?",
 answer: "Go to Settings → API Keys page, click Add Key, select the service provider (e.g. OpenAI, Claude), enter your API key, and save to start using it.",
 category: "Config",
 helpful: 156,
 },
 {
 id: "faq-4",
 question: "FileUploadhasWhatLimit?",
 answer: "FreeUserMaximumFile 10MB, totalStorage 1GB.Pro UserFile 50MB, totalStorage 10GB.Support'sFormatInclude: PDF, Word, Excel, Image, CodeFileetc.",
 category: "LimitDescription",
 helpful: 145,
 },
 {
 id: "faq-5",
 question: "ifwhatwillFileAddtoKnowledge Base?",
 answer: "Select a file in the Files section, click Add to Knowledge Base, select the target knowledge base or create a new one. The system will automatically parse the document and create vector indexes.",
 category: "FeaturesDescription",
 helpful: 132,
 },
];

// ============================================
// AI RegressionTest
// ============================================

export type RegressionCaseStatus = "pass" | "fail" | "needs_review" | "flaky";

export interface RegressionTestCase {
 id: string;
 title: string;
 prompt: string;
 expected: string;
 rubric: string;
 tags: string[];
 status: RegressionCaseStatus;
 lastRunAt: string;
 owner: string;
 score: number;
}

export const regressionTestCases: RegressionTestCase[] = [
 {
 id: "rt-1",
 title: "SupportTicketSummary",
 prompt: "PleasewillwithdownTicketContentSummaryas 3 needandtoPriority.",
 expected: "ContainsIssue, ImpactRange, ProcessSuggestion.",
 rubric: "needCoveragerate ≥ 90%, ProhibitOutputSensitiveInfo.",
 tags: ["Summary", "Support", "Structure"],
 status: "pass",
 lastRunAt: "2026-02-01T09:12:00Z",
 owner: "Team",
 score: 94,
 },
 {
 id: "rt-2",
 title: "Marketing Copy A/B",
 prompt: "GeneratefaceEnterpriseProcurement'sLaunchEmailTitle.",
 expected: "ToneProfessional, Containsvalue, canread.",
 rubric: "canread ≥ 90, key ≥ 2.",
 tags: ["Marketing", "Copy", "Title"],
 status: "needs_review",
 lastRunAt: "2026-02-01T08:40:00Z",
 owner: "GrowthTeam",
 score: 86,
 },
 {
 id: "rt-3",
 title: "FinanceDataExplain",
 prompt: "ExplainTable'scompareGrowthReason, needto 2 canVerifyFact.",
 expected: "UsageTableData, AvoidEmpty.",
 rubric: "Fact1 ≥ 88, useTableField.",
 tags: ["Data", "Analytics", "Fact1"],
 status: "fail",
 lastRunAt: "2026-01-31T16:05:00Z",
 owner: "AnalyticsTeam",
 score: 72,
 },
 {
 id: "rt-4",
 title: "ComplianceRiskTip",
 prompt: "IdentifyConversationat'sComplianceRiskandAlternative.",
 expected: "OutputRisk + Alternative.",
 rubric: "RiskIdentifyCoverage ≥ 95, AlternativeNoneViolation.",
 tags: ["Compliance", "Security", "Risk Control"],
 status: "pass",
 lastRunAt: "2026-01-31T14:22:00Z",
 owner: "SecurityTeam",
 score: 97,
 },
 {
 id: "rt-5",
 title: "multipleLanguageTranslate1",
 prompt: "willProductFeaturesDescriptionTranslatedayandMaintainTerm1.",
 expected: "keyTerm1, ToneNatural.",
 rubric: "Term1rate ≥ 92, Style1.",
 tags: ["Translate", "Local", "Term"],
 status: "flaky",
 lastRunAt: "2026-01-31T12:18:00Z",
 owner: "InternationalTeam",
 score: 88,
 },
 {
 id: "rt-6",
 title: "Knowledge BaseQ&A",
 prompt: "Based onKnowledge BaseDescriptionAnswerPricingIssue, andonuseParagraph.",
 expected: "AnswerClean, useandFact1.",
 rubric: "useAccuraterate ≥ 95, Clean ≥ 85.",
 tags: ["Knowledge Base", "use", "Q&A"],
 status: "pass",
 lastRunAt: "2026-01-31T10:02:00Z",
 owner: "ContentTeam",
 score: 92,
 },
];

// ============================================
// personReviewstylePolicy
// ============================================

export type ReviewSamplingPriority = "high" | "medium" | "low";
export type ReviewSamplingStatus = "active" | "paused";

export interface ReviewSamplingRule {
 id: string;
 scenario: string;
 trigger: string;
 sampleRate: number;
 priority: ReviewSamplingPriority;
 status: ReviewSamplingStatus;
 slaHours: number;
 reviewers: string[];
 notes?: string;
}

export interface ReviewSamplingCoverage {
 id: string;
 label: string;
 rate: number;
 goal: string;
}

export interface ReviewSamplingStrategy {
 baseRate: number;
 dailyMin: number;
 dailyMax: number;
 escalationThreshold: number;
 confidenceGate: number;
 lastUpdated: string;
 owner: string;
 reviewers: string[];
 triggers: Array<{ id: string; label: string; description: string }>;
 coverage: ReviewSamplingCoverage[];
 rules: ReviewSamplingRule[];
 checklist: Array<{ id: string; label: string; required: boolean }>;
}

export const reviewSamplingStrategy: ReviewSamplingStrategy = {
 baseRate: 0.08,
 dailyMin: 40,
 dailyMax: 260,
 escalationThreshold: 0.85,
 confidenceGate: 0.9,
 lastUpdated: "2026-02-01T11:20:00Z",
 owner: "AI Owner",
 reviewers: ["Team", "DomainExpert", "ComplianceReview"],
 triggers: [
 {
 id: "t-1",
 label: "Output",
 description: "Model < 0.90 AutoEnterstyle",
 },
 {
 id: "t-2",
 label: "ImpactScenario",
 description: "Finance, Legal, HealthcareetcRiskDomainForcestyle",
 },
 {
 id: "t-3",
 label: "newModelVersion",
 description: "newModelonline 7 daysinImprovestylecompareexample",
 },
 {
 id: "t-4",
 label: "UserTrigger",
 description: "Continuous 3 timesFeedbackTriggerstyle",
 },
 ],
 coverage: [
 { id: "c-1", label: "Knowledge BaseQ&A", rate: 0.12, goal: "useAccuraterate ≥ 95%" },
 { id: "c-2", label: "Marketing Copy", rate: 0.1, goal: "canread ≥ 90" },
 { id: "c-3", label: "DataAnalytics", rate: 0.15, goal: "Fact1 ≥ 88" },
 { id: "c-4", label: "SupportSummary", rate: 0.08, goal: "StructureComplete ≥ 90" },
 ],
 rules: [
 {
 id: "r-1",
 scenario: "RiskContent",
 trigger: "SensitiveIndustry / ComplianceKeywords",
 sampleRate: 0.35,
 priority: "high",
 status: "active",
 slaHours: 12,
 reviewers: ["ComplianceReview", "Team"],
 notes: "Forceperson",
 },
 {
 id: "r-2",
 scenario: "newModelGrayscale",
 trigger: "ModelVersion < 7 days",
 sampleRate: 0.2,
 priority: "high",
 status: "active",
 slaHours: 24,
 reviewers: ["Team"],
 },
 {
 id: "r-3",
 scenario: "Output",
 trigger: " < 0.90",
 sampleRate: 0.18,
 priority: "medium",
 status: "active",
 slaHours: 24,
 reviewers: ["Team"],
 },
 {
 id: "r-4",
 scenario: "CostCall",
 trigger: "timesCost > ¥2.0",
 sampleRate: 0.12,
 priority: "medium",
 status: "active",
 slaHours: 36,
 reviewers: ["Costoptimalgroup"],
 },
 {
 id: "r-5",
 scenario: "ScenarioRegression",
 trigger: "7 dayinCall < 20 times",
 sampleRate: 0.08,
 priority: "low",
 status: "paused",
 slaHours: 48,
 reviewers: ["Team"],
 notes: "pendingstylecurrentafterRestore",
 },
 ],
 checklist: [
 { id: "q-1", label: "OutputisnoFollowScenarioneed", required: true },
 { id: "q-2", label: "Factanduseisno1", required: true },
 { id: "q-3", label: "isnoContainsSensitive/ViolationContent", required: true },
 { id: "q-4", label: "FormatandLanguageisnoClear", required: false },
 { id: "q-5", label: "cannotocanExecuteSuggestion", required: false },
 ],
};

// ============================================
// inExample App Checklist
// ============================================

export type SampleAppComplexity = "beginner" | "intermediate" | "advanced";

export interface SampleApp {
 id: string;
 name: string;
 description: string;
 icon: string;
 category: string;
 scenario: string;
 complexity: SampleAppComplexity;
 tags: string[];
 updatedAt: string;
 href: string;
}

export const sampleApps: SampleApp[] = [
 {
 id: "sa-1",
 name: "SmartSupportConnect",
 description: "1ProcessmultipleChannelConsulting, AutoIdentifyandGenerateStructureReply.",
 icon: "🎧",
 category: "CustomerService",
 scenario: "Consulting · multipleConversation",
 complexity: "beginner",
 tags: ["Intent Recognition", "FAQ", "multipleConversation"],
 updatedAt: "2026-01-30T09:30:00Z",
 href: "/dashboard/template-gallery",
 },
 {
 id: "sa-2",
 name: "SalesQuoteAssistant",
 description: "Based onRequirementsAutoGenerateQuoteChecklistandDeliverPlan, SupportmultipleVersionforcompare.",
 icon: "💼",
 category: "SalesOperations",
 scenario: "beforeSupport · QuoteGenerate",
 complexity: "intermediate",
 tags: ["Quote", "PlanGenerate", "forcompare"],
 updatedAt: "2026-01-28T14:10:00Z",
 href: "/dashboard/template-gallery",
 },
 {
 id: "sa-3",
 name: "MarketplaceWorkshop",
 description: "totalTrendDataandInfo, 1keyOutputMarketplaceweeks.",
 icon: "📰",
 category: "Marketplace",
 scenario: "TrendTrack · weeksGenerate",
 complexity: "intermediate",
 tags: ["", "", "canvisual"],
 updatedAt: "2026-01-27T16:45:00Z",
 href: "/dashboard/template-gallery",
 },
 {
 id: "sa-4",
 name: "ComplianceCheck",
 description: "forProceedRiskIdentifyandEditSuggestion, OutputReviewSummary.",
 icon: "🧾",
 category: "Compliance",
 scenario: "RiskIdentify · ComplianceReview",
 complexity: "advanced",
 tags: ["Compliance", "Risk", "Review"],
 updatedAt: "2026-01-26T11:20:00Z",
 href: "/dashboard/template-gallery",
 },
 {
 id: "sa-5",
 name: "Knowledge BaseQ&A",
 description: "Based onEnterpriseKnowledge BaseProvideuseAnswer, SupportmultipleSourcetotal.",
 icon: "📚",
 category: "Operations",
 scenario: "Q&A · useValidate",
 complexity: "beginner",
 tags: ["Knowledge Base", "use", "SearchEnhanced"],
 updatedAt: "2026-01-25T10:00:00Z",
 href: "/dashboard/template-gallery",
 },
 {
 id: "sa-6",
 name: "OperationsdayGenerate",
 description: "AutoPullBusinessMetricsandGeneratecanSend'sOperationsdayTemplate.",
 icon: "📈",
 category: "OperationsAnalytics",
 scenario: "day · BusinessMetrics",
 complexity: "beginner",
 tags: ["day", "Metrics", "Automation"],
 updatedAt: "2026-01-24T08:25:00Z",
 href: "/dashboard/template-gallery",
 },
];

// ============================================
// Demo DataandScaffold
// ============================================

export type DemoDataFormat = "csv" | "json" | "parquet";

export interface DemoDataPack {
 id: string;
 name: string;
 description: string;
 format: DemoDataFormat;
 records: number;
 fields: number;
 size: string;
 tags: string[];
 updatedAt: string;
}

export const demoDataPacks: DemoDataPack[] = [
 {
 id: "dd-1",
 name: "SupportTicketstylecurrent",
 description: "multipleChannelSupportConversationandTicketTags, SuitableDemoIntent RecognitionandAutoSummary.",
 format: "json",
 records: 4200,
 fields: 18,
 size: "12.4MB",
 tags: ["Support", "Intent Recognition", "Summary"],
 updatedAt: "2026-02-01T08:30:00Z",
 },
 {
 id: "dd-2",
 name: "MarketingReachDataset",
 description: "ContainsChannel, UserrowasandResult, Used forDemoAttributionAnalytics.",
 format: "csv",
 records: 12800,
 fields: 22,
 size: "18.1MB",
 tags: ["Marketing", "", "Attribution"],
 updatedAt: "2026-01-30T15:45:00Z",
 },
 {
 id: "dd-3",
 name: "Knowledge BaseQ&A",
 description: "EnterpriseKnowledge BaseFragmentandQ&Afor, Used forDemouseAnswerandSearch.",
 format: "parquet",
 records: 7600,
 fields: 12,
 size: "9.7MB",
 tags: ["Knowledge Base", "use", "Search"],
 updatedAt: "2026-01-29T11:05:00Z",
 },
];

export interface DemoScaffoldTemplate {
 id: string;
 name: string;
 description: string;
 language: string;
 entry: string;
 code: string;
 tags: string[];
 updatedAt: string;
}

export const demoScaffoldTemplates: DemoScaffoldTemplate[] = [
 {
 id: "ds-1",
 name: "Support",
 description: "Based onTicketstylecurrentAutoGenerateSummary, RiskandFollow upSuggestion.",
 language: "json",
 entry: "workflow.customer-qa.json",
 code: `{
 "name": "Support",
 "nodes": [
 {
 "type": "input",
 "id": "ticket",
 "config": { "schema": "support_ticket" }
 },
 {
 "type": "llm",
 "id": "summary",
 "config": { "model": "gpt-4", "prompt": "Generate 3 SummaryandRiskTip" }
 },
 {
 "type": "rule",
 "id": "risk_gate",
 "config": { "threshold": 0.85 }
 },
 {
 "type": "output",
 "id": "qa_report",
 "config": { "format": "markdown" }
 }
 ]
}`,
 tags: ["Support", "", "Risk"],
 updatedAt: "2026-02-01T09:40:00Z",
 },
 {
 id: "ds-2",
 name: "MarketplaceweeksGenerate",
 description: "fromMarketingReachDatasetAutoGenerateTrendInsightsandrowSuggestion.",
 language: "json",
 entry: "workflow.market-brief.json",
 code: `{
 "name": "MarketplaceweeksGenerate",
 "nodes": [
 { "type": "dataset", "id": "campaigns", "config": { "source": "marketing_pack" } },
 { "type": "transform", "id": "metrics", "config": { "operation": "aggregate" } },
 { "type": "llm", "id": "insights", "config": { "model": "gpt-4", "prompt": " 5 Insights" } },
 { "type": "output", "id": "brief", "config": { "format": "slide" } }
 ]
}`,
 tags: ["Marketing", "Insights", "weeks"],
 updatedAt: "2026-01-31T16:10:00Z",
 },
 {
 id: "ds-3",
 name: "Knowledge BaseQ&AScaffold",
 description: "useSearch + , SuitableDemocanAnswer.",
 language: "json",
 entry: "workflow.kb-qa.json",
 code: `{
 "name": "Knowledge BaseQ&AScaffold",
 "nodes": [
 { "type": "retrieval", "id": "kb", "config": { "top_k": 5 } },
 { "type": "llm", "id": "answer", "config": { "model": "claude-3", "prompt": "useSourceAnswer" } },
 { "type": "rule", "id": "confidence", "config": { "min": 0.9 } },
 { "type": "output", "id": "final", "config": { "format": "json" } }
 ]
}`,
 tags: ["Knowledge Base", "use", ""],
 updatedAt: "2026-01-30T10:25:00Z",
 },
];

// ============================================
// DemoFlowcurrent
// ============================================

export interface DemoFlowLink {
 label: string;
 href: string;
}

export interface DemoFlowStep {
 id: string;
 title: string;
 duration: string;
 owner: string;
 goal: string;
 actions: string[];
 deliverable: string;
 links: DemoFlowLink[];
}

export interface DemoFlowScript {
 title: string;
 description: string;
 totalDuration: string;
 audience: string[];
 notes: string[];
 steps: DemoFlowStep[];
}

export const demoFlowScript: DemoFlowScript = {
 title: "StandardDemoFlow(30 min)",
 description: "faceBusinessandTechnologyRole'sProductDemocurrent, canDirectuse.",
 totalDuration: "30 min",
 audience: ["BusinessOwner", "TechnologyOwner", "OperationsTeam"],
 notes: ["DemobeforeConfirmDataalreadyLoad", "re-valueandPath"],
 steps: [
 {
 id: "step-1",
 title: "ScenarioforandTargetConfirm",
 duration: "3 min",
 owner: "ProductConsultant",
 goal: "ClearDemoScenarioandEvaluateTarget",
 actions: ["SelectExample App", "ConfirmBusiness", "DefinitionAcceptanceMetrics"],
 deliverable: "ScenarioConfirmChecklist",
 links: [{ label: "Example App", href: "/dashboard/apps" }],
 },
 {
 id: "step-2",
 title: "LoadDataandScaffold",
 duration: "5 min",
 owner: "ResolvePlan",
 goal: "QuickBuildcanDemoFlow",
 actions: ["SelectData", "LoadScaffoldTemplate", "CheckNodeConfig"],
 deliverable: "canRun's Demo Workflow",
 links: [
 { label: "Demo Kit", href: "/dashboard/apps" },
 { label: "Template Gallery", href: "/dashboard/template-gallery" },
 ],
 },
 {
 id: "step-3",
 title: "RunandEffectShowcase",
 duration: "7 min",
 owner: "ResolvePlan",
 goal: "ShowcaseendpointtoendpointOutputEffect",
 actions: ["TriggerExecute", "ShowcaseOutputResult", "DescriptionBusinessvalue"],
 deliverable: "DemoResultstyleexample",
 links: [{ label: "RunMonitor", href: "/dashboard/app/demo/monitoring" }],
 },
 {
 id: "step-4",
 title: "andRegressionAssurance",
 duration: "6 min",
 owner: "Owner",
 goal: "DescriptioncanandReviewMechanism",
 actions: ["ShowcaseRegressionuseexample", "stylePolicy", "DescriptionRiskControl"],
 deliverable: "AssuranceDescription",
 links: [{ label: "Monitor", href: "/dashboard/app/demo/monitoring" }],
 },
 {
 id: "step-5",
 title: "CostandIterationPath",
 duration: "5 min",
 owner: "ProductConsultant",
 goal: "ClearDeliverPathandCostEstimate",
 actions: ["CostStructure", "DescriptiononlineRhythm", "OKNextrow"],
 deliverable: "DemorowPlan",
 links: [{ label: "UsageAnalytics", href: "/dashboard/analytics" }],
 },
 {
 id: "step-6",
 title: "Q&A andtail",
 duration: "4 min",
 owner: "all",
 goal: "CollectFeedbackandConfirmafter",
 actions: ["Resolve", "RecordRequirements", "ConfirmOwner"],
 deliverable: "willneed",
 links: [{ label: "Feedbackcenter", href: "/dashboard/feedback" }],
 },
 ],
};

// ============================================
// PublishRhythmandWindow
// ============================================

export type ReleaseWindowType = "feature" | "maintenance" | "hotfix";
export type ReleaseWindowStatus = "open" | "restricted";

export interface ReleaseWindow {
 id: string;
 label: string;
 type: ReleaseWindowType;
 cadence: string;
 timeRange: string;
 scope: string;
 gate: string;
 owner: string;
 status: ReleaseWindowStatus;
}

export interface ReleaseFreezeWindow {
 id: string;
 label: string;
 rule: string;
 notes: string;
}

export interface ReleaseChannel {
 id: string;
 label: string;
 rollout: number;
 duration: string;
 guardrail: string;
}

export interface ReleaseCadencePlan {
 title: string;
 timezone: string;
 owner: string;
 description: string;
 regularWindows: ReleaseWindow[];
 freezeWindows: ReleaseFreezeWindow[];
 channels: ReleaseChannel[];
 hotfixPolicy: {
 window: string;
 approval: string;
 rollback: string;
 comms: string;
 };
 checklist: string[];
}

export const releaseCadencePlan: ReleaseCadencePlan = {
 title: "PublishRhythmandWindow",
 timezone: "Asia/Shanghai (UTC+8)",
 owner: "Release Manager",
 description: "MaintainStable'sPublishRhythm, EnsurecanRollback, canTrack.",
 regularWindows: [
 {
 id: "rw-1",
 label: "StandardPublish",
 type: "feature",
 cadence: "eachweeks2 / weeks4",
 timeRange: "10:00 - 12:00",
 scope: "Web / API / Runtime",
 gate: "RegressionVia + Monitorvalue OK",
 owner: "PlatformTeam",
 status: "open",
 },
 {
 id: "rw-2",
 label: "GrayscalePublish",
 type: "feature",
 cadence: "eachweeks3",
 timeRange: "14:00 - 16:00",
 scope: "newFeaturesGrayscale",
 gate: "GrayscaleMetricsMeet Target",
 owner: "ProductOwner",
 status: "open",
 },
 {
 id: "rw-3",
 label: "MaintainWindow",
 type: "maintenance",
 cadence: "eachweeksday",
 timeRange: "22:00 - 23:00",
 scope: "DB / Infra / Task",
 gate: "None/canRollback",
 owner: "SRE",
 status: "restricted",
 },
 ],
 freezeWindows: [
 {
 id: "fw-1",
 label: "monthsFreeze",
 rule: "eachmonthsmostafter 2 Business Day",
 notes: "onlyAllow P0/P1 Fix",
 },
 {
 id: "fw-2",
 label: "dayFreeze",
 rule: "daybefore 24 h",
 notes: "CloseStandardPublish",
 },
 ],
 channels: [
 {
 id: "rc-1",
 label: "Canary 5%",
 rollout: 5,
 duration: "2 h",
 guardrail: "Errorrate < 0.5%",
 },
 {
 id: "rc-2",
 label: "Beta 20%",
 rollout: 20,
 duration: "6 h",
 guardrail: "P95 < 2s",
 },
 {
 id: "rc-3",
 label: "Stable 100%",
 rollout: 100,
 duration: "24 h",
 guardrail: "AlertvalueallsectionVia",
 },
 ],
 hotfixPolicy: {
 window: "AnytimeTrigger(needvalueConfirm)",
 approval: "valueOwner + SecurityReview",
 rollback: "15 minincanRollback",
 comms: "2 hinSyncAnnouncement",
 },
 checklist: [
 "Version NumberUpgradeandRecordChange",
 "RegressionTestallsectionVia",
 "MonitorandAlertvalueConfirm",
 "Publishafter 30 minHealth",
 ],
};

// ============================================
// VersionChangeAnnouncementTemplate
// ============================================

export interface ReleaseNoteSection {
 title: string;
 items: string[];
}

export interface ReleaseNoteTemplate {
 version: string;
 date: string;
 title: string;
 summary: string;
 highlights: string[];
 sections: ReleaseNoteSection[];
 impact: {
 downtime: string;
 affected: string;
 migration: string;
 };
 rollback: string;
 links: Array<{ label: string; href: string }>;
 acknowledgements: string[];
}

export const releaseNoteTemplate: ReleaseNoteTemplate = {
 version: "v3.27.0",
 date: "2026-02-02",
 title: "andPublishManageEnhanced",
 summary: "AddRegressionPanel, PublishRhythmand Demo Scaffold, ImprovecanDemoandcan.",
 highlights: [
 "AddRegressionTestandstylePolicyPanel",
 "PublishRhythmandWindowPolicycanvisual",
 "Provide Demo DataandScaffoldTemplate",
 ],
 sections: [
 {
 title: "Add",
 items: [
 "Workbench Increase Demo Kit andDemoFlowcurrent",
 "EvaluatepageSupportRegressionuseexampleandstylePolicy",
 "Plugin Manifest SemVer Validate1",
 ],
 },
 {
 title: "optimal",
 items: [
 "Version NumberStandard1as SemVer, SupportPublishVersion",
 "DemoDataStructureoptimal, SupportmultipleFormat",
 ],
 },
 {
 title: "Fix",
 items: ["FixDemoFlowcurrentLinkMissing'sIssue"],
 },
 ],
 impact: {
 downtime: "NonePlan",
 affected: "Web Console / PluginValidate",
 migration: "NoneneedMigration",
 },
 rollback: "ifPublishafter 30 mininAppear P1 Alert, ExecuteRollbacktoon1StableVersion.",
 links: [
 { label: "PublishDescription", href: "/whats-new" },
 { label: "Statuspage", href: "/status" },
 { label: "Feedbackcenter", href: "/dashboard/feedback" },
 ],
 acknowledgements: ["PlatformTeam", "Team", "SRE"],
};

// ============================================
// andMirrorStandard
// ============================================

export interface ContainerImageSpec {
 id: string;
 service: string;
 repository: string;
 runtime: string;
 tagPolicy: string;
 rollback: string;
 healthCheck: string;
}

export interface ContainerizationSpec {
 registry: string;
 tagFormat: string;
 latestTag: string;
 retention: string;
 rollbackPolicy: string;
 scanPolicy: string;
 signingPolicy: string;
 lastUpdated: string;
 buildPipeline: string[];
 images: ContainerImageSpec[];
}

export const containerizationSpec: ContainerizationSpec = {
 registry: "registry.agentflow.ai",
 tagFormat: "agentflow/{service}:v{semver}-{shortSha}",
 latestTag: "agentflow/{service}:stable",
 retention: "RetainRecent 10 Tag(StableversionRetain 3 )",
 rollbackPolicy: "30 minincanRollbackon1StableVersion",
 scanPolicy: "MirrorPushbeforeExecuteVulnerabilityScan()",
 signingPolicy: "ProductionMirrorMustBioandRecord SBOM",
 lastUpdated: "2026-02-02T10:20:00Z",
 buildPipeline: [
 "multiplePhaseBuild(build/runtime )",
 "Usage buildx + Cache",
 "Generate SBOM andMirrorBio",
 "Push Registry andSyncTags",
 ],
 images: [
 {
 id: "img-web",
 service: "web",
 repository: "agentflow/web",
 runtime: "node18-alpine",
 tagPolicy: "v{semver}-{shortSha}",
 rollback: "RetainRecent 3 Stable Tag",
 healthCheck: "/healthz",
 },
 {
 id: "img-api",
 service: "api",
 repository: "agentflow/api",
 runtime: "go1.22-alpine",
 tagPolicy: "v{semver}-{shortSha}",
 rollback: "RetainRecent 5 Tag",
 healthCheck: "/healthz",
 },
 {
 id: "img-runtime",
 service: "runtime",
 repository: "agentflow/runtime",
 runtime: "go1.22-alpine",
 tagPolicy: "v{semver}-{shortSha}",
 rollback: "RetainRecent 5 Tag",
 healthCheck: "/healthz",
 },
 {
 id: "img-db",
 service: "db-provisioner",
 repository: "agentflow/db-provisioner",
 runtime: "go1.22-alpine",
 tagPolicy: "v{semver}-{shortSha}",
 rollback: "RetainRecent 3 Stable Tag",
 healthCheck: "/healthz",
 },
 {
 id: "img-domain",
 service: "domain-service",
 repository: "agentflow/domain-service",
 runtime: "go1.22-alpine",
 tagPolicy: "v{semver}-{shortSha}",
 rollback: "RetainRecent 3 Stable Tag",
 healthCheck: "/healthz",
 },
 ],
};

// ============================================
// EnvironmentIsolateandNamingStandard
// ============================================

export interface EnvironmentScope {
 id: string;
 label: string;
 env: "dev" | "staging" | "prod";
 purpose: string;
 access: string;
 namespace: string;
 domainPattern: string;
 dataRetention: string;
 configPrefix: string;
 secretPrefix: string;
}

export interface EnvironmentNamingRule {
 id: string;
 resource: string;
 pattern: string;
 example: string;
 notes: string;
}

export interface EnvironmentNamingSpec {
 title: string;
 description: string;
 lastUpdated: string;
 namingPattern: string;
 environments: EnvironmentScope[];
 resourceRules: EnvironmentNamingRule[];
 guardrails: string[];
}

export const environmentNamingSpec: EnvironmentNamingSpec = {
 title: "EnvironmentIsolateandNamingStandard",
 description: "1 dev / staging / prod 'sNamingRuleandIsolateEdge.",
 lastUpdated: "2026-02-02T11:40:00Z",
 namingPattern: "af-{workspace}-{env}-{service}",
 environments: [
 {
 id: "env-dev",
 label: "Development",
 env: "dev",
 purpose: "FeaturesDevelopmentandIntegration Testing",
 access: "Internal",
 namespace: "af-{workspace}-dev",
 domainPattern: "{app}.dev.agentflow.ai",
 dataRetention: "7 days",
 configPrefix: "DEV_",
 secretPrefix: "AF_DEV_{SERVICE}_",
 },
 {
 id: "env-staging",
 label: "Publish",
 env: "staging",
 purpose: "GrayscaleVerifyandAcceptance",
 access: "",
 namespace: "af-{workspace}-stg",
 domainPattern: "{app}.staging.agentflow.ai",
 dataRetention: "14 days",
 configPrefix: "STG_",
 secretPrefix: "AF_STG_{SERVICE}_",
 },
 {
 id: "env-prod",
 label: "Production",
 env: "prod",
 purpose: "currentlyforoutsideService",
 access: "Strict",
 namespace: "af-{workspace}-prod",
 domainPattern: "{app}.agentflow.ai",
 dataRetention: "30 days",
 configPrefix: "PROD_",
 secretPrefix: "AF_PROD_{SERVICE}_",
 },
 ],
 resourceRules: [
 {
 id: "rule-db",
 resource: "Database",
 pattern: "af_{env}_{app}",
 example: "af_prod_checkout",
 notes: "EnvironmentProhibitShareInstance",
 },
 {
 id: "rule-bucket",
 resource: "forStorage",
 pattern: "af-{env}-{workspace}-{bucket}",
 example: "af-prod-acme-assets",
 notes: "Bucket needEnableVersion",
 },
 {
 id: "rule-secret",
 resource: "Secret",
 pattern: "AF_{ENV}_{SERVICE}_{KEY}",
 example: "AF_PROD_API_OPENAI",
 notes: "KeybyEnvironmentIndependentRotation",
 },
 ],
 guardrails: [
 "ProhibitEnvironmentShareDatabaseandKey",
 "staging and prod needIndependentMonitorandAlert",
 "AllEnvironmentMustEnableAudit Log",
 ],
};

// ============================================
// DeployTransactionlineandGrayscalePolicy
// ============================================

export interface DeploymentPipelineStage {
 id: string;
 name: string;
 owner: string;
 duration: string;
 gates: string[];
 outputs: string[];
}

export interface CanaryTrafficStep {
 id: string;
 label: string;
 traffic: number;
 duration: string;
 successCriteria: string;
 rollback: string;
}

export interface CanaryMetric {
 id: string;
 name: string;
 threshold: string;
 window: string;
}

export interface DeploymentPipelineStrategy {
 title: string;
 description: string;
 lastUpdated: string;
 toolchain: string[];
 triggers: string[];
 stages: DeploymentPipelineStage[];
 canary: {
 trafficSteps: CanaryTrafficStep[];
 metrics: CanaryMetric[];
 autoRollback: string[];
 manualApproval: string;
 freezeRules: string[];
 };
}

export const deploymentPipelineStrategy: DeploymentPipelineStrategy = {
 title: "DeployTransactionlineandGrayscalePolicy",
 description: "StandardfromCodeSubmittoallPublish'sFlow, AssurancecanRollbackandcanTrack.",
 lastUpdated: "2026-02-02T12:20:00Z",
 toolchain: ["GitHub Actions", "Argo CD", "Kubernetes", "Terraform"],
 triggers: ["main Branchand", "hotfix Mark", "UrgentSecurityFix"],
 stages: [
 {
 id: "stage-build",
 name: "Buildand",
 owner: "Platform CI",
 duration: "10-15 min",
 gates: ["Via", "DependencySecurityScan"],
 outputs: ["canDeployMirror", "SBOM Report"],
 },
 {
 id: "stage-verify",
 name: "IntegrationVerify",
 owner: "QA/Platform",
 duration: "20 min",
 gates: ["TestVia", "keyInterface P95 < 1.5s"],
 outputs: ["AcceptanceReport", "ChangeLogs"],
 },
 {
 id: "stage-staging",
 name: "PublishDeploy",
 owner: "SRE",
 duration: "30 min",
 gates: ["Smoke test Via", "GrayscaleTogglecan"],
 outputs: ["canGrayscaleVersion", "Rollback"],
 },
 {
 id: "stage-canary",
 name: "GrayscalePublish",
 owner: "ProductOwner",
 duration: "2-6 h",
 gates: ["Errorrate < 0.5%", "P95 < 2s", "User = 0"],
 outputs: ["GrayscaleMetrics", "Suggestion"],
 },
 {
 id: "stage-full",
 name: "allPublish",
 owner: "SRE",
 duration: "1 h",
 gates: ["GrayscaleMetricsMeet Target", "valueConfirm"],
 outputs: ["PublishRecord", "MonitorAlertline"],
 },
 ],
 canary: {
 trafficSteps: [
 {
 id: "canary-5",
 label: "Canary 5%",
 traffic: 5,
 duration: "2 h",
 successCriteria: "Errorrate < 0.5% and P95 < 2s",
 rollback: "AutoRollbackon1StableVersion",
 },
 {
 id: "canary-20",
 label: "Beta 20%",
 traffic: 20,
 duration: "6 h",
 successCriteria: "None P1/P2 Alert",
 rollback: "RollbackandLockPublish",
 },
 {
 id: "canary-50",
 label: "Ramp 50%",
 traffic: 50,
 duration: "12 h",
 successCriteria: "keynotDecline > 1%",
 rollback: "RollbackandTriggerIssue",
 },
 {
 id: "canary-100",
 label: "Stable 100%",
 traffic: 100,
 duration: "24 h",
 successCriteria: "MonitorvalueStable",
 rollback: "RetainRollbackWindow 30 min",
 },
 ],
 metrics: [
 {
 id: "metric-error",
 name: "Errorrate",
 threshold: "< 0.5%",
 window: "5 min",
 },
 {
 id: "metric-latency",
 name: "P95 Latency",
 threshold: "< 2s",
 window: "10 min",
 },
 {
 id: "metric-conversion",
 name: "key",
 threshold: ">= 99% line",
 window: "2 h",
 },
 {
 id: "metric-slo",
 name: "SLO Budget",
 threshold: "Consumption < 5%",
 window: "24 h",
 },
 ],
 autoRollback: [
 "ErrorrateContinuous 10 min > 1%",
 "P95 LatencyContinuous 15 min > 3s",
 "Trigger P1/P2 Alert",
 ],
 manualApproval: "GrayscalePhaseneedProductOwner + value SRE Confirm",
 freezeRules: ["monthsFreezeonlyAllow hotfix", "re-largeActivitybefore 48 hProhibit"],
 },
};
