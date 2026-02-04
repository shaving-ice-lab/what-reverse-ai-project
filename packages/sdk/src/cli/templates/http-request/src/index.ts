/**
 * {{projectName}} - HTTP 请求节点
 *
 * 提供灵活的 HTTP 请求功能，支持各种 API 集成场景。
 */

import { defineNode, input, output } from "@agentflow/sdk";

export default defineNode({
  id: "{{nodeId}}",
  name: "{{nodeName}}",
  description: "发送 HTTP 请求并处理响应",
  icon: "globe",
  category: "integration",
  version: "1.0.0",
  author: "{{author}}",
  tags: ["http", "api", "integration"],

  inputs: {
    url: input
      .string("请求 URL")
      .required()
      .placeholder("https://api.example.com/endpoint")
      .description("完整的请求 URL")
      .build(),

    method: input
      .select("请求方法", [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "PATCH", label: "PATCH" },
        { value: "DELETE", label: "DELETE" },
      ])
      .default("GET")
      .description("HTTP 请求方法")
      .build(),

    headers: input
      .json("请求头")
      .default({})
      .description("自定义请求头，JSON 格式")
      .build(),

    body: input
      .json("请求体")
      .description("POST/PUT/PATCH 请求的请求体")
      .build(),

    timeout: input
      .number("超时时间")
      .default(30000)
      .min(1000)
      .max(300000)
      .description("请求超时时间（毫秒）")
      .build(),

    retries: input
      .number("重试次数")
      .default(0)
      .min(0)
      .max(5)
      .description("请求失败时的重试次数")
      .build(),
  },

  outputs: {
    status: output.number("状态码").description("HTTP 响应状态码").build(),

    headers: output.json("响应头").description("HTTP 响应头").build(),

    body: output.json("响应体").description("解析后的 JSON 响应体").build(),

    rawBody: output.string("原始响应").description("原始响应文本").build(),

    duration: output.number("耗时").description("请求耗时（毫秒）").build(),

    success: output.boolean("是否成功").description("请求是否成功（2xx）").build(),
  },

  async execute(ctx) {
    const { url, method, headers, body, timeout, retries } = ctx.inputs;

    ctx.log.info("发送 HTTP 请求", { url, method });
    ctx.reportProgress(10, "准备请求...");

    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempt = 0;
    const normalizedHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers || {})) {
      if (value !== undefined) {
        normalizedHeaders[key] = String(value);
      }
    }

    while (attempt <= retries) {
      try {
        if (attempt > 0) {
          ctx.log.info(`重试请求 (${attempt}/${retries})`);
          ctx.reportProgress(10 + attempt * 10, `重试中 (${attempt}/${retries})...`);
        }

        const response = await ctx.http.request({
          url,
          method,
          headers: normalizedHeaders,
          body: body ? JSON.stringify(body) : undefined,
          timeout,
        });

        const duration = Date.now() - startTime;
        const success = response.status >= 200 && response.status < 300;

        ctx.reportProgress(100, "完成");
        ctx.log.info("请求完成", {
          status: response.status,
          duration,
          success,
        });

        let parsedBody = response.body;
        try {
          if (typeof response.body === "string") {
            parsedBody = JSON.parse(response.body);
          }
        } catch {
          // 保持原始响应
        }

        return {
          status: response.status,
          headers: response.headers,
          body: parsedBody,
          rawBody: typeof response.body === "string" ? response.body : JSON.stringify(response.body),
          duration,
          success,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt <= retries) {
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // 所有重试都失败
    ctx.log.error("请求失败", { error: lastError?.message });
    throw lastError || new Error("请求失败");
  },
});
