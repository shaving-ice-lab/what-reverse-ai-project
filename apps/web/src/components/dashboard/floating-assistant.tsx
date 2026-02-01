"use client";

/**
 * 浮动 AI 助手组件
 * 在任何页面提供即时帮助和快捷操作
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

// 消息类型
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// 快捷问题
const quickQuestions = [
  { icon: Zap, label: "如何创建工作流？", question: "如何创建一个新的工作流？" },
  { icon: Bot, label: "Agent 是什么？", question: "Agent 是什么，如何使用？" },
  { icon: FileText, label: "如何上传文件？", question: "如何上传文件到知识库？" },
  { icon: HelpCircle, label: "API 配置", question: "如何配置 API 密钥？" },
];

// 模拟 AI 响应
const getAssistantResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("工作流") || lowerQuestion.includes("workflow")) {
    return `创建工作流非常简单！

1. 点击左侧导航栏的 **工作流** 图标
2. 点击右上角的 **创建工作流** 按钮
3. 在编辑器中拖拽节点来构建流程
4. 配置每个节点的参数
5. 点击 **保存** 完成创建

您也可以使用模板快速开始，访问 [模板库](/template-gallery) 选择合适的模板。

需要我帮您创建一个工作流吗？`;
  }

  if (lowerQuestion.includes("agent") || lowerQuestion.includes("助手")) {
    return `**Agent** 是您的智能 AI 助手！

Agent 可以：
- 🤖 自动处理重复性任务
- 💬 智能回复客户咨询
- 📊 分析数据并生成报告
- ✍️ 协助内容创作

**创建 Agent：**
1. 进入 [我的 Agent](/my-agents)
2. 点击 **创建 Agent**
3. 选择模型和配置能力
4. 设置触发条件

每个 Agent 都可以独立运行，帮您节省大量时间！`;
  }

  if (lowerQuestion.includes("文件") || lowerQuestion.includes("上传") || lowerQuestion.includes("知识库")) {
    return `上传文件到知识库可以让 AI 基于您的数据回答问题。

**支持的文件格式：**
- 📄 文档：PDF、Word、Markdown、TXT
- 📊 表格：Excel、CSV
- 🖼️ 图片：PNG、JPG、WEBP
- 💻 代码：各种编程语言文件

**上传步骤：**
1. 进入 [文件库](/files)
2. 点击 **上传文件** 或拖拽文件
3. 选择要添加到的知识库
4. 等待索引完成

索引完成后，AI 就可以基于这些文档回答问题了！`;
  }

  if (lowerQuestion.includes("api") || lowerQuestion.includes("密钥") || lowerQuestion.includes("配置")) {
    return `配置 API 密钥可以使用您自己的 AI 模型额度。

**配置步骤：**
1. 进入 [设置 → API 密钥](/settings/api-keys)
2. 点击 **添加密钥**
3. 选择服务提供商（OpenAI、Claude 等）
4. 输入您的 API Key
5. 保存并测试连接

**支持的服务：**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- 本地模型 (Ollama)

您的密钥会安全加密存储，仅用于调用对应服务。`;
  }

  return `感谢您的提问！

我可以帮您：
- 🚀 创建和管理工作流
- 🤖 配置 AI Agent
- 📁 管理文件和知识库
- ⚙️ 设置和配置账户
- 📊 数据分析和报告

您可以直接描述您想做的事情，或者点击上方的快捷问题获取帮助。

如需更多帮助，请访问 [帮助中心](/help) 或 [联系客服](/feedback)。`;
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

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // 发送消息
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

    // 模拟 AI 响应
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

  // 处理快捷问题
  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => handleSend(), 100);
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    setShowQuickQuestions(true);
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理链接点击
  const handleLinkClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  // 简单的 Markdown 渲染
  const renderContent = (content: string) => {
    return content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline cursor-pointer" data-href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')
      .replace(/^- /gm, '• ');
  };

  // 在 dashboard 相关页面不显示
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null;
  }

  return (
    <>
      {/* 浮动按钮 */}
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

      {/* 对话窗口 */}
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
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">AI 助手</h3>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">随时为您提供帮助</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="清空对话"
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

          {/* 内容区域 */}
          {!isMinimized && (
            <>
              {/* 消息列表 */}
              <div className="flex-1 h-[380px] overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">有什么可以帮您的？</h4>
                    <p className="text-xs text-muted-foreground mb-6">选择一个问题或直接输入</p>

                    {/* 快捷问题 */}
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

              {/* 输入区域 */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入您的问题..."
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
