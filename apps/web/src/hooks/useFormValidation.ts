"use client";

import { useState, useCallback, useEffect } from "react";
import { validateNodeConfig, type ValidationResult } from "@/lib/validations/nodeConfig";

/**
 * FormVerify Hook
 * ProvideReal-timeVerifyandErrorStatusManage
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

 // Verifycount
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

 // VerifyField
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

 // MarkFieldasalreadyTouch
 const touchField = useCallback((fieldPath: string) => {
 setState((prev) => ({
 ...prev,
 touchedFields: new Set(prev.touchedFields).add(fieldPath),
 }));

 if (validateOnBlur) {
 validateField(fieldPath);
 }
 }, [validateOnBlur, validateField]);

 // FetchFieldError(DisplayalreadyTouchField'sError)
 const getFieldError = useCallback(
 (fieldPath: string): string | undefined => {
 if (!state.touchedFields.has(fieldPath)) return undefined;
 return state.errors[fieldPath];
 },
 [state.errors, state.touchedFields]
 );

 // ClearError
 const clearErrors = useCallback(() => {
 setState((prev) => ({
 ...prev,
 errors: {},
 isValid: true,
 }));
 }, []);

 // ClearSpecificFieldError
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

 // ResetStatus
 const reset = useCallback(() => {
 setState({
 errors: {},
 isValid: true,
 isValidating: false,
 touchedFields: new Set(),
 });
 }, []);

 // ConfigtimeAutoVerify(Debounce)
 useEffect(() => {
 if (!validateOnChange) return;

 const timeoutId = setTimeout(() => {
 // VerifyalreadyTouch'sField
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
