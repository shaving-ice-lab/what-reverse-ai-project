/**
 * definePlugin - 插件定义辅助函数
 */

import type { PluginContext, PluginPermission } from "./types";
import type { NodeDefinition } from "../types";

export interface PluginDefinition<
  TNodes extends Array<NodeDefinition<any, any>> = Array<NodeDefinition<any, any>>
> {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tags?: string[];
  permissions?: PluginPermission[];
  nodes?: TNodes;
  onLoad?: (ctx: PluginContext) => void | Promise<void>;
  onUnload?: (ctx: PluginContext) => void | Promise<void>;
}

/**
 * 定义插件（用于类型推断与结构约束）
 */
export function definePlugin<
  TNodes extends Array<NodeDefinition<any, any>> = Array<NodeDefinition<any, any>>
>(
  config: PluginDefinition<TNodes>
): PluginDefinition<TNodes> {
  return config;
}
