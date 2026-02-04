# 重大变更审批流程

## 触发条件
当版本变更记录满足以下任一条件时，视为重大变更：
- `breaking:` / `major:` 类型
- 包含 `BREAKING:` / `BREAKING CHANGE:`
- 明确写出「重大变更」

## 流程
1. 创建版本并填写变更记录。
2. 系统自动创建重大变更审核队列；若未自动创建，可手动提交审核。
3. 审核员通过/拒绝审核并记录原因。
4. 版本发布前必须完成审核；未通过审核将阻断发布。

## API 示例

### 提交审核
`POST /api/v1/apps/:id/major-change/review`
```json
{
  "version_id": "uuid",
  "note": "涉及接口字段调整"
}
```

### 获取审核状态
`GET /api/v1/apps/:id/major-change/review?version_id=uuid`

### 获取审核历史
`GET /api/v1/apps/:id/major-change/review/history?version_id=uuid`

### 审核通过
`POST /api/v1/apps/:id/major-change/review/approve`
```json
{
  "version_id": "uuid",
  "note": "风险可控，允许发布"
}
```

### 审核拒绝
`POST /api/v1/apps/:id/major-change/review/reject`
```json
{
  "version_id": "uuid",
  "reason": "缺少回滚方案"
}
```
