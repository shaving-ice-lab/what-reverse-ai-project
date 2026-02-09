/**
 * Text Node Executors
 * Template rendering, regex extraction, split, and join
 */

import type {
  NodeContext,
  NodeResult,
  NodeExecutor,
  TemplateConfig,
} from "../types";
import { renderTemplate, createNodeError } from "../utils";

// ==================== Text Template Node ====================

/**
 * Text template node executor
 */
export const templateExecutor: NodeExecutor<TemplateConfig> = {
  type: "template",
  
  async execute(context): Promise<NodeResult> {
    const { nodeConfig, variables, inputs } = context;
    const startTime = Date.now();
    const logs: NodeResult["logs"] = [];
    
    try {
      const allVariables = { ...variables, ...inputs };
      
      // Render template
      const rendered = renderTemplate(nodeConfig.template, allVariables);
 
 logs.push({
 level: "info",
 message: `Template rendered successfully (${rendered.length} chars)`,
 timestamp: new Date().toISOString(),
 });
 
 return {
 success: true,
 outputs: {
 text: rendered,
 output: rendered,
 length: rendered.length,
 },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 logs.push({
 level: "error",
 message: errorMessage,
 timestamp: new Date().toISOString(),
 });
 
 return {
 success: false,
 outputs: {},
 error: createNodeError("TEMPLATE_RENDER_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.template) {
 errors.push("Template content is required");
 }
 
 return {
 valid: errors.length === 0,
 errors,
 };
  },
};

// ==================== Regex Extract Node ====================

interface RegexConfig {
 pattern: string;
 flags?: string;
 extractType: "match" | "matchAll" | "test" | "replace";
 replacement?: string;
 groupIndex?: number;
}

export const regexExecutor: NodeExecutor<RegexConfig> = {
 type: "regex",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 const inputText = String(inputs.text ?? inputs.input ?? variables.input ?? "");
 const pattern = renderTemplate(nodeConfig.pattern, { ...variables, ...inputs });
 const regex = new RegExp(pattern, nodeConfig.flags || "");
 
 let result: unknown;
 
 switch (nodeConfig.extractType) {
 case "match": {
 const match = inputText.match(regex);
 if (match) {
 result = nodeConfig.groupIndex !== undefined ? match[nodeConfig.groupIndex] : match[0];
 } else {
 result = null;
 }
 break;
 }
 
 case "matchAll": {
 const matches = [...inputText.matchAll(new RegExp(pattern, nodeConfig.flags?.includes("g") ? nodeConfig.flags : (nodeConfig.flags || "") + "g"))];
 result = matches.map((m) => (nodeConfig.groupIndex !== undefined ? m[nodeConfig.groupIndex] : m[0]));
 break;
 }
 
 case "test": {
 result = regex.test(inputText);
 break;
 }
 
 case "replace": {
 const replacement = renderTemplate(nodeConfig.replacement || "", { ...variables, ...inputs });
 result = inputText.replace(regex, replacement);
 break;
 }
 
 default:
 result = null;
 }
 
 logs.push({
 level: "info",
 message: `Regex ${nodeConfig.extractType} completed`,
 timestamp: new Date().toISOString(),
 data: { pattern, inputLength: inputText.length },
 });
 
 return {
 success: true,
 outputs: { result, output: result, matched: result !== null },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 return {
 success: false,
 outputs: {},
 error: createNodeError("REGEX_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.pattern) {
 errors.push("Regex pattern is required");
 } else {
 try {
 new RegExp(config.pattern);
 } catch {
 errors.push("Invalid regex pattern");
 }
 }
 
 if (!config.extractType) {
 errors.push("Extract type is required");
 }
 
 if (config.extractType === "replace" && !config.replacement) {
 errors.push("Replacement string is required for replace mode");
 }
 
 return { valid: errors.length === 0, errors };
  },
};

// ==================== Text Split/Join Node ====================

interface SplitJoinConfig {
 mode: "split" | "join";
 delimiter: string;
 limit?: number;
}

export const splitJoinExecutor: NodeExecutor<SplitJoinConfig> = {
 type: "splitJoin",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 const delimiter = renderTemplate(nodeConfig.delimiter, { ...variables, ...inputs });
 let result: unknown;
 
 if (nodeConfig.mode === "split") {
 const inputText = String(inputs.text ?? inputs.input ?? variables.input ?? "");
 result = nodeConfig.limit !== undefined
 ? inputText.split(delimiter, nodeConfig.limit)
 : inputText.split(delimiter);
 
 logs.push({
 level: "info",
 message: `Split text into ${(result as string[]).length} parts`,
 timestamp: new Date().toISOString(),
 });
 } else {
 const inputArray = inputs.items ?? inputs.input ?? variables.input;
 if (!Array.isArray(inputArray)) {
 throw new Error("Input must be an array for join mode");
 }
 result = inputArray.join(delimiter);
 
 logs.push({
 level: "info",
 message: `Joined ${inputArray.length} items`,
 timestamp: new Date().toISOString(),
 });
 }
 
 return {
 success: true,
 outputs: { result, output: result },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 return {
 success: false,
 outputs: {},
 error: createNodeError("SPLIT_JOIN_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.mode) {
 errors.push("Mode (split/join) is required");
 }
 
 if (config.delimiter === undefined) {
 errors.push("Delimiter is required");
 }
 
 return { valid: errors.length === 0, errors };
 },
};
