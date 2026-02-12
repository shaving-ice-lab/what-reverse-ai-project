# SDK/CLI 规划

> 目标：让开发者在 30 分钟内完成自定义节点的创建、调试、测试与发布闭环。

## 适用对象

- 自定义节点/插件开发者
- 平台集成与扩展开发者

## 现状盘点

- SDK 代码位于 `packages/sdk`，提供 `defineNode`、输入/输出构建器、验证器等能力
- CLI 入口为 `reverseai`，位于 `packages/sdk/src/cli`
- 现有文档：
  - `packages/sdk/README.md`
  - `packages/sdk/src/plugin/PLUGIN_DEV_GUIDE.md`

## 规划目标

1. SDK API 稳定、类型完善，确保向后兼容
2. CLI 覆盖创建、开发、构建、验证、测试与发布
3. 标准模板可复用，降低起步成本
4. 文档与示例完整，保证可执行与可验证

## CLI 命令规划（现状 + 规范）

| 命令          | 说明           | 关键参数                                              |
| ------------- | -------------- | ----------------------------------------------------- |
| `init [name]` | 初始化节点项目 | `--template`、`--directory`、`--typescript`           |
| `dev`         | 启动开发模式   | `--port`、`--file`、`--no-watch`、`--no-interactive`  |
| `build`       | 构建节点项目   | `--watch`、`--output`、`--minify`                     |
| `test`        | 运行节点测试   | `--watch`、`--coverage`、`--filter`                   |
| `validate`    | 校验节点定义   | `--file`、`--strict`                                  |
| `publish`     | 发布到市场     | `--registry`、`--token`、`--manifest`、`--skip-build` |

> CLI 入口由 `packages/sdk/package.json` 的 `bin.reverseai` 暴露。

## SDK 能力规划

- **核心 API**：`defineNode`、`input`、`output`、`validators` 的稳定性保障
- **执行上下文**：日志、进度、HTTP、存储、密钥等能力文档化
- **校验工具**：`validateAllInputs` 与 `validateNodeDefinition` 统一规范
- **测试框架**：`createNodeTester` 与 `runTestSuite` 覆盖最小闭环

## 模板规划

模板由 `reverseai init --template <name>` 使用，建议落位于：
`packages/sdk/src/cli/templates/<name>/`

| 模板           | 目标场景       | 必含文件                                        |
| -------------- | -------------- | ----------------------------------------------- |
| `basic`        | 最小可运行节点 | `manifest.json`、`src/index.ts`、`package.json` |
| `http-request` | HTTP 集成节点  | `src/nodes/http.ts`、`README.md`                |
| `llm`          | LLM 调用节点   | `src/nodes/llm.ts`、`README.md`                 |
| `transform`    | 数据转换节点   | `src/nodes/transform.ts`                        |
| `plugin`       | 插件型项目     | `manifest.json`、`src/index.ts`、`assets/`      |

## 发布与版本策略

- **发布载体**：NPM 包 `@reverseai/sdk`，内置 `reverseai` CLI
- **版本策略**：语义化版本 (SemVer)
- **发布步骤**：
  1. `pnpm -C packages/sdk build`
  2. `pnpm -C packages/sdk test`
  3. 更新 `CHANGELOG.md`
  4. `pnpm publish`（或 CI 自动发布）
- **鉴权配置**：
  - `REVERSEAI_MARKETPLACE_URL`
  - `REVERSEAI_PUBLISH_TOKEN`

## 文档与示例规划

- CLI 使用说明：补充命令用例与参数说明（可新增 `docs/SDK-CLI-USER-GUIDE.md`）
- SDK API 参考：以 `packages/sdk/README.md` 为主，补充典型场景
- 插件开发：以 `PLUGIN_DEV_GUIDE.md` 为主，补充一键脚手架

## 验收标准（可执行）

1. `reverseai init` 生成的项目可直接 `pnpm install` + `reverseai dev` 跑通
2. 模板项目 `reverseai validate` 通过，且存在最小测试用例
3. `reverseai publish` 能基于 token 完成发布请求或模拟请求
4. SDK 文档能覆盖创建、调试、测试、发布全链路

## 风险与回滚

- **风险**：CLI 与 SDK 发布节奏不一致导致兼容问题
- **回滚**：保留上一版本 CLI 与 SDK，并在文档中注明兼容范围
