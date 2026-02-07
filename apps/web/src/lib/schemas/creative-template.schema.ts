/**
 * AI CreativeAssistantTemplate JSON Schema
 * 
 * Used forVerifyTemplateConfigData'sCompleteandcurrently
 * canand Zod, Ajv etcVerifyUsage
 */

import { z } from "zod";

// ===== BasicEnum Schema =====

/**
 * TemplateCategory Schema
 */
export const CreativeTemplateCategorySchema = z.enum([
 "business",
 "content",
 "product",
 "marketing",
]);

/**
 * InputFieldType Schema
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

// ===== InputField Schema =====

/**
 * downOption Schema
 */
export const SelectOptionSchema = z.object({
 value: z.string().min(1, "OptionvalueCannot be empty"),
 label: z.string().min(1, "OptionTagsCannot be empty"),
 description: z.string().optional(),
});

/**
 * InputVerifyRule Schema
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
 { message: "minLength Mustsmallatetcat maxLength" }
).refine(
 (data) => {
 if (data.min !== undefined && data.max !== undefined) {
 return data.min <= data.max;
 }
 return true;
 },
 { message: "min Mustsmallatetcat max" }
);

/**
 * ConditionDisplayRule Schema
 */
export const ShowWhenSchema = z.object({
 field: z.string().min(1, "DependencyField ID Cannot be empty"),
 operator: z.enum(["eq", "neq", "contains", "notEmpty"]),
 value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

/**
 * InputField Schema
 */
export const InputFieldSchema = z.object({
 id: z.string()
.min(1, "Field ID Cannot be empty")
.regex(/^[a-z_][a-z0-9_]*$/, "Field ID Mustissmallchar, countcharanddownline, andwithcharordownlinehead"),
 label: z.string().min(1, "FieldTagsCannot be empty").max(100, "FieldTagsnotcanExceed 100 Character"),
 type: InputFieldTypeSchema,
 placeholder: z.string().max(500, "PlaceholdernotcanExceed 500 Character").optional(),
 helpText: z.string().max(500, "HelpTextnotcanExceed 500 Character").optional(),
 defaultValue: z.union([
 z.string(),
 z.number(),
 z.boolean(),
 z.array(z.string()),
 ]).optional(),
 options: z.array(SelectOptionSchema).optional(),
 validation: InputValidationSchema.optional(),
 aiSuggest: z.boolean().optional(),
 aiSuggestPrompt: z.string().max(2000, "AI SuggestionPromptnotcanExceed 2000 Character").optional(),
 showWhen: ShowWhenSchema.optional(),
}).refine(
 (data) => {
 // select and multiselect TypeMusthas options
 if (data.type === "select" || data.type === "multiselect") {
 return data.options && data.options.length >= 1;
 }
 return true;
 },
 { message: "select and multiselect TypeMustfewhas1Option" }
).refine(
 (data) => {
 // aiSuggest as true timeSuggestionhas aiSuggestPrompt
 if (data.aiSuggest && !data.aiSuggestPrompt) {
 return true; // isWarning, notForce
 }
 return true;
 },
 { message: "Enable AI SuggestiontimeSuggestionProvide aiSuggestPrompt" }
);

// ===== OutputChapter Schema =====

/**
 * OutputChapter Schema
 */
export const OutputSectionSchema = z.object({
 id: z.string()
.min(1, "Chapter ID Cannot be empty")
.regex(/^[a-z_][a-z0-9_-]*$/, "Chapter ID Mustissmallchar, countchar, downlineandCharacter"),
 title: z.string().min(1, "ChapterTitleCannot be empty").max(100, "ChapterTitlenotcanExceed 100 Character"),
 description: z.string().max(500, "ChapterDescriptionnotcanExceed 500 Character"),
 promptTemplate: z.string().min(10, "PromptTemplatenotcanfewat 10 Character"),
 icon: z.string().max(50).optional(),
 estimatedTime: z.number().min(1).max(600).optional(), // mostmultiple 10 min
 dependsOn: z.array(z.string()).optional(),
 regeneratable: z.boolean().optional().default(true),
 outputFormat: z.enum(["markdown", "json", "table", "list"]).optional().default("markdown"),
});

// ===== TemplateExample Schema =====

/**
 * TemplateExample Schema
 */
export const TemplateExampleSchema = z.object({
 input: z.record(z.string(), z.unknown()),
 output: z.string().min(100, "ExampleOutputfewneedneed 100 Character"),
 title: z.string().max(100).optional(),
 description: z.string().max(500).optional(),
});

// ===== TemplatemainStructure Schema =====

/**
 * CreativeTemplate Schema
 */
export const CreativeTemplateSchema = z.object({
 id: z.string()
.min(1, "Template ID Cannot be empty")
.regex(/^[a-z][a-z0-9-]*$/, "Template ID Mustissmallchar, countcharandCharacter, andwithcharhead"),
 name: z.string().min(2, "TemplateNamefew 2 Character").max(50, "TemplateNamenotcanExceed 50 Character"),
 description: z.string().min(10, "TemplateDescriptionfew 10 Character").max(500, "TemplateDescriptionnotcanExceed 500 Character"),
 icon: z.string().min(1, "IconCannot be empty").max(50, "IconNamenotcanExceed 50 Character"),
 category: CreativeTemplateCategorySchema,
 inputs: z.object({
 required: z.array(InputFieldSchema).min(1, "fewneedneed1RequiredField"),
 optional: z.array(InputFieldSchema).default([]),
 }),
 outputSections: z.array(OutputSectionSchema).min(1, "fewneedneed1OutputChapter"),
 workflowId: z.string().min(1, "Workflow ID Cannot be empty"),
 example: TemplateExampleSchema.optional(),
 usageCount: z.number().min(0).default(0),
 rating: z.number().min(0).max(5).default(0),
 reviewCount: z.number().min(0).default(0),
 tags: z.array(z.string().max(20)).max(10, "TagsnotcanExceed 10 ").default([]),
 estimatedTime: z.number().min(10).max(1800).optional(), // 10s - 30min
 isOfficial: z.boolean().optional().default(false),
 creatorId: z.string().optional(),
 creatorName: z.string().max(50).optional(),
 version: z.number().min(1).default(1),
 createdAt: z.string().datetime().optional(),
 updatedAt: z.string().datetime().optional(),
}).refine(
 (data) => {
 // VerifyOutputChapter's dependsOn useisnoValid
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
 { message: "Chapter's dependsOn useDoes not exist'sChapter ID" }
).refine(
 (data) => {
 // VerifyExampleInputisnoContainsAllRequiredField
 if (data.example) {
 const requiredIds = data.inputs.required.map((f) => f.id);
 const inputKeys = Object.keys(data.example.input);
 return requiredIds.every((id) => inputKeys.includes(id));
 }
 return true;
 },
 { message: "TemplateExampleMustContainsAllRequiredField'sInput" }
);

// ===== CreateTemplateRequest Schema =====

/**
 * Create/UpdateTemplateRequest Schema (notContainsAutoGenerate'sField)
 */
export const CreateTemplateRequestSchema = CreativeTemplateSchema.omit({
 usageCount: true,
 rating: true,
 reviewCount: true,
 createdAt: true,
 updatedAt: true,
});

// ===== TypeInfer =====

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

// ===== VerifyHelper Functioncount =====

/**
 * VerifyTemplateConfig
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
 * VerifyInputField
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
 * VerifyOutputChapter
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
 * FormatVerifyErrorasUserFriendly'sMessage
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
 return errors.errors.map((err) => {
 const path = err.path.join(".");
 return path ? `${path}: ${err.message}` : err.message;
 });
}
