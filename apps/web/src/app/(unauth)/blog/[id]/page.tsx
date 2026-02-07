"use client";

/**
 * BlogDetailsPage - LobeHub StyleDarkDesign
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
 ArrowLeft,
 Calendar,
 Clock,
 User,
 Share2,
 Heart,
 MessageSquare,
 Twitter,
 Linkedin,
 Link2,
 Copy,
 Check,
 ChevronRight,
 BookOpen,
 Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// MockBlogArticleData
const blogPosts: Record<string, {
 id: string;
 title: string;
 excerpt: string;
 content: string;
 category: string;
 author: string;
 authorRole: string;
 date: string;
 readTime: string;
 tags: string[];
}> = {
 "ai-agent-2-release": {
 id: "ai-agent-2-release",
 title: "AI Agent 2.0 currentlyPublish: moreSmart'sWorkflowAutomation",
 excerpt: "Wevery AI Agent 2.0 'scurrentlyPublish, comemorelarge'sNaturalLanguageUnderstandcanpower, multipleModelSupportandSmartRecommendedFeatures.",
 content: `
## 

Today, WeVery AgentFlow AI Agent 2.0 'scurrentlyPublish!thisisWeasmostre-need'sUpdate, come'snewFeaturesand'scanImprove.

## mainneedUpdate

### 1. multipleModelSupport

AI Agent 2.0 atSupportfaceonAllmain'slargeLanguageModel: 

- **GPT-4 Turbo** - OpenAI mostnewBestlarge'sModel
- **Claude 3** - Anthropic 'snew1Model
- **Tongyi1000** - inbaba'slargeModel
- **center1** - 100'slargeModel
- **LocalModel** - Via Ollama SupportLocalDeploy'sModel

youcanwithBased onTaskTypeandCostConsider, FlexibleSelectmostSuitable'sModel.

### 2. NaturalLanguageWorkflow

thisisWemostpending'sFeatures1.atyoucanwithuseNaturalLanguageDescriptionyouwantneedAutomation'sTask, AI willAutoGenerateforshould'sWorkflow.

exampleif, youneedneed: "eachtoCustomerEmailtime, AutoCategoryandReplyFAQ", SystemthenwillasyouCreateComplete'sWorkflow.

### 3. SmartRecommendedSystem

Based onyou'sUsageandIndustryFeature, AI Agent 2.0 willSmartRecommended: 

- mostSuitableyou'sWorkflowTemplate
- cancanneedneed'sNodeandIntegration
- optimalSuggestionandBest Practices

### 4. canlargeImprove

- ExecuteSpeedImprove **40%**
- inuseReduce **30%**
- LaunchTimeShorten **50%**

## ifwhatUpgrade

ifresultyouisExistingUser, AI Agent 2.0 alreadyAutoasyouEnable.youneedneedSign InConsole, thencanExperienceAllnewFeatures.

newUsercanwithViaSign UpFreeAccountNowStartUsage.

## NextPlan

WewillContinueUserFeedback, ContinuousImproveProduct.downcome'sre-methodInclude: 

- Moveendpoint App
- moremultipleThird-partyIntegration
- TeamCollaborationEnhanced
- AI WorkflowDebugTool

Thank youAllUser'sSupportandFeedback, currentlyisyoulet AgentFlow more!

---

ifresultyouhaswhatIssueorSuggestion, WelcomeViawithdownmethodContact Us: 

- CommunityForum: [community.agentflow.ai](https://community.agentflow.ai)
- Twitter: [@agentflow](https://twitter.com/agentflow)
- Email: feedback@agentflow.ai
`,
 category: "product",
 author: "ProductTeam",
 authorRole: "AgentFlow Productsection",
 date: "2026-01-25",
 readTime: "5 min",
 tags: ["AI Agent", "ProductUpdate", "newFeatures"],
 },
 "workflow-best-practices": {
 id: "workflow-best-practices",
 title: "WorkflowDesignBest Practices: fromGetting StartedtoExpert",
 excerpt: "currentwillShareWeatHelpcount1000UserBuildWorkflowpastSummary'sBest Practices, HelpyouDesignmoreEfficient, morecan'sAutomationFlow.",
 content: `
## 

atHelpcount1000UserBuildWorkflow'spast, Welarge'sExperienceand.currentwillSharethis'sBest Practices, HelpyouDesignmoreEfficient, morecan'sAutomationFlow.

## 1. fromsmall

**then: firstfromSimple'sWorkflowStart, IncreaseComplex.**

verymultipleUser1StartthenwantBuild1Contains10Node'sComplexWorkflow, Resultand.Suggestionyou: 

- firstIdentifymostre-need's 2-3 Step
- Build1MinimumAvailable'sWorkflow
- VerifyEffectafteragainExtend

## 2. ReasonableUsageConditionBranch

ConditionBranchisWorkflowBestlarge'sFeatures1, butalsoEasybyuse.

### Recommendeddo

- ConditionDetermineShouldSimpleClear
- AvoidExceed 3 Nested
- Usagehas'sBranchName

### notRecommendeddo

- at1NodepastmultipleCondition
- UsageBlur'sDetermineLogic
- IgnoreEdgeSituationProcess

## 3. ErrorProcessisMust's

whatWorkflowallcancantoError, keyisifwhatoptimalProcessit.

Suggestion'sErrorProcessPolicy: 

1. **RetryMechanism**: forattimeError, SettingsReasonable'sRetrytimescount
2. **DowngradeProcess**: mainneedPathFailedtime, SwitchtousePlan
3. **AlertNotifications**: re-needErrorShouldandtimeNotificationsRelatedperson
4. **LogsRecord**: Record'sInfowithIssue

## 4. canoptimalTips

### androwExecute

multipleStepbetweenNoDependencytime, UsageandrowExecutecanwithlargeImprovecan.

### CachePolicy

foratFrequentAccess'sData, ConsiderUsageCacheAvoidre-Request.

### BatchProcess

ProcesslargeDatatime, UsageBatchActionandnotisProcess.

## 5. TestandMonitor

### TestEnvironment

AlwaysatTestEnvironmentVerifyWorkflow, ConfirmNoneafteragainDeploytoProductionEnvironment.

### MonitorMetrics

FollowwithdownkeyMetrics: 

- ExecuteSuccess Rate
- AverageExecuteTime
- ErrorDistribution
- ResourceConsumption

## Summary

'sWorkflowDesignneedneednotPracticeandoptimal.HopethisBest PracticescanHelpyouBuildmore'sAutomationFlow.

ifresultyouhaswhatIssueorwantShareyou'sExperience, WelcomeatCommunityForumandWeExchange!
`,
 category: "tips",
 author: "TechnologyTeam",
 authorRole: "AgentFlow Technologysection",
 date: "2026-01-20",
 readTime: "8 min",
 tags: ["Best Practices", "WorkflowDesign", "Tutorial"],
 },
};

// RelatedArticle
const relatedPosts = [
 {
 id: "enterprise-automation-trends",
 title: "2026 EnterpriseAutomationTrend: AI Driven'sWorkflow",
 date: "2026-01-15",
 readTime: "10 min",
 },
 {
 id: "slack-integration-guide",
 title: "Slack IntegrationcompleteallGuide: BuildEfficientTeamCollaboration",
 date: "2026-01-10",
 readTime: "6 min",
 },
 {
 id: "error-handling-patterns",
 title: "WorkflowErrorProcess: EnsureAutomation'scan",
 date: "2025-12-28",
 readTime: "9 min",
 },
];

export default function BlogPostPage() {
 const params = useParams();
 const router = useRouter();
 const postId = params.id as string;
 
 const [copied, setCopied] = useState(false);
 const [liked, setLiked] = useState(false);
 const [likeCount, setLikeCount] = useState(42);
 
 const post = blogPosts[postId];

 // ifresultArticleDoes not exist, Display 404
 if (!post) {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />
 <div className="pt-32 sm:pt-40 pb-16 px-6 text-center">
 <h1 className="text-[20px] font-semibold text-foreground mb-4">ArticleDoes not exist</h1>
 <p className="text-[13px] text-foreground-light mb-8">Sorry, youAccess'sArticleDoes not existoralreadybyDelete</p>
 <Link href="/blog">
 <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 BackBlogList
 </Button>
 </Link>
 </div>
 <SiteFooter />
 </div>
 );
 }

 const copyLink = () => {
 navigator.clipboard.writeText(window.location.href);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleLike = () => {
 if (liked) {
 setLikeCount(prev => prev - 1);
 } else {
 setLikeCount(prev => prev + 1);
 }
 setLiked(!liked);
 };

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Article Header */}
 <article className="pt-32 sm:pt-40 pb-16 px-6">
 <div className="max-w-3xl mx-auto">
 {/* Back link */}
 <Link
 href="/blog"
 className="inline-flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground mb-8 group"
 >
 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
 BackBlog
 </Link>

 {/* Category & Meta */}
 <div className="flex flex-wrap items-center gap-3 mb-6">
 <span className="lobe-badge">
 {post.category === "product" ? "ProductUpdate": 
 post.category === "tips" ? "UsageTips": 
 post.category === "tech" ? "TechnologyShare": post.category}
 </span>
 <span className="flex items-center gap-1 text-[12px] text-foreground-lighter">
 <Clock className="w-4 h-4" />
 {post.readTime}
 </span>
 </div>

 {/* Title */}
 <h1 className="text-[26px] sm:text-[32px] font-semibold text-foreground mb-6 leading-tight">
 {post.title}
 </h1>

 {/* Author & Date */}
 <div className="flex items-center justify-between flex-wrap gap-4 pb-8 border-b border-border/30">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
 <User className="w-6 h-6 text-brand" />
 </div>
 <div>
 <div className="text-[14px] font-medium text-foreground">{post.author}</div>
 <div className="text-[12px] text-foreground-lighter">{post.authorRole}</div>
 </div>
 </div>
 <div className="flex items-center gap-2 text-[13px] text-foreground-lighter">
 <Calendar className="w-4 h-4" />
 {post.date}
 </div>
 </div>

 {/* Content */}
 <div className="py-10">
 <div className="prose prose-neutral dark:prose-invert max-w-none">
 {post.content.split('\n').map((paragraph, index) => {
 if (paragraph.startsWith('## ')) {
 return (
 <h2 key={index} className="text-[20px] font-semibold text-foreground mt-10 mb-4">
 {paragraph.replace('## ', '')}
 </h2>
 );
 }
 if (paragraph.startsWith('### ')) {
 return (
 <h3 key={index} className="text-[17px] font-semibold text-foreground mt-8 mb-3">
 {paragraph.replace('### ', '')}
 </h3>
 );
 }
 if (paragraph.startsWith('- ')) {
 return (
 <li key={index} className="text-[13px] text-foreground-light ml-4">
 {paragraph.replace('- ', '')}
 </li>
 );
 }
 if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ') || paragraph.startsWith('4. ')) {
 return (
 <li key={index} className="text-[13px] text-foreground-light ml-4 list-decimal">
 {paragraph.replace(/^\d+\.\s/, '')}
 </li>
 );
 }
 if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
 return (
 <p key={index} className="text-foreground font-semibold my-4 text-[14px]">
 {paragraph.replace(/\*\*/g, '')}
 </p>
 );
 }
 if (paragraph.startsWith('---')) {
 return <hr key={index} className="my-8 border-border/30" />;
 }
 if (paragraph.trim() === '') return null;
 return (
 <p key={index} className="text-[13px] text-foreground-light leading-relaxed my-4">
 {paragraph}
 </p>
 );
 })}
 </div>
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-2 py-6 border-t border-border/30">
 <Tag className="w-4 h-4 text-foreground-lighter" />
 {post.tags.map((tag) => (
 <Link
 key={tag}
 href={`/blog?tag=${encodeURIComponent(tag)}`}
 className="px-3 py-1 rounded-full bg-surface-100/30 text-[12px] text-foreground-light hover:text-foreground transition-colors"
 >
 {tag}
 </Link>
 ))}
 </div>

 {/* Actions */}
 <div className="flex items-center justify-between py-6 border-t border-border/30">
 <div className="flex items-center gap-4">
 <button
 onClick={handleLike}
 className={cn(
 "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
 liked
 ? "bg-red-500/10 text-red-400"
 : "bg-surface-100/30 text-foreground-light hover:text-foreground"
 )}
 >
 <Heart className={cn("w-5 h-5", liked && "fill-current")} />
 <span className="text-[13px]">{likeCount}</span>
 </button>
 <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100/30 text-foreground-light hover:text-foreground transition-colors">
 <MessageSquare className="w-5 h-5" />
 <span className="text-[13px]">Comment</span>
 </button>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-[12px] text-foreground-lighter mr-2">Share</span>
 <a
 href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
 >
 <Twitter className="w-4 h-4" />
 </a>
 <a
 href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
 >
 <Linkedin className="w-4 h-4" />
 </a>
 <button
 onClick={copyLink}
 className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
 >
 {copied ? <Check className="w-4 h-4 text-brand" /> : <Link2 className="w-4 h-4" />}
 </button>
 </div>
 </div>
 </div>
 </article>

 {/* Related Posts */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-3xl mx-auto">
 <h2 className="text-[17px] font-semibold text-foreground mb-8 flex items-center gap-2">
 <BookOpen className="w-5 h-5 text-brand" />
 RelatedArticle
 </h2>

 <div className="space-y-4">
 {relatedPosts.map((relatedPost) => (
 <Link
 key={relatedPost.id}
 href={`/blog/${relatedPost.id}`}
 className={cn(
 "flex items-center justify-between p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:border-brand/30",
 "transition-all group"
 )}
 >
 <div className="flex-1">
 <h3 className="text-[14px] font-medium text-foreground group-hover:text-brand transition-colors mb-2">
 {relatedPost.title}
 </h3>
 <div className="flex items-center gap-4 text-[12px] text-foreground-lighter">
 <span>{relatedPost.date}</span>
 <span>{relatedPost.readTime}</span>
 </div>
 </div>
 <ChevronRight className="w-5 h-5 text-foreground-lighter group-hover:text-brand transition-colors" />
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Newsletter CTA */}
 <section className="py-16 px-6">
 <div className="max-w-2xl mx-auto text-center">
 <h2 className="text-[17px] font-semibold text-foreground mb-4">
 SubscriptionWe's Newsletter
 </h2>
 <p className="text-[13px] text-foreground-light mb-6">
 eachweeksFeaturedmostnewArticleandProductUpdate, DirectSendtoyou'sEmail
 </p>
 <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
 <input
 type="email"
 placeholder="your@email.com"
 className="flex-1 h-11 px-4 rounded-full bg-surface-100/30 border border-border/30 text-foreground placeholder:text-foreground-lighter focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50"
 />
 <Button className="h-11 px-6 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90">
 Subscription
 </Button>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
