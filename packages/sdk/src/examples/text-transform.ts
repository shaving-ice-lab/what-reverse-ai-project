/**
 * 示例节点：文本转换
 * 
 * 演示基础节点定义、输入验证、执行逻辑
 */

import { defineNode, input, output } from "../index";

export const textTransformNode = defineNode({
  id: "text-transform",
  name: "文本转换",
  description: "将输入文本转换为大写、小写或首字母大写",
  icon: "transform",
  category: "data",
  version: "1.0.0",
  author: "AgentFlow",
  tags: ["文本", "转换", "字符串"],

  inputs: {
    text: input.string("输入文本")
      .required()
      .placeholder("请输入要转换的文本")
      .description("需要进行转换的原始文本")
      .build(),
    
    mode: input.select("转换模式", [
      { label: "大写", value: "upper", description: "转换为全大写" },
      { label: "小写", value: "lower", description: "转换为全小写" },
      { label: "首字母大写", value: "capitalize", description: "每个单词首字母大写" },
      { label: "反转", value: "reverse", description: "反转文本顺序" },
    ])
      .default("upper")
      .description("选择文本转换的方式")
      .build(),
    
    trim: input.boolean("去除空白")
      .default(true)
      .description("是否去除文本首尾的空白字符")
      .build(),
  },

  outputs: {
    result: output.string("转换结果")
      .description("转换后的文本")
      .build(),
    
    length: output.number("文本长度")
      .description("转换后文本的字符数")
      .build(),
  },

  async execute(ctx) {
    const { text, mode, trim } = ctx.inputs;
    
    ctx.log.info("开始文本转换", { mode, textLength: text.length });
    ctx.reportProgress(10, "处理输入...");

    // 预处理
    let processedText = trim ? text.trim() : text;
    ctx.reportProgress(30, "转换中...");

    // 转换
    let result: string;
    switch (mode) {
      case "upper":
        result = processedText.toUpperCase();
        break;
      case "lower":
        result = processedText.toLowerCase();
        break;
      case "capitalize":
        result = processedText
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
        break;
      case "reverse":
        result = processedText.split("").reverse().join("");
        break;
      default:
        result = processedText;
    }

    ctx.reportProgress(100, "完成");
    ctx.log.info("转换完成", { resultLength: result.length });

    return {
      result,
      length: result.length,
    };
  },
});
