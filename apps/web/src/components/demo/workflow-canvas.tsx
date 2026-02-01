"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Bot,
  Database,
  Send,
  GitBranch,
  Webhook,
  Zap,
  Mail,
  FileText,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 节点类型配置
const nodeTypes = {
  trigger: { 
    color: "#10B981", 
    bgColor: "bg-emerald-500/10", 
    borderColor: "border-emerald-500/30",
    label: "触发器" 
  },
  llm: { 
    color: "#8B5CF6", 
    bgColor: "bg-violet-500/10", 
    borderColor: "border-violet-500/30",
    label: "AI 模型" 
  },
  condition: { 
    color: "#F59E0B", 
    bgColor: "bg-amber-500/10", 
    borderColor: "border-amber-500/30",
    label: "条件" 
  },
  action: { 
    color: "#3B82F6", 
    bgColor: "bg-blue-500/10", 
    borderColor: "border-blue-500/30",
    label: "动作" 
  },
  data: { 
    color: "#06B6D4", 
    bgColor: "bg-cyan-500/10", 
    borderColor: "border-cyan-500/30",
    label: "数据" 
  },
};

// 预设场景
const scenarios = [
  {
    id: "customer-service",
    name: "智能客服",
    icon: Bot,
    nodes: [
      { id: 1, type: "trigger", label: "消息接收", icon: Webhook, x: 50, y: 140 },
      { id: 2, type: "llm", label: "GPT-4 理解", icon: Bot, x: 200, y: 100 },
      { id: 3, type: "condition", label: "意图判断", icon: GitBranch, x: 350, y: 140 },
      { id: 4, type: "action", label: "自动回复", icon: Send, x: 500, y: 80 },
      { id: 5, type: "data", label: "记录日志", icon: Database, x: 500, y: 200 },
    ],
    connections: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
    ],
  },
  {
    id: "data-pipeline",
    name: "数据处理",
    icon: Database,
    nodes: [
      { id: 1, type: "trigger", label: "定时触发", icon: Clock, x: 50, y: 140 },
      { id: 2, type: "data", label: "读取数据", icon: Database, x: 180, y: 140 },
      { id: 3, type: "llm", label: "数据清洗", icon: Sparkles, x: 310, y: 140 },
      { id: 4, type: "action", label: "格式转换", icon: FileText, x: 440, y: 140 },
      { id: 5, type: "data", label: "存储结果", icon: Database, x: 570, y: 140 },
    ],
    connections: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ],
  },
  {
    id: "marketing-auto",
    name: "营销自动化",
    icon: Mail,
    nodes: [
      { id: 1, type: "trigger", label: "新用户注册", icon: Zap, x: 50, y: 140 },
      { id: 2, type: "llm", label: "个性化内容", icon: Bot, x: 200, y: 100 },
      { id: 3, type: "condition", label: "用户分群", icon: GitBranch, x: 350, y: 140 },
      { id: 4, type: "action", label: "发送邮件", icon: Mail, x: 500, y: 80 },
      { id: 5, type: "action", label: "推送通知", icon: Send, x: 500, y: 200 },
    ],
    connections: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
    ],
  },
];

export interface WorkflowCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否自动播放演示 */
  autoPlay?: boolean;
  /** 演示速度（毫秒） */
  speed?: number;
  /** 初始场景 */
  initialScenario?: string;
  /** 是否显示控制栏 */
  showControls?: boolean;
  /** 是否显示场景切换 */
  showScenarioSwitcher?: boolean;
}

