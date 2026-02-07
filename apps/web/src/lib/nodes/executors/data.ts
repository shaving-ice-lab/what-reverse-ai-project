/**
 * DataNodeExecute
 * VariableSettings, DataConvert, and, Filter
 */

import type {
 NodeContext,
 NodeResult,
 NodeExecutor,
 VariableConfig,
} from "../types";
import {
 renderTemplate,
 getValueByPath,
 safeJSONParse,
 createNodeError,
} from "../utils";

// ==================== VariableSettingsNode ====================

/**
 * ParseVariablevalue
 */
function parseVariableValue(
 value: unknown,
 valueType: VariableConfig["valueType"],
 variables: Record<string, unknown>
): unknown {
 // ifresultisString, firstRenderTemplate
 if (typeof value === "string") {
 value = renderTemplate(value, variables);
 }
 
 switch (valueType) {
 case "string":
 return String(value ?? "");
 
 case "number": {
 const num = Number(value);
 if (isNaN(num)) {
 throw new Error(`Cannot convert "${value}" to number`);
 }
 return num;
 }
 
 case "boolean": {
 if (typeof value === "boolean") return value;
 if (typeof value === "string") {
 const lower = value.toLowerCase();
 if (lower === "true" || lower === "1" || lower === "yes") return true;
 if (lower === "false" || lower === "0" || lower === "no") return false;
 }
 return Boolean(value);
 }
 
 case "object": {
 if (typeof value === "object" && value !== null) return value;
 if (typeof value === "string") {
 return safeJSONParse(value, {});
 }
 return {};
 }
 
 case "array": {
 if (Array.isArray(value)) return value;
 if (typeof value === "string") {
 const parsed = safeJSONParse(value, null);
 if (Array.isArray(parsed)) return parsed;
 // TrybyCommaSplit
 return value.split(",").map((s) => s.trim());
 }
 return [value];
 }
 
 default:
 return value;
 }
}

/**
 * VariableSettingsNodeExecute
 */
export const variableExecutor: NodeExecutor<VariableConfig> = {
 type: "variable",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 const allVariables = { ...variables, ...inputs };
 
 // ParseVariablevalue
 const parsedValue = parseVariableValue(
 nodeConfig.value,
 nodeConfig.valueType,
 allVariables
 );
 
 logs.push({
 level: "info",
 message: `Set variable "${nodeConfig.variableName}" to ${JSON.stringify(parsedValue).slice(0, 100)}`,
 timestamp: new Date().toISOString(),
 data: { type: nodeConfig.valueType },
 });
 
 return {
 success: true,
 outputs: {
 [nodeConfig.variableName]: parsedValue,
 value: parsedValue,
 name: nodeConfig.variableName,
 type: nodeConfig.valueType,
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
 error: createNodeError("VARIABLE_SET_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.variableName) {
 errors.push("Variable name is required");
 } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(config.variableName)) {
 errors.push("Variable name must start with a letter or underscore, followed by letters, digits, or underscores");
 }
 
 if (!config.valueType) {
 errors.push("Value type is required");
 }
 
 return {
 valid: errors.length === 0,
 errors,
 };
 },
};

// ==================== DataConvertNode ====================

interface TransformConfig {
 transformType: "jsonPath" | "map" | "filter" | "reduce" | "expression";
 expression?: string;
 jsonPath?: string;
}

