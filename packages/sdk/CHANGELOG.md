# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-27

### Added

- **Core API**
  - `defineNode()` - 节点定义核心函数
  - `input` - 输入字段构建器 (string, number, boolean, object, array, select, file, image, json, any)
  - `output` - 输出字段构建器

- **Type System**
  - 完整的 TypeScript 类型定义
  - 节点类别、数据类型、图标名称类型
  - 输入/输出字段配置类型
  - 执行上下文类型
  - 验证结果类型

- **Validation**
  - `validateAllInputs()` - 验证所有输入
  - `validateInputField()` - 验证单个字段
  - `validateNodeDefinition()` - 验证节点定义
  - `validators` - 预置验证器 (email, url, uuid, phone, etc.)
  - 支持同步和异步验证
  - 支持条件显示逻辑

- **Testing Framework**
  - `createNodeTester()` - 创建节点测试器
  - `createTestContext()` - 创建测试上下文
  - Mock 对象: `createMockLogger()`, `createMockHttpClient()`, `createMockStorage()`
  - 断言辅助: `assert.success()`, `assert.failure()`, `assert.outputEquals()`, `assert.hasLog()`, `assert.hasHttpRequest()`
  - `runTestSuite()` - 运行测试套件

- **CLI Tools**
  - `reverseai init` - 初始化节点项目
  - `reverseai build` - 构建节点
  - `reverseai test` - 运行测试
  - `reverseai validate` - 验证节点定义

- **Example Nodes**
  - `textTransformNode` - 文本转换示例
  - `httpRequestNode` - HTTP 请求示例
  - `jsonTransformNode` - JSON 转换示例

- **Error Types**
  - `SDKError` - SDK 错误基类
  - `ValidationError` - 验证错误
  - `ExecutionError` - 执行错误
  - `ConfigurationError` - 配置错误

### Documentation

- 完整的 README 文档
- API 参考文档
- 使用示例
