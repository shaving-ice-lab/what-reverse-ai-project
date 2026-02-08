/**
 * Tauri Desktop App API Wrapper
 * 
 * Provides a unified API interface with automatic runtime environment detection.
 * Falls back to standard Web APIs when running in browser.
 */

// ===== Environment Detection =====

/**
 * Detect whether running in a Tauri desktop app
 */
export function isTauri(): boolean {
 if (typeof window === 'undefined') return false;
 return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

/**
 * Get the current platform
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

// ===== FileSystem API =====

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
 * Open file selection dialog
 */
export async function openFileDialog(options?: FileDialogOptions): Promise<string[] | null> {
 if (!isTauri()) {
 // Web fallback: Use input[type=file]
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
 * Open File Save Dialog
 */
export async function saveFileDialog(options?: FileDialogOptions): Promise<string | null> {
 if (!isTauri()) {
 // Web fallback: Prompt user for file name
 const fileName = prompt('Please enter a file name', options?.defaultPath || 'untitled');
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
 * Read file content
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
 * Write file content
 */
export async function writeFile(path: string, contents: string): Promise<boolean> {
 if (!isTauri()) {
 // Web fallback: Download file
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

// ===== Notifications API =====

export interface NotificationOptions {
 title: string;
 body: string;
 icon?: string;
}

/**
 * Send system notification
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
 if (!isTauri()) {
 // Web fallback: Use Web Notifications API
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
 * Open URL in default browser
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
 * Send HTTP request (bypasses CORS in Tauri)
 */
export async function httpRequest<T = unknown>(
 url: string,
 options?: HttpRequestOptions
): Promise<T | null> {
 if (!isTauri()) {
    // Web fallback: Use fetch
    try {
 const response = await fetch(url, {
 method: options?.method || 'GET',
 headers: options?.headers,
 body: options?.body ?? JSON.stringify(options.body) : undefined,
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
 body: options?.body ?? JSON.stringify(options.body) : undefined,
 connectTimeout: options?.timeout,
 });
 return await response.json();
 } catch (error) {
 console.error('HTTP request failed:', error);
 return null;
 }
}

// ===== Storage API =====

/**
 * Local storage (uses Tauri Store or localStorage)
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
 * Call Tauri backend command
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

// ===== Event System =====

type EventCallback<T> = (payload: T) => void;

/**
 * Listen to Tauri event
 */
export async function listenEvent<T = unknown>(
 event: string,
 callback: EventCallback<T>
): Promise<() => void> {
 if (!isTauri()) {
    // Web fallback: Use CustomEvent
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
 * Emit Tauri event
 */
export async function emitEvent<T = unknown>(
 event: string,
 payload?: T
): Promise<boolean> {
 if (!isTauri()) {
    // Web fallback: Use CustomEvent
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

// ===== Export Types =====

export type { FileDialogOptions, NotificationOptions, HttpRequestOptions };
