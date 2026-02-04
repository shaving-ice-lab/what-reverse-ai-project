/**
 * 插件系统类型定义
 */

// ===== Manifest 规范 =====

/** 插件 Manifest */
export interface PluginManifest {
  /** Manifest 版本 */
  manifestVersion: 1;
  /** 插件唯一标识符 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 作者信息 */
  author: PluginAuthor;
  /** 插件图标 */
  icon?: string;
  /** 插件分类 */
  category: PluginCategory;
  /** 关键词 */
  keywords?: string[];
  /** 许可证 */
  license?: string;
  /** 仓库地址 */
  repository?: string;
  /** 主页地址 */
  homepage?: string;
  /** 最低支持版本 */
  minAppVersion?: string;
  /** 最高支持版本 */
  maxAppVersion?: string;
  /** 插件入口 */
  main: string;
  /** 节点定义 */
  nodes?: PluginNodeEntry[];
  /** 权限声明 */
  permissions?: PluginPermission[];
  /** 依赖项 */
  dependencies?: PluginDependency[];
  /** 配置项 */
  settings?: PluginSettingDefinition[];
  /** 激活事件 */
  activationEvents?: PluginActivationEvent[];
  /** 贡献点 */
  contributes?: PluginContributes;
}

/** 作者信息 */
export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

/** 插件分类 */
export type PluginCategory =
  | "ai"           // AI 相关
  | "data"         // 数据处理
  | "integration"  // 第三方集成
  | "utility"      // 工具类
  | "automation"   // 自动化
  | "analytics"    // 分析
  | "communication"// 通信
  | "development"  // 开发工具
  | "other";       // 其他

/** 节点入口 */
export interface PluginNodeEntry {
  /** 节点 ID */
  id: string;
  /** 节点文件路径 */
  path: string;
  /** 是否默认启用 */
  enabled?: boolean;
}

/** 权限类型 */
export type PluginPermission =
  | "network"           // 网络访问
  | "storage"           // 存储访问
  | "storage:read"      // 存储只读
  | "storage:write"     // 存储写入
  | "clipboard"         // 剪贴板
  | "notifications"     // 通知
  | "env"              // 环境变量
  | "secrets"          // 密钥访问
  | "filesystem"       // 文件系统（受限）
  | "shell"            // Shell 命令（危险）
  | "api:workflows"    // 工作流 API
  | "api:executions"   // 执行 API
  | "api:users"        // 用户 API
  | "ui:sidebar"       // 侧边栏 UI
  | "ui:toolbar"       // 工具栏 UI
  | "ui:panel"         // 面板 UI
  | "ui:modal";        // 模态框 UI

/** 依赖项 */
export interface PluginDependency {
  /** 依赖插件 ID */
  id: string;
  /** 版本范围 */
  version: string;
  /** 是否可选 */
  optional?: boolean;
}

/** 配置项定义 */
export interface PluginSettingDefinition {
  /** 配置键 */
  key: string;
  /** 显示名称 */
  title: string;
  /** 描述 */
  description?: string;
  /** 类型 */
  type: "string" | "number" | "boolean" | "select" | "multiselect";
  /** 默认值 */
  default?: unknown;
  /** 选项（用于 select/multiselect） */
  options?: Array<{ label: string; value: string | number }>;
  /** 是否必填 */
  required?: boolean;
}

/** 激活事件 */
export type PluginActivationEvent =
  | "*"                                    // 立即激活
  | "onStartup"                            // 启动时
  | `onCommand:${string}`                  // 执行命令时
  | `onNode:${string}`                     // 使用节点时
  | `onWorkflow:${string}`                 // 工作流事件
  | `onLanguage:${string}`;                // 语言相关

/** 贡献点 */
export interface PluginContributes {
  /** 命令 */
  commands?: PluginCommand[];
  /** 菜单项 */
  menus?: PluginMenuItem[];
  /** 快捷键 */
  keybindings?: PluginKeybinding[];
  /** 视图 */
  views?: PluginView[];
  /** 主题 */
  themes?: PluginTheme[];
}

/** 命令 */
export interface PluginCommand {
  id: string;
  title: string;
  icon?: string;
  category?: string;
}

/** 菜单项 */
export interface PluginMenuItem {
  command: string;
  when?: string;
  group?: string;
}

/** 快捷键 */
export interface PluginKeybinding {
  command: string;
  key: string;
  mac?: string;
  when?: string;
}

