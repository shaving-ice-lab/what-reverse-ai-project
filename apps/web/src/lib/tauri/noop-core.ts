/**
 * @tauri-apps/api/core 的 Web 模式 noop 存根
 * 在非 Tauri 环境中，所有 Tauri API 调用将抛出错误
 */

export async function invoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
  throw new Error('[Tauri noop] invoke() is not available in web mode');
}

export function transformCallback(_callback?: (response: unknown) => void, _once?: boolean): number {
  return 0;
}

export class Channel<T = unknown> {
  id = 0;
  onmessage: (response: T) => void = () => {};
  toJSON(): string { return ''; }
}

export class Resource {
  readonly rid: number = 0;
  close(): Promise<void> { return Promise.resolve(); }
}
