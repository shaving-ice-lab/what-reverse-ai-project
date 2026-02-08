"use client";

/**
 * Floating AI Assistant Component
 * Provides real-time help and quick actions on any page
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
 MessageSquare,
 X,
 Send,
 Sparkles,
 Minimize2,
 Maximize2,
 ArrowUp,
 Loader2,
 Zap,
 FileText,
 Bot,
 History,
 Trash2,
 Settings,
 ChevronDown,
 ChevronUp,
 HelpCircle,
 Lightbulb,
 ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Message type
interface ChatMessage {
 id: string;
 role: "user" | "assistant";
 content: string;
 timestamp: Date;
}

// Quick questions
const quickQuestions = [
  { icon: Zap, label: "How to create a workflow?", question: "How do I create a new workflow?" },
  { icon: Bot, label: "What is an Agent?", question: "What is an Agent and how do I use it?" },
  { icon: FileText, label: "How to upload files?", question: "How do I upload files to the Knowledge Base?" },
  { icon: HelpCircle, label: "API Configuration", question: "How do I configure an API key?" },
];

// Mock AI Response
const getAssistantResponse = (question: string): string => {
 const lowerQuestion = question.toLowerCase();

 if (lowerQuestion.includes("Workflow") || lowerQuestion.includes("workflow")) {
    return `Creating a workflow is easy!

1. Click the **Workflow** icon in the left sidebar
2. Click the **Create Workflow** button on the right
3. Drag and drop nodes in the editor to build your flow
4. Configure each node's parameters
5. Click **Save** to finish

You can also use templates to get started quickly. Visit the [Template Gallery](/template-gallery) to browse available templates.

Would you like me to help you create a workflow?`;
 }

 if (lowerQuestion.includes("agent") || lowerQuestion.includes("Assistant")) {
    return `**Agent** is your smart AI assistant!

Agents can help you with: 
- 🤖 Automate repetitive tasks
- 💬 Intelligently reply to customer inquiries
- 📊 Analyze data and generate reports
- ✍️ Create content

**Create an Agent:**
1. Go to [My Agents](/my-agents)
2. Click **Create Agent**
3. Select a model and configure capabilities
4. Set trigger conditions

Each agent can run independently, saving you a lot of time!`;
 }

 if (lowerQuestion.includes("File") || lowerQuestion.includes("Upload") || lowerQuestion.includes("Knowledge Base")) {
    return `Upload files to the Knowledge Base so AI can answer questions based on your data.

**Supported File Formats:**
- 📄 Documents: PDF, Word, Markdown, TXT
- 📊 Spreadsheets: Excel, CSV
- 🖼️ Images: PNG, JPG, WEBP
- 💻 Code: Any programming language file

**Upload Steps:**
1. Go to [Files](/files)
2. Click **Upload File** or drag and drop files
3. Select the Knowledge Base to add them to
4. Wait for indexing to complete

Once indexing is done, AI can answer questions based on these documents!`;
 }

 if (lowerQuestion.includes("api") || lowerQuestion.includes("Key") || lowerQuestion.includes("Config")) {
    return `Configure an API key to use your own AI model quota.

**Configuration Steps:**
1. Go to [Settings → API Keys](/settings/api-keys)
2. Click **Add Key**
3. Select a service provider (OpenAI, Claude, etc.)
4. Enter your API key
5. Save and test the connection

**Supported Services:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- Local Models (Ollama)

Your keys are securely encrypted and only used to call the corresponding services.`;
 }

  return `Thank you for asking!

I can help you with: 
- 🚀 Creating and managing workflows
- 🤖 Configuring AI Agents
- 📁 Managing files and Knowledge Bases
- ⚙️ Account settings and configuration
- 📊 Data analytics and reports

You can describe what you'd like to do, or click one of the quick questions above to get help.

If you need more help, please visit the [Help Center](/help) or [Contact Support](/feedback).`;
};

export function FloatingAssistant() {
 const [isOpen, setIsOpen] = useState(false);
 const [isMinimized, setIsMinimized] = useState(false);
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [inputValue, setInputValue] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [showQuickQuestions, setShowQuickQuestions] = useState(true);
 const inputRef = useRef<HTMLInputElement>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const pathname = usePathname();
 const router = useRouter();

 // ScrolltoFooter
 const scrollToBottom = useCallback(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, []);

 useEffect(() => {
 if (messages.length > 0) {
 scrollToBottom();
 }
 }, [messages, scrollToBottom]);

 // OpentimeFocusInput
 useEffect(() => {
 if (isOpen && !isMinimized) {
 setTimeout(() => inputRef.current?.focus(), 100);
 }
 }, [isOpen, isMinimized]);

 // SendMessage
 const handleSend = async () => {
 if (!inputValue.trim() || isLoading) return;

 const userMessage: ChatMessage = {
 id: Date.now().toString(),
 role: "user",
 content: inputValue.trim(),
 timestamp: new Date(),
 };

 setMessages((prev) => [...prev, userMessage]);
 setInputValue("");
 setIsLoading(true);
 setShowQuickQuestions(false);

 // Mock AI Response
 setTimeout(() => {
 const assistantMessage: ChatMessage = {
 id: (Date.now() + 1).toString(),
 role: "assistant",
 content: getAssistantResponse(userMessage.content),
 timestamp: new Date(),
 };
 setMessages((prev) => [...prev, assistantMessage]);
 setIsLoading(false);
 }, 800);
 };

 // ProcessShortcutIssue
 const handleQuickQuestion = (question: string) => {
 setInputValue(question);
 setTimeout(() => handleSend(), 100);
 };

 // ClearConversation
 const handleClear = () => {
 setMessages([]);
 setShowQuickQuestions(true);
 };

 // keyEvent
 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 };

 // ProcessLinkClick
 const handleLinkClick = (href: string) => {
 router.push(href);
 setIsOpen(false);
 };

 // Simple's Markdown Render
 const renderContent = (content: string) => {
 return content
 .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
 .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline cursor-pointer" data-href="$2">$1</a>')
 .replace(/\n\n/g, '</p><p>')
 .replace(/\n/g, '<br />')
 .replace(/^- /gm, '• ');
 };

 // at dashboard RelatedPagenotDisplay
 if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
 return null;
 }

 return (
 <>
 {/* FloatingButton */}
 {!isOpen && (
 <button
 onClick={() => setIsOpen(true)}
 className={cn(
 "fixed bottom-6 right-6 z-50",
 "w-14 h-14 rounded-2xl",
 "bg-gradient-to-br from-primary to-purple-600",
 "shadow-lg shadow-primary/30",
 "flex items-center justify-center",
 "hover:scale-105 active:scale-95",
 "transition-all duration-200",
 "group"
 )}
 >
 <Sparkles className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
 <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
 </button>
 )}

 {/* ConversationWindow */}
 {isOpen && (
 <div
 className={cn(
 "fixed z-50 bg-card rounded-2xl border border-border shadow-2xl shadow-black/50",
 "transition-all duration-300 ease-out",
 isMinimized
 ? "bottom-6 right-6 w-72 h-14"
 : "bottom-6 right-6 w-[380px] h-[520px]"
 )}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-border">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-white" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">AI Assistant</h3>
 {!isMinimized && (
 <p className="text-xs text-muted-foreground">Here to help anytime</p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-1">
 {!isMinimized && messages.length > 0 && (
 <button
 onClick={handleClear}
 className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
 title="Clear conversation"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 <button
 onClick={() => setIsMinimized(!isMinimized)}
 className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
 >
 {isMinimized ? (
 <Maximize2 className="w-4 h-4" />
 ) : (
 <Minimize2 className="w-4 h-4" />
 )}
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* ContentRegion */}
 {!isMinimized && (
 <>
 {/* MessageList */}
 <div className="flex-1 h-[380px] overflow-y-auto p-4 space-y-4">
 {messages.length === 0 ? (
 <div className="text-center py-8">
 <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
 <Lightbulb className="w-6 h-6 text-muted-foreground" />
 </div>
 <h4 className="text-sm font-medium text-foreground mb-1">How can I help you?</h4>
 <p className="text-xs text-muted-foreground mb-6">Select a question or type your own</p>

 {/* ShortcutIssue */}
 {showQuickQuestions && (
 <div className="space-y-2">
 {quickQuestions.map((q, index) => (
 <button
 key={index}
 onClick={() => handleQuickQuestion(q.question)}
 className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-border transition-all text-left group"
 >
 <q.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
 <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">
 {q.label}
 </span>
 </button>
 ))}
 </div>
 )}
 </div>
 ) : (
 <>
 {messages.map((message) => (
 <div
 key={message.id}
 className={cn(
 "flex gap-3",
 message.role === "user" && "flex-row-reverse"
 )}
 >
 {message.role === "assistant" ? (
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
 <Sparkles className="w-3.5 h-3.5 text-white" />
 </div>
 ) : (
 <Avatar className="w-7 h-7 shrink-0">
 <AvatarFallback className="bg-muted text-foreground text-xs">
 U
 </AvatarFallback>
 </Avatar>
 )}
 <div
 className={cn(
 "max-w-[85%] px-3 py-2 rounded-xl text-sm",
 message.role === "user"
 ? "bg-primary text-white"
 : "bg-muted/50 text-foreground/80"
 )}
 >
 {message.role === "assistant" ? (
 <div
 className="prose prose-sm prose-invert max-w-none"
 dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
 onClick={(e) => {
 const target = e.target as HTMLElement;
 const href = target.getAttribute("data-href");
 if (href) {
 e.preventDefault();
 handleLinkClick(href);
 }
 }}
 />
 ) : (
 message.content
 )}
 </div>
 </div>
 ))}
 {isLoading && (
 <div className="flex gap-3">
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
 <Sparkles className="w-3.5 h-3.5 text-white" />
 </div>
 <div className="px-3 py-2 rounded-xl bg-muted/50">
 <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </>
 )}
 </div>

 {/* InputRegion */}
 <div className="p-3 border-t border-border">
 <div className="flex items-center gap-2">
 <input
 ref={inputRef}
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Type your question..."
 className="flex-1 h-10 px-4 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
 disabled={isLoading}
 />
 <button
 onClick={handleSend}
 disabled={!inputValue.trim() || isLoading}
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
 inputValue.trim() && !isLoading
 ? "bg-primary text-white hover:bg-primary/90"
 : "bg-muted/50 text-muted-foreground"
 )}
 >
 <ArrowUp className="w-5 h-5" />
 </button>
 </div>
 </div>
 </>
 )}
 </div>
 )}
 </>
 );
}
