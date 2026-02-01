/**
 * 节点验证机制
 * 
 * 提供完整的输入验证、运行时验证、Schema 验证功能
 */

import type {
  InputFieldConfig,
  ValidationRule,
  ValidationResult,
  ValidationError,
  DataType,
  NodeDefinitionConfig,
} from "./types";

// ===== 验证器接口 =====

/** 验证器接口 */
export interface Validator<T = unknown> {
  validate(value: T): ValidationResult;
  validateAsync(value: T): Promise<ValidationResult>;
}

/** 字段验证器 */
export interface FieldValidator {
  field: string;
  validators: Array<(value: unknown) => ValidationError | null>;
}

// ===== 验证工具函数 =====

/**
 * 创建验证结果
 */
export function createValidationResult(
  valid: boolean,
  errors: ValidationError[] = []
): ValidationResult {
  return { valid, errors };
}

/**
 * 合并验证结果
 */
export function mergeValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const errors: ValidationError[] = [];
  let valid = true;

  for (const result of results) {
    if (!result.valid) {
      valid = false;
      errors.push(...result.errors);
    }
  }

  return { valid, errors };
}

// ===== 类型验证器 =====

/**
 * 验证数据类型
 */
export function validateDataType(
  fieldName: string,
  value: unknown,
  expectedType: DataType,
  label: string
): ValidationError | null {
  if (value === undefined || value === null) {
    return null; // 空值由 required 验证处理
  }

  switch (expectedType) {
    case "string":
      if (typeof value !== "string") {
        return {
          field: fieldName,
          message: `${label} 必须是字符串类型`,
          code: "TYPE_STRING",
        };
      }
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        return {
          field: fieldName,
          message: `${label} 必须是数字类型`,
          code: "TYPE_NUMBER",
        };
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return {
          field: fieldName,
          message: `${label} 必须是布尔类型`,
          code: "TYPE_BOOLEAN",
        };
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${label} 必须是对象类型`,
          code: "TYPE_OBJECT",
        };
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${label} 必须是数组类型`,
          code: "TYPE_ARRAY",
        };
      }
      break;

    case "file":
    case "image":
      if (!(value instanceof File) && !(value instanceof Blob) && typeof value !== "string") {
        return {
          field: fieldName,
          message: `${label} 必须是文件类型`,
          code: "TYPE_FILE",
        };
      }
      break;

    case "json":
      try {
        if (typeof value === "string") {
          JSON.parse(value);
        }
      } catch {
        return {
          field: fieldName,
          message: `${label} 必须是有效的 JSON`,
          code: "TYPE_JSON",
        };
      }
      break;

    case "any":
      // 任意类型都通过
      break;
  }

  return null;
}

// ===== 规则验证器 =====

/**
 * 验证单个规则
 */