export const transformExecutor: NodeExecutor<TransformConfig> = {
 type: "transform",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 const inputData = inputs.data ?? inputs.input ?? variables.input;
 let result: unknown;
 
 switch (nodeConfig.transformType) {
 case "jsonPath": {
 if (!nodeConfig.jsonPath) {
 throw new Error("JSON Path is required");
 }
 result = getValueByPath(inputData as Record<string, unknown>, nodeConfig.jsonPath);
 break;
 }
 
 case "expression": {
 // SimpleExpressionvalue
 if (!nodeConfig.expression) {
 throw new Error("Expression is required");
 }
 const expr = renderTemplate(nodeConfig.expression, { ...variables, ...inputs, data: inputData });
 // Note: ActualitemshouldUsageSecurity'sExpressionEngine
 result = expr;
 break;
 }
 
 default:
 result = inputData;
 }
 
 logs.push({
 level: "info",
 message: `Data transformed using ${nodeConfig.transformType}`,
 timestamp: new Date().toISOString(),
 });
 
 return {
 success: true,
 outputs: { data: result, output: result },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 return {
 success: false,
 outputs: {},
 error: createNodeError("TRANSFORM_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.transformType) {
 errors.push("Transform type is required");
 }
 
 return { valid: errors.length === 0, errors };
 },
};

// ==================== DataandNode ====================

interface MergeConfig {
 mergeType: "object" | "array" | "concat";
}

export const mergeExecutor: NodeExecutor<MergeConfig> = {
 type: "merge",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, inputs } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 // FetchAllInput
 const inputValues = Object.values(inputs).filter((v) => v !== undefined);
 let result: unknown;
 
 switch (nodeConfig.mergeType) {
 case "object": {
 result = inputValues.reduce((merged, item) => {
 if (typeof item === "object" && item !== null && !Array.isArray(item)) {
 return { ...(merged as object), ...(item as object) };
 }
 return merged;
 }, {});
 break;
 }
 
 case "array": {
 result = inputValues;
 break;
 }
 
 case "concat": {
 result = inputValues.reduce((arr: unknown[], item) => {
 if (Array.isArray(item)) {
 return [...arr, ...item];
 }
 return [...arr, item];
 }, []);
 break;
 }
 
 default:
 result = inputValues;
 }
 
 logs.push({
 level: "info",
 message: `Merged ${inputValues.length} inputs using ${nodeConfig.mergeType}`,
 timestamp: new Date().toISOString(),
 });
 
 return {
 success: true,
 outputs: { data: result, output: result },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 return {
 success: false,
 outputs: {},
 error: createNodeError("MERGE_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 if (!config.mergeType) {
 errors.push("Merge type is required");
 }
 return { valid: errors.length === 0, errors };
 },
};

// ==================== DatabaseNode (Mock) ====================

type DatabaseOperation = "select" | "insert" | "update" | "delete" | "migrate";

export interface DatabaseConfig {
 operation?: DatabaseOperation;
 table?: string;
 where?: string;
 values?: unknown;
 limit?: number;
 sql?: string;
 mockRows?: unknown;
 mockRowsAffected?: number;
 mockInsertedId?: string | number;
}

function resolveDBOperation(nodeType: string, operation?: string): DatabaseOperation {
 const op = (operation || nodeType.replace("db_", "")).toLowerCase();
 if (op === "insert" || op === "update" || op === "delete" || op === "migrate") {
 return op;
 }
 return "select";
}

function parseJSONValue(value: unknown): unknown {
 if (typeof value === "string" && value.trim()) {
 return safeJSONParse(value, value);
 }
 return value;
}

function normalizeRows(value: unknown): unknown[] {
 if (Array.isArray(value)) return value;
 if (value && typeof value === "object") return [value];
 return [];
}

function estimateRowsAffected(values: unknown, fallback?: number): number {
 if (typeof fallback === "number") return fallback;
 if (Array.isArray(values)) return values.length;
 if (values && typeof values === "object") return 1;
 return 0;
}

export const databaseExecutor: NodeExecutor<DatabaseConfig> = {
 type: "database",

 async execute(context): Promise<NodeResult> {
 const { nodeConfig, inputs, nodeType } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];

 try {
 const operation = resolveDBOperation(nodeType, nodeConfig.operation);
 const table = nodeConfig.table || "";
 const where = nodeConfig.where || "";

 if (operation === "select") {
 const rowsSource =
 nodeConfig.mockRows ??
 inputs.rows ??
 inputs.output ??
 inputs.input;
 const rows = normalizeRows(parseJSONValue(rowsSource));
 const count = rows.length;
 const first = rows[0] ?? null;

 logs.push({
 level: "info",
 message: `DB select executed (mock)`,
 timestamp: new Date().toISOString(),
 data: { table, where, count },
 });

 return {
 success: true,
 outputs: {
 rows,
 count,
 first,
 output: rows,
 result: rows,
 },
 logs,
 duration: Date.now() - startTime,
 };
 }

 if (operation === "insert") {
 const values = parseJSONValue(nodeConfig.values ?? inputs.values ?? inputs.input);
 const rowsAffected = estimateRowsAffected(values, nodeConfig.mockRowsAffected);
 const insertedId =
 nodeConfig.mockInsertedId ??
 (values && typeof values === "object" && "id" in (values as Record<string, unknown>)
 ? (values as Record<string, unknown>).id
 : undefined);

 logs.push({
 level: "info",
 message: `DB insert executed (mock)`,
 timestamp: new Date().toISOString(),
 data: { table, rowsAffected },
 });

 return {
 success: true,
 outputs: {
 insertedId,
 rowsAffected,
 output: { insertedId, rowsAffected },
 result: { insertedId, rowsAffected },
 },
 logs,
 duration: Date.now() - startTime,
 };
 }

 if (operation === "update") {
 const values = parseJSONValue(nodeConfig.values ?? inputs.values ?? inputs.input);
 const rowsAffected = estimateRowsAffected(values, nodeConfig.mockRowsAffected);

 logs.push({
 level: "info",
 message: `DB update executed (mock)`,
 timestamp: new Date().toISOString(),
 data: { table, where, rowsAffected },
 });

 return {
 success: true,
 outputs: {
 rowsAffected,
 output: rowsAffected,
 result: rowsAffected,
 },
 logs,
 duration: Date.now() - startTime,
 };
 }

 if (operation === "delete") {
 const rowsAffected = estimateRowsAffected(undefined, nodeConfig.mockRowsAffected);

 logs.push({
 level: "info",
 message: `DB delete executed (mock)`,
 timestamp: new Date().toISOString(),
 data: { table, where, rowsAffected },
 });

 return {
 success: true,
 outputs: {
 rowsAffected,
 output: rowsAffected,
 result: rowsAffected,
 },
 logs,
 duration: Date.now() - startTime,
 };
 }

 const sql = nodeConfig.sql || "";
 const appliedCount = sql ? 1 : 0;

 logs.push({
 level: "info",
 message: `DB migrate executed (mock)`,
 timestamp: new Date().toISOString(),
 data: { appliedCount },
 });

 return {
 success: true,
 outputs: {
 applied: appliedCount > 0,
 appliedCount,
 output: appliedCount > 0,
 result: appliedCount,
 },
 logs,
 duration: Date.now() - startTime,
 };
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : "Unknown error";

 return {
 success: false,
 outputs: {},
 error: createNodeError("DB_EXECUTION_FAILED", errorMessage, error, false),
 logs,
 duration: Date.now() - startTime,
 };
 }
 },
};
