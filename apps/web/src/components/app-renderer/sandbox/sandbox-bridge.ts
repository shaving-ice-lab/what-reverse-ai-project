/**
 * Sandbox Bridge — postMessage communication protocol between host and iframe sandbox.
 *
 * Message types:
 * - host → iframe: INIT (send code + data), UPDATE_DATA, CALL_ACTION
 * - iframe → host: READY, RENDER_COMPLETE, ERROR, ACTION_REQUEST, RESIZE
 */

// ===== Message Types =====

export type HostMessage =
  | { type: 'INIT'; code: string; data?: Record<string, unknown>; theme?: 'light' | 'dark' }
  | { type: 'UPDATE_DATA'; data: Record<string, unknown> }
  | { type: 'CALL_ACTION'; action: string; payload?: unknown }

export type SandboxMessage =
  | { type: 'READY' }
  | { type: 'RENDER_COMPLETE'; height?: number }
  | { type: 'ERROR'; message: string; stack?: string }
  | { type: 'ACTION_REQUEST'; action: string; payload?: unknown }
  | { type: 'RESIZE'; height: number }

// ===== Constants =====

export const SANDBOX_ORIGIN = 'null' // srcdoc iframes have origin "null"
export const MESSAGE_PREFIX = '__SANDBOX__'

// ===== Helper Functions =====

export function createHostMessage(msg: HostMessage): string {
  return JSON.stringify({ ...msg, __sandbox: true })
}

export function parseHostMessage(event: MessageEvent): HostMessage | null {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    if (!data || !data.__sandbox) return null
    return data as HostMessage
  } catch {
    return null
  }
}

export function createSandboxMessage(msg: SandboxMessage): string {
  return JSON.stringify({ ...msg, __sandbox: true })
}

export function parseSandboxMessage(event: MessageEvent): SandboxMessage | null {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    if (!data || !data.__sandbox) return null
    return data as SandboxMessage
  } catch {
    return null
  }
}
