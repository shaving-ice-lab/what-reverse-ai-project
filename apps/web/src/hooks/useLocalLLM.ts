/**
 * Local LLM Hook
 * @description Provides a React Hook for local LLM status management and actions
 * @supports Ollama, LM Studio
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
 OllamaProvider,
 createOllamaProvider,
 LMStudioProvider,
 createLMStudioProvider,
 type LocalModelInfo,
 type OllamaStatus,
 type PullProgress,
 type ChatOptions,
 type ChatResponse,
 type OllamaConfig,
 type LMStudioConfig,
 type LLMProviderType,
} from '@/lib/llm';

/**
 * Detect if running in Tauri environment
 */
function isTauri(): boolean {
 return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Tauri command invocation
 */
async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
 if (!isTauri()) {
 throw new Error('Not in Tauri environment');
 }
 // @ts-expect-error - Tauri API
 const { invoke } = await import('@tauri-apps/api/core');
 return invoke(cmd, args);
}

/**
 * Provider Status
 */
interface ProviderStatus {
 /** Whether available */
 available: boolean;
 /** Model count */
 modelsCount: number;
 /** Version info */
 version?: string;
}

/**
 * Hook Status
 */
interface LocalLLMState {
 /** Currently active provider */
 activeProvider: LLMProviderType;
 /** Status */
 status: 'checking' | 'available' | 'unavailable';
 /** Installed model list */
 models: LocalModelInfo[];
 /** Current download progress */
 downloadProgress: PullProgress | null;
 /** Name of the model being downloaded */
 downloadingModel: string | null;
 /** Error info */
 error: string | null;
 /** Whether loading */
 isLoading: boolean;
 /** Provider Status */
 providerStatuses: Record<LLMProviderType, ProviderStatus>;
}

/**
 * Hook Action
 */
interface LocalLLMActions {
 /** Check status */
 checkStatus: () => Promise<void>;
 /** Refresh model list */
 refreshModels: () => Promise<void>;
 /** Download model */
 pullModel: (modelName: string) => Promise<void>;
 /** Delete model */
 deleteModel: (modelName: string) => Promise<void>;
 /** Chat */
 chat: (options: ChatOptions) => Promise<ChatResponse>;
 /** Test model */
 testModel: (modelName: string) => Promise<string>;
 /** Update config */
 updateConfig: (config: Partial<OllamaConfig | LMStudioConfig>) => void;
 /** Cancel download */
 cancelDownload: () => void;
 /** Switch provider */
 switchProvider: (provider: LLMProviderType) => void;
 /** Check specific provider status */
 checkProviderStatus: (provider: LLMProviderType) => Promise<ProviderStatus>;
}

/**
 * Hook return type
 */
export type UseLocalLLMReturn = LocalLLMState & LocalLLMActions;

/**
 * Hook config options
 */
interface UseLocalLLMOptions {
 /** Default Provider */
 defaultProvider?: LLMProviderType;
 /** Ollama URL */
 ollamaUrl?: string;
 /** LM Studio URL */
 lmStudioUrl?: string;
 /** Auto-check status */
 autoCheck?: boolean;
}

/**
 * Local LLM Hook
 */