export function WorkflowCanvas({
  autoPlay = true,
  speed = 1500,
  initialScenario = "customer-service",
  showControls = true,
  showScenarioSwitcher = true,
  className,
  ...props
}: WorkflowCanvasProps) {
  const [activeScenario, setActiveScenario] = useState(initialScenario);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [activeNodeIndex, setActiveNodeIndex] = useState(-1);
  const [executedNodes, setExecutedNodes] = useState<number[]>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentScenario = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  // 自动执行动画
  useEffect(() => {
    if (!isPlaying) return;

    const nodes = currentScenario.nodes;
    let index = activeNodeIndex;

    const timer = setInterval(() => {
      index++;
      if (index >= nodes.length) {
        // 重置
        setActiveNodeIndex(-1);
        setExecutedNodes([]);
        index = -1;
      } else {
        setActiveNodeIndex(index);
        setExecutedNodes((prev) => [...prev, nodes[index].id]);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, activeNodeIndex, currentScenario.nodes, speed]);

  // 切换场景时重置状态
  useEffect(() => {
    setActiveNodeIndex(-1);
    setExecutedNodes([]);
  }, [activeScenario]);

  const handleReset = () => {
    setActiveNodeIndex(-1);
    setExecutedNodes([]);
  };

  const getNodeStatus = (nodeId: number) => {
    const nodeIndex = currentScenario.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === activeNodeIndex) return "running";
    if (executedNodes.includes(nodeId)) return "completed";
    return "idle";
  };

  // 生成连线路径
  const getConnectionPath = (from: number, to: number) => {
    const fromNode = currentScenario.nodes.find((n) => n.id === from);
    const toNode = currentScenario.nodes.find((n) => n.id === to);
    if (!fromNode || !toNode) return "";

    const startX = fromNode.x + 80; // 节点右边
    const startY = fromNode.y + 25; // 节点中心
    const endX = toNode.x;
    const endY = toNode.y + 25;

    // 使用贝塞尔曲线
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card to-muted/50",
        "border border-border/50",
        "shadow-2xl shadow-black/10",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            {currentScenario.name}工作流.flow
          </span>
        </div>
        
        {/* 场景切换 */}
        {showScenarioSwitcher && (
          <div className="flex items-center gap-1">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  "transition-all duration-200",
                  activeScenario === scenario.id
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <scenario.icon className="w-3.5 h-3.5" />
                {scenario.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative h-[320px] sm:h-[360px]">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connection Lines with Animation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="flowGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="flowGradientIdle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.1" />
            </linearGradient>
            
            {/* 流动粒子 */}
            <circle id="particle" r="3" fill="hsl(var(--primary))">
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </defs>

          {currentScenario.connections.map((conn, i) => {
            const path = getConnectionPath(conn.from, conn.to);
            const fromStatus = getNodeStatus(conn.from);
            const isActive = fromStatus === "completed" || fromStatus === "running";
            
            return (
              <g key={`${conn.from}-${conn.to}`}>
                {/* 基础线 */}
                <path
                  d={path}
                  stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth="2"
                  strokeOpacity={isActive ? 0.6 : 0.2}
                  fill="none"
                  className="transition-all duration-500"
                />
                
                {/* 流动动画 */}
                {isActive && (
                  <circle r="4" fill="hsl(var(--primary))" opacity="0.8">
                    <animateMotion
                      dur="1s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {currentScenario.nodes.map((node, index) => {
          const nodeConfig = nodeTypes[node.type as keyof typeof nodeTypes];
          const status = getNodeStatus(node.id);
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              className={cn(
                "absolute flex items-center gap-2 px-4 py-3 rounded-xl",
                "bg-card border shadow-lg",
                "transition-all duration-300 cursor-pointer",
                nodeConfig.borderColor,
                status === "running" && "scale-105 shadow-xl",
                status === "completed" && "opacity-90",
                hoveredNode === node.id && "scale-105 shadow-xl z-10"
              )}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                borderColor: status === "running" ? nodeConfig.color : undefined,
                boxShadow: status === "running" 
                  ? `0 0 20px ${nodeConfig.color}40, 0 4px 12px rgba(0,0,0,0.1)` 
                  : undefined,
                animationDelay: `${index * 100}ms`,
                animation: 'nodeAppear 500ms ease-out both'
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* 图标 */}
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                nodeConfig.bgColor
              )}>
                <Icon className="w-4 h-4" style={{ color: nodeConfig.color }} />
              </div>

              {/* 标签 */}
              <div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {node.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {nodeConfig.label}
                </span>
              </div>

              {/* 状态指示器 */}
              {status === "running" && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary">
                  <div className="absolute inset-0 rounded-full bg-primary animate-ping" />
                </div>
              )}
              {status === "completed" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* 执行状态徽章 */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {isPlaying && activeNodeIndex >= 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              执行中... {activeNodeIndex + 1}/{currentScenario.nodes.length}
            </div>
          )}
          {!isPlaying && executedNodes.length === currentScenario.nodes.length && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              执行完成
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 rounded-lg"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  播放
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 rounded-lg"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              重置
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              触发器
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              AI 模型
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              条件
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              动作
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
