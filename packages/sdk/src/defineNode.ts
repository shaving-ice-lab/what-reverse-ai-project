/**
 * defineNode - 节点定义核心函数
 */

import type {
  NodeDefinitionConfig,
  NodeDefinition,
  InputFieldConfig,
  OutputFieldConfig,
  ValidationResult,
  ValidationError,
  ValidationRule,
  SerializedNodeDefinition,
  SerializedInputField,
  SerializedOutputField,
} from "./types";

/**
 * 定义自定义节点
 *
 * @example
 * ```typescript
 * import { defineNode, input, output } from '@agentflow/sdk';
 *
 * export default defineNode({
 *   id: 'my-custom-node',
 *   name: '自定义节点',
 *   description: '这是一个自定义节点',
 *   icon: 'puzzle',
 *   category: 'custom',
 *   version: '1.0.0',
 *
 *   inputs: {
 *     text: input.string('输入文本').required().build(),
 *     count: input.number('重复次数').default(1).min(1).max(100).build(),
 *   },
 *
 *   outputs: {
 *     result: output.string('处理结果').build(),
 *   },
 *
 *   async execute(ctx) {
 *     const { text, count } = ctx.inputs;
 *     ctx.log.info('Processing text', { text, count });
 *
 *     return {
 *       result: text.repeat(count),
 *     };
 *   },
 * });
 * ```
 */
export function defineNode<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig>
>(
  config: NodeDefinitionConfig<TInputs, TOutputs>
): NodeDefinition<TInputs, TOutputs> {
  // 验证配置
  validateNodeConfig(config);

  // 创建节点定义实例
  const definition: NodeDefinition<TInputs, TOutputs> = {
    ...config,

    // 验证输入
    validateInputs(inputs: unknown): ValidationResult {
      return validateInputs(config.inputs, inputs);
    },

    // 获取默认配置
    getDefaultConfig(): Record<string, unknown> {
      const defaults: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(config.inputs)) {
        if (field.defaultValue !== undefined) {
          defaults[key] = field.defaultValue;
        }
      }
      return defaults;
    },

    // 序列化节点定义
    serialize(): SerializedNodeDefinition {
      return serializeDefinition(config);
    },
  };

  return definition;
}

/**
 * 验证节点配置
 */
function validateNodeConfig<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig>
>(config: NodeDefinitionConfig<TInputs, TOutputs>): void {
  // 验证必填字段
  if (!config.id) {
    throw new Error("Node id is required");
  }
  if (!/^[a-z0-9-]+$/.test(config.id)) {
    throw new Error("Node id must be lowercase alphanumeric with hyphens");
  }
  if (!config.name) {
    throw new Error("Node name is required");
  }
  if (!config.description) {
    throw new Error("Node description is required");
  }
  if (!config.category) {
    throw new Error("Node category is required");
  }
  if (!config.icon) {
    throw new Error("Node icon is required");
  }
  if (!config.version) {
    throw new Error("Node version is required");
  }
  if (!config.execute || typeof config.execute !== "function") {
    throw new Error("Node execute function is required");
  }

  // 验证版本格式
  if (!/^\d+\.\d+\.\d+$/.test(config.version)) {
    throw new Error("Node version must be in semver format (e.g., 1.0.0)");
  }
}

/**
 * 验证输入值
 */
function validateInputs(
  inputDefs: Record<string, InputFieldConfig>,
  inputs: unknown
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof inputs !== "object" || inputs === null) {
    return {
      valid: false,
      errors: [
        {
          field: "_root",
          message: "Inputs must be an object",
          code: "INVALID_TYPE",
        },
      ],
    };
  }

  const inputValues = inputs as Record<string, unknown>;

  for (const [fieldName, fieldConfig] of Object.entries(inputDefs)) {
    const value = inputValues[fieldName];

    // 检查必填
    if (fieldConfig.required && (value === undefined || value === null)) {
      errors.push({
        field: fieldName,
        message: `${fieldConfig.label} is required`,
        code: "REQUIRED",
      });
      continue;
    }

    // 如果值为空且非必填，跳过验证
    if (value === undefined || value === null) {
      continue;
    }

    // 类型检查
    const typeError = validateType(fieldName, fieldConfig, value);
    if (typeError) {
      errors.push(typeError);
      continue;
    }

    // 自定义验证规则
    if (fieldConfig.validation) {
      for (const rule of fieldConfig.validation) {
        const ruleError = validateRule(fieldName, rule, value);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证类型
 */
function validateType(
  fieldName: string,
  config: InputFieldConfig,
  value: unknown
): ValidationError | null {
  const { type, label } = config;

  switch (type) {
    case "string":
      if (typeof value !== "string") {
        return {
          field: fieldName,
          message: `${label} must be a string`,
          code: "INVALID_TYPE",
        };
      }
      break;
    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        return {
          field: fieldName,
          message: `${label} must be a number`,
          code: "INVALID_TYPE",
        };
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        return {
          field: fieldName,
          message: `${label} must be a boolean`,
          code: "INVALID_TYPE",
        };
      }
      break;
    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${label} must be an object`,
          code: "INVALID_TYPE",
        };
      }
      break;
    case "array":
      if (!Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${label} must be an array`,
          code: "INVALID_TYPE",
        };
      }
      break;
  }

  return null;
}

/**
 * 验证规则
 */
function validateRule(
  fieldName: string,
  rule: ValidationRule,
  value: unknown
): ValidationError | null {
  switch (rule.type) {
    case "min":
      if (typeof value === "number" && value < (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "MIN" };
      }
      break;
    case "max":
      if (typeof value === "number" && value > (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "MAX" };
      }
      break;
    case "minLength":
      if (typeof value === "string" && value.length < (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "MIN_LENGTH" };
      }
      break;
    case "maxLength":
      if (typeof value === "string" && value.length > (rule.value as number)) {
        return { field: fieldName, message: rule.message, code: "MAX_LENGTH" };
      }
      break;
    case "pattern":
      if (typeof value === "string" && !new RegExp(rule.value as string).test(value)) {
        return { field: fieldName, message: rule.message, code: "PATTERN" };
      }
      break;
    case "custom":
      if (rule.validator && !rule.validator(value)) {
        return { field: fieldName, message: rule.message, code: "CUSTOM" };
      }
      break;
  }

  return null;
}

/**
 * 序列化节点定义
 */
function serializeDefinition<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig>
>(config: NodeDefinitionConfig<TInputs, TOutputs>): SerializedNodeDefinition {
  const inputs: Record<string, SerializedInputField> = {};
  for (const [key, field] of Object.entries(config.inputs)) {
    inputs[key] = {
      type: field.type,
      label: field.label,
      description: field.description,
      required: field.required,
      defaultValue: field.defaultValue,
    };
  }

  const outputs: Record<string, SerializedOutputField> = {};
  for (const [key, field] of Object.entries(config.outputs)) {
    outputs[key] = {
      type: field.type,
      label: field.label,
      description: field.description,
      optional: field.optional,
    };
  }

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category,
    icon: config.icon,
    version: config.version,
    inputs,
    outputs,
  };
}
