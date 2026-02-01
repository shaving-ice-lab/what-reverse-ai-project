"use client";

/**
 * ComparisonSlider - Before/After 对比滑块组件
 * 
 * 用于展示传统方式 vs AgentFlow 的对比效果
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Code, Workflow, Clock, Zap, CheckCircle2, XCircle } from "lucide-react";

interface ComparisonItem {
  title: string;
  points: Array<{
    text: string;
    positive: boolean;
  }>;
  codeExample?: string;
  icon: React.ElementType;
  accent: string;
}

const beforeData: ComparisonItem = {
  title: "传统开发方式",
  icon: Code,
  accent: "border-red-500/50",
  points: [
    { text: "需要编写大量重复代码", positive: false },
    { text: "手动处理错误和重试逻辑", positive: false },
    { text: "难以维护和调试", positive: false },
    { text: "开发周期长，迭代慢", positive: false },
    { text: "缺乏可视化监控", positive: false },
  ],
  codeExample: `// 传统方式：需要大量样板代码
async function processOrder(order) {
  try {
    // 验证订单
    const validated = await validateOrder(order);
    if (!validated) throw new Error('Invalid');
    
    // 处理支付
    const payment = await processPayment(order);
    if (!payment.success) {
      // 手动重试逻辑
      for (let i = 0; i < 3; i++) {
        await delay(1000 * i);
        payment = await processPayment(order);
        if (payment.success) break;
      }
    }
    
    // 发送通知
    await sendEmail(order.email);
    await sendSMS(order.phone);
    
    // 更新库存...
    // 更新数据库...
    // 记录日志...
  } catch (error) {
    // 错误处理...
  }
}`,
};

const afterData: ComparisonItem = {
  title: "AgentFlow 方式",
  icon: Workflow,
  accent: "border-primary/50",
  points: [
    { text: "可视化拖拽构建工作流", positive: true },
    { text: "内置重试、超时、错误处理", positive: true },
    { text: "实时监控和调试工具", positive: true },
    { text: "分钟级部署，快速迭代", positive: true },
    { text: "完整的执行日志和分析", positive: true },
  ],
  codeExample: `// AgentFlow 方式：简洁声明式配置
const workflow = new AgentFlow({
  name: "订单处理流程",
  nodes: [
    { type: "trigger", event: "order.created" },
    { type: "validate", schema: orderSchema },
    { type: "payment", retry: 3, backoff: "exponential" },
    { type: "parallel", nodes: [
      { type: "email", template: "order_confirm" },
      { type: "sms", template: "order_notify" }
    ]},
    { type: "inventory", action: "decrease" },
    { type: "database", action: "update" }
  ]
});

// 自动处理错误、重试、监控、日志`,
};

export function ComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  return (
    <div className="w-full">
      {/* 标题区域 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-medium">传统开发</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5" />
          <span className="font-medium">AgentFlow</span>
        </div>
      </div>

      {/* 对比滑块容器 */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-card cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Before 内容 (传统方式) */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent">
          <div className="absolute inset-0 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <beforeData.icon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-400">{beforeData.title}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* 问题列表 */}
              <div className="space-y-2">
                {beforeData.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{point.text}</span>
                  </div>
                ))}
              </div>
              
              {/* 代码示例 */}
              <div className="hidden md:block">
                <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
                  <pre className="text-red-300/70 whitespace-pre-wrap">{beforeData.codeExample}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* After 内容 (AgentFlow) - 覆盖在上面，通过 clip-path 控制显示区域 */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
          style={{
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
          }}
        >
          <div className="absolute inset-0 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <afterData.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary">{afterData.title}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* 优势列表 */}
              <div className="space-y-2">
                {afterData.points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{point.text}</span>
                  </div>
                ))}
              </div>
              
              {/* 代码示例 */}
              <div className="hidden md:block">
                <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
                  <pre className="text-primary/80 whitespace-pre-wrap">{afterData.codeExample}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 滑块手柄 */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* 手柄圆形按钮 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-1 h-4 bg-gray-400 rounded-full" />
              <div className="w-1 h-4 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        ← 拖动滑块对比效果 →
      </p>
    </div>
  );
}

export default ComparisonSlider;
