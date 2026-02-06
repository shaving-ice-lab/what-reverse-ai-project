/**
 * @tauri-apps/plugin-* 的 Web 模式 noop 存根
 * 所有插件 API 调用将抛出错误或返回空值
 */

// plugin-os
export async function platform(): Promise<string> {
  throw new Error('[Tauri noop] platform() is not available in web mode');
}

// plugin-dialog
export async function open(_options?: unknown): Promise<null> {
  throw new Error('[Tauri noop] open() is not available in web mode');
}

export async function save(_options?: unknown): Promise<null> {
  throw new Error('[Tauri noop] save() is not available in web mode');
}

// plugin-fs
export async function readTextFile(_path: string): Promise<string> {
  throw new Error('[Tauri noop] readTextFile() is not available in web mode');
}

export async function writeTextFile(_path: string, _contents: string): Promise<void> {
  throw new Error('[Tauri noop] writeTextFile() is not available in web mode');
}

// plugin-notification
export async function sendNotification(_options: unknown): Promise<void> {
  // noop in web mode
}

// plugin-shell
// Note: 'open' is already exported above from plugin-dialog

// plugin-http
// Re-export native fetch as a fallback
const noopFetch = globalThis.fetch;
export { noopFetch as fetch };

// plugin-store
export async function load(_path: string): Promise<{
  get: <T>(_key: string) => Promise<T | null>;
  set: (_key: string, _value: unknown) => Promise<void>;
  delete: (_key: string) => Promise<void>;
  save: () => Promise<void>;
}> {
  return {
    get: async () => null,
    set: async () => {},
    delete: async () => {},
    save: async () => {},
  };
}
