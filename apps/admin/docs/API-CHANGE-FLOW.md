# Admin API 变更适配流程

版本：v1.0  
日期：2026-02-03  
状态：Active  

---

## 1. 概述

本文档定义 Admin 前端如何适配后端 API 变更的标准流程，确保变更可追溯、影响可控。

---

## 2. API 变更分类

### 2.1 变更类型

| 类型 | 描述 | 影响级别 | 示例 |
|------|------|----------|------|
| **新增 API** | 新增接口或字段 | 低 | 新增 `/admin/reports` 接口 |
| **字段变更** | 字段重命名/类型变化 | 中 | `user_id` → `userId` |
| **结构变更** | 响应结构调整 | 高 | 嵌套结构扁平化 |
| **删除 API** | 接口或字段移除 | 高 | 移除 `/admin/legacy` |
| **行为变更** | 相同接口逻辑变化 | 高 | 分页参数从 0-based 改为 1-based |

### 2.2 向后兼容性

- **兼容变更**：新增可选字段、新增接口
- **不兼容变更**：删除字段、重命名字段、改变类型、改变行为

---

## 3. 变更适配流程

### 3.1 流程图

```
┌─────────────────┐
│ 1. 变更通知     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 影响评估     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 类型更新     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 代码适配     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 测试验证     │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. 发布部署     │
└─────────────────┘
```

### 3.2 详细步骤

#### 步骤 1: 变更通知

**触发来源**：
- 后端 API 变更 PR
- API 文档更新
- 定期同步会议

**通知内容**：
```markdown
## API 变更通知

- **变更类型**: [新增/修改/删除]
- **影响接口**: `/api/v1/admin/xxx`
- **变更描述**: [具体变更内容]
- **兼容性**: [向后兼容/不兼容]
- **生效时间**: [日期/版本]
- **迁移窗口**: [如适用]
```

#### 步骤 2: 影响评估

**评估清单**：
- [ ] 识别所有使用该 API 的页面
- [ ] 识别依赖该 API 的组件
- [ ] 评估类型定义变更范围
- [ ] 评估测试用例更新需求
- [ ] 评估是否需要数据迁移
- [ ] 评估是否需要灰度发布

**影响范围模板**：
```typescript
// api-change-impact.ts
export const impact = {
  api: '/api/v1/admin/users',
  changeType: 'field_rename',
  affectedPages: [
    '/users',
    '/users/[id]',
  ],
  affectedComponents: [
    'UserTable',
    'UserDetail',
  ],
  affectedTypes: [
    'User',
    'UserListResponse',
  ],
  testCases: [
    'user-list.spec.ts',
    'user-detail.spec.ts',
  ],
};
```

#### 步骤 3: 类型更新

**更新顺序**：
1. 更新 `src/types/` 中的类型定义
2. 更新 API 响应类型
3. 更新组件 Props 类型

**示例**：
```typescript
// Before
interface User {
  user_id: string;
  user_name: string;
}

// After
interface User {
  userId: string;      // 重命名
  userName: string;    // 重命名
  /** @deprecated Use userId instead */
  user_id?: string;    // 过渡期保留
}
```

#### 步骤 4: 代码适配

**适配策略**：

**策略 A: 直接适配**（适用于兼容变更）
```typescript
// 直接使用新字段
const userId = user.userId;
```

**策略 B: 兼容适配**（适用于过渡期）
```typescript
// 兼容新旧字段
const userId = user.userId ?? user.user_id;
```

**策略 C: 适配层**（适用于大规模变更）
```typescript
// src/lib/api/adapters/user-adapter.ts
export function adaptUser(raw: RawUser): User {
  return {
    userId: raw.userId ?? raw.user_id,
    userName: raw.userName ?? raw.user_name,
  };
}
```

#### 步骤 5: 测试验证

**测试清单**：
- [ ] 单元测试：类型适配
- [ ] 集成测试：API 调用
- [ ] E2E 测试：页面功能
- [ ] 回归测试：相关功能

**测试示例**：
```typescript
// __tests__/api/user-adapter.test.ts
describe('UserAdapter', () => {
  it('should adapt legacy user format', () => {
    const legacy = { user_id: '1', user_name: 'test' };
    const result = adaptUser(legacy);
    expect(result.userId).toBe('1');
    expect(result.userName).toBe('test');
  });

  it('should use new format when available', () => {
    const modern = { userId: '1', userName: 'test' };
    const result = adaptUser(modern);
    expect(result.userId).toBe('1');
  });
});
```

#### 步骤 6: 发布部署

**发布策略**：
- **同步发布**：前后端同时部署
- **前端先行**：前端兼容新旧，后端再发布
- **后端先行**：后端兼容新旧，前端再适配

**推荐流程**：
1. 前端添加兼容层
2. 部署前端
3. 后端发布新 API
4. 前端移除兼容层（可选）

---

## 4. 版本管理

### 4.1 API 版本策略

```typescript
// src/lib/api/version.ts
export const API_VERSION = 'v1';
export const API_BASE = `/api/${API_VERSION}`;

// 支持多版本
export const API_VERSIONS = {
  v1: '/api/v1',
  v2: '/api/v2', // 规划中
};
```

### 4.2 特性开关

```typescript
// src/lib/api/features.ts
export const API_FEATURES = {
  // 新 API 特性开关
  USE_NEW_USER_API: process.env.NEXT_PUBLIC_USE_NEW_USER_API === 'true',
  
  // 兼容模式开关
  LEGACY_USER_FORMAT: process.env.NEXT_PUBLIC_LEGACY_USER_FORMAT === 'true',
};
```

---

## 5. 变更记录

### 5.1 记录模板

```markdown
## [日期] API 变更: [变更标题]

### 变更内容
- 接口: `/api/v1/admin/xxx`
- 类型: [新增/修改/删除]
- 描述: [具体变更]

### 适配方案
- 策略: [直接适配/兼容适配/适配层]
- 代码: [PR 链接]

### 影响范围
- 页面: [页面列表]
- 组件: [组件列表]

### 验证结果
- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 手动验证通过

### 发布信息
- 前端版本: [版本号]
- 后端版本: [版本号]
- 发布时间: [时间]
```

### 5.2 历史变更

| 日期 | 变更 | 类型 | 状态 |
|------|------|------|------|
| 2026-02-03 | 初始化 API 客户端 | 新增 | ✅ 完成 |

---

## 6. 最佳实践

### 6.1 推荐做法

- ✅ 使用类型断言确保类型安全
- ✅ 添加适配层隔离 API 变更
- ✅ 使用特性开关控制新旧逻辑
- ✅ 保留兼容代码至过渡期结束
- ✅ 编写单元测试覆盖适配逻辑

### 6.2 避免做法

- ❌ 直接修改类型定义而不更新使用处
- ❌ 忽略测试覆盖
- ❌ 同时进行大量 API 变更
- ❌ 在没有过渡期的情况下删除兼容代码

---

## 7. 相关文档

- [代码共享策略](./CODE-SHARING.md)
- [目录分层约定](./DIRECTORY-CONVENTION.md)
- [API 映射矩阵](../../docs/api/API-FIELDS.md)
