/**
 * HTTP Tools 示例插件
 * 
 * 演示更复杂的插件功能：
 * - 网络请求
 * - 请求日志记录
 * - 自定义节点注册
 * - 面板 UI
 */

import type { PluginContext, PluginAPI, PluginModule } from "../../types";

// 请求日志
interface RequestLog {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
  response?: unknown;
  error?: string;
}

let requestLogs: RequestLog[] = [];
let logEnabled = true;
let maxLogSize = 100;

/**
 * 激活插件
 */
export async function activate(context: PluginContext, api: PluginAPI): Promise<void> {
  const { log } = context;

  log.info("Activating HTTP Tools plugin");

  // 加载配置
  logEnabled = (await api.storage.get<boolean>("settings.logRequests")) ?? true;
  maxLogSize = (await api.storage.get<number>("settings.maxLogSize")) ?? 100;

  // 加载历史日志
  requestLogs = (await api.storage.get<RequestLog[]>("requestLogs")) || [];

  // 注册测试请求命令
  const testRequestCmd = api.commands.registerCommand(
    "http-tools.testRequest",
    async () => {
      const url = await api.ui.showInputBox({
        title: "输入 URL",
        placeholder: "https://api.example.com/data",
        validateInput: (value) => {
          try {
            new URL(value);
            return undefined;
          } catch {
            return "请输入有效的 URL";
          }
        },
      });

      if (!url) return;

      const method = await api.ui.showQuickPick(
        [
          { label: "GET", description: "获取数据" },
          { label: "POST", description: "发送数据" },
          { label: "PUT", description: "更新数据" },
          { label: "DELETE", description: "删除数据" },
        ],
        { title: "选择请求方法" }
      );

      if (!method) return;

      api.ui.showMessage(`正在请求 ${url}...`, "info");
      log.info(`Testing HTTP request: ${method.label} ${url}`);

      const startTime = Date.now();
      const requestLog: RequestLog = {
        id: generateId(),
        url,
        method: method.label,
        status: 0,
        duration: 0,
        timestamp: new Date(),
      };

      try {
        const response = await fetch(url, { method: method.label });
        const data = await response.json().catch(() => response.text());

        requestLog.status = response.status;
        requestLog.duration = Date.now() - startTime;
        requestLog.response = data;

        api.ui.showNotification({
          message: `请求成功: ${response.status} (${requestLog.duration}ms)`,
          type: "success",
        });

        log.info(`Request completed: ${response.status}`);
      } catch (error) {
        requestLog.duration = Date.now() - startTime;
        requestLog.error = error instanceof Error ? error.message : String(error);

        api.ui.showNotification({
          message: `请求失败: ${requestLog.error}`,
          type: "error",
        });

        log.error(`Request failed: ${requestLog.error}`);
      }

      // 保存日志
      if (logEnabled) {
        await saveRequestLog(requestLog, api);
      }
    }
  );
  context.subscriptions.push(testRequestCmd);

  // 注册查看日志命令
  const viewLogsCmd = api.commands.registerCommand(
    "http-tools.viewLogs",
    async () => {
      if (requestLogs.length === 0) {
        api.ui.showMessage("没有请求日志", "info");
        return;
      }

      const items = requestLogs.slice(-20).reverse().map((log) => ({
        label: `${log.method} ${log.url}`,
        description: `${log.status || "Error"} - ${log.duration}ms`,
        detail: new Date(log.timestamp).toLocaleString(),
        log,
      }));

      const selected = await api.ui.showQuickPick(items, {
        title: "请求日志",
        placeholder: "选择查看详情",
      });

      if (selected) {
        const logDetail = JSON.stringify(selected.log, null, 2);
        api.ui.showMessage(logDetail, "info");
      }
    }
  );
  context.subscriptions.push(viewLogsCmd);

  // 注册清除日志命令
  const clearLogsCmd = api.commands.registerCommand(
    "http-tools.clearLogs",
    async () => {
      requestLogs = [];
      await api.storage.set("requestLogs", []);
      api.ui.showNotification({
        message: "请求日志已清除",
        type: "success",
      });
      log.info("Request logs cleared");
    }
  );
  context.subscriptions.push(clearLogsCmd);

  log.info("HTTP Tools plugin activated");
}

/**
 * 停用插件
 */
export async function deactivate(): Promise<void> {
  console.log("HTTP Tools plugin deactivated");
}

/**
 * 保存请求日志
 */
async function saveRequestLog(log: RequestLog, api: PluginAPI): Promise<void> {
  requestLogs.push(log);

  // 限制日志数量
  if (requestLogs.length > maxLogSize) {
    requestLogs = requestLogs.slice(-maxLogSize);
  }

  await api.storage.set("requestLogs", requestLogs);
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 导出插件模块
const plugin: PluginModule = {
  activate,
  deactivate,
};

export default plugin;
