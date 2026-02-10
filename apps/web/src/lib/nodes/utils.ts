/**
 * NodeExecuteToolcount
 */

/**
 * Parse Variable Path, Get Nested Value
 * @example getValueByPath({ user: { name: 'John' } }, 'user.name') => 'John'
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (!path || !obj) return undefined

  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }

    // ProcesscountgroupIndex [0]
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, key, indexStr] = arrayMatch
      const index = parseInt(indexStr, 10)
      current = (current as Record<string, unknown>)[key]
      if (Array.isArray(current)) {
        current = current[index]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)[part]
    }
  }

  return current
}

/**
 * Set Nested Value
 */
export function setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
}

/**
 * Parse Template String's Variable
 * @example renderTemplate('Hello {{name}}!', { name: 'World' }) => 'Hello World!'
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  if (!template) return ''

  return template.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
    const path = varPath.trim()
    const value = getValueByPath(variables, path)

    if (value === undefined || value === null) {
      return match // Retain Original Variable Mark
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  })
}

/**
 * Detect Template's Variable
 */
export function extractTemplateVariables(template: string): string[] {
  const variables: string[] = []
  const pattern = /\{\{([^}]+)\}\}/g
  let match

  while ((match = pattern.exec(template)) !== null) {
    const varPath = match[1].trim()
    if (!variables.includes(varPath)) {
      variables.push(varPath)
    }
  }

  return variables
}

/**
 * Create Latency
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry's Execute Count
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number
    delay: number
    onRetry?: (error: Error, attempt: number) => void
  }
): Promise<T> {
  const { retries, delay: retryDelay, onRetry } = options
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < retries) {
        onRetry?.(lastError, attempt + 1)
        await delay(retryDelay)
      }
    }
  }

  throw lastError
}

/**
 * Timeout's Execute Count
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

/**
 * CreateNodeError
 */
export function createNodeError(
  code: string,
  message: string,
  details?: unknown,
  retryable = false
): { code: string; message: string; details?: unknown; retryable: boolean } {
  return { code, message, details, retryable }
}

/**
 * Format Continuous Time
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

/**
 * Security's JSON Parse
 */
export function safeJSONParse<T = unknown>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str) as T
  } catch {
    return defaultValue
  }
}

/**
 * Deep Copy For
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T
  }

  const cloned = {} as Record<string, unknown>
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key])
    }
  }

  return cloned as T
}

/**
 * And Variable Context
 */
export function mergeContext(...contexts: Record<string, unknown>[]): Record<string, unknown> {
  return contexts.reduce((merged, ctx) => {
    return { ...merged, ...ctx }
  }, {})
}
