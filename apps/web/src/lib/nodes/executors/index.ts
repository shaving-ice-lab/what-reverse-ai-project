/**
 * NodeExecuteExport
 */

export * from "./llm";
export * from "./http";
export * from "./logic";
export * from "./data";
export * from "./text";
export * from "./io";

// ExecuteSign Up
import { llmChatExecutor } from "./llm";
import { httpExecutor } from "./http";
import { conditionExecutor, loopExecutor } from "./logic";
import { variableExecutor, transformExecutor, mergeExecutor, databaseExecutor } from "./data";
import { templateExecutor, regexExecutor, splitJoinExecutor } from "./text";
import { inputExecutor, outputExecutor } from "./io";
import type { NodeExecutor } from "../types";

/**
 * AllAvailable'sNodeExecute
 */
export const nodeExecutors: Record<string, NodeExecutor> = {
 // AI Node
 llm: llmChatExecutor,
 "llm-chat": llmChatExecutor,
 
 // IntegrationNode
 http: httpExecutor,
 "http-request": httpExecutor,
 
 // LogicNode
 condition: conditionExecutor,
 "if-else": conditionExecutor,
 loop: loopExecutor,
 "for-each": loopExecutor,
 
 // DataNode
 variable: variableExecutor,
 "set-variable": variableExecutor,
 transform: transformExecutor,
 "data-transform": transformExecutor,
 merge: mergeExecutor,
 "data-merge": mergeExecutor,
 db_select: databaseExecutor,
 db_insert: databaseExecutor,
 db_update: databaseExecutor,
 db_delete: databaseExecutor,
 db_migrate: databaseExecutor,
 
 // InputOutputNode
 input: inputExecutor,
 output: outputExecutor,
 
 // TextNode
 template: templateExecutor,
 "text-template": templateExecutor,
 regex: regexExecutor,
 "regex-extract": regexExecutor,
 "split-join": splitJoinExecutor,
 "text-split": splitJoinExecutor,
 "text-join": splitJoinExecutor,
};

/**
 * FetchNodeExecute
 */
export function getNodeExecutor(nodeType: string): NodeExecutor | null {
 return nodeExecutors[nodeType] || null;
}

/**
 * Sign UpCustomNodeExecute
 */
export function registerNodeExecutor(type: string, executor: NodeExecutor): void {
 nodeExecutors[type] = executor;
}
