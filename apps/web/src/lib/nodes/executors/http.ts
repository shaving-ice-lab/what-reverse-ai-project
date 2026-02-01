/**
 * HTTP 请求节点执行器
 */

import type {
  NodeContext,
  NodeResult,
  NodeExecutor,
  HTTPConfig,
  HTTPResponse,
} from "../types";
import {
  renderTemplate,
  withTimeout,
  createNodeError,
} from "../utils";

/**
 * 构建完整 URL (包含查询参数)
 */
function buildUrl(
  baseUrl: string,
  queryParams?: Record<string, string>,
  variables?: Record<string, unknown>
): string {
  // 渲染 URL 中的变量
  let url = variables ? renderTemplate(baseUrl, variables) : baseUrl;
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(queryParams)) {
      const renderedValue = variables ? renderTemplate(value, variables) : value;
      params.append(key, renderedValue);
    }
    
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}${params.toString()}`;
  }
  
  return url;
}

/**
 * 构建请求头
 */
function buildHeaders(
  config: HTTPConfig,
  variables?: Record<string, unknown>
): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // 基础头
  if (config.bodyType === "json") {
    headers["Content-Type"] = "application/json";
  } else if (config.bodyType === "form") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  
  // 自定义头
  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers[key] = variables ? renderTemplate(value, variables) : value;
    }
  }
  
  // 认证头
  if (config.authType && config.authType !== "none" && config.authConfig) {
    switch (config.authType) {
      case "basic": {
        const { username, password } = config.authConfig;
        if (username && password) {
          const credentials = btoa(`${username}:${password}`);
          headers["Authorization"] = `Basic ${credentials}`;
        }
        break;
      }
      case "bearer": {
        const { token } = config.authConfig;
        if (token) {
          const renderedToken = variables ? renderTemplate(token, variables) : token;
          headers["Authorization"] = `Bearer ${renderedToken}`;
        }
        break;
      }
      case "apiKey": {
        const { apiKeyName, apiKeyValue, apiKeyIn } = config.authConfig;
        if (apiKeyName && apiKeyValue && apiKeyIn === "header") {
          const renderedValue = variables ? renderTemplate(apiKeyValue, variables) : apiKeyValue;
          headers[apiKeyName] = renderedValue;
        }
        break;
      }
    }
  }
  
  return headers;
}

/**
 * 构建请求体
 */
function buildBody(
  config: HTTPConfig,
  variables?: Record<string, unknown>
): BodyInit | undefined {
  if (config.method === "GET" || config.method === "HEAD" || !config.body) {
    return undefined;
  }
  
  switch (config.bodyType) {
    case "json": {
      if (typeof config.body === "string") {
        // 渲染模板变量
        const rendered = variables ? renderTemplate(config.body, variables) : config.body;
        return rendered;
      }
      return JSON.stringify(config.body);
    }
    case "form": {
      if (typeof config.body === "object" && config.body !== null) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(config.body as Record<string, string>)) {
          const rendered = variables ? renderTemplate(value, variables) : value;
          params.append(key, rendered);
        }
        return params.toString();
      }
      return undefined;
    }
    case "raw": {
      if (typeof config.body === "string") {
        return variables ? renderTemplate(config.body, variables) : config.body;
      }
      return String(config.body);
    }
    default:
      return undefined;
  }
}

/**
 * 解析响应
 */
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  }
  
  if (contentType.includes("text/")) {
    return await response.text();
  }
  
  // 尝试解析为 JSON，失败则返回文本
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * HTTP 请求节点执行器
 */
export const httpExecutor: NodeExecutor<HTTPConfig> = {
  type: "http",
  
  async execute(context): Promise<NodeResult> {
    const { nodeConfig, variables, inputs, abortSignal } = context;
    const startTime = Date.now();
    const logs: NodeResult["logs"] = [];
    
    try {
      // 合并变量
      const allVariables = { ...variables, ...inputs };
      
      // 构建请求
      const url = buildUrl(nodeConfig.url, nodeConfig.queryParams, allVariables);
      const headers = buildHeaders(nodeConfig, allVariables);
      const body = buildBody(nodeConfig, allVariables);
      
      logs.push({
        level: "info",
        message: `Sending ${nodeConfig.method} request to ${url}`,
        timestamp: new Date().toISOString(),
      });
      
      // 处理 API Key 在 query 参数中的情况
      let finalUrl = url;
      if (
        nodeConfig.authType === "apiKey" &&
        nodeConfig.authConfig?.apiKeyIn === "query" &&
        nodeConfig.authConfig?.apiKeyName &&
        nodeConfig.authConfig?.apiKeyValue
      ) {
        const separator = finalUrl.includes("?") ? "&" : "?";
        const value = renderTemplate(nodeConfig.authConfig.apiKeyValue, allVariables);
        finalUrl = `${finalUrl}${separator}${nodeConfig.authConfig.apiKeyName}=${encodeURIComponent(value)}`;
      }
      
      // 执行请求
      const timeout = nodeConfig.timeout ?? 30000;
      const fetchOptions: RequestInit = {
        method: nodeConfig.method,
        headers,
        body,
        signal: abortSignal,
        redirect: nodeConfig.followRedirects !== false ? "follow" : "manual",
      };
      
      const response = await withTimeout(
        () => fetch(finalUrl, fetchOptions),
        timeout,
        `HTTP request timed out after ${timeout}ms`
      );
      
      const duration = Date.now() - startTime;
      
      // 检查状态码
      if (nodeConfig.validateStatus !== false && !response.ok) {
        const errorBody = await response.text();
        
        logs.push({
          level: "error",
          message: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          data: { body: errorBody.slice(0, 500) },
        });
        
        return {
          success: false,
          outputs: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            error: errorBody,
          },
          error: createNodeError(
            "HTTP_ERROR",
            `HTTP ${response.status}: ${response.statusText}`,
            { status: response.status, body: errorBody },
            response.status >= 500 // 5xx 错误可重试
          ),
          logs,
          duration,
        };
      }
      
      // 解析响应
      const data = await parseResponse(response);
      const responseHeaders = Object.fromEntries(response.headers.entries());
      
      logs.push({
        level: "info",
        message: `Request completed with status ${response.status} in ${duration}ms`,
        timestamp: new Date().toISOString(),
      });
      
      const httpResponse: HTTPResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        duration,
      };
      
      return {
        success: true,
        outputs: {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          response: httpResponse,
        },
        logs,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      logs.push({
        level: "error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: false,
        outputs: {},
        error: createNodeError(
          "HTTP_REQUEST_FAILED",
          errorMessage,
          error,
          true
        ),
        logs,
        duration,
      };
    }
  },
  
  validate(config) {
    const errors: string[] = [];
    
    if (!config.url) {
      errors.push("URL is required");
    } else if (!config.url.includes("{{")) {
      // 只有在不是变量时才验证 URL 格式
      try {
        new URL(config.url);
      } catch {
        errors.push("Invalid URL format");
      }
    }
    
    if (!config.method) {
      errors.push("HTTP method is required");
    }
    
    if (config.timeout !== undefined && config.timeout < 1000) {
      errors.push("Timeout must be at least 1000ms");
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