export function useLocalLLM(options: UseLocalLLMOptions = {}): UseLocalLLMReturn {
 const {
 defaultProvider = 'ollama',
 ollamaUrl = 'http://localhost:11434',
 lmStudioUrl = 'http://localhost:1234',
 autoCheck = true,
 } = options;

 // Provider Instance
 const ollamaProvider = useMemo(
 () => createOllamaProvider({ baseUrl: ollamaUrl }),
 [ollamaUrl]
 );

 const lmStudioProvider = useMemo(
 () => createLMStudioProvider({ baseUrl: lmStudioUrl }),
 [lmStudioUrl]
 );

 // Get currently active provider
 const getActiveProvider = useCallback(
 (type: LLMProviderType) => {
 switch (type) {
 case 'lm-studio':
 return lmStudioProvider;
 case 'ollama':
 default:
 return ollamaProvider;
 }
 },
 [ollamaProvider, lmStudioProvider]
 );

 // Status
 const [state, setState] = useState<LocalLLMState>({
 activeProvider: defaultProvider,
 status: 'checking',
 models: [],
 downloadProgress: null,
 downloadingModel: null,
 error: null,
 isLoading: false,
 providerStatuses: {
 'ollama': { available: false, modelsCount: 0 },
 'lm-studio': { available: false, modelsCount: 0 },
 'llama-cpp': { available: false, modelsCount: 0 },
 },
 });

 // Download cancel flag
 const [downloadCancelled, setDownloadCancelled] = useState(false);

 // Currently active provider
 const provider = getActiveProvider(state.activeProvider);

 /**
 * Check provider status
 */
 const checkStatus = useCallback(async () => {
 setState((prev) => ({ ...prev, status: 'checking', error: null }));

 try {
 if (isTauri()) {
      // Use Tauri command
 const status = await invokeTauri<{ running: boolean; models_count: number }>(
 'check_ollama_status'
 );
 setState((prev) => ({
 ...prev,
 status: status.running ? 'available' : 'unavailable',
 }));

 if (status.running) {
 const models = await invokeTauri<LocalModelInfo[]>('list_ollama_models');
 setState((prev) => ({
 ...prev,
 models: models.map((m) => ({
 ...m,
 modifiedAt: m.modifiedAt || '',
 })),
 }));
 }
 } else {
      // Use Web API
 const available = await provider.isAvailable();
 setState((prev) => ({
 ...prev,
 status: available ? 'available' : 'unavailable',
 }));

 if (available) {
 const models = await provider.listModels();
 setState((prev) => ({ ...prev, models }));
 }
 }
 } catch (error) {
 setState((prev) => ({
 ...prev,
 status: 'unavailable',
    error: error instanceof Error ? error.message: 'Failed to check status',
 }));
 }
 }, [provider]);

 /**
 * Refresh model list
 */
 const refreshModels = useCallback(async () => {
 if (state.status !== 'available') return;

 setState((prev) => ({ ...prev, isLoading: true, error: null }));

 try {
 if (isTauri()) {
 const models = await invokeTauri<LocalModelInfo[]>('list_ollama_models');
 setState((prev) => ({
 ...prev,
 models: models.map((m) => ({
 ...m,
 modifiedAt: m.modifiedAt || '',
 })),
 isLoading: false,
 }));
 } else {
 const models = await provider.listModels();
 setState((prev) => ({ ...prev, models, isLoading: false }));
 }
 } catch (error) {
 setState((prev) => ({
 ...prev,
 isLoading: false,
    error: error instanceof Error ? error.message: 'Failed to fetch model list',
 }));
 }
 }, [state.status, provider]);

 /**
 * Download model
 */
 const pullModel = useCallback(
  async (modelName: string) => {
   if (state.status !== 'available') {
    throw new Error('Ollama is not running');
   }

   setState((prev) => ({
    ...prev,
    downloadingModel: modelName,
    downloadProgress: { status: 'Preparing download...', completed: 0, total: 0 },
 error: null,
 }));
 setDownloadCancelled(false);

 try {
 if (isTauri()) {
      // Use Tauri command in Tauri environment
 await invokeTauri('pull_ollama_model', { modelName });
 } else {
      // Use streaming API in web environment
 await provider.pullModel(modelName, (progress) => {
 if (downloadCancelled) return;
 setState((prev) => ({ ...prev, downloadProgress: progress }));
 });
 }

    // Download complete, refresh model list
 await refreshModels();
 } catch (error) {
 if (!downloadCancelled) {
 setState((prev) => ({
 ...prev,
      error: error instanceof Error ? error.message: 'Failed to download model',
 }));
 }
 } finally {
 setState((prev) => ({
 ...prev,
 downloadingModel: null,
 downloadProgress: null,
 }));
 }
 },
 [state.status, provider, refreshModels, downloadCancelled]
 );

 /**
 * Delete model
 */
 const deleteModel = useCallback(
  async (modelName: string) => {
   if (state.status !== 'available') {
    throw new Error('Ollama is not running');
   }

 setState((prev) => ({ ...prev, isLoading: true, error: null }));

 try {
 if (isTauri()) {
 await invokeTauri('delete_ollama_model', { modelName });
 } else {
 await provider.deleteModel(modelName);
 }

    // Refresh model list
   await refreshModels();
  } catch (error) {
   setState((prev) => ({
    ...prev,
    isLoading: false,
    error: error instanceof Error ? error.message: 'Failed to delete model',
 }));
 throw error;
 }
 },
 [state.status, provider, refreshModels]
 );

 /**
 * Chat
 */
 const chat = useCallback(
  async (options: ChatOptions): Promise<ChatResponse> => {
   if (state.status !== 'available') {
    throw new Error('Ollama is not running');
   }

 if (isTauri()) {
 const response = await invokeTauri<{
 model: string;
 message: { role: string; content: string };
 done: boolean;
 eval_count?: number;
 prompt_eval_count?: number;
 }>('chat_completion', {
 model: options.model || 'llama3.2',
 messages: options.messages,
 options: {
 temperature: options.temperature,
 top_p: options.topP,
 top_k: options.topK,
 max_tokens: options.maxTokens,
 },
 });

 return {
 content: response.message.content,
 model: response.model,
 usage: {
 promptTokens: response.prompt_eval_count || 0,
 completionTokens: response.eval_count || 0,
 totalTokens:
 (response.prompt_eval_count || 0) + (response.eval_count || 0),
 },
 finishReason: 'stop',
 };
 }

 return provider.chat(options);
 },
 [state.status, provider]
 );

 /**
 * Test model
 */
 const testModel = useCallback(
  async (modelName: string): Promise<string> => {
   const response = await chat({
    model: modelName,
    messages: [
     {
      role: 'user',
      content: 'Hello, please introduce yourself briefly.',
     },
    ],
 maxTokens: 100,
 temperature: 0.7,
 });

 return response.content;
 },
 [chat]
 );

 /**
 * Update config
 */
 const updateConfig = useCallback(
 (config: Partial<OllamaConfig>) => {
 provider.updateConfig(config);
 },
 [provider]
 );

 /**
 * Cancel download
 */
 const cancelDownload = useCallback(() => {
 setDownloadCancelled(true);
 if ('cancelAll' in provider) {
 (provider as OllamaProvider).cancelAll();
 }
 setState((prev) => ({
 ...prev,
 downloadingModel: null,
 downloadProgress: null,
 }));
 }, [provider]);

 /**
 * Switch Provider
 */
 const switchProvider = useCallback(
 (providerType: LLMProviderType) => {
 if (providerType === state.activeProvider) return;

 setState((prev) => ({
 ...prev,
 activeProvider: providerType,
 status: 'checking',
 models: [],
 error: null,
 }));

   // Auto-check new provider status
 setTimeout(() => checkStatus(), 0);
 },
 [state.activeProvider, checkStatus]
 );

 /**
 * Check specific provider status
 */
 const checkProviderStatus = useCallback(
 async (providerType: LLMProviderType): Promise<ProviderStatus> => {
 const targetProvider = getActiveProvider(providerType);

 try {
 const available = await targetProvider.isAvailable();
 let modelsCount = 0;

 if (available) {
 const models = await targetProvider.listModels();
 modelsCount = models.length;
 }

 const status: ProviderStatus = {
 available,
 modelsCount,
 };

 setState((prev) => ({
 ...prev,
 providerStatuses: {
 ...prev.providerStatuses,
 [providerType]: status,
 },
 }));

 return status;
 } catch {
 const status: ProviderStatus = {
 available: false,
 modelsCount: 0,
 };

 setState((prev) => ({
 ...prev,
 providerStatuses: {
 ...prev.providerStatuses,
 [providerType]: status,
 },
 }));

 return status;
 }
 },
 [getActiveProvider]
 );

 // Auto-check status
 useEffect(() => {
  if (autoCheck) {
   checkStatus();
   // Also check all provider statuses
 checkProviderStatus('ollama');
 checkProviderStatus('lm-studio');
 }
 }, [autoCheck, checkStatus, checkProviderStatus]);

 return {
 ...state,
 checkStatus,
 refreshModels,
 pullModel,
 deleteModel,
 chat,
 testModel,
 updateConfig,
 cancelDownload,
 switchProvider,
 checkProviderStatus,
 };
}

export default useLocalLLM;
