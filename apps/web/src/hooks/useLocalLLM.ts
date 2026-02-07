/**
 * Local LLM Hook
 * @description ProvideLocal LLM StatusManageandAction's React Hook
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
 * Detectisnoat Tauri Environment
 */
function isTauri(): boolean {
 return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Tauri CommandCall
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
 /** isnoAvailable */
 available: boolean;
 /** ModelCount */
 modelsCount: number;
 /** VersionInfo */
 version?: string;
}

/**
 * Hook Status
 */
interface LocalLLMState {
 /** CurrentActive Provider */
 activeProvider: LLMProviderType;
 /** Status */
 status: 'checking' | 'available' | 'unavailable';
 /** alreadyInstallModelList */
 models: LocalModelInfo[];
 /** CurrentDownloadProgress */
 downloadProgress: PullProgress | null;
 /** Downloading'sModelName */
 downloadingModel: string | null;
 /** ErrorInfo */
 error: string | null;
 /** isnoLoading */
 isLoading: boolean;
 /** Provider Status */
 providerStatuses: Record<LLMProviderType, ProviderStatus>;
}

/**
 * Hook Action
 */
interface LocalLLMActions {
 /** CheckStatus */
 checkStatus: () => Promise<void>;
 /** RefreshModelList */
 refreshModels: () => Promise<void>;
 /** DownloadModel */
 pullModel: (modelName: string) => Promise<void>;
 /** DeleteModel */
 deleteModel: (modelName: string) => Promise<void>;
 /** Chat */
 chat: (options: ChatOptions) => Promise<ChatResponse>;
 /** TestModel */
 testModel: (modelName: string) => Promise<string>;
 /** UpdateConfig */
 updateConfig: (config: Partial<OllamaConfig | LMStudioConfig>) => void;
 /** CancelDownload */
 cancelDownload: () => void;
 /** Switch Provider */
 switchProvider: (provider: LLMProviderType) => void;
 /** CheckSpecific Provider Status */
 checkProviderStatus: (provider: LLMProviderType) => Promise<ProviderStatus>;
}

/**
 * Hook BackType
 */
export type UseLocalLLMReturn = LocalLLMState & LocalLLMActions;

/**
 * Hook ConfigOption
 */
interface UseLocalLLMOptions {
 /** Default Provider */
 defaultProvider?: LLMProviderType;
 /** Ollama URL */
 ollamaUrl?: string;
 /** LM Studio URL */
 lmStudioUrl?: string;
 /** AutoCheckStatus */
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

 // FetchCurrentActive Provider
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

 // DownloadCancelLogo
 const [downloadCancelled, setDownloadCancelled] = useState(false);

 // CurrentActive Provider
 const provider = getActiveProvider(state.activeProvider);

 /**
 * Check Ollama Status
 */
 const checkStatus = useCallback(async () => {
 setState((prev) => ({ ...prev, status: 'checking', error: null }));

 try {
 if (isTauri()) {
 // Usage Tauri Command
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
 // Usage Web API
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
 error: error instanceof Error ? error.message: 'CheckStatusFailed',
 }));
 }
 }, [provider]);

 /**
 * RefreshModelList
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
 error: error instanceof Error ? error.message: 'FetchModelListFailed',
 }));
 }
 }, [state.status, provider]);

 /**
 * DownloadModel
 */
 const pullModel = useCallback(
 async (modelName: string) => {
 if (state.status !== 'available') {
 throw new Error('Ollama not yetRun');
 }

 setState((prev) => ({
 ...prev,
 downloadingModel: modelName,
 downloadProgress: { status: 'PrepareDownload...', completed: 0, total: 0 },
 error: null,
 }));
 setDownloadCancelled(false);

 try {
 if (isTauri()) {
 // Tauri EnvironmentUsageCommand
 await invokeTauri('pull_ollama_model', { modelName });
 } else {
 // Web EnvironmentUsageStreaming API
 await provider.pullModel(modelName, (progress) => {
 if (downloadCancelled) return;
 setState((prev) => ({ ...prev, downloadProgress: progress }));
 });
 }

 // DownloadDone, RefreshModelList
 await refreshModels();
 } catch (error) {
 if (!downloadCancelled) {
 setState((prev) => ({
 ...prev,
 error: error instanceof Error ? error.message: 'DownloadModelFailed',
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
 * DeleteModel
 */
 const deleteModel = useCallback(
 async (modelName: string) => {
 if (state.status !== 'available') {
 throw new Error('Ollama not yetRun');
 }

 setState((prev) => ({ ...prev, isLoading: true, error: null }));

 try {
 if (isTauri()) {
 await invokeTauri('delete_ollama_model', { modelName });
 } else {
 await provider.deleteModel(modelName);
 }

 // RefreshModelList
 await refreshModels();
 } catch (error) {
 setState((prev) => ({
 ...prev,
 isLoading: false,
 error: error instanceof Error ? error.message: 'DeleteModelFailed',
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
 throw new Error('Ollama not yetRun');
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
 * TestModel
 */
 const testModel = useCallback(
 async (modelName: string): Promise<string> => {
 const response = await chat({
 model: modelName,
 messages: [
 {
 role: 'user',
 content: 'you, Pleaseuse1IntroductionSelf.',
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
 * UpdateConfig
 */
 const updateConfig = useCallback(
 (config: Partial<OllamaConfig>) => {
 provider.updateConfig(config);
 },
 [provider]
 );

 /**
 * CancelDownload
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

 // AutoChecknew Provider Status
 setTimeout(() => checkStatus(), 0);
 },
 [state.activeProvider, checkStatus]
 );

 /**
 * CheckSpecific Provider Status
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

 // AutoCheckStatus
 useEffect(() => {
 if (autoCheck) {
 checkStatus();
 // timeCheckAll Provider Status
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
