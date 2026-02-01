/**
 * 本地 LLM Hook
 * @description 提供本地 LLM 状态管理和操作的 React Hook
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
 * 检测是否在 Tauri 环境中
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Tauri 命令调用
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
 * Provider 状态
 */
interface ProviderStatus {
  /** 是否可用 */
  available: boolean;
  /** 模型数量 */
  modelsCount: number;
  /** 版本信息 */
  version?: string;
}

/**
 * Hook 状态
 */
interface LocalLLMState {
  /** 当前活跃 Provider */
  activeProvider: LLMProviderType;
  /** 状态 */
  status: 'checking' | 'available' | 'unavailable';
  /** 已安装模型列表 */
  models: LocalModelInfo[];
  /** 当前下载进度 */
  downloadProgress: PullProgress | null;
  /** 正在下载的模型名称 */
  downloadingModel: string | null;
  /** 错误信息 */
  error: string | null;
  /** 是否加载中 */
  isLoading: boolean;
  /** 各 Provider 状态 */
  providerStatuses: Record<LLMProviderType, ProviderStatus>;
}

/**
 * Hook 操作
 */
interface LocalLLMActions {
  /** 检查状态 */
  checkStatus: () => Promise<void>;
  /** 刷新模型列表 */
  refreshModels: () => Promise<void>;
  /** 下载模型 */
  pullModel: (modelName: string) => Promise<void>;
  /** 删除模型 */
  deleteModel: (modelName: string) => Promise<void>;
  /** 聊天 */
  chat: (options: ChatOptions) => Promise<ChatResponse>;
  /** 测试模型 */
  testModel: (modelName: string) => Promise<string>;
  /** 更新配置 */
  updateConfig: (config: Partial<OllamaConfig | LMStudioConfig>) => void;
  /** 取消下载 */
  cancelDownload: () => void;
  /** 切换 Provider */
  switchProvider: (provider: LLMProviderType) => void;
  /** 检查特定 Provider 状态 */
  checkProviderStatus: (provider: LLMProviderType) => Promise<ProviderStatus>;
}

/**
 * Hook 返回类型
 */
export type UseLocalLLMReturn = LocalLLMState & LocalLLMActions;

/**
 * Hook 配置选项
 */
interface UseLocalLLMOptions {
  /** 默认 Provider */
  defaultProvider?: LLMProviderType;
  /** Ollama URL */
  ollamaUrl?: string;
  /** LM Studio URL */
  lmStudioUrl?: string;
  /** 自动检查状态 */
  autoCheck?: boolean;
}

/**
 * 本地 LLM Hook
 */
export function useLocalLLM(options: UseLocalLLMOptions = {}): UseLocalLLMReturn {
  const {
    defaultProvider = 'ollama',
    ollamaUrl = 'http://localhost:11434',
    lmStudioUrl = 'http://localhost:1234',
    autoCheck = true,
  } = options;

  // Provider 实例
  const ollamaProvider = useMemo(
    () => createOllamaProvider({ baseUrl: ollamaUrl }),
    [ollamaUrl]
  );

  const lmStudioProvider = useMemo(
    () => createLMStudioProvider({ baseUrl: lmStudioUrl }),
    [lmStudioUrl]
  );

  // 获取当前活跃 Provider
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

  // 状态
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

  // 下载取消标志
  const [downloadCancelled, setDownloadCancelled] = useState(false);

  // 当前活跃 Provider
  const provider = getActiveProvider(state.activeProvider);

  /**
   * 检查 Ollama 状态
   */
  const checkStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'checking', error: null }));

    try {
      if (isTauri()) {
        // 使用 Tauri 命令
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
        // 使用 Web API
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
        error: error instanceof Error ? error.message : '检查状态失败',
      }));
    }
  }, [provider]);

  /**
   * 刷新模型列表
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
        error: error instanceof Error ? error.message : '获取模型列表失败',
      }));
    }
  }, [state.status, provider]);

  /**
   * 下载模型
   */
  const pullModel = useCallback(
    async (modelName: string) => {
      if (state.status !== 'available') {
        throw new Error('Ollama 未运行');
      }

      setState((prev) => ({
        ...prev,
        downloadingModel: modelName,
        downloadProgress: { status: '准备下载...', completed: 0, total: 0 },
        error: null,
      }));
      setDownloadCancelled(false);

      try {
        if (isTauri()) {
          // Tauri 环境使用命令
          await invokeTauri('pull_ollama_model', { modelName });
        } else {
          // Web 环境使用流式 API
          await provider.pullModel(modelName, (progress) => {
            if (downloadCancelled) return;
            setState((prev) => ({ ...prev, downloadProgress: progress }));
          });
        }

        // 下载完成，刷新模型列表
        await refreshModels();
      } catch (error) {
        if (!downloadCancelled) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : '下载模型失败',
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
   * 删除模型
   */
  const deleteModel = useCallback(
    async (modelName: string) => {
      if (state.status !== 'available') {
        throw new Error('Ollama 未运行');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (isTauri()) {
          await invokeTauri('delete_ollama_model', { modelName });
        } else {
          await provider.deleteModel(modelName);
        }

        // 刷新模型列表
        await refreshModels();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '删除模型失败',
        }));
        throw error;
      }
    },
    [state.status, provider, refreshModels]
  );

  /**
   * 聊天
   */
  const chat = useCallback(
    async (options: ChatOptions): Promise<ChatResponse> => {
      if (state.status !== 'available') {
        throw new Error('Ollama 未运行');
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
   * 测试模型
   */
  const testModel = useCallback(
    async (modelName: string): Promise<string> => {
      const response = await chat({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: '你好，请用一句话介绍自己。',
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
   * 更新配置
   */
  const updateConfig = useCallback(
    (config: Partial<OllamaConfig>) => {
      provider.updateConfig(config);
    },
    [provider]
  );

  /**
   * 取消下载
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
   * 切换 Provider
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

      // 自动检查新 Provider 状态
      setTimeout(() => checkStatus(), 0);
    },
    [state.activeProvider, checkStatus]
  );

  /**
   * 检查特定 Provider 状态
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

  // 自动检查状态
  useEffect(() => {
    if (autoCheck) {
      checkStatus();
      // 同时检查所有 Provider 状态
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
