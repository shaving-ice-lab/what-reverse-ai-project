/**
 * 插件 Manifest 验证和处理
 */

import type { PluginManifest, PluginCategory, PluginPermission } from './types'
import { isValidSemver } from './version'

// ===== Manifest 验证 =====

/** 验证结果 */
export interface ManifestValidationResult {
  valid: boolean
  errors: ManifestValidationError[]
  warnings: ManifestValidationWarning[]
}

export interface ManifestValidationError {
  field: string
  message: string
  code: string
}

export interface ManifestValidationWarning {
  field: string
  message: string
  code: string
}

/** 有效的插件分类 */
const VALID_CATEGORIES: PluginCategory[] = [
  'ai',
  'data',
  'integration',
  'utility',
  'automation',
  'analytics',
  'communication',
  'development',
  'other',
]

/** 有效的权限 */
const VALID_PERMISSIONS: PluginPermission[] = [
  'network',
  'storage',
  'clipboard',
  'notifications',
  'env',
  'secrets',
  'filesystem',
  'shell',
  'api:workflows',
  'api:executions',
  'api:users',
  'ui:sidebar',
  'ui:toolbar',
  'ui:panel',
  'ui:modal',
]

/**
 * 验证 Manifest
 */
export function validateManifest(manifest: unknown): ManifestValidationResult {
  const errors: ManifestValidationError[] = []
  const warnings: ManifestValidationWarning[] = []

  if (!manifest || typeof manifest !== 'object') {
    return {
      valid: false,
      errors: [{ field: '_root', message: 'Manifest must be an object', code: 'INVALID_TYPE' }],
      warnings: [],
    }
  }

  const m = manifest as Record<string, unknown>

  // 必填字段验证
  validateRequired(m, 'manifestVersion', errors)
  validateRequired(m, 'id', errors)
  validateRequired(m, 'name', errors)
  validateRequired(m, 'version', errors)
  validateRequired(m, 'description', errors)
  validateRequired(m, 'author', errors)
  validateRequired(m, 'category', errors)
  validateRequired(m, 'main', errors)

  // manifestVersion 验证
  if (m.manifestVersion !== undefined && m.manifestVersion !== 1) {
    errors.push({
      field: 'manifestVersion',
      message: 'manifestVersion must be 1',
      code: 'INVALID_MANIFEST_VERSION',
    })
  }

  // id 格式验证
  if (typeof m.id === 'string' && !/^[a-z0-9-]+$/.test(m.id)) {
    errors.push({
      field: 'id',
      message: 'Plugin id must be lowercase alphanumeric with hyphens',
      code: 'INVALID_ID_FORMAT',
    })
  }

  // version 格式验证
  if (typeof m.version === 'string' && !isValidSemver(m.version)) {
    errors.push({
      field: 'version',
      message: 'Version must be in semver format (e.g., 1.0.0 or 1.0.0-rc.1)',
      code: 'INVALID_VERSION_FORMAT',
    })
  }

  // author 验证
  if (m.author && typeof m.author === 'object') {
    const author = m.author as Record<string, unknown>
    if (!author.name || typeof author.name !== 'string') {
      errors.push({
        field: 'author.name',
        message: 'Author name is required',
        code: 'REQUIRED',
      })
    }
  }

  // category 验证
  if (m.category && !VALID_CATEGORIES.includes(m.category as PluginCategory)) {
    errors.push({
      field: 'category',
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      code: 'INVALID_CATEGORY',
    })
  }

  // permissions 验证
  if (m.permissions && Array.isArray(m.permissions)) {
    for (let i = 0; i < m.permissions.length; i++) {
      const perm = m.permissions[i]
      if (typeof perm === 'string' && !VALID_PERMISSIONS.includes(perm as PluginPermission)) {
        warnings.push({
          field: `permissions[${i}]`,
          message: `Unknown permission: ${perm}`,
          code: 'UNKNOWN_PERMISSION',
        })
      }
    }

    // 危险权限警告
    if (m.permissions.includes('shell')) {
      warnings.push({
        field: 'permissions',
        message: 'Shell permission is dangerous and may be rejected',
        code: 'DANGEROUS_PERMISSION',
      })
    }
    if (m.permissions.includes('filesystem')) {
      warnings.push({
        field: 'permissions',
        message: 'Filesystem permission requires careful review',
        code: 'SENSITIVE_PERMISSION',
      })
    }
  }

  // nodes 验证
  if (m.nodes && Array.isArray(m.nodes)) {
    for (let i = 0; i < m.nodes.length; i++) {
      const node = m.nodes[i] as Record<string, unknown>
      if (!node.id || typeof node.id !== 'string') {
        errors.push({
          field: `nodes[${i}].id`,
          message: 'Node id is required',
          code: 'REQUIRED',
        })
      }
      if (!node.path || typeof node.path !== 'string') {
        errors.push({
          field: `nodes[${i}].path`,
          message: 'Node path is required',
          code: 'REQUIRED',
        })
      }
    }
  }

  // dependencies 验证
  if (m.dependencies && Array.isArray(m.dependencies)) {
    for (let i = 0; i < m.dependencies.length; i++) {
      const dep = m.dependencies[i] as Record<string, unknown>
      if (!dep.id || typeof dep.id !== 'string') {
        errors.push({
          field: `dependencies[${i}].id`,
          message: 'Dependency id is required',
          code: 'REQUIRED',
        })
      }
      if (!dep.version || typeof dep.version !== 'string') {
        errors.push({
          field: `dependencies[${i}].version`,
          message: 'Dependency version is required',
          code: 'REQUIRED',
        })
      }
    }
  }

  // settings 验证
  if (m.settings && Array.isArray(m.settings)) {
    const validTypes = ['string', 'number', 'boolean', 'select', 'multiselect']
    for (let i = 0; i < m.settings.length; i++) {
      const setting = m.settings[i] as Record<string, unknown>
      if (!setting.key || typeof setting.key !== 'string') {
        errors.push({
          field: `settings[${i}].key`,
          message: 'Setting key is required',
          code: 'REQUIRED',
        })
      }
      if (!setting.title || typeof setting.title !== 'string') {
        errors.push({
          field: `settings[${i}].title`,
          message: 'Setting title is required',
          code: 'REQUIRED',
        })
      }
      if (!setting.type || !validTypes.includes(setting.type as string)) {
        errors.push({
          field: `settings[${i}].type`,
          message: `Setting type must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE',
        })
      }
    }
  }

  // 可选字段建议
  if (!m.keywords || (Array.isArray(m.keywords) && m.keywords.length === 0)) {
    warnings.push({
      field: 'keywords',
      message: 'Adding keywords improves discoverability',
      code: 'MISSING_KEYWORDS',
    })
  }

  if (!m.license) {
    warnings.push({
      field: 'license',
      message: 'Specifying a license is recommended',
      code: 'MISSING_LICENSE',
    })
  }

  if (!m.repository) {
    warnings.push({
      field: 'repository',
      message: 'Specifying a repository improves trust',
      code: 'MISSING_REPOSITORY',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function validateRequired(
  obj: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
    errors.push({
      field,
      message: `${field} is required`,
      code: 'REQUIRED',
    })
  }
}

/**
 * 解析 Manifest 文件
 */
export function parseManifest(content: string): PluginManifest {
  const data = JSON.parse(content)
  const result = validateManifest(data)

  if (!result.valid) {
    throw new Error(`Invalid manifest: ${result.errors.map((e) => e.message).join(', ')}`)
  }

  return data as PluginManifest
}

/**
 * 创建默认 Manifest
 */
export function createDefaultManifest(
  id: string,
  name: string,
  options: Partial<PluginManifest> = {}
): PluginManifest {
  return {
    manifestVersion: 1,
    id,
    name,
    version: '1.0.0',
    description: '',
    author: { name: 'Unknown' },
    category: 'other',
    main: 'dist/index.js',
    ...options,
  }
}

/**
 * 序列化 Manifest
 */
export function serializeManifest(manifest: PluginManifest): string {
  return JSON.stringify(manifest, null, 2)
}

/**
 * 检查权限
 */
export function hasPermission(manifest: PluginManifest, permission: PluginPermission): boolean {
  return manifest.permissions?.includes(permission) ?? false
}

/**
 * 获取危险权限
 */
export function getDangerousPermissions(manifest: PluginManifest): PluginPermission[] {
  const dangerous: PluginPermission[] = ['shell', 'filesystem', 'secrets']
  return (manifest.permissions ?? []).filter((p) =>
    dangerous.includes(p as PluginPermission)
  ) as PluginPermission[]
}

/**
 * 比较版本
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA > numB) return 1
    if (numA < numB) return -1
  }

  return 0
}

/**
 * 检查版本兼容性
 */
export function isVersionCompatible(manifest: PluginManifest, appVersion: string): boolean {
  if (manifest.minAppVersion) {
    if (compareVersions(appVersion, manifest.minAppVersion) < 0) {
      return false
    }
  }

  if (manifest.maxAppVersion) {
    if (compareVersions(appVersion, manifest.maxAppVersion) > 0) {
      return false
    }
  }

  return true
}
