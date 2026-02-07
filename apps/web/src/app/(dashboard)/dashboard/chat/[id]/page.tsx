"use client";

/**
 * ConversationDetailsPage - Chatface
 * SupportViewHistoryMessage, SendnewMessage, StreamingResponse
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 ArrowLeft,
 Settings,
 Share2,
 MoreHorizontal,
 Star,
 Archive,
 Trash2,
 Edit3,
 Loader2,
 Sparkles,
 RefreshCw,
 MessageSquare,
 ChevronDown,
} from "lucide-react";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChatInput, QuickReplies } from "@/components/chat/chat-input";
import { ChatMessages, WelcomeMessage, type ChatMessage } from "@/components/chat/chat-messages";
import { AISettingsPanel } from "@/components/chat/ai-settings-panel";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@/components/ui/sheet";
import { appApi, conversationApi } from "@/lib/api";
import { useStreamingChat } from "@/hooks";
import type { Conversation, Message as ConversationMessage, AIParameters } from "@/types/conversation";
import { AI_MODELS, formatRelativeTime, getModelDisplayName } from "@/types/conversation";

// willafterendpointMessageFormatConvertasComponentMessageFormat
function toDisplayMessage(msg: ConversationMessage): ChatMessage {
 return {
 id: msg.id,
 role: msg.role,
 content: msg.content,
 timestamp: new Date(msg.createdAt),
 model: msg.model,
 tokens: msg.tokenUsage,
 liked: msg.liked,
 disliked: msg.disliked,
 bookmarked: msg.bookmarked,
 };
}

// AvailableModelList
const AVAILABLE_MODELS = AI_MODELS.map((m) => ({
 id: m.id,
 name: m.name,
 icon: "✨",
}));

// SuggestionIssue
const SUGGESTIONS = [
 { label: "I1Code", prompt: "I1 React Component" },
 { label: "Explain1Concept", prompt: "Explain1downWhatisServiceArchitecture" },
 { label: "SummaryArticleContent", prompt: "ISummarywithdownArticle'smainneedContent" },
 { label: "ProvideSuggestion", prompt: "toI1ImproveWorkrate'sSuggestion" },
];

const LAST_WORKSPACE_STORAGE_KEY = "last_workspace_id";

const readStoredWorkspaceId = () => {
 if (typeof window === "undefined") return null;
 try {
 return localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY);
 } catch {
 return null;
 }
};

const writeStoredWorkspaceId = (workspaceId: string) => {
 if (typeof window === "undefined") return;
 try {
 localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, workspaceId);
 } catch {
 // ignore storage errors
 }
};

const resolveConversationWorkspaceId = (conversation: Conversation) =>
 (conversation as { workspaceId?: string }).workspaceId ||
 (conversation as { workspace_id?: string }).workspace_id ||
 null;

type ChatPageProps = {
 conversationId: string;
 workspaceId?: string;
};

export function ChatPageContent({ conversationId, workspaceId }: ChatPageProps) {
 const router = useRouter();

 // Status
 const [conversation, setConversation] = useState<Conversation | null>(null);
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [loading, setLoading] = useState(true);
 const [sending, setSending] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [selectedModel, setSelectedModel] = useState("gpt-4");
 const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
 const [isEditing, setIsEditing] = useState(false);
 const [editTitle, setEditTitle] = useState("");
 const [useStreaming, setUseStreaming] = useState(true); // isnoUsageStreamingResponse
 const abortControllerRef = useRef<AbortController | null>(null);
 
 // MessageEditStatus
 const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
 const [editingContent, setEditingContent] = useState("");
 
 // ReplyStatus
 const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
 
 // ShortcutReplySuggestion
 const [quickReplies, setQuickReplies] = useState<string[]>([]);
 
 // AI ParameterSettings
 const [aiParams, setAiParams] = useState<AIParameters>({});
 const [settingsOpen, setSettingsOpen] = useState(false);
 
 // StreamingChat hook
 const { streamChat, cancelStream, isStreaming } = useStreamingChat();
 const conversationsHref = workspaceId ? `/dashboard/app/${workspaceId}/conversations` : "/dashboard/apps";

 // LoadConversationDetails
 const fetchConversation = useCallback(async () => {
 if (!conversationId || conversationId === "new") {
 setLoading(false);
 return;
 }

 if (!workspaceId) {
 setError("PleasefirstSelectWorkspace");
 setLoading(false);
 return;
 }

 setLoading(true);
 setError(null);

 try {
 const conv = await conversationApi.get(conversationId, {
 messageLimit: 100,
 workspaceId,
 });
 setConversation(conv);
 setSelectedModel(conv.model || "gpt-4");
 setEditTitle(conv.title);
 
 // Load AI Parameter
 setAiParams({
 temperature: conv.temperature,
 maxTokens: conv.maxTokens,
 topP: conv.topP,
 topK: conv.topK,
 frequencyPenalty: conv.frequencyPenalty,
 presencePenalty: conv.presencePenalty,
 });

 // ConvertMessageFormat(needneedInvertOrder, as API Back'sismostnew'satbefore)
 if (conv.messages && conv.messages.length > 0) {
 const displayMessages = conv.messages
 .map(toDisplayMessage)
 .reverse();
 setMessages(displayMessages);
 }
 } catch (err) {
 console.error("Failed to fetch conversation:", err);
 setError("LoadConversationFailed, PleaseRetry");
 } finally {
 setLoading(false);
 }
 }, [conversationId, workspaceId]);

 useEffect(() => {
 fetchConversation();
 }, [fetchConversation]);

 // SendMessage
 const handleSend = async (content: string) => {
 if (!content.trim() || sending) return;

 let currentConversationId = conversationId;

 // ifresultisnewConversation, firstCreateConversation
 if (conversationId === "new") {
 try {
 if (!workspaceId) {
 setError("PleasefirstSelectWorkspace");
 router.push("/dashboard/apps");
 return;
 }
 const newConv = await conversationApi.create({
 workspaceId,
 title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
 model: selectedModel,
 });
 currentConversationId = newConv.id;
 setConversation(newConv);
 // Update URL(notRefreshPage)
 window.history.replaceState(
 null,
 "",
 `/dashboard/app/${workspaceId}/conversations/${newConv.id}`
 );
 } catch (err) {
 console.error("Failed to create conversation:", err);
 setError("CreateConversationFailed");
 return;
 }
 }

 // CreateUserMessagetimeDisplay
 const tempUserMessageId = `temp-user-${Date.now()}`;
 const userMessage: ChatMessage = {
 id: tempUserMessageId,
 role: "user",
 content,
 timestamp: new Date(),
 parentId: replyingToMessage?.id,
 parentMessage: replyingToMessage || undefined,
 };

 // Create AI Message
 const tempAiMessageId = `temp-ai-${Date.now()}`;
 const aiMessage: ChatMessage = {
 id: tempAiMessageId,
 role: "assistant",
 content: "",
 timestamp: new Date(),
 model: selectedModel,
 };

 // ClearReplyStatus
 const replyParentId = replyingToMessage?.id;
 setReplyingToMessage(null);

 setMessages((prev) => [...prev, userMessage, aiMessage]);
 setSending(true);
 setStreamingMessageId(tempAiMessageId);

 try {
 if (useStreaming) {
 // UsageStreamingResponse
 const fullContent = await streamChat(currentConversationId, content, {
 workspaceId,
 model: selectedModel,
 onToken: (token) => {
 // Real-timeUpdate AI MessageContent
 setMessages((prev) =>
 prev.map((msg) =>
 msg.id === tempAiMessageId
 ? { ...msg, content: msg.content + token }
 : msg
 )
 );
 },
 onComplete: (finalContent) => {
 // StreamingResponseDone, UpdatemostContent
 setMessages((prev) =>
 prev.map((msg) =>
 msg.id === tempAiMessageId
 ? { ...msg, content: finalContent }
 : msg
 )
 );
 },
 onError: (error) => {
 console.error("Streaming error:", error);
 setMessages((prev) =>
 prev.map((msg) =>
 msg.id === tempAiMessageId
 ? {...msg, content: "Sorry, SendMessagetimeAppearError.PleaseRetry." }
 : msg
 )
 );
 },
 });
 } else {
 // UsageStreamingResponse
 const response = await conversationApi.chat(currentConversationId, content, {
 workspaceId,
 model: selectedModel,
 });

 // UpdateMessageasReal's ID andContent
 setMessages((prev) =>
 prev.map((msg) => {
 if (msg.id === tempUserMessageId) {
 return {
 ...msg,
 id: response.userMessage.id,
 };
 }
 if (msg.id === tempAiMessageId) {
 return {
 ...msg,
 id: response.aiMessage.id,
 content: response.aiMessage.content,
 model: response.aiMessage.model,
 };
 }
 return msg;
 })
 );
 }
 } catch (err) {
 console.error("Failed to send message:", err);
 // DisplayErrorMessage
 setMessages((prev) =>
 prev.map((msg) =>
 msg.id === tempAiMessageId
 ? {...msg, content: "Sorry, SendMessagetimeAppearError.PleaseRetry." }
 : msg
 )
 );
 } finally {
 setSending(false);
 setStreamingMessageId(null);
 
 // GenerateShortcutReplySuggestion(Based onConversationContentGenerate1Suggestion)
 generateQuickReplies();
 }
 };

 // GenerateShortcutReplySuggestion
 const generateQuickReplies = () => {
 // Based onRecent'sConversationContentGenerate1use'safterIssue
 const suggestions = [
 "ContinueExplain",
 "canexample??",
 "hasWhatneedneedNote's?",
 "Summary1down",
 ];
 setQuickReplies(suggestions);
 };

 // CancelSend
 const handleCancel = () => {
 // CancelStreamingRequest
 cancelStream();
 // CancelNormalRequest
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 abortControllerRef.current = null;
 }
 setSending(false);
 setStreamingMessageId(null);
 };

 // re-newGenerate
 const handleRegenerate = async (messageId: string) => {
 const messageIndex = messages.findIndex((m) => m.id === messageId);
 if (messageIndex === -1) return;

 // tobefore'sUserMessage
 const prevUserMessage = messages
 .slice(0, messageIndex)
 .reverse()
 .find((m) => m.role === "user");

 if (prevUserMessage) {
 // DeleteCurrent AI Messageandafter'sMessage
 setMessages((prev) => prev.slice(0, messageIndex));
 // re-newSend
 await handleSend(prevUserMessage.content);
 }
 };

 // StartEditMessage
 const startEditMessage = (messageId: string) => {
 const message = messages.find((m) => m.id === messageId);
 if (message) {
 setEditingMessageId(messageId);
 setEditingContent(message.content);
 }
 };

 // SaveMessageEdit
 const saveEditMessage = async () => {
 if (!editingMessageId || !editingContent.trim() || !conversation) return;

 try {
 await conversationApi.updateMessage(
 conversation.id,
 editingMessageId,
 editingContent.trim()
 );

 setMessages((prev) =>
 prev.map((m) =>
 m.id === editingMessageId
 ? { ...m, content: editingContent.trim() }
 : m
 )
 );
 setEditingMessageId(null);
 setEditingContent("");
 } catch (err) {
 console.error("Failed to update message:", err);
 }
 };

 // CancelMessageEdit
 const cancelEditMessage = () => {
 setEditingMessageId(null);
 setEditingContent("");
 };

 // DeleteMessage
 const handleDeleteMessage = async (messageId: string) => {
 if (!conversation) return;
 
 try {
 await conversationApi.deleteMessage(conversation.id, messageId);
 setMessages((prev) => prev.filter((m) => m.id !== messageId));
 } catch (err) {
 console.error("Failed to delete message:", err);
 }
 };

 // MessageFeedback(Like//Favorite)
 const handleMessageFeedback = async (messageId: string, action: "like" | "dislike" | "bookmark") => {
 if (!conversation) return;
 
 const message = messages.find((m) => m.id === messageId);
 if (!message) return;

 // firstOptimisticUpdate UI
 const newLiked = action === "like" ? !message.liked : (action === "dislike" && message.liked ? false : message.liked);
 const newDisliked = action === "dislike" ? !message.disliked : (action === "like" && message.disliked ? false : message.disliked);
 const newBookmarked = action === "bookmark" ? !message.bookmarked : message.bookmarked;

 setMessages((prev) =>
 prev.map((m) =>
 m.id === messageId
 ? { ...m, liked: newLiked, disliked: newDisliked, bookmarked: newBookmarked }
 : m
 )
 );

 try {
 // Call API Persistent
 await conversationApi.updateMessageFeedback(conversation.id, messageId, {
 liked: action === "like" ? newLiked : undefined,
 disliked: action === "dislike" ? newDisliked : undefined,
 bookmarked: action === "bookmark" ? newBookmarked : undefined,
 });
 } catch (err) {
 console.error("Failed to update message feedback:", err);
 // Rollback UI
 setMessages((prev) =>
 prev.map((m) =>
 m.id === messageId
 ? { ...m, liked: message.liked, disliked: message.disliked, bookmarked: message.bookmarked }
 : m
 )
 );
 }
 };

 // MessageAction
 const handleMessageAction = (action: string, messageId: string) => {
 switch (action) {
 case "regenerate":
 handleRegenerate(messageId);
 break;
 case "edit":
 startEditMessage(messageId);
 break;
 case "delete":
 handleDeleteMessage(messageId);
 break;
 case "like":
 case "dislike":
 case "bookmark":
 handleMessageFeedback(messageId, action);
 break;
 case "reply":
 const replyTarget = messages.find((m) => m.id === messageId);
 if (replyTarget) {
 setReplyingToMessage(replyTarget);
 }
 break;
 }
 };

 // CancelReply
 const cancelReply = () => {
 setReplyingToMessage(null);
 };

 // SwitchFavorite
 const handleToggleStar = async () => {
 if (!conversation) return;
 try {
 await conversationApi.setStarred(conversation.id, !conversation.starred);
 setConversation((prev) =>
 prev ? { ...prev, starred: !prev.starred } : null
 );
 } catch (err) {
 console.error("Failed to toggle star:", err);
 }
 };

 // ArchiveConversation
 const handleArchive = async () => {
 if (!conversation) return;
 try {
 await conversationApi.setArchived(conversation.id, true);
 router.push(conversationsHref);
 } catch (err) {
 console.error("Failed to archive:", err);
 }
 };

 // DeleteConversation
 const handleDelete = async () => {
 if (!conversation) return;
 if (!confirm("OKneedDeletethisConversation??")) return;
 try {
 await conversationApi.delete(conversation.id);
 router.push(conversationsHref);
 } catch (err) {
 console.error("Failed to delete:", err);
 }
 };

 // UpdateTitle
 const handleUpdateTitle = async () => {
 if (!conversation || !editTitle.trim()) return;
 try {
 await conversationApi.update(conversation.id, { title: editTitle });
 setConversation((prev) =>
 prev ? { ...prev, title: editTitle } : null
 );
 setIsEditing(false);
 } catch (err) {
 console.error("Failed to update title:", err);
 }
 };

 // LoadStatus
 if (loading) {
 return (
 <div className="flex h-full items-center justify-center bg-background-studio">
 <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
 </div>
 );
 }

 // ErrorStatus
 if (error) {
 return (
 <div className="flex h-full flex-col items-center justify-center gap-4 bg-background-studio">
 <p className="text-foreground-light">{error}</p>
 <Button onClick={fetchConversation}>
 <RefreshCw className="w-4 h-4 mr-2" />
 Retry
 </Button>
 </div>
 );
 }

 const isNewConversation = conversationId === "new" || !conversation;
 const messageCount = messages.length || conversation?.messageCount || 0;
 const lastUpdatedLabel = conversation?.updatedAt ? formatRelativeTime(conversation.updatedAt)
 : messageCount > 0
 ? "Just now"
 : "—";

 return (
 <div className="flex h-full flex-col bg-background-studio">
 {/* Header */}
 <header className="shrink-0 border-b border-border bg-surface-75/80 backdrop-blur">
 <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4 px-6 py-3">
 <div className="flex items-start gap-3 min-w-0">
 <Link href={conversationsHref}>
 <Button
 variant="ghost"
 size="icon-xs"
 className="text-foreground-muted hover:text-foreground"
 >
 <ArrowLeft className="w-5 h-5" />
 </Button>
 </Link>

 <div className="min-w-0">
 <div className="page-caption flex items-center gap-2">
 <span>Conversation</span>
 <span className="h-1 w-1 rounded-full bg-foreground-muted" />
 <span>{isNewConversation ? "newConversation": "ConversationDetails"}</span>
 </div>

 {isEditing ? (
 <div className="mt-2 flex flex-wrap items-center gap-2">
 <Input
 value={editTitle}
 onChange={(e) => setEditTitle(e.target.value)}
 inputSize="sm"
 className="w-64 bg-surface-100 border-border focus:border-brand-500"
 autoFocus
 onKeyDown={(e) => {
 if (e.key === "Enter") handleUpdateTitle();
 if (e.key === "Escape") setIsEditing(false);
 }}
 />
 <Button size="sm" onClick={handleUpdateTitle}>
 Save
 </Button>
 <Button
 size="sm"
 variant="ghost"
 onClick={() => setIsEditing(false)}
 className="text-foreground-muted hover:text-foreground"
 >
 Cancel
 </Button>
 </div>
 ) : (
 <div className="mt-2 flex items-center gap-2 min-w-0">
 <h1 className="text-[14px] font-medium text-foreground truncate max-w-[360px]">
 {conversation?.title || "newConversation"}
 </h1>
 {conversation?.starred && (
 <Star className="w-4 h-4 text-warning fill-warning" />
 )}
 </div>
 )}

 <p className="mt-1 text-[11px] text-foreground-muted">
 CurrentModel {getModelDisplayName(selectedModel)} · {messageCount} Message · Update {lastUpdatedLabel}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* AI Settings */}
 <div className="flex items-center gap-1 rounded-md border border-border bg-surface-100 p-1">
 <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
 <SheetTrigger asChild>
 <Button
 variant="ghost"
 size="icon-xs"
 className="text-foreground-muted hover:text-foreground"
 >
 <Settings className="w-5 h-5" />
 </Button>
 </SheetTrigger>
 <SheetContent className="bg-surface-100 border-border">
 <SheetHeader>
 <SheetTitle className="text-foreground">AI ParameterSettings</SheetTitle>
 </SheetHeader>
 <div className="mt-6">
 <AISettingsPanel
 params={aiParams}
 onChange={(params) => {
 setAiParams(params);
 // ifresultConversationAlready exists, SavetoService
 if (conversation) {
 conversationApi.update(conversation.id, params).catch(console.error);
 }
 }}
 />
 </div>
 </SheetContent>
 </Sheet>
 </div>

 {/* ModelSelect */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="h-8 gap-2 border-border text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 <Sparkles className="w-4 h-4 text-brand-500" />
 {getModelDisplayName(selectedModel)}
 <ChevronDown className="w-3 h-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="bg-surface-100 border-border">
 {AVAILABLE_MODELS.map((model) => (
 <DropdownMenuItem
 key={model.id}
 onClick={() => setSelectedModel(model.id)}
 className="text-foreground-light hover:text-foreground hover:bg-surface-200"
 >
 <span className="mr-2">{model.icon}</span>
 {model.name}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 {!isNewConversation && (
 <div className="flex items-center gap-1 rounded-md border border-border bg-surface-100 p-1">
 <Button
 variant="ghost"
 size="icon-xs"
 className="text-foreground-muted hover:text-foreground"
 onClick={handleToggleStar}
 >
 <Star
 className={cn(
 "w-5 h-5",
 conversation?.starred && "text-warning fill-warning"
 )}
 />
 </Button>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon-xs"
 className="text-foreground-muted hover:text-foreground"
 >
 <MoreHorizontal className="w-5 h-5" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="bg-surface-100 border-border">
 <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
 <Edit3 className="w-4 h-4 mr-2" />
 re-Naming
 </DropdownMenuItem>
 <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
 <Share2 className="w-4 h-4 mr-2" />
 Share
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuItem onClick={handleArchive} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
 <Archive className="w-4 h-4 mr-2" />
 Archive
 </DropdownMenuItem>
 <DropdownMenuItem
 className="text-destructive hover:bg-destructive-200"
 onClick={handleDelete}
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 )}
 </div>
 </div>
 </header>

 {/* MessageRegion */}
 <main className="flex-1 overflow-auto scrollbar-thin">
 <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6">
 <div className="page-panel overflow-hidden">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">Message</h2>
 <p className="page-panel-description">
 {messages.length > 0 ? "mostnewConversationContent": "PrepareStartConversation"}
 </p>
 </div>
 <span className="text-xs text-foreground-muted">
 {messageCount} 
 </span>
 </div>
 {messages.length === 0 ? (
 <WelcomeMessage
 title="StartnewConversation"
 description="Inputyou'sIssueorSelect1SuggestionStartConversation.AI AssistantwillasyouProvideHelp."
 suggestions={SUGGESTIONS}
 onSuggestionClick={handleSend}
 className="min-h-[60vh] border-t border-border/60"
 />
 ) : (
 <ChatMessages
 messages={messages}
 isLoading={sending}
 streamingMessageId={streamingMessageId}
 editingMessageId={editingMessageId}
 editingContent={editingContent}
 onEditingContentChange={setEditingContent}
 onSaveEdit={saveEditMessage}
 onCancelEdit={cancelEditMessage}
 onMessageAction={handleMessageAction}
 className="border-t border-border/60"
 />
 )}
 </div>
 </div>
 </main>

 <div className="shrink-0 border-t border-border bg-background-studio/95">
 <div className="mx-auto w-full max-w-5xl px-6">
 {/* ShortcutReplySuggestion */}
 {!sending && messages.length > 0 && quickReplies.length > 0 && (
 <div className="pt-3 pb-2">
 <div className="mb-2 flex items-center justify-between">
 <span className="page-caption">ShortcutReply</span>
 <Button
 variant="ghost"
 size="sm"
 className="h-6 px-2 text-[11px] text-foreground-muted hover:text-foreground"
 onClick={() => setQuickReplies([])}
 >
 Clear
 </Button>
 </div>
 <QuickReplies
 suggestions={quickReplies}
 onSelect={(suggestion) => {
 handleSend(suggestion);
 setQuickReplies([]);
 }}
 />
 </div>
 )}

 {/* ReplyIndicator */}
 {replyingToMessage && (
 <div className="mb-2 rounded-md border border-border border-l-2 border-l-brand-500/30 bg-surface-75/80 px-3 py-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-[12px]">
 <MessageSquare className="w-4 h-4 text-brand-500" />
 <span className="text-foreground-muted">
 Reply {replyingToMessage.role === "user" ? "you": "AI"}: 
 </span>
 <span className="text-foreground truncate max-w-[320px] font-medium">
 {replyingToMessage.content.slice(0, 50)}
 {replyingToMessage.content.length > 50 && "..."}
 </span>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={cancelReply}
 className="h-6 px-2 text-xs text-foreground-muted hover:text-foreground"
 >
 Cancel
 </Button>
 </div>
 </div>
 )}

 {/* InputRegion */}
 <ChatInput
 onSend={handleSend}
 onCancel={handleCancel}
 isLoading={sending}
 placeholder={replyingToMessage ? "InputReplyContent...": "InputMessage, by Enter Send..."}
 showModels={false}
 models={AVAILABLE_MODELS}
 selectedModel={selectedModel}
 onModelChange={setSelectedModel}
 className="border-t-0 bg-transparent px-0"
 />
 </div>
 </div>
 </div>
 );
}

export default function ChatPage() {
 const params = useParams();
 const router = useRouter();
 const conversationId = params.id as string | undefined;
 const [redirectError, setRedirectError] = useState<string | null>(null);

 useEffect(() => {
 let cancelled = false;

 const redirectToWorkspaceConversation = async () => {
 if (!conversationId) return;
 const storedId = readStoredWorkspaceId();

 if (conversationId === "new") {
 if (storedId) {
 router.replace(`/dashboard/app/${storedId}/conversations/new`);
 return;
 }
 try {
 const { items } = await appApi.list({ pageSize: 1 });
 const firstId = items?.[0]?.id;
 if (firstId) {
 writeStoredWorkspaceId(firstId);
 router.replace(`/dashboard/app/${firstId}/conversations/new`);
 return;
 }
 } catch (error) {
 console.error("Failed to resolve workspace for new conversation:", error);
 }
 router.replace("/dashboard/apps");
 return;
 }

 try {
 const conv = await conversationApi.get(conversationId, { messageLimit: 1 });
 if (cancelled) return;
 const wsId = resolveConversationWorkspaceId(conv);
 if (wsId) {
 writeStoredWorkspaceId(wsId);
 router.replace(`/dashboard/app/${wsId}/conversations/${conversationId}`);
 return;
 }
 setRedirectError("ConversationUnboundWorkspace, NoneNavigate");
 } catch (error) {
 if (cancelled) return;
 console.error("Failed to resolve app for conversation:", error);
 setRedirectError("LoadConversationFailed, Please try again laterRetry");
 }
 };

 redirectToWorkspaceConversation();
 return () => {
 cancelled = true;
 };
 }, [conversationId, router]);

 if (!conversationId) {
 return null;
 }

 if (redirectError) {
 return (
 <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
 <p className="text-sm text-foreground-muted">{redirectError}</p>
 <Button variant="outline" onClick={() => router.replace("/dashboard/apps")}>
 BackAppList
 </Button>
 </div>
 );
 }

 return (
 <div className="min-h-[60vh] flex items-center justify-center text-sm text-foreground-muted">
 currentlyatNavigatetoAppConversation...
 </div>
 );
}