export function validateRule(
  fieldName: string,
  value: unknown,
  rule: ValidationRule
): ValidationError | null {
  switch (rule.type) {
    case "min":
      if (typeof value === "number" && value < (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MIN" };
      }
      break;

    case "max":
      if (typeof value === "number" && value > (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MAX" };
      }
      break;

    case "minLength":
      if (typeof value === "string" && value.length < (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MIN_LENGTH" };
      }
      if (Array.isArray(value) && value.length < (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MIN_LENGTH" };
      }
      break;

    case "maxLength":
      if (typeof value === "string" && value.length > (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MAX_LENGTH" };
      }
      if (Array.isArray(value) && value.length > (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "RULE_MAX_LENGTH" };
      }
      break;

    case "pattern":
      if (typeof value === "string") {
        const regex = rule.value instanceof RegExp 
          ? rule.value 
          : new RegExp(rule.value as string);
        if (!regex.test(value)) {
          return { field: fieldName, message: rule.message, code: "RULE_PATTERN" };
        }
      }
      break;

    case "custom":
      if (rule.validator) {
        const result = rule.validator(value);
        if (result === false) {
          return { field: fieldName, message: rule.message, code: "RULE_CUSTOM" };
        }
      }
      break;
  }

  return null;
}

/**
 * 异步验证规则
 */
export async function validateRuleAsync(
  fieldName: string,
  value: unknown,
  rule: ValidationRule
): Promise<ValidationError | null> {
  // 先执行同步验证
  const syncResult = validateRule(fieldName, value, rule);
  if (syncResult) {
    return syncResult;
  }

  // 处理异步自定义验证
  if (rule.type === "custom" && rule.validator) {
    try {
      const result = await rule.validator(value);
      if (result === false) {
        return { field: fieldName, message: rule.message, code: "RULE_CUSTOM" };
      }
    } catch (error) {
      return {
        field: fieldName,
        message: `验证失败: ${error instanceof Error ? error.message : "未知错误"}`,
        code: "RULE_CUSTOM_ERROR",
      };
    }
  }

  return null;
}

// ===== 字段验证器 =====

/**
 * 验证单个输入字段
 */
export function validateInputField(
  fieldName: string,
  value: unknown,
  config: InputFieldConfig
): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查必填
  if (config.required && (value === undefined || value === null || value === "")) {
    errors.push({
      field: fieldName,
      message: `${config.label} 是必填项`,
      code: "REQUIRED",
    });
    return createValidationResult(false, errors);
  }

  // 如果值为空且非必填，跳过后续验证
  if (value === undefined || value === null) {
    return createValidationResult(true);
  }

  // 类型验证
  const typeError = validateDataType(fieldName, value, config.type, config.label);
  if (typeError) {
    errors.push(typeError);
    return createValidationResult(false, errors);
  }

  // 规则验证
  if (config.validation) {
    for (const rule of config.validation) {
      const ruleError = validateRule(fieldName, value, rule);
      if (ruleError) {
        errors.push(ruleError);
      }
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

/**
 * 异步验证单个输入字段
 */
export async function validateInputFieldAsync(
  fieldName: string,
  value: unknown,
  config: InputFieldConfig
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // 检查必填
  if (config.required && (value === undefined || value === null || value === "")) {
    errors.push({
      field: fieldName,
      message: `${config.label} 是必填项`,
      code: "REQUIRED",
    });
    return createValidationResult(false, errors);
  }

  // 如果值为空且非必填，跳过后续验证
  if (value === undefined || value === null) {
    return createValidationResult(true);
  }

  // 类型验证
  const typeError = validateDataType(fieldName, value, config.type, config.label);
  if (typeError) {
    errors.push(typeError);
    return createValidationResult(false, errors);
  }

  // 异步规则验证
  if (config.validation) {
    const ruleResults = await Promise.all(
      config.validation.map((rule) => validateRuleAsync(fieldName, value, rule))
    );
    for (const ruleError of ruleResults) {
      if (ruleError) {
        errors.push(ruleError);
      }
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

// ===== 完整输入验证 =====

/**
 * 验证所有输入
 */
export function validateAllInputs(
  inputConfigs: Record<string, InputFieldConfig>,
  inputs: Record<string, unknown>
): ValidationResult {
  const results: ValidationResult[] = [];

  for (const [fieldName, config] of Object.entries(inputConfigs)) {
    const value = inputs[fieldName];
    
    // 检查条件显示
    if (config.showIf && !evaluateShowIf(config.showIf, inputs)) {
      continue;
    }

    results.push(validateInputField(fieldName, value, config));
  }

  return mergeValidationResults(...results);
}

/**
 * 异步验证所有输入
 */
export async function validateAllInputsAsync(
  inputConfigs: Record<string, InputFieldConfig>,
  inputs: Record<string, unknown>
): Promise<ValidationResult> {
  const results: ValidationResult[] = [];

  for (const [fieldName, config] of Object.entries(inputConfigs)) {
    const value = inputs[fieldName];
    
    // 检查条件显示
    if (config.showIf && !evaluateShowIf(config.showIf, inputs)) {
      continue;
    }

    results.push(await validateInputFieldAsync(fieldName, value, config));
  }

  return mergeValidationResults(...results);
}

/**
 * 评估条件显示
 */
function evaluateShowIf(
  condition: { field: string; operator: string; value?: unknown },
  inputs: Record<string, unknown>
): boolean {
  const fieldValue = inputs[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;
    case "notEquals":
      return fieldValue !== condition.value;
    case "contains":
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    default:
      return true;
  }
}

// ===== 节点定义验证 =====

/**
 * 验证节点定义配置
 */
export function validateNodeDefinition(
  config: Partial<NodeDefinitionConfig>
): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证 ID
  if (!config.id) {
    errors.push({
      field: "id",
      message: "节点 ID 是必填项",
      code: "REQUIRED",
    });
  } else if (!/^[a-z0-9-]+$/.test(config.id)) {
    errors.push({
      field: "id",
      message: "节点 ID 只能包含小写字母、数字和连字符",
      code: "INVALID_FORMAT",
    });
  }

  // 验证名称
  if (!config.name) {
    errors.push({
      field: "name",
      message: "节点名称是必填项",
      code: "REQUIRED",
    });
  }

  // 验证描述
  if (!config.description) {
    errors.push({
      field: "description",
      message: "节点描述是必填项",
      code: "REQUIRED",
    });
  }

  // 验证版本
  if (!config.version) {
    errors.push({
      field: "version",
      message: "节点版本是必填项",
      code: "REQUIRED",
    });
  } else if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
    errors.push({
      field: "version",
      message: "版本号必须是 semver 格式 (如 1.0.0)",
      code: "INVALID_FORMAT",
    });
  }

  // 验证类别
  const validCategories = ["trigger", "action", "logic", "data", "ai", "integration", "custom"];
  if (!config.category) {
    errors.push({
      field: "category",
      message: "节点类别是必填项",
      code: "REQUIRED",
    });
  } else if (!validCategories.includes(config.category)) {
    errors.push({
      field: "category",
      message: `节点类别必须是以下之一: ${validCategories.join(", ")}`,
      code: "INVALID_VALUE",
    });
  }

  // 验证图标
  if (!config.icon) {
    errors.push({
      field: "icon",
      message: "节点图标是必填项",
      code: "REQUIRED",
    });
  }

  // 验证执行函数
  if (!config.execute || typeof config.execute !== "function") {
    errors.push({
      field: "execute",
      message: "执行函数是必填项且必须是函数",
      code: "REQUIRED",
    });
  }

  // 验证输入定义
  if (config.inputs) {
    for (const [inputName, inputConfig] of Object.entries(config.inputs)) {
      if (!inputConfig.type) {
        errors.push({
          field: `inputs.${inputName}.type`,
          message: `输入 "${inputName}" 的类型是必填项`,
          code: "REQUIRED",
        });
      }
      if (!inputConfig.label) {
        errors.push({
          field: `inputs.${inputName}.label`,
          message: `输入 "${inputName}" 的标签是必填项`,
          code: "REQUIRED",
        });
      }
    }
  }

  // 验证输出定义
  if (config.outputs) {
    for (const [outputName, outputConfig] of Object.entries(config.outputs)) {
      if (!outputConfig.type) {
        errors.push({
          field: `outputs.${outputName}.type`,
          message: `输出 "${outputName}" 的类型是必填项`,
          code: "REQUIRED",
        });
      }
      if (!outputConfig.label) {
        errors.push({
          field: `outputs.${outputName}.label`,
          message: `输出 "${outputName}" 的标签是必填项`,
          code: "REQUIRED",
        });
      }
    }
  }

  return createValidationResult(errors.length === 0, errors);
}

// ===== Schema 验证器 =====

/**
 * 创建 Schema 验证器
 */
export function createSchemaValidator<T extends Record<string, InputFieldConfig>>(
  schema: T
): Validator<Record<string, unknown>> {
  return {
    validate(value: Record<string, unknown>): ValidationResult {
      return validateAllInputs(schema, value);
    },
    async validateAsync(value: Record<string, unknown>): Promise<ValidationResult> {
      return validateAllInputsAsync(schema, value);
    },
  };
}

// ===== 预置验证器 =====

export const validators = {
  /** 邮箱验证 */
  email: (message = "请输入有效的邮箱地址"): ValidationRule => ({
    type: "pattern",
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message,
  }),

  /** URL 验证 */
  url: (message = "请输入有效的 URL"): ValidationRule => ({
    type: "pattern",
    value: /^https?:\/\/.+/,
    message,
  }),

  /** UUID 验证 */
  uuid: (message = "请输入有效的 UUID"): ValidationRule => ({
    type: "pattern",
    value: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message,
  }),

  /** 手机号验证 (中国) */
  phone: (message = "请输入有效的手机号"): ValidationRule => ({
    type: "pattern",
    value: /^1[3-9]\d{9}$/,
    message,
  }),

  /** 正整数验证 */
  positiveInteger: (message = "必须是正整数"): ValidationRule => ({
    type: "custom",
    message,
    validator: (v) => typeof v === "number" && Number.isInteger(v) && v > 0,
  }),

  /** 非空字符串验证 */
  notEmpty: (message = "不能为空"): ValidationRule => ({
    type: "custom",
    message,
    validator: (v) => typeof v === "string" && v.trim().length > 0,
  }),

  /** 枚举验证 */
  oneOf: <T>(values: T[], message?: string): ValidationRule => ({
    type: "custom",
    message: message || `必须是以下值之一: ${values.join(", ")}`,
    validator: (v) => values.includes(v as T),
  }),

  /** JSON 对象验证 */
  jsonObject: (message = "必须是有效的 JSON 对象"): ValidationRule => ({
    type: "custom",
    message,
    validator: (v) => {
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        return true;
      }
      if (typeof v === "string") {
        try {
          const parsed = JSON.parse(v);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
        } catch {
          return false;
        }
      }
      return false;
    },
  }),
};
