/**
 * Tauri 桌面应用 API 封装
 * 
 * 提供统一的 API 接口，自动检测运行环境
 * 在 Web 模式下回退到标准 Web API
 */

// ===== 环境检测 =====

/**
 * 检测是否在 Tauri 桌面应用中运行
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

/**
 * 获取当前平台
 */
export type Platform = 'windows' | 'macos' | 'linux' | 'web';

export async function getPlatform(): Promise<Platform> {
  if (!isTauri()) return 'web';
  
  try {
    const { platform } = await import('@tauri-apps/plugin-os');
    const os = await platform();
    
    switch (os) {
      case 'windows':
        return 'windows';
      case 'macos':
        return 'macos';
      case 'linux':
        return 'linux';
      default:
        return 'web';
    }
  } catch {
    return 'web';
  }
}

// ===== 文件系统 API =====

export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  multiple?: boolean;
}

/**
 * 打开文件选择对话框
 */
export async function openFileDialog(options?: FileDialogOptions): Promise<string[] | null> {
  if (!isTauri()) {
    // Web fallback: 使用 input[type=file]
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple ?? false;
      
      if (options?.filters?.[0]?.extensions) {
        input.accept = options.filters[0].extensions.map(ext => `.${ext}`).join(',');
      }
      
      input.onchange = () => {
        const files = Array.from(input.files || []).map(f => f.name);
        resolve(files.length > 0 ? files : null);
      };
      
      input.click();
    });
  }
  
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const result = await open({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      multiple: options?.multiple,
    });
    
    if (result === null) return null;
    return Array.isArray(result) ? result : [result];
  } catch {
    return null;
  }
}

/**
 * 打开文件保存对话框
 */
export async function saveFileDialog(options?: FileDialogOptions): Promise<string | null> {
  if (!isTauri()) {
    // Web fallback: 返回用户输入的文件名
    const fileName = prompt('请输入文件名', options?.defaultPath || 'untitled');
    return fileName;
  }
  
  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    return await save({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    });
  } catch {
    return null;
  }
}

/**
 * 读取文件内容
 */
export async function readFile(path: string): Promise<string | null> {
  if (!isTauri()) {
    console.warn('readFile is only available in Tauri desktop app');
    return null;
  }
  
  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return await readTextFile(path);
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
}

/**
 * 写入文件内容
 */
export async function writeFile(path: string, contents: string): Promise<boolean> {
  if (!isTauri()) {
    // Web fallback: 下载文件
    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }
  
  try {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    await writeTextFile(path, contents);
    return true;
  } catch (error) {
    console.error('Failed to write file:', error);
    return false;
  }
}

// ===== 通知 API =====

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

/**
 * 发送系统通知
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  if (!isTauri()) {
    // Web fallback: 使用 Web Notifications API
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    
    new Notification(options.title, {
      body: options.body,
      icon: options.icon,
    });
    return true;
  }
  
  try {
    const { sendNotification: tauriNotify } = await import('@tauri-apps/plugin-notification');
    await tauriNotify({
      title: options.title,
      body: options.body,
    });
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// ===== Shell API =====

/**
 * 在默认浏览器中打开 URL
 */
export async function openInBrowser(url: string): Promise<boolean> {
  if (!isTauri()) {
    window.open(url, '_blank');
    return true;
  }
  
  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
    return true;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
}

// ===== HTTP API =====

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * 发送 HTTP 请求 (绕过 CORS)
 */
export async function httpRequest<T = unknown>(
  url: string,
  options?: HttpRequestOptions
): Promise<T | null> {
  if (!isTauri()) {
    // Web fallback: 使用 fetch
    try {
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: options?.headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
      return await response.json();
    } catch (error) {
      console.error('HTTP request failed:', error);
      return null;
    }
  }
  
  try {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    const response = await tauriFetch(url, {
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      connectTimeout: options?.timeout,
    });
    return await response.json();
  } catch (error) {
    console.error('HTTP request failed:', error);
    return null;
  }
}

// ===== 存储 API =====

/**
 * 本地存储 (使用 Tauri Store 或 localStorage)
 */
export const storage = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (!isTauri()) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
    
    try {
      const { load } = await import('@tauri-apps/plugin-store');
      const store = await load('settings.json');
      return await store.get<T>(key);
    } catch {
      return null;
    }
  },
  
  async set<T = unknown>(key: string, value: T): Promise<boolean> {
    if (!isTauri()) {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    
    try {
      const { load } = await import('@tauri-apps/plugin-store');
      const store = await load('settings.json');
      await store.set(key, value);
      await store.save();
      return true;
    } catch {
      return false;
    }
  },
  
  async remove(key: string): Promise<boolean> {
    if (!isTauri()) {
      localStorage.removeItem(key);
      return true;
    }
    
    try {
      const { load } = await import('@tauri-apps/plugin-store');
      const store = await load('settings.json');
      await store.delete(key);
      await store.save();
      return true;
    } catch {
      return false;
    }
  },
};

// ===== Tauri Commands =====

/**
 * 调用 Tauri 后端命令
 */
export async function invokeCommand<T = unknown>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  if (!isTauri()) {
    console.warn(`Tauri command "${command}" is only available in desktop app`);
    return null;
  }
  
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Failed to invoke command "${command}":`, error);
    return null;
  }
}

// ===== 事件系统 =====

type EventCallback<T> = (payload: T) => void;

/**
 * 监听 Tauri 事件
 */
export async function listenEvent<T = unknown>(
  event: string,
  callback: EventCallback<T>
): Promise<() => void> {
  if (!isTauri()) {
    // Web fallback: 使用 CustomEvent
    const handler = (e: Event) => {
      callback((e as CustomEvent).detail as T);
    };
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }
  
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen<T>(event, (event) => {
      callback(event.payload);
    });
    return unlisten;
  } catch {
    return () => {};
  }
}

/**
 * 发送 Tauri 事件
 */
export async function emitEvent<T = unknown>(
  event: string,
  payload?: T
): Promise<boolean> {
  if (!isTauri()) {
    // Web fallback: 使用 CustomEvent
    window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    return true;
  }
  
  try {
    const { emit } = await import('@tauri-apps/api/event');
    await emit(event, payload);
    return true;
  } catch {
    return false;
  }
}

// ===== 导出类型 =====

export type { FileDialogOptions, NotificationOptions, HttpRequestOptions };
