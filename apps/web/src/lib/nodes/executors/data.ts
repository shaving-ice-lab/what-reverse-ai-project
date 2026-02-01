/**
 * 数据节点执行器
 * 变量设置、数据转换、合并、筛选
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

// ==================== 变量设置节点 ====================

/**
 * 解析变量值
 */
function parseVariableValue(
  value: unknown,
  valueType: VariableConfig["valueType"],
  variables: Record<string, unknown>
): unknown {
  // 如果是字符串，先渲染模板
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
        // 尝试按逗号分割
        return value.split(",").map((s) => s.trim());
      }
      return [value];
    }
    
    default:
      return value;
  }
}

/**
 * 变量设置节点执行器
 */
export const variableExecutor: NodeExecutor<VariableConfig> = {
  type: "variable",
  
  async execute(context): Promise<NodeResult> {
    const { nodeConfig, variables, inputs } = context;
    const startTime = Date.now();
    const logs: NodeResult["logs"] = [];
    
    try {
      const allVariables = { ...variables, ...inputs };
      
      // 解析变量值
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

// ==================== 数据转换节点 ====================

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
          // 简单表达式求值
          if (!nodeConfig.expression) {
            throw new Error("Expression is required");
          }
          const expr = renderTemplate(nodeConfig.expression, { ...variables, ...inputs, data: inputData });
          // 注意: 实际项目中应使用安全的表达式引擎
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

// ==================== 数据合并节点 ====================

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
      // 获取所有输入
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
