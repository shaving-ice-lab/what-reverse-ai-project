# 版本变更记录规范

## 格式

- 单行摘要：`type(scope): summary` 或 `type: summary`
- 可选说明行：追加细节或列表

## 类型（type）

- `feat`：新增功能
- `fix`：问题修复
- `perf`：性能优化
- `refactor`：重构
- `docs`：文档更新
- `chore`：工程杂项
- `style`：样式/格式
- `test`：测试相关
- `build`：构建/依赖
- `ci`：CI 流水线
- `revert`：回滚/撤销
- `misc`：无法归类的变更
- `breaking` / `major`：重大变更

## 重大变更标记

满足任一条件即可触发「重大变更」：

- 使用 `breaking:` 或 `major:` 作为类型
- 在正文中包含 `BREAKING:` / `BREAKING CHANGE:` 标记
- 明确写出「重大变更」

## 示例

```
feat(workflow): 新增批量发布入口

BREAKING: 移除旧版参数字段 `legacy_mode`
```

```
revert: 回滚 v12 版本的 schema 变更
```

## 兼容说明

若提交内容不符合上述格式，系统会自动按 `misc:` 归一化，以保证一致性。
