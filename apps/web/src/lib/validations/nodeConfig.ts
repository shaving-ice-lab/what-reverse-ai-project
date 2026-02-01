/**
 * 节点配置验证 Schema
 * 使用 zod 进行类型安全的表单验证
 */

import { z } from "zod";

// ===== 基础验证 Schema =====

// 非空字符串
const nonEmptyString = z.string().min(1, "此字段不能为空");

// URL 验证
const urlSchema = z.string().refine(
  (val) => {
    if (!val) return true; // 允许空值
    // 支持变量语法 {{var}}
    if (val.includes("{{") && val.includes("}}")) return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "请输入有效的 URL 地址" }
);

// ===== LLM 节点配置 Schema =====

export const llmConfigSchema = z.object({
  model: z.string().min(1, "请选择模型"),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  temperature: z.number().min(0, "最小值为 0").max(2, "最大值为 2").default(0.7),
  maxTokens: z.number().int().min(1, "最小值为 1").max(128000, "最大值为 128000").default(2048),
  topP: z.number().min(0).max(1).default(1).optional(),
  frequencyPenalty: z.number().min(0).max(2).default(0).optional(),
  presencePenalty: z.number().min(0).max(2).default(0).optional(),
  streaming: z.boolean().default(false),
  timeout: z.number().int().min(1000).max(600000).default(60000).optional(),
  retryCount: z.number().int().min(0).max(10).default(0).optional(),
  retryDelay: z.number().int().min(0).max(60000).default(1000).optional(),
});

export type LLMConfig = z.infer<typeof llmConfigSchema>;

// ===== HTTP 节点配置 Schema =====

const httpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

const authTypeSchema = z.enum(["none", "basic", "bearer", "apiKey"]);

export const httpConfigSchema = z.object({
  method: httpMethodSchema.default("GET"),
  url: urlSchema,
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}).optional(),
  body: z.any().optional(),
  bodyType: z.enum(["none", "json", "form", "raw"]).default("none"),
  timeout: z.number().int().min(1000).max(300000).default(30000),
  authType: authTypeSchema.default("none"),
  authConfig: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    apiKeyName: z.string().optional(),
    apiKeyValue: z.string().optional(),
    apiKeyIn: z.enum(["header", "query"]).optional(),
  }).optional(),
  followRedirects: z.boolean().default(true),
  validateStatus: z.boolean().default(true),
});

export type HTTPConfig = z.infer<typeof httpConfigSchema>;

// ===== 条件节点配置 Schema =====

const conditionOperatorSchema = z.enum([
  "eq", "neq", "gt", "gte", "lt", "lte",
  "contains", "notContains", "startsWith", "endsWith",
  "matches", "empty", "notEmpty"
]);

const singleConditionSchema = z.object({
  id: z.string(),
  left: z.string(),
  operator: conditionOperatorSchema,
  right: z.string(),
});

const conditionGroupSchema = z.object({
  id: z.string(),
  conditions: z.array(singleConditionSchema).min(1, "至少需要一个条件"),
  logic: z.enum(["and", "or"]).default("and"),
});

export const conditionConfigSchema = z.object({
  conditions: z.array(conditionGroupSchema).min(1, "至少需要一个条件组"),
  logic: z.enum(["and", "or"]).default("and"),
});

export type ConditionConfig = z.infer<typeof conditionConfigSchema>;

// ===== 循环节点配置 Schema =====

export const loopConfigSchema = z.object({
  mode: z.enum(["forEach", "while", "count"]).default("forEach"),
  items: z.string().optional(),
  condition: z.string().optional(),
  count: z.number().int().min(1).max(100000).default(10).optional(),
  maxIterations: z.number().int().min(1).max(100000).default(1000),
}).refine(
  (data) => {
    if (data.mode === "forEach" && !data.items) {
      return false;
    }
    if (data.mode === "while" && !data.condition) {
      return false;
    }
    return true;
  },
  {
    message: "请填写必要的循环配置",
    path: ["mode"],
  }
);

export type LoopConfig = z.infer<typeof loopConfigSchema>;

// ===== 代码节点配置 Schema =====

export const codeConfigSchema = z.object({
  language: z.enum(["javascript", "typescript"]).default("javascript"),
  code: z.string().min(1, "请输入代码"),
  timeout: z.number().int().min(1000).max(300000).default(30000),
});

export type CodeConfig = z.infer<typeof codeConfigSchema>;

// ===== 模板节点配置 Schema =====

export const templateConfigSchema = z.object({
  template: z.string().min(1, "请输入模板内容"),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

// ===== 变量节点配置 Schema =====

export const variableConfigSchema = z.object({
  variableName: nonEmptyString.regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    "变量名只能包含字母、数字和下划线，且不能以数字开头"
  ),
  valueType: z.enum(["string", "number", "boolean", "object", "array"]).default("string"),
  value: z.any(),
});

export type VariableConfig = z.infer<typeof variableConfigSchema>;

// ===== 节点基础信息 Schema =====

export const nodeBasicSchema = z.object({
  label: nonEmptyString.max(50, "名称不能超过 50 个字符"),
  description: z.string().max(200, "描述不能超过 200 个字符").optional(),
});

export type NodeBasic = z.infer<typeof nodeBasicSchema>;

// ===== 验证结果类型 =====

export interface ValidationResult {
  success: boolean;
  errors: Record<string, string>;
  data?: unknown;
}

// ===== 通用验证函数 =====

export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: {},
      data: result.data,
    };
  }

  // 将 Zod 错误转换为简单的错误对象
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return {
    success: false,
    errors,
  };
}

// ===== 节点类型到 Schema 的映射 =====

export const nodeConfigSchemas: Record<string, z.ZodSchema> = {
  llm: llmConfigSchema,
  http: httpConfigSchema,
  condition: conditionConfigSchema,
  loop: loopConfigSchema,
  code: codeConfigSchema,
  template: templateConfigSchema,
  variable: variableConfigSchema,
};

// 获取节点类型对应的 Schema
export function getNodeConfigSchema(nodeType: string): z.ZodSchema | null {
  return nodeConfigSchemas[nodeType] || null;
}

// 验证节点配置
export function validateNodeConfig(
  nodeType: string,
  config: unknown
): ValidationResult {
  const schema = getNodeConfigSchema(nodeType);
  
  if (!schema) {
    return { success: true, errors: {}, data: config };
  }

  return validateConfig(schema, config);
}
