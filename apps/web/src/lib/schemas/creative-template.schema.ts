/**
 * AI 创意助手模板 JSON Schema
 * 
 * 用于验证模板配置数据的完整性和正确性
 * 可与 Zod、Ajv 等验证库配合使用
 */

import { z } from "zod";

// ===== 基础枚举 Schema =====

/**
 * 模板分类 Schema
 */
export const CreativeTemplateCategorySchema = z.enum([
  "business",
  "content",
  "product",
  "marketing",
]);

/**
 * 输入字段类型 Schema
 */
export const InputFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "slider",
  "switch",
  "date",
]);

// ===== 输入字段 Schema =====

/**
 * 下拉选项 Schema
 */
export const SelectOptionSchema = z.object({
  value: z.string().min(1, "选项值不能为空"),
  label: z.string().min(1, "选项标签不能为空"),
  description: z.string().optional(),
});

/**
 * 输入验证规则 Schema
 */
export const InputValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
}).refine(
  (data) => {
    if (data.minLength !== undefined && data.maxLength !== undefined) {
      return data.minLength <= data.maxLength;
    }
    return true;
  },
  { message: "minLength 必须小于等于 maxLength" }
).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: "min 必须小于等于 max" }
);

/**
 * 条件显示规则 Schema
 */
export const ShowWhenSchema = z.object({
  field: z.string().min(1, "依赖字段 ID 不能为空"),
  operator: z.enum(["eq", "neq", "contains", "notEmpty"]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

/**
 * 输入字段 Schema
 */
export const InputFieldSchema = z.object({
  id: z.string()
    .min(1, "字段 ID 不能为空")
    .regex(/^[a-z_][a-z0-9_]*$/, "字段 ID 必须是小写字母、数字和下划线，且以字母或下划线开头"),
  label: z.string().min(1, "字段标签不能为空").max(100, "字段标签不能超过 100 个字符"),
  type: InputFieldTypeSchema,
  placeholder: z.string().max(500, "占位符不能超过 500 个字符").optional(),
  helpText: z.string().max(500, "帮助文本不能超过 500 个字符").optional(),
  defaultValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]).optional(),
  options: z.array(SelectOptionSchema).optional(),
  validation: InputValidationSchema.optional(),
  aiSuggest: z.boolean().optional(),
  aiSuggestPrompt: z.string().max(2000, "AI 建议提示词不能超过 2000 个字符").optional(),
  showWhen: ShowWhenSchema.optional(),
}).refine(
  (data) => {
    // select 和 multiselect 类型必须有 options
    if (data.type === "select" || data.type === "multiselect") {
      return data.options && data.options.length >= 1;
    }
    return true;
  },
  { message: "select 和 multiselect 类型必须至少有一个选项" }
).refine(
  (data) => {
    // aiSuggest 为 true 时建议有 aiSuggestPrompt
    if (data.aiSuggest && !data.aiSuggestPrompt) {
      return true; // 只是警告，不强制
    }
    return true;
  },
  { message: "启用 AI 建议时建议提供 aiSuggestPrompt" }
);

// ===== 输出章节 Schema =====

/**
 * 输出章节 Schema
 */
export const OutputSectionSchema = z.object({
  id: z.string()
    .min(1, "章节 ID 不能为空")
    .regex(/^[a-z_][a-z0-9_-]*$/, "章节 ID 必须是小写字母、数字、下划线和连字符"),
  title: z.string().min(1, "章节标题不能为空").max(100, "章节标题不能超过 100 个字符"),
  description: z.string().max(500, "章节描述不能超过 500 个字符"),
  promptTemplate: z.string().min(10, "提示词模板不能少于 10 个字符"),
  icon: z.string().max(50).optional(),
  estimatedTime: z.number().min(1).max(600).optional(), // 最多 10 分钟
  dependsOn: z.array(z.string()).optional(),
  regeneratable: z.boolean().optional().default(true),
  outputFormat: z.enum(["markdown", "json", "table", "list"]).optional().default("markdown"),
});

// ===== 模板示例 Schema =====

/**
 * 模板示例 Schema
 */
export const TemplateExampleSchema = z.object({
  input: z.record(z.string(), z.unknown()),
  output: z.string().min(100, "示例输出至少需要 100 个字符"),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

// ===== 模板主结构 Schema =====

/**
 * 创意模板 Schema
 */
export const CreativeTemplateSchema = z.object({
  id: z.string()
    .min(1, "模板 ID 不能为空")
    .regex(/^[a-z][a-z0-9-]*$/, "模板 ID 必须是小写字母、数字和连字符，且以字母开头"),
  name: z.string().min(2, "模板名称至少 2 个字符").max(50, "模板名称不能超过 50 个字符"),
  description: z.string().min(10, "模板描述至少 10 个字符").max(500, "模板描述不能超过 500 个字符"),
  icon: z.string().min(1, "图标不能为空").max(50, "图标名称不能超过 50 个字符"),
  category: CreativeTemplateCategorySchema,
  inputs: z.object({
    required: z.array(InputFieldSchema).min(1, "至少需要一个必填字段"),
    optional: z.array(InputFieldSchema).default([]),
  }),
  outputSections: z.array(OutputSectionSchema).min(1, "至少需要一个输出章节"),
  workflowId: z.string().min(1, "工作流 ID 不能为空"),
  example: TemplateExampleSchema.optional(),
  usageCount: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().min(0).default(0),
  tags: z.array(z.string().max(20)).max(10, "标签不能超过 10 个").default([]),
  estimatedTime: z.number().min(10).max(1800).optional(), // 10秒 - 30分钟
  isOfficial: z.boolean().optional().default(false),
  creatorId: z.string().optional(),
  creatorName: z.string().max(50).optional(),
  version: z.number().min(1).default(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    // 验证输出章节的 dependsOn 引用是否有效
    const sectionIds = new Set(data.outputSections.map((s) => s.id));
    for (const section of data.outputSections) {
      if (section.dependsOn) {
        for (const depId of section.dependsOn) {
          if (!sectionIds.has(depId)) {
            return false;
          }
        }
      }
    }
    return true;
  },
  { message: "章节的 dependsOn 引用了不存在的章节 ID" }
).refine(
  (data) => {
    // 验证示例输入是否包含所有必填字段
    if (data.example) {
      const requiredIds = data.inputs.required.map((f) => f.id);
      const inputKeys = Object.keys(data.example.input);
      return requiredIds.every((id) => inputKeys.includes(id));
    }
    return true;
  },
  { message: "模板示例必须包含所有必填字段的输入" }
);

// ===== 创建模板请求 Schema =====

/**
 * 创建/更新模板请求 Schema (不包含自动生成的字段)
 */
export const CreateTemplateRequestSchema = CreativeTemplateSchema.omit({
  usageCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

// ===== 类型推断 =====

export type CreativeTemplateCategoryType = z.infer<typeof CreativeTemplateCategorySchema>;
export type InputFieldTypeType = z.infer<typeof InputFieldTypeSchema>;
export type SelectOptionType = z.infer<typeof SelectOptionSchema>;
export type InputValidationType = z.infer<typeof InputValidationSchema>;
export type ShowWhenType = z.infer<typeof ShowWhenSchema>;
export type InputFieldType = z.infer<typeof InputFieldSchema>;
export type OutputSectionType = z.infer<typeof OutputSectionSchema>;
export type TemplateExampleType = z.infer<typeof TemplateExampleSchema>;
export type CreativeTemplateType = z.infer<typeof CreativeTemplateSchema>;
export type CreateTemplateRequestType = z.infer<typeof CreateTemplateRequestSchema>;

// ===== 验证辅助函数 =====

/**
 * 验证模板配置
 */
export function validateTemplate(data: unknown): {
  success: boolean;
  data?: CreativeTemplateType;
  errors?: z.ZodError;
} {
  const result = CreativeTemplateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * 验证输入字段
 */
export function validateInputField(data: unknown): {
  success: boolean;
  data?: InputFieldType;
  errors?: z.ZodError;
} {
  const result = InputFieldSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * 验证输出章节
 */
export function validateOutputSection(data: unknown): {
  success: boolean;
  data?: OutputSectionType;
  errors?: z.ZodError;
} {
  const result = OutputSectionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * 格式化验证错误为用户友好的消息
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}
