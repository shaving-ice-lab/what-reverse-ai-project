"use client";

import { useState, useCallback, useEffect } from "react";
import { validateNodeConfig, type ValidationResult } from "@/lib/validations/nodeConfig";

/**
 * 表单验证 Hook
 * 提供实时验证和错误状态管理
 */

interface UseFormValidationOptions {
  nodeType: string;
  config: unknown;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface FormValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  touchedFields: Set<string>;
}

export function useFormValidation({
  nodeType,
  config,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions) {
  const [state, setState] = useState<FormValidationState>({
    errors: {},
    isValid: true,
    isValidating: false,
    touchedFields: new Set(),
  });

  // 验证函数
  const validate = useCallback((): ValidationResult => {
    setState((prev) => ({ ...prev, isValidating: true }));

    const result = validateNodeConfig(nodeType, config);

    setState((prev) => ({
      ...prev,
      errors: result.errors,
      isValid: result.success,
      isValidating: false,
    }));

    return result;
  }, [nodeType, config]);

  // 验证单个字段
  const validateField = useCallback(
    (fieldPath: string): string | undefined => {
      const result = validateNodeConfig(nodeType, config);
      const error = result.errors[fieldPath];
      
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldPath]: error || "",
        },
      }));

      return error;
    },
    [nodeType, config]
  );

  // 标记字段为已触摸
  const touchField = useCallback((fieldPath: string) => {
    setState((prev) => ({
      ...prev,
      touchedFields: new Set(prev.touchedFields).add(fieldPath),
    }));

    if (validateOnBlur) {
      validateField(fieldPath);
    }
  }, [validateOnBlur, validateField]);

  // 获取字段错误（只显示已触摸字段的错误）
  const getFieldError = useCallback(
    (fieldPath: string): string | undefined => {
      if (!state.touchedFields.has(fieldPath)) return undefined;
      return state.errors[fieldPath];
    },
    [state.errors, state.touchedFields]
  );

  // 清除错误
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // 清除特定字段错误
  const clearFieldError = useCallback((fieldPath: string) => {
    setState((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldPath];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      errors: {},
      isValid: true,
      isValidating: false,
      touchedFields: new Set(),
    });
  }, []);

  // 配置变化时自动验证（带防抖）
  useEffect(() => {
    if (!validateOnChange) return;

    const timeoutId = setTimeout(() => {
      // 只验证已触摸的字段
      if (state.touchedFields.size > 0) {
        validate();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [config, validateOnChange, debounceMs, validate, state.touchedFields.size]);

  return {
    errors: state.errors,
    isValid: state.isValid,
    isValidating: state.isValidating,
    touchedFields: state.touchedFields,
    validate,
    validateField,
    touchField,
    getFieldError,
    clearErrors,
    clearFieldError,
    reset,
  };
}
