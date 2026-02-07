/**
 * StreamingChat Hook
 * Support Server-Sent Events (SSE) StreamingResponse
 */

import { useState, useRef, useCallback } from "react";
import { API_BASE_URL, getStoredTokens } from "@/lib/api/shared";

export interface StreamingChatOptions {
 model?: string;
 systemPrompt?: string;
 workspaceId?: string;
 onToken?: (token: string) => void;
 onComplete?: (fullContent: string) => void;
 onError?: (error: Error) => void;
}

export function useStreamingChat() {
 const [isStreaming, setIsStreaming] = useState(false);
 const abortControllerRef = useRef<AbortController | null>(null);

 /**
 * SendStreamingChatRequest
 */
 const streamChat = useCallback(
 async (
 conversationId: string,
 message: string,
 options?: StreamingChatOptions
 ): Promise<string> => {
 // firstbefore'sRequest
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }

 const abortController = new AbortController();
 abortControllerRef.current = abortController;

 setIsStreaming(true);
 let fullContent = "";

 try {
 const tokens = getStoredTokens();

 const query = options?.workspaceId ? `?workspace_id=${options.workspaceId}` : "";
 const response = await fetch(
 `${API_BASE_URL}/conversations/${conversationId}/chat/stream${query}`,
 {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 ...(tokens?.accessToken && {
 Authorization: `Bearer ${tokens.accessToken}`,
 }),
 },
 body: JSON.stringify({
 message,
 model: options?.model,
 system_prompt: options?.systemPrompt,
 }),
 signal: abortController.signal,
 }
 );

 if (!response.ok) {
 throw new Error(`Chat failed: ${response.statusText}`);
 }

 const reader = response.body?.getReader();
 if (!reader) {
 throw new Error("No response body");
 }

 const decoder = new TextDecoder();
 let buffer = "";

 while (true) {
 const { done, value } = await reader.read();
 if (done) break;

 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split("\n");
 buffer = lines.pop() || "";

 for (const line of lines) {
 if (line.startsWith("data: ")) {
 const data = line.slice(6).trim();
 
 if (data === "[DONE]") {
 // StreamingResponseDone
 options?.onComplete?.(fullContent);
 return fullContent;
 }

 try {
 const parsed = JSON.parse(data);
 if (parsed.content) {
 fullContent += parsed.content;
 options?.onToken?.(parsed.content);
 }
 if (parsed.error) {
 throw new Error(parsed.error);
 }
 } catch (parseError) {
 // ifresultnotis JSON, cancanisDirect'sText
 if (data && !data.startsWith("{")) {
 fullContent += data;
 options?.onToken?.(data);
 }
 }
 }
 }
 }

 options?.onComplete?.(fullContent);
 return fullContent;
 } catch (error) {
 if ((error as Error).name === "AbortError") {
 // RequestbyCancel, notvisualasError
 return fullContent;
 }
 options?.onError?.(error as Error);
 throw error;
 } finally {
 setIsStreaming(false);
 if (abortControllerRef.current === abortController) {
 abortControllerRef.current = null;
 }
 }
 },
 []
 );

 /**
 * CancelCurrent'sStreamingRequest
 */
 const cancelStream = useCallback(() => {
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 abortControllerRef.current = null;
 }
 setIsStreaming(false);
 }, []);

 return {
 streamChat,
 cancelStream,
 isStreaming,
 };
}

/**
 * Hook Version'sStreamingChatGenerate
 */
export async function* streamChatGenerator(
 conversationId: string,
 message: string,
 options?: {
 model?: string;
 systemPrompt?: string;
 workspaceId?: string;
 signal?: AbortSignal;
 }
): AsyncGenerator<string, string, unknown> {
 const tokens = getStoredTokens();

 const query = options?.workspaceId ? `?workspace_id=${options.workspaceId}` : "";
 const response = await fetch(
 `${API_BASE_URL}/conversations/${conversationId}/chat/stream${query}`,
 {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 ...(tokens?.accessToken && {
 Authorization: `Bearer ${tokens.accessToken}`,
 }),
 },
 body: JSON.stringify({
 message,
 model: options?.model,
 system_prompt: options?.systemPrompt,
 }),
 signal: options?.signal,
 }
 );

 if (!response.ok) {
 throw new Error(`Chat failed: ${response.statusText}`);
 }

 const reader = response.body?.getReader();
 if (!reader) {
 throw new Error("No response body");
 }

 const decoder = new TextDecoder();
 let buffer = "";
 let fullContent = "";

 try {
 while (true) {
 const { done, value } = await reader.read();
 if (done) break;

 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split("\n");
 buffer = lines.pop() || "";

 for (const line of lines) {
 if (line.startsWith("data: ")) {
 const data = line.slice(6).trim();

 if (data === "[DONE]") {
 return fullContent;
 }

 try {
 const parsed = JSON.parse(data);
 if (parsed.content) {
 fullContent += parsed.content;
 yield parsed.content;
 }
 if (parsed.error) {
 throw new Error(parsed.error);
 }
 } catch {
 if (data && !data.startsWith("{")) {
 fullContent += data;
 yield data;
 }
 }
 }
 }
 }
 } finally {
 reader.releaseLock();
 }

 return fullContent;
}
