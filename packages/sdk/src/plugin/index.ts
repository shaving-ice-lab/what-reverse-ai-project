/**
 * 插件系统模块
 */

// 类型导出
export type {
  // Manifest 类型
  PluginManifest,
  PluginAuthor,
  PluginCategory,
  PluginNodeEntry,
  PluginPermission,
  PluginDependency,
  PluginSettingDefinition,
  PluginActivationEvent,
  PluginContributes,
  PluginCommand,
  PluginMenuItem,
  PluginKeybinding,
  PluginView,
  PluginTheme,
  // API 类型
  PluginContext,
  PluginLogger,
  Disposable,
  PluginAPI,
  CommandsAPI,
  WorkflowsAPI,
  WorkflowInfo,
  CreateWorkflowData,
  UpdateWorkflowData,
  ExecutionInfo,
  StorageAPI,
  UIAPI,
  NotificationOptions,
  QuickPickItem,
  QuickPickOptions,
  InputBoxOptions,
  StatusBarItemOptions,
  StatusBarItem,
  EventsAPI,
  Event,
  // 模块类型
  PluginModule,
  PluginState,
  InstalledPlugin,
} from "./types";

// Manifest 工具
export {
  validateManifest,
  parseManifest,
  createDefaultManifest,
  serializeManifest,
  hasPermission,
  getDangerousPermissions,
  compareVersions,
  isVersionCompatible,
} from "./manifest";

export type {
  ManifestValidationResult,
  ManifestValidationError,
  ManifestValidationWarning,
} from "./manifest";

// 加载器
export {
  PluginLoader,
  PluginRegistry,
  createDisposable,
  combineDisposables,
} from "./loader";

export type {
  PluginLoaderConfig,
  LoadedPlugin,
} from "./loader";

// 沙箱
export {
  PermissionChecker,
  PermissionDeniedError,
  createSandboxedAPI,
  createSafeHttpClient,
  executeWithTimeout,
  ResourceMonitor,
  SandboxExecutor,
} from "./sandbox";

export type {
  SandboxConfig,
  SandboxContext,
  SafeHttpOptions,
} from "./sandbox";

// 权限管理
export {
  PERMISSION_METADATA,
  PermissionManager,
  PolicyChecker,
  PermissionAuditor,
  DEFAULT_POLICY,
} from "./permissions";

export type {
  PermissionMeta,
  PermissionRequest,
  PermissionGrant,
  PermissionPolicy,
  PermissionAuditEntry,
} from "./permissions";

// 安装管理
export {
  PluginInstaller,
  checkForUpdates,
} from "./installer";

export type {
  InstallConfig,
  InstallSource,
  InstallOptions,
  InstallResult,
  UninstallResult,
  UpdateInfo,
} from "./installer";

// 市场
export {
  MarketplaceClient,
  PublisherClient,
  MarketplaceCache,
  CachedMarketplaceClient,
} from "./marketplace";

export type {
  MarketplacePlugin,
  PluginVersionInfo,
  SearchOptions,
  SearchResult,
  MarketplaceStats,
  MarketplaceClientConfig,
  PublishRequest,
  PublishResult,
  CacheConfig,
} from "./marketplace";

// 版本管理
export {
  parseVersion,
  formatVersion,
  compareVersions,
  satisfiesRange,
  bumpVersion,
  VersionManager,
  checkCompatibility,
  checkUpgradeCompatibility,
} from "./version";

export type {
  SemanticVersion,
  VersionBump,
  VersionHistory,
  VersionManagerConfig,
  CompatibilityResult,
  CompatibilityIssue,
} from "./version";

// 签名验证
export {
  SignatureVerifier,
  SignatureGenerator,
  createSignatureFile,
  parseSignatureFile,
  serializeSignatureFile,
  computeChecksum,
  verifyChecksum,
  computeFileChecksums,
} from "./signature";

export type {
  SignatureAlgorithm,
  PluginSignature,
  SignatureVerificationResult,
  SignatureError,
  SignatureWarning,
  SignerInfo,
  CertificateInfo,
  SignatureVerifierConfig,
  SignatureGeneratorConfig,
  SignatureFile,
} from "./signature";
