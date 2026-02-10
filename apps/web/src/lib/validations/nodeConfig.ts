/**
 * Node Config Validation Schema
 * Uses zod for type-safe form validation
 */

import { z } from 'zod'

// ===== Basic Validation Schema =====

// Non-empty string
const nonEmptyString = z.string().min(1, 'This field cannot be empty')

const outputSchemaSchema = z.union([z.record(z.any()), z.string()])

// URL validation
const urlSchema = z.string().refine(
  (val) => {
    if (!val) return true // Allow empty value
    // Support variable syntax {{var}}
    if (val.includes('{{') && val.includes('}}')) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  },
  { message: 'Please enter a valid URL' }
)

// ===== LLM NodeConfig Schema =====

export const llmConfigSchema = z.object({
  model: z.string().min(1, 'Please select a model'),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  temperature: z.number().min(0, 'Minimum value is 0').max(2, 'Maximum value is 2').default(0.7),
  maxTokens: z
    .number()
    .int()
    .min(1, 'Minimum value is 1')
    .max(128000, 'Maximum value is 128000')
    .default(2048),
  max_tokens: z
    .number()
    .int()
    .min(1, 'Minimum value is 1')
    .max(128000, 'Maximum value is 128000')
    .optional(),
  outputSchema: outputSchemaSchema.optional(),
  output_schema: outputSchemaSchema.optional(),
  topP: z.number().min(0).max(1).default(1).optional(),
  frequencyPenalty: z.number().min(0).max(2).default(0).optional(),
  presencePenalty: z.number().min(0).max(2).default(0).optional(),
  streaming: z.boolean().default(false),
  timeout: z.number().int().min(1000).max(600000).default(60000).optional(),
  retryCount: z.number().int().min(0).max(10).default(0).optional(),
  retryDelay: z.number().int().min(0).max(60000).default(1000).optional(),
})

export type LLMConfig = z.infer<typeof llmConfigSchema>

// ===== HTTP NodeConfig Schema =====

const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

const authTypeSchema = z.enum(['none', 'basic', 'bearer', 'apiKey'])

export const httpConfigSchema = z.object({
  method: httpMethodSchema.default('GET'),
  url: urlSchema,
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}).optional(),
  body: z.any().optional(),
  bodyType: z.enum(['none', 'json', 'form', 'raw']).default('none'),
  timeout: z.number().int().min(1000).max(300000).default(30000),
  authType: authTypeSchema.default('none'),
  authConfig: z
    .object({
      username: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      apiKeyName: z.string().optional(),
      apiKeyValue: z.string().optional(),
      apiKeyIn: z.enum(['header', 'query']).optional(),
    })
    .optional(),
  followRedirects: z.boolean().default(true),
  validateStatus: z.boolean().default(true),
})

export type HTTPConfig = z.infer<typeof httpConfigSchema>

// ===== ConditionNodeConfig Schema =====

const conditionOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'matches',
  'empty',
  'notEmpty',
])

const singleConditionSchema = z.object({
  id: z.string(),
  left: z.string(),
  operator: conditionOperatorSchema,
  right: z.string(),
})

const conditionGroupSchema = z.object({
  id: z.string(),
  conditions: z.array(singleConditionSchema).min(1, 'At least one condition is required'),
  logic: z.enum(['and', 'or']).default('and'),
})

export const conditionConfigSchema = z.object({
  conditions: z.array(conditionGroupSchema).min(1, 'At least one condition group is required'),
  logic: z.enum(['and', 'or']).default('and'),
})

export type ConditionConfig = z.infer<typeof conditionConfigSchema>

// ===== LoopNodeConfig Schema =====

export const loopConfigSchema = z
  .object({
    mode: z.enum(['forEach', 'while', 'count']).default('forEach'),
    items: z.string().optional(),
    condition: z.string().optional(),
    count: z.number().int().min(1).max(100000).default(10).optional(),
    maxIterations: z.number().int().min(1).max(100000).default(1000),
  })
  .refine(
    (data) => {
      if (data.mode === 'forEach' && !data.items) {
        return false
      }
      if (data.mode === 'while' && !data.condition) {
        return false
      }
      return true
    },
    {
      message: 'Please fill in the required loop configuration',
      path: ['mode'],
    }
  )

export type LoopConfig = z.infer<typeof loopConfigSchema>

// ===== CodeNodeConfig Schema =====

export const codeConfigSchema = z.object({
  language: z.enum(['javascript', 'typescript']).default('javascript'),
  code: z.string().min(1, 'Please enter the code'),
  timeout: z.number().int().min(1000).max(300000).default(30000),
})

export type CodeConfig = z.infer<typeof codeConfigSchema>

// ===== TemplateNodeConfig Schema =====

export const templateConfigSchema = z.object({
  template: z.string().min(1, 'Please enter template content'),
})

export type TemplateConfig = z.infer<typeof templateConfigSchema>

// ===== VariableNodeConfig Schema =====

