"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Terminal,
  Rocket,
  Settings,
  Play,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 快速入门步骤
const quickStartSteps = [
  {
    id: 1,
    title: "安装 CLI",
    description: "使用 npm 或 yarn 安装 AgentFlow CLI 工具",
    code: "npm install -g @agentflow/cli",
    altCode: "yarn global add @agentflow/cli",
    tip: "推荐使用 Node.js 18+ 版本",
  },
  {
    id: 2,
    title: "登录账户",
    description: "使用 CLI 登录你的 AgentFlow 账户",
    code: "agentflow login",
    tip: "首次使用会自动打开浏览器进行认证",
  },
  {
    id: 3,
    title: "创建项目",
    description: "初始化一个新的工作流项目",
    code: "agentflow init my-workflow",
    tip: "这会创建一个包含基础配置的项目目录",
  },
  {
    id: 4,
    title: "编辑工作流",
    description: "打开编辑器设计你的工作流",
    code: "cd my-workflow && agentflow dev",
    tip: "这会启动本地开发服务器和可视化编辑器",
  },
  {
    id: 5,
    title: "部署上线",
    description: "将工作流部署到云端",
    code: "agentflow deploy",
    tip: "部署后会得到一个可调用的 API 端点",
  },
];

export interface QuickStartWizardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示步骤导航 */
  showNavigation?: boolean;
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 完成后的回调 */
  onComplete?: () => void;
}

export function QuickStartWizard({
  showNavigation = true,
  compact = false,
  onComplete,
  className,
  ...props
}: QuickStartWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < quickStartSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = quickStartSteps.find((s) => s.id === currentStep);

  return (
    <div className={cn("", className)} {...props}>
      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            步骤 {currentStep} / {quickStartSteps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round((completedSteps.length / quickStartSteps.length) * 100)}% 完成
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/90 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / quickStartSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {quickStartSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0",
                  isCurrent && "bg-primary/10 text-primary",
                  !isCurrent && isCompleted && "text-primary",
                  !isCurrent && !isCompleted && "text-muted-foreground hover:text-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className={cn(
                    "w-5 h-5",
                    isCurrent && "fill-primary/20"
                  )} />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  compact && "hidden sm:inline"
                )}>
                  {step.title}
                </span>
              </button>
              
              {index < quickStartSteps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 rounded",
                  index < currentStep - 1 ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 当前步骤内容 */}
      {currentStepData && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">
                {currentStepData.title}
              </h3>
              <p className="text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* 代码块 */}
          <div className="bg-background rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
              <span className="text-xs text-muted-foreground">Terminal</span>
              <button
                onClick={() => handleCopyCode(currentStepData.code)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {copiedCode === currentStepData.code ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="p-4">
              <code className="text-sm font-mono text-emerald-400">
                $ {currentStepData.code}
              </code>
            </div>
          </div>

          {/* 替代命令 */}
          {currentStepData.altCode && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">或者使用 yarn:</span>
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {currentStepData.altCode}
              </code>
            </div>
          )}

          {/* 提示 */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{currentStepData.tip}</p>
          </div>
        </div>
      )}

      {/* 导航按钮 */}
      {showNavigation && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>

          <Button
            onClick={handleStepComplete}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {currentStep === quickStartSteps.length ? (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                完成
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// 代码沙盒组件
export interface CodeSandboxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 初始代码 */
  initialCode?: string;
  /** 语言 */
  language?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 运行回调 */
  onRun?: (code: string) => void;
}

export function CodeSandbox({
  initialCode = `// 尝试编辑代码并运行
const workflow = new AgentFlow();

workflow.addNode({
  type: 'llm',
  model: 'gpt-4',
  prompt: '你好，世界！'
});

const result = await workflow.run();
console.log(result);`,
  language = "typescript",
  readOnly = false,
  onRun,
  className,
  ...props
}: CodeSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    
    // 模拟运行
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setOutput(`> 执行成功
{
  "success": true,
  "output": "你好，世界！这是 AI 的回复。",
  "tokens": 28,
  "duration": "0.8s"
}`);
    setIsRunning(false);
    onRun?.(code);
  };

  return (
    <div className={cn("rounded-2xl overflow-hidden border border-border", className)} {...props}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">代码沙盒</span>
        </div>
        <Button
          size="sm"
          onClick={handleRun}
          disabled={isRunning}
          className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg"
        >
          {isRunning ? (
            <>运行中...</>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              运行
            </>
          )}
        </Button>
      </div>
      
      <div className="grid lg:grid-cols-2 divide-x divide-border">
        {/* 代码编辑区 */}
        <div className="bg-background min-h-[300px]">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={readOnly}
            className={cn(
              "w-full h-full min-h-[300px] p-4",
              "bg-transparent text-foreground font-mono text-sm",
              "focus:outline-none resize-none",
              readOnly && "cursor-not-allowed opacity-70"
            )}
            spellCheck={false}
          />
        </div>
        
        {/* 输出区 */}
        <div className="bg-background min-h-[300px]">
          <div className="px-4 py-2 border-b border-border/50 bg-card/50">
            <span className="text-xs text-muted-foreground">输出</span>
          </div>
          <pre className="p-4 text-sm font-mono text-emerald-400/90 whitespace-pre-wrap">
            {output || "// 点击运行按钮执行代码"}
          </pre>
        </div>
      </div>
    </div>
  );
}
