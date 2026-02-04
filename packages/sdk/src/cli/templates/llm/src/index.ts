/**
 * {{projectName}} - LLM 调用节点
 *
 * 提供灵活的大语言模型调用能力，支持多种模型和自定义提示词。
 */

import { defineNode, input, output } from "@agentflow/sdk";

export default defineNode({
  id: "{{nodeId}}",
  name: "{{nodeName}}",
  description: "调用大语言模型生成内容",
  icon: "brain",
  category: "ai",
  version: "1.0.0",
  author: "{{author}}",
  tags: ["llm", "ai", "gpt", "claude"],

  inputs: {
    model: input
      .select("模型", [
        { value: "gpt-4", label: "GPT-4" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        { value: "claude-3-opus", label: "Claude 3 Opus" },
        { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
        { value: "claude-3-haiku", label: "Claude 3 Haiku" },
      ])
      .default("gpt-4-turbo")
      .description("选择要使用的 LLM 模型")
      .build(),

    systemPrompt: input
      .textarea("系统提示词")
      .default("你是一个有帮助的 AI 助手。")
      .placeholder("设定 AI 的角色和行为...")
      .description("定义 AI 助手的角色和行为")
      .build(),

    userPrompt: input
      .textarea("用户提示词")
      .required()
      .placeholder("输入你的问题或指令...")
      .description("发送给 AI 的具体问题或指令")
      .build(),

    temperature: input
      .number("温度")
      .default(0.7)
      .min(0)
      .max(2)
      .description("控制输出的随机性，0 更确定，2 更随机")
      .build(),

    maxTokens: input
      .number("最大 Token 数")
      .default(2048)
      .min(1)
      .max(128000)
      .description("生成内容的最大长度")
      .build(),

    topP: input
      .number("Top P")
      .default(1)
      .min(0)
      .max(1)
      .description("核采样参数")
      .build(),

    stream: input
      .boolean("流式输出")
      .default(true)
      .description("是否启用流式输出")
      .build(),
  },

  outputs: {
    content: output
      .string("生成内容")
      .description("AI 生成的文本内容")
      .build(),

    model: output
      .string("使用模型")
      .description("实际使用的模型名称")
      .build(),

    promptTokens: output
      .number("提示词 Token")
      .description("输入消耗的 Token 数")
      .build(),

    completionTokens: output
      .number("生成 Token")
      .description("生成消耗的 Token 数")
      .build(),

    totalTokens: output
      .number("总 Token")
      .description("总共消耗的 Token 数")
      .build(),

    finishReason: output
      .string("结束原因")
      .description("生成结束的原因")
      .build(),
  },

  async execute(ctx) {
    const {
      model,
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens,
      topP,
      stream,
    } = ctx.inputs;

    ctx.log.info("开始 LLM 调用", { model, promptLength: userPrompt.length });
    ctx.reportProgress(10, "准备请求...");

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    ctx.reportProgress(30, "调用模型中...");

    const response = await ctx.llm.chat({
      model,
      messages,
      temperature,
      maxTokens,
      topP,
      stream,
      onStream: stream
        ? (chunk) => {
            ctx.reportProgress(50, "生成中...");
            ctx.streamOutput("content", chunk);
          }
        : undefined,
    });

    ctx.reportProgress(100, "完成");
    ctx.log.info("LLM 调用完成", {
      totalTokens: response.usage?.totalTokens,
      finishReason: response.finishReason,
    });

    return {
      content: response.content,
      model: response.model || model,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
      finishReason: response.finishReason || "stop",
    };
  },
});
