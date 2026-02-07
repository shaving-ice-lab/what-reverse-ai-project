/**
 * Input/OutputNodeExecute
 */

import type { NodeExecutor, NodeResult } from "../types";
import { createNodeError } from "../utils";

type InputConfig = {
 inputType?: string;
 name?: string;
 label?: string;
 defaultValue?: unknown;
 required?: boolean;
 options?: Array<{ label: string; value: string }>;
};

type OutputConfig = {
 outputType?: string;
 title?: string;
 showTimestamp?: boolean;
 maxLength?: number;
};

export const inputExecutor: NodeExecutor<InputConfig> = {
 type: "input",

 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs } = context;
 const startTime = Date.now();

 const inputName = nodeConfig.name?.trim() || "input";
 const value =
 inputs[inputName] ??
 variables[inputName] ??
 nodeConfig.defaultValue;

 if (nodeConfig.required && (value === undefined || value === null)) {
 return {
 success: false,
 outputs: {},
 error: createNodeError("INPUT_REQUIRED", `fewRequiredField: ${inputName}`),
 duration: Date.now() - startTime,
 };
 }

 return {
 success: true,
 outputs: {
 value,
 output: value,
 [inputName]: value,
 },
 duration: Date.now() - startTime,
 };
 },
};

export const outputExecutor: NodeExecutor<OutputConfig> = {
 type: "output",

 async execute(context): Promise<NodeResult> {
 const { nodeConfig, inputs } = context;
 const startTime = Date.now();

 let value: unknown = inputs.output ?? inputs.value ?? inputs.input;
 if (value === undefined) {
 const firstValue = Object.values(inputs).find((item) => item !== undefined);
 value = firstValue;
 }

 return {
 success: true,
 outputs: {
 value,
 output: value,
 type: nodeConfig.outputType ?? "text",
 title: nodeConfig.title ?? "OutputResult",
 showTimestamp: Boolean(nodeConfig.showTimestamp),
 maxLength: nodeConfig.maxLength ?? 0,
 },
 duration: Date.now() - startTime,
 };
 },
};
