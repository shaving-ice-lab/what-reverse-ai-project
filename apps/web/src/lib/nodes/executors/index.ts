/**
 * 节点执行器导出
 */

export * from "./llm";
export * from "./http";
export * from "./logic";
export * from "./data";
export * from "./text";

// 执行器注册表
import { llmChatExecutor } from "./llm";
import { httpExecutor } from "./http";
import { conditionExecutor, loopExecutor } from "./logic";
import { variableExecutor, transformExecutor, mergeExecutor } from "./data";
import { templateExecutor, regexExecutor, splitJoinExecutor } from "./text";
import type { NodeExecutor } from "../types";

/**
 * 所有可用的节点执行器
 */
export const nodeExecutors: Record<string, NodeExecutor> = {
  // AI 节点
  llm: llmChatExecutor,
  "llm-chat": llmChatExecutor,
  
  // 集成节点
  http: httpExecutor,
  "http-request": httpExecutor,
  
  // 逻辑节点
  condition: conditionExecutor,
  "if-else": conditionExecutor,
  loop: loopExecutor,
  "for-each": loopExecutor,
  
  // 数据节点
  variable: variableExecutor,
  "set-variable": variableExecutor,
  transform: transformExecutor,
  "data-transform": transformExecutor,
  merge: mergeExecutor,
  "data-merge": mergeExecutor,
  
  // 文本节点
  template: templateExecutor,
  "text-template": templateExecutor,
  regex: regexExecutor,
  "regex-extract": regexExecutor,
  "split-join": splitJoinExecutor,
  "text-split": splitJoinExecutor,
  "text-join": splitJoinExecutor,
};

/**
 * 获取节点执行器
 */
export function getNodeExecutor(nodeType: string): NodeExecutor | null {
  return nodeExecutors[nodeType] || null;
}

/**
 * 注册自定义节点执行器
 */
export function registerNodeExecutor(type: string, executor: NodeExecutor): void {
  nodeExecutors[type] = executor;
}