const identifierSchema = z
  .string()
  .min(1, 'Field cannot be empty')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Field can only contain letters, numbers, and underscores, and cannot start with a number'
  )

const optionalIdentifierSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (val === undefined || val.trim() === '') return true
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val)
    },
    {
      message:
        'Field can only contain letters, numbers, and underscores, and cannot start with a number',
    }
  )

export const variableConfigSchema = z.object({
  variableName: identifierSchema,
  valueType: z.enum(['string', 'number', 'boolean', 'object', 'array']).default('string'),
  value: z.any(),
})

export type VariableConfig = z.infer<typeof variableConfigSchema>

// ===== InputOutputNodeConfig Schema =====

const inputTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'password',
  'email',
  'url',
])

export const inputConfigSchema = z.object({
  inputType: inputTypeSchema.default('text'),
  name: optionalIdentifierSchema,
  label: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
})

export type InputConfig = z.infer<typeof inputConfigSchema>

const submitActionSchema = z.union([
  z.string().min(1, 'Submit action cannot be empty'),
  z.object({
    id: z.string().optional(),
    type: z.enum(['submit', 'reset', 'custom']).optional(),
    label: z.string().optional(),
  }),
])

export const uiTriggerConfigSchema = z.object({
  formId: z.string().min(1, 'Form ID cannot be empty').optional(),
  form_id: z.string().min(1, 'Form ID cannot be empty').optional(),
  submitAction: submitActionSchema.optional(),
  submit_action: submitActionSchema.optional(),
  validation: z.record(z.any()).optional(),
})

const outputTypeSchema = z.enum(['text', 'json', 'table', 'image', 'markdown', 'html', 'file'])

export const outputConfigSchema = z.object({
  outputType: outputTypeSchema.default('text'),
  title: z.string().optional(),
  showTimestamp: z.boolean().default(false),
  maxLength: z.number().int().min(0).max(100000).optional(),
  template: z.string().optional(),
})

export type OutputConfig = z.infer<typeof outputConfigSchema>

// ===== DatabaseNodeConfig Schema =====

const dbOperationSchema = z.enum(['select', 'insert', 'update', 'delete', 'migrate'])

const dbBaseConfigSchema = z.object({
  operation: dbOperationSchema.optional(),
  table: z.string().optional(),
  where: z.string().optional(),
  values: z.any().optional(),
  limit: z
    .number()
    .int()
    .min(1, 'Minimum value is 1')
    .max(100000, 'Maximum value is 100000')
    .optional(),
  sql: z.string().optional(),
})

const dbSelectConfigSchema = dbBaseConfigSchema.extend({
  table: nonEmptyString,
})

const dbInsertConfigSchema = dbBaseConfigSchema.extend({
  table: nonEmptyString,
  values: z.any(),
})

const dbUpdateConfigSchema = dbBaseConfigSchema.extend({
  table: nonEmptyString,
  values: z.any(),
})

const dbDeleteConfigSchema = dbBaseConfigSchema.extend({
  table: nonEmptyString,
})

const dbMigrateConfigSchema = dbBaseConfigSchema.extend({
  sql: nonEmptyString,
})

// ===== Node Basic Info Schema =====

export const nodeBasicSchema = z.object({
  label: nonEmptyString.max(50, 'Name cannot exceed 50 characters'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
})

export type NodeBasic = z.infer<typeof nodeBasicSchema>

// ===== Validation Result Type =====

export interface ValidationResult {
  success: boolean
  errors: Record<string, string>
  data?: unknown
}

// ===== Validation Function =====

export function validateConfig<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      errors: {},
      data: result.data,
    }
  }

  // Convert Zod errors to a simple error map
  const errors: Record<string, string> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })

  return {
    success: false,
    errors,
  }
}

// ===== Node Type to Schema Mapping =====

export const nodeConfigSchemas: Record<string, z.ZodSchema> = {
  llm: llmConfigSchema,
  http: httpConfigSchema,
  condition: conditionConfigSchema,
  loop: loopConfigSchema,
  code: codeConfigSchema,
  template: templateConfigSchema,
  variable: variableConfigSchema,
  start: uiTriggerConfigSchema,
  input: inputConfigSchema,
  output: outputConfigSchema,
  db_select: dbSelectConfigSchema,
  db_insert: dbInsertConfigSchema,
  db_update: dbUpdateConfigSchema,
  db_delete: dbDeleteConfigSchema,
  db_migrate: dbMigrateConfigSchema,
}

// Get the schema for a node type
export function getNodeConfigSchema(nodeType: string): z.ZodSchema | null {
  return nodeConfigSchemas[nodeType] || null
}

// Validate node config
export function validateNodeConfig(nodeType: string, config: unknown): ValidationResult {
  const schema = getNodeConfigSchema(nodeType)

  if (!schema) {
    return { success: true, errors: {}, data: config }
  }

  return validateConfig(schema, config)
}