/** 视图 */
export interface PluginView {
  id: string;
  name: string;
  icon?: string;
  location: "sidebar" | "panel" | "toolbar";
}

/** 主题 */
export interface PluginTheme {
  id: string;
  label: string;
  path: string;
}

// ===== 插件 API =====

/** 插件上下文 */
export interface PluginContext {
  /** 插件 ID */
  pluginId: string;
  /** 插件版本 */
  version: string;
  /** 扩展路径 */
  extensionPath: string;
  /** 存储路径 */
  storagePath: string;
  /** 全局存储路径 */
  globalStoragePath: string;
  /** 日志输出 */
  log: PluginLogger;
  /** 订阅集合（用于清理） */
  subscriptions: Disposable[];
}

/** 日志接口 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/** 可释放资源 */
export interface Disposable {
  dispose(): void;
}

/** 插件 API */
export interface PluginAPI {
  /** 命令 API */
  commands: CommandsAPI;
  /** 工作流 API */
  workflows: WorkflowsAPI;
  /** 存储 API */
  storage: StorageAPI;
  /** UI API */
  ui: UIAPI;
  /** 事件 API */
  events: EventsAPI;
}

/** 命令 API */
export interface CommandsAPI {
  registerCommand(id: string, handler: (...args: unknown[]) => unknown): Disposable;
  executeCommand<T = unknown>(id: string, ...args: unknown[]): Promise<T>;
  getCommands(): string[];
}

/** 工作流 API */
export interface WorkflowsAPI {
  getWorkflows(): Promise<WorkflowInfo[]>;
  getWorkflow(id: string): Promise<WorkflowInfo | null>;
  createWorkflow(data: CreateWorkflowData): Promise<WorkflowInfo>;
  updateWorkflow(id: string, data: UpdateWorkflowData): Promise<WorkflowInfo>;
  deleteWorkflow(id: string): Promise<void>;
  executeWorkflow(id: string, inputs?: Record<string, unknown>): Promise<ExecutionInfo>;
}

export interface WorkflowInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  definition?: unknown;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  definition?: unknown;
}

export interface ExecutionInfo {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startedAt?: Date;
  completedAt?: Date;
  outputs?: Record<string, unknown>;
  error?: string;
}

/** 存储 API */
export interface StorageAPI {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

/** UI API */
export interface UIAPI {
  showMessage(message: string, type?: "info" | "warning" | "error"): void;
  showNotification(options: NotificationOptions): void;
  showQuickPick<T extends QuickPickItem>(items: T[], options?: QuickPickOptions): Promise<T | undefined>;
  showInputBox(options?: InputBoxOptions): Promise<string | undefined>;
  createStatusBarItem(options: StatusBarItemOptions): StatusBarItem;
}

export interface NotificationOptions {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  action?: { label: string; callback: () => void };
}

export interface QuickPickItem {
  label: string;
  description?: string;
  detail?: string;
}

export interface QuickPickOptions {
  title?: string;
  placeholder?: string;
  canPickMany?: boolean;
}

export interface InputBoxOptions {
  title?: string;
  placeholder?: string;
  value?: string;
  validateInput?: (value: string) => string | undefined;
}

export interface StatusBarItemOptions {
  text: string;
  tooltip?: string;
  command?: string;
  priority?: number;
}

export interface StatusBarItem extends Disposable {
  text: string;
  tooltip?: string;
  command?: string;
  show(): void;
  hide(): void;
}

/** 事件 API */
export interface EventsAPI {
  onDidChangeWorkflows: Event<void>;
  onDidExecuteWorkflow: Event<ExecutionInfo>;
  onDidChangeSettings: Event<string>;
}

export type Event<T> = (listener: (e: T) => void) => Disposable;

// ===== 插件生命周期 =====

/** 插件模块接口 */
export interface PluginModule {
  /** 激活插件 */
  activate(context: PluginContext, api: PluginAPI): void | Promise<void>;
  /** 停用插件（可选） */
  deactivate?(): void | Promise<void>;
}

// ===== 插件状态 =====

/** 插件状态 */
export type PluginState = 
  | "not-installed"
  | "installed"
  | "enabled"
  | "disabled"
  | "error";

/** 已安装插件信息 */
export interface InstalledPlugin {
  manifest: PluginManifest;
  state: PluginState;
  installPath: string;
  installedAt: Date;
  updatedAt?: Date;
  error?: string;
}
