# {{projectName}}

ReverseAI 自定义节点 - 数据转换模板

## 功能

灵活的数据转换节点，支持：

- JSON 路径提取
- 字段映射
- 数据过滤
- 数组展平
- 分组聚合
- 排序
- 去重

## 安装

```bash
npm install
```

## 使用示例

### 提取字段

```json
{
  "data": { "user": { "profile": { "name": "John" } } },
  "operation": "extract",
  "path": "user.profile.name"
}
// 输出: "John"
```

### 映射转换

```json
{
  "data": [{ "firstName": "John", "lastName": "Doe" }],
  "operation": "map",
  "mapping": {
    "fullName": "firstName",
    "family": "lastName"
  }
}
// 输出: [{ "fullName": "John", "family": "Doe" }]
```

### 过滤数据

```json
{
  "data": [
    { "name": "A", "status": "active" },
    { "name": "B", "status": "inactive" }
  ],
  "operation": "filter",
  "filterExpression": "item.status === 'active'"
}
// 输出: [{ "name": "A", "status": "active" }]
```

## 输入参数

| 参数             | 类型   | 必填 | 说明       |
| ---------------- | ------ | ---- | ---------- |
| data             | json   | 是   | 输入数据   |
| operation        | select | 是   | 操作类型   |
| path             | string | 否   | JSON 路径  |
| mapping          | json   | 否   | 映射规则   |
| filterExpression | string | 否   | 过滤表达式 |
| sortField        | string | 否   | 排序字段   |
| sortOrder        | select | 否   | 排序顺序   |
| groupField       | string | 否   | 分组字段   |

## 输出

| 字段    | 类型    | 说明     |
| ------- | ------- | -------- |
| result  | json    | 转换结果 |
| count   | number  | 数据量   |
| success | boolean | 是否成功 |

## 许可证

MIT
