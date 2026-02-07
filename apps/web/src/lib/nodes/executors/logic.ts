/**
 * LogicNodeExecute
 * ConditionDetermine, Loopetc
 */

import type {
 NodeContext,
 NodeResult,
 NodeExecutor,
 ConditionConfig,
 ConditionGroup,
 SingleCondition,
 ConditionOperator,
 LoopConfig,
} from "../types";
import { getValueByPath, renderTemplate, createNodeError } from "../utils";

// ==================== ConditionDetermineNode ====================

/**
 * EvaluateCondition
 */
function evaluateCondition(
 condition: SingleCondition,
 variables: Record<string, unknown>
): boolean {
 // ParseleftActioncount
 let leftValue = condition.left;
 if (leftValue.startsWith("{{") && leftValue.endsWith("}}")) {
 const path = leftValue.slice(2, -2).trim();
 leftValue = getValueByPath(variables, path) as string;
 }
 
 // ParserightActioncount
 let rightValue = condition.right;
 if (rightValue?.startsWith("{{") && rightValue?.endsWith("}}")) {
 const path = rightValue.slice(2, -2).trim();
 rightValue = getValueByPath(variables, path) as string;
 }
 
 // TypeConvertAuxiliary
 const toNumber = (v: unknown): number => {
 const num = Number(v);
 return isNaN(num) ? 0 : num;
 };
 
 const toString = (v: unknown): string => {
 if (v === null || v === undefined) return "";
 if (typeof v === "object") return JSON.stringify(v);
 return String(v);
 };
 
 // EvaluateAction
 switch (condition.operator) {
 case "eq":
 return leftValue == rightValue; // LooseCompare
 case "neq":
 return leftValue != rightValue;
 case "gt":
 return toNumber(leftValue) > toNumber(rightValue);
 case "gte":
 return toNumber(leftValue) >= toNumber(rightValue);
 case "lt":
 return toNumber(leftValue) < toNumber(rightValue);
 case "lte":
 return toNumber(leftValue) <= toNumber(rightValue);
 case "contains":
 return toString(leftValue).includes(toString(rightValue));
 case "notContains":
 return !toString(leftValue).includes(toString(rightValue));
 case "startsWith":
 return toString(leftValue).startsWith(toString(rightValue));
 case "endsWith":
 return toString(leftValue).endsWith(toString(rightValue));
 case "matches":
 try {
 const regex = new RegExp(toString(rightValue));
 return regex.test(toString(leftValue));
 } catch {
 return false;
 }
 case "empty":
 return (
 leftValue === null ||
 leftValue === undefined ||
 leftValue === "" ||
 (Array.isArray(leftValue) && leftValue.length === 0) ||
 (typeof leftValue === "object" && Object.keys(leftValue as object).length === 0)
 );
 case "notEmpty":
 return !(
 leftValue === null ||
 leftValue === undefined ||
 leftValue === "" ||
 (Array.isArray(leftValue) && leftValue.length === 0) ||
 (typeof leftValue === "object" && Object.keys(leftValue as object).length === 0)
 );
 default:
 return false;
 }
}

/**
 * EvaluateConditiongroup
 */
function evaluateConditionGroup(
 group: ConditionGroup,
 variables: Record<string, unknown>
): boolean {
 const results = group.conditions.map((condition) =>
 evaluateCondition(condition, variables)
 );
 
 if (group.logic === "and") {
 return results.every((r) => r);
 } else {
 return results.some((r) => r);
 }
}

/**
 * EvaluateCompleteConditionConfig
 */
function evaluateConditions(
 config: ConditionConfig,
 variables: Record<string, unknown>
): boolean {
 const results = config.conditions.map((group) =>
 evaluateConditionGroup(group, variables)
 );
 
 if (config.logic === "and") {
 return results.every((r) => r);
 } else {
 return results.some((r) => r);
 }
}

/**
 * ConditionDetermineNodeExecute
 */
export const conditionExecutor: NodeExecutor<ConditionConfig> = {
 type: "condition",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 // andVariable
 const allVariables = { ...variables, ...inputs };
 
 // EvaluateCondition
 const result = evaluateConditions(nodeConfig, allVariables);
 
 logs.push({
 level: "info",
 message: `Condition evaluated to: ${result}`,
 timestamp: new Date().toISOString(),
 data: { groupsCount: nodeConfig.conditions.length, logic: nodeConfig.logic },
 });
 
 return {
 success: true,
 outputs: {
 result,
 branch: result ? "true" : "false",
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
 outputs: { result: false, branch: "false" },
 error: createNodeError("CONDITION_EVAL_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.conditions || config.conditions.length === 0) {
 errors.push("At least one condition group is required");
 }
 
 return {
 valid: errors.length === 0,
 errors,
 };
 },
};

// ==================== LoopNode ====================

/**
 * LoopNodeExecute
 */
export const loopExecutor: NodeExecutor<LoopConfig> = {
 type: "loop",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 const maxIterations = nodeConfig.maxIterations ?? 1000;
 
 try {
 const allVariables = { ...variables, ...inputs };
 const results: unknown[] = [];
 let iterations = 0;
 
 switch (nodeConfig.mode) {
 case "forEach": {
 // FetchneedTraverse'scountgroup
 let items: unknown[];
 if (nodeConfig.items) {
 const itemsPath = nodeConfig.items.replace(/^\{\{|\}\}$/g, "").trim();
 const itemsValue = getValueByPath(allVariables, itemsPath);
 items = Array.isArray(itemsValue) ? itemsValue : [itemsValue];
 } else {
 items = (inputs.items as unknown[]) || [];
 }
 
 logs.push({
 level: "info",
 message: `Starting forEach loop with ${items.length} items`,
 timestamp: new Date().toISOString(),
 });
 
 for (let i = 0; i < items.length && i < maxIterations; i++) {
 iterations++;
 results.push({
 item: items[i],
 index: i,
 });
 }
 break;
 }
 
 case "count": {
 const count = nodeConfig.count ?? 10;
 
 logs.push({
 level: "info",
 message: `Starting count loop for ${count} iterations`,
 timestamp: new Date().toISOString(),
 });
 
 for (let i = 0; i < count && i < maxIterations; i++) {
 iterations++;
 results.push({
 index: i,
 iteration: i + 1,
 });
 }
 break;
 }
 
 case "while": {
 logs.push({
 level: "info",
 message: `Starting while loop`,
 timestamp: new Date().toISOString(),
 });
 
 // While needneedatExecuteEnginefaceProcess
 // thisinBackLoopConfig, ActualExecuteEngineProcess
 results.push({
 mode: "while",
 condition: nodeConfig.condition,
 maxIterations,
 });
 break;
 }
 }
 
 if (iterations >= maxIterations) {
 logs.push({
 level: "warn",
 message: `Loop reached maximum iterations (${maxIterations})`,
 timestamp: new Date().toISOString(),
 });
 }
 
 return {
 success: true,
 outputs: {
 results,
 iterations,
 completed: iterations < maxIterations,
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
 outputs: { results: [], iterations: 0 },
 error: createNodeError("LOOP_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.mode) {
 errors.push("Loop mode is required");
 }
 
 if (config.mode === "forEach" && !config.items) {
 // items canwithfromInputPortFetch, withthisinnotForceneed
 }
 
 if (config.mode === "count" && (!config.count || config.count < 1)) {
 errors.push("Count must be at least 1 for count mode");
 }
 
 if (config.mode === "while" && !config.condition) {
 errors.push("Condition is required for while mode");
 }
 
 return {
 valid: errors.length === 0,
 errors,
 };
 },
};
