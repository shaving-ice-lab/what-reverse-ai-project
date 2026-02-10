/**
 * AI Creative Assistant template JSON schema.
 * Used to verify template config data completeness; can be used with Zod, Ajv, etc.
 */

import { z } from 'zod'

// ===== Basic Enum Schema =====

/**
 * Template Category Schema
 */
export const CreativeTemplateCategorySchema = z.enum([
  'business',
  'content',
  'product',
  'marketing',
])

/**
 * Input Field Type Schema
 */
export const InputFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'select',
  'multiselect',
  'slider',
  'switch',
  'date',
])

// ===== Input Field Schema =====

/**
 * Dropdown Option Schema
 */
export const SelectOptionSchema = z.object({
  value: z.string().min(1, 'Option value cannot be empty'),
  label: z.string().min(1, 'Option label cannot be empty'),
  description: z.string().optional(),
})

/**
 * Input Validation Rule Schema
 */
export const InputValidationSchema = z
  .object({
    required: z.boolean().optional(),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternMessage: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.minLength !== undefined && data.maxLength !== undefined) {
        return data.minLength <= data.maxLength
      }
      return true
    },
    { message: 'minLength must be less than or equal to maxLength' }
  )
  .refine(
    (data) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max
      }
      return true
    },
    { message: 'min must be less than or equal to max' }
  )

/**
 * Conditional Display Rule Schema
 */
export const ShowWhenSchema = z.object({
  field: z.string().min(1, 'Dependency field ID cannot be empty'),
  operator: z.enum(['eq', 'neq', 'contains', 'notEmpty']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

/**
 * Input Field Schema
 */
export const InputFieldSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Field ID cannot be empty')
      .regex(
        /^[a-z_][a-z0-9_]*$/,
        'Field ID must contain only lowercase letters, numbers, and underscores, and start with a letter or underscore'
      ),
    label: z
      .string()
      .min(1, 'Field label cannot be empty')
      .max(100, 'Field label cannot exceed 100 characters'),
    type: InputFieldTypeSchema,
    placeholder: z.string().max(500, 'Placeholder cannot exceed 500 characters').optional(),
    helpText: z.string().max(500, 'Help text cannot exceed 500 characters').optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
    options: z.array(SelectOptionSchema).optional(),
    validation: InputValidationSchema.optional(),
    aiSuggest: z.boolean().optional(),
    aiSuggestPrompt: z
      .string()
      .max(2000, 'AI suggestion prompt cannot exceed 2000 characters')
      .optional(),
    showWhen: ShowWhenSchema.optional(),
  })
  .refine(
    (data) => {
      // select and multiselect types must have options
      if (data.type === 'select' || data.type === 'multiselect') {
        return data.options && data.options.length >= 1
      }
      return true
    },
    { message: 'select and multiselect types must have at least 1 option' }
  )
  .refine(
    (data) => {
      // When aiSuggest is true, it's recommended to have aiSuggestPrompt
      if (data.aiSuggest && !data.aiSuggestPrompt) {
        return true // Warning only, not enforced
      }
      return true
    },
    { message: 'When AI suggestion is enabled, it is recommended to provide aiSuggestPrompt' }
  )

// ===== Output Section Schema =====

/**
 * Output Section Schema
 */
export const OutputSectionSchema = z.object({
  id: z
    .string()
    .min(1, 'Section ID cannot be empty')
    .regex(
      /^[a-z_][a-z0-9_-]*$/,
      'Section ID must contain only lowercase letters, numbers, underscores, and hyphens'
    ),
  title: z
    .string()
    .min(1, 'Section title cannot be empty')
    .max(100, 'Section title cannot exceed 100 characters'),
  description: z.string().max(500, 'Section description cannot exceed 500 characters'),
  promptTemplate: z.string().min(10, 'Prompt template must be at least 10 characters'),
  icon: z.string().max(50).optional(),
  estimatedTime: z.number().min(1).max(600).optional(), // Max 10 minutes
  dependsOn: z.array(z.string()).optional(),
  regeneratable: z.boolean().optional().default(true),
  outputFormat: z.enum(['markdown', 'json', 'table', 'list']).optional().default('markdown'),
})

// ===== Template Example Schema =====

/**
 * Template Example Schema
 */
export const TemplateExampleSchema = z.object({
  input: z.record(z.string(), z.unknown()),
  output: z.string().min(100, 'Example output must be at least 100 characters'),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
})

// ===== Template Main Structure Schema =====

/**
 * Creative Template Schema
 */
export const CreativeTemplateSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Template ID cannot be empty')
      .regex(
        /^[a-z][a-z0-9-]*$/,
        'Template ID must contain only lowercase letters, numbers, and hyphens, and start with a letter'
      ),
    name: z
      .string()
      .min(2, 'Template name must be at least 2 characters')
      .max(50, 'Template name cannot exceed 50 characters'),
    description: z
      .string()
      .min(10, 'Template description must be at least 10 characters')
      .max(500, 'Template description cannot exceed 500 characters'),
    icon: z
      .string()
      .min(1, 'Icon cannot be empty')
      .max(50, 'Icon name cannot exceed 50 characters'),
    category: CreativeTemplateCategorySchema,
    inputs: z.object({
      required: z.array(InputFieldSchema).min(1, 'At least 1 required field is needed'),
      optional: z.array(InputFieldSchema).default([]),
    }),
    outputSections: z.array(OutputSectionSchema).min(1, 'At least 1 output section is needed'),
    workflowId: z.string().min(1, 'Workflow ID cannot be empty'),
    example: TemplateExampleSchema.optional(),
    usageCount: z.number().min(0).default(0),
    rating: z.number().min(0).max(5).default(0),
    reviewCount: z.number().min(0).default(0),
    tags: z.array(z.string().max(20)).max(10, 'Tags cannot exceed 10').default([]),
    estimatedTime: z.number().min(10).max(1800).optional(), // 10s - 30min
    isOfficial: z.boolean().optional().default(false),
    creatorId: z.string().optional(),
    creatorName: z.string().max(50).optional(),
    version: z.number().min(1).default(1),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      // Verify that output section dependsOn references are valid
      const sectionIds = new Set(data.outputSections.map((s) => s.id))
      for (const section of data.outputSections) {
        if (section.dependsOn) {
          for (const depId of section.dependsOn) {
            if (!sectionIds.has(depId)) {
              return false
            }
          }
        }
      }
      return true
    },
    { message: 'Section dependsOn references a non-existent section ID' }
  )
  .refine(
    (data) => {
      // Verify that the example input contains all required fields
      if (data.example) {
        const requiredIds = data.inputs.required.map((f) => f.id)
        const inputKeys = Object.keys(data.example.input)
        return requiredIds.every((id) => inputKeys.includes(id))
      }
      return true
    },
    { message: 'Template example must contain input for all required fields' }
  )

