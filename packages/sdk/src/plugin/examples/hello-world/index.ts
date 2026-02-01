/**
 * Hello World 示例插件
 * 
 * 演示插件开发的基本模式：
 * - 注册命令
 * - 使用存储 API
 * - 显示通知
 * - 使用配置
 */

import type { PluginContext, PluginAPI, PluginModule } from "../../types";

// 插件状态
let activationCount = 0;

/**
 * 激活插件
 */
export async function activate(context: PluginContext, api: PluginAPI): Promise<void> {
  const { log, pluginId, version } = context;

  log.info(`Activating ${pluginId} v${version}`);

  // 读取激活次数
  activationCount = (await api.storage.get<number>("activationCount")) || 0;
  activationCount++;
  await api.storage.set("activationCount", activationCount);

  // 注册 Say Hello 命令
  const sayHelloDisposable = api.commands.registerCommand(
    "hello-world.sayHello",
    async () => {
      const greeting = (await api.storage.get<string>("settings.greeting")) || "Hello";
      const showNotification = (await api.storage.get<boolean>("settings.showNotification")) ?? true;

      log.info(`Saying hello with greeting: ${greeting}`);

      if (showNotification) {
        api.ui.showNotification({
          message: `${greeting}, World! 这是第 ${activationCount} 次激活`,
          type: "success",
          duration: 3000,
        });
      } else {
        api.ui.showMessage(`${greeting}, World!`, "info");
      }
    }
  );
  context.subscriptions.push(sayHelloDisposable);

  // 注册 Show Info 命令
  const showInfoDisposable = api.commands.registerCommand(
    "hello-world.showInfo",
    async () => {
      const info = [
        `Plugin ID: ${pluginId}`,
        `Version: ${version}`,
        `Activation Count: ${activationCount}`,
        `Extension Path: ${context.extensionPath}`,
      ].join("\n");

      api.ui.showMessage(info, "info");
      log.info("Plugin info displayed");
    }
  );
  context.subscriptions.push(showInfoDisposable);

  // 显示激活通知
  const showNotification = (await api.storage.get<boolean>("settings.showNotification")) ?? true;
  if (showNotification) {
    api.ui.showNotification({
      message: `Hello World 插件已激活 (第 ${activationCount} 次)`,
      type: "info",
    });
  }

  log.info(`${pluginId} activated successfully`);
}

/**
 * 停用插件
 */
export async function deactivate(): Promise<void> {
  // 清理工作在 subscriptions 中自动处理
  console.log("Hello World plugin deactivated");
}

// 导出插件模块
const plugin: PluginModule = {
  activate,
  deactivate,
};

export default plugin;