// ===== Create Template Request Schema =====

/**
 * Create/Update Template Request Schema (excludes auto-generated fields)
 */
export const CreateTemplateRequestSchema = CreativeTemplateSchema.omit({
  usageCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
})

// ===== Type Inference =====

export type CreativeTemplateCategoryType = z.infer<typeof CreativeTemplateCategorySchema>
export type InputFieldTypeType = z.infer<typeof InputFieldTypeSchema>
export type SelectOptionType = z.infer<typeof SelectOptionSchema>
export type InputValidationType = z.infer<typeof InputValidationSchema>
export type ShowWhenType = z.infer<typeof ShowWhenSchema>
export type InputFieldType = z.infer<typeof InputFieldSchema>
export type OutputSectionType = z.infer<typeof OutputSectionSchema>
export type TemplateExampleType = z.infer<typeof TemplateExampleSchema>
export type CreativeTemplateType = z.infer<typeof CreativeTemplateSchema>
export type CreateTemplateRequestType = z.infer<typeof CreateTemplateRequestSchema>

// ===== Validation Helper Functions =====

/**
 * Validate template configuration
 */
export function validateTemplate(data: unknown): {
  success: boolean
  data?: CreativeTemplateType
  errors?: z.ZodError
} {
  const result = CreativeTemplateSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Validate input field
 */
export function validateInputField(data: unknown): {
  success: boolean
  data?: InputFieldType
  errors?: z.ZodError
} {
  const result = InputFieldSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Validate output section
 */
export function validateOutputSection(data: unknown): {
  success: boolean
  data?: OutputSectionType
  errors?: z.ZodError
} {
  const result = OutputSectionSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Format validation errors as user-friendly messages
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}
