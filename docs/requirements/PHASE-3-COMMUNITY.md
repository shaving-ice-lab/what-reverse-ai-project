# Phase 3: 社区生态 - 详细需求文档

> **版本**: v1.0  
> **更新日期**: 2026-01-29  
> **预计周期**: 8-12 周  
> **前置条件**: Phase 2 完成
> **优先级**: P1 - 增长引擎

---

## 目录

1. [阶段目标](#1-阶段目标)
2. [Agent 商店](#2-agent-商店)
3. [模板市场](#3-模板市场)
4. [自定义节点 SDK](#4-自定义节点-sdk)
5. [创作者经济](#5-创作者经济)
6. [社交功能](#6-社交功能)
7. [开发计划](#7-开发计划)

---

## 1. 阶段目标

### 1.1 核心目标

> **建立增长飞轮，实现用户、创作者、平台三方共赢**

增长模型:
```
┌─────────────────────────────────────────────────────────────────┐
│                        增长飞轮                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           更多用户 ←──────────────────────────┐                 │
│              │                                │                 │
│              ▼                                │                 │
│        更多使用量                             │                 │
│              │                                │                 │
│              ▼                                │                 │
│     更多创作者收入 ────→ 更多创作者 ────→ 更多 Agent           │
│                                               │                 │
│                                               │                 │
│              病毒传播 ←───────────────────────┘                 │
│              (分享、Fork、嵌入)                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 成功标准

| 指标 | 目标 |
|------|------|
| Agent 商店上架数量 | > 200 |
| 活跃创作者数量 | > 100 |
| 月活跃用户 (MAU) | > 20,000 |
| Agent 月交易额 | > ¥100,000 |
| 用户 NPS | > 50 |

---

## 2. Agent 商店

### 2.1 概述

Agent 商店是用户发现、使用、分享 AI Agent 的中心平台。

### 2.2 功能需求

#### REQ-201: 商店首页

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-201-1 | 精选推荐 | P0 | 编辑推荐的优质 Agent |
| REQ-201-2 | 热门排行 | P0 | 按使用量排序 |
| REQ-201-3 | 最新上架 | P0 | 时间倒序 |
| REQ-201-4 | 分类浏览 | P0 | 按类别筛选 |
| REQ-201-5 | 搜索 | P0 | 关键词搜索 |
| REQ-201-6 | 标签筛选 | P1 | 按标签过滤 |

#### REQ-202: Agent 详情页

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-202-1 | 基本信息 | P0 | 名称、描述、图标、作者 |
| REQ-202-2 | 截图/演示 | P0 | 效果展示 |
| REQ-202-3 | 使用统计 | P0 | 使用次数、评分 |
| REQ-202-4 | 评价列表 | P0 | 用户评价 |
| REQ-202-5 | 版本历史 | P1 | 更新日志 |
| REQ-202-6 | 相关推荐 | P1 | 相似 Agent |

#### REQ-203: Agent 操作

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-203-1 | 一键使用 | P0 | 直接运行 Agent |
| REQ-203-2 | 添加到工作流 | P0 | 作为子流程使用 |
| REQ-203-3 | Fork | P0 | 复制到自己账户 |
| REQ-203-4 | 收藏 | P0 | 添加到收藏夹 |
| REQ-203-5 | 分享 | P0 | 生成分享链接 |
| REQ-203-6 | 评价 | P1 | 评分和评论 |
| REQ-203-7 | 举报 | P1 | 举报违规内容 |

### 2.3 UI 设计

**商店首页**:

```
┌─────────────────────────────────────────────────────────────────┐
│  🏪 Agent 商店                           [搜索...]   [发布 Agent]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📌 精选推荐                                        [查看更多 →]│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ 📰          │ │ 📊          │ │ 🎨          │ │ 💼        │ │
│  │ 每日新闻    │ │ 数据分析    │ │ 设计助手    │ │ 商业计划  │ │
│  │ 摘要助手    │ │ 专家        │ │             │ │ 生成器    │ │
│  │             │ │             │ │             │ │           │ │
│  │ ⭐4.9 免费  │ │ ⭐4.8 ¥9.9 │ │ ⭐4.7 免费  │ │⭐4.6 ¥19.9│ │
│  │ 👤 1.2k使用 │ │ 👤 856使用  │ │ 👤 2.1k使用 │ │ 👤 432使用│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  🔥 热门分类                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ 内容创作 │ │ 数据处理 │ │ 客服助手 │ │ 开发工具 │ │办公效率││
│  │   128    │ │    95    │ │    67    │ │    89    │ │   112  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                 │
│  🆕 最新上架                                        [查看更多 →]│
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Agent 列表...                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Agent 详情页**:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  📰 每日新闻摘要助手                              │
│  │         │                                                    │
│  │  ICON   │  自动获取热门新闻并用 AI 生成摘要                  │
│  │         │                                                    │
│  └─────────┘  作者: @creator123  |  v2.1.0  |  更新于 3天前     │
│                                                                 │
│  ⭐ 4.9 (328 评价)  |  👤 1.2k 使用  |  ❤️ 456 收藏             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [🚀 立即使用]  [📥 添加到工作流]  [🍴 Fork]  [❤️ 收藏]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 功能介绍 ───────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  这个 Agent 可以:                                         │  │
│  │  ✅ 自动获取 Hacker News、Reddit 等热门内容               │  │
│  │  ✅ 使用 GPT-4 生成中文摘要                               │  │
│  │  ✅ 支持定时推送到邮箱                                     │  │
│  │  ✅ 可自定义关注的话题                                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 截图预览 ───────────────────────────────────────────────┐  │
│  │  [截图1]  [截图2]  [截图3]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 用户评价 ───────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ⭐⭐⭐⭐⭐ 用户A  "非常好用，每天必用"     2天前         │  │
│  │  ⭐⭐⭐⭐⭐ 用户B  "节省了很多时间"        5天前         │  │
│  │  ⭐⭐⭐⭐  用户C  "希望支持更多来源"      1周前         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 数据模型

```sql
-- Agent 表
CREATE TABLE agents (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    workflow_id     VARCHAR(36) NOT NULL,
    
    -- 基本信息
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    long_description TEXT,
    icon            VARCHAR(500),
    cover_image     VARCHAR(500),
    screenshots     JSONB DEFAULT '[]',
    
    -- 分类
    category        VARCHAR(50),
    tags            JSONB DEFAULT '[]',
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'draft', -- draft, pending, published, rejected
    visibility      VARCHAR(20) DEFAULT 'public', -- public, private, unlisted
    
    -- 定价
    pricing_type    VARCHAR(20) DEFAULT 'free', -- free, paid, subscription
    price           DECIMAL(10, 2),
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 统计
    use_count       INTEGER DEFAULT 0,
    star_count      INTEGER DEFAULT 0,
    fork_count      INTEGER DEFAULT 0,
    review_count    INTEGER DEFAULT 0,
    avg_rating      DECIMAL(3, 2) DEFAULT 0,
    
    -- 版本
    version         VARCHAR(20) DEFAULT '1.0.0',
    changelog       TEXT,
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- 评价表
CREATE TABLE agent_reviews (
    id              VARCHAR(36) PRIMARY KEY,
    agent_id        VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content         TEXT,
    
    -- 互动
    helpful_count   INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (agent_id, user_id)
);

-- 收藏表
CREATE TABLE agent_stars (
    agent_id        VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (agent_id, user_id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Agent 使用记录
CREATE TABLE agent_usages (
    id              VARCHAR(36) PRIMARY KEY,
    agent_id        VARCHAR(36) NOT NULL,
    user_id         VARCHAR(36) NOT NULL,
    execution_id    VARCHAR(36),
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.5 API 设计

```yaml
# Agent 商店 API

# 浏览
GET /api/v1/agents                    # 获取 Agent 列表
GET /api/v1/agents/featured           # 精选推荐
GET /api/v1/agents/trending           # 热门排行
GET /api/v1/agents/categories         # 分类列表
GET /api/v1/agents/:slug              # Agent 详情

# 操作
POST /api/v1/agents/:id/use           # 使用 Agent
POST /api/v1/agents/:id/fork          # Fork Agent
POST /api/v1/agents/:id/star          # 收藏/取消收藏
POST /api/v1/agents/:id/review        # 提交评价

# 创作者
POST /api/v1/agents                   # 发布 Agent
PUT /api/v1/agents/:id                # 更新 Agent
DELETE /api/v1/agents/:id             # 下架 Agent
GET /api/v1/agents/:id/analytics      # 获取分析数据
```

### 2.6 分类定义

| 分类 | 英文 | 描述 |
|------|------|------|
| 内容创作 | content | 写作、文案、社媒 |
| 数据处理 | data | 分析、清洗、报表 |
| 客服助手 | customer-service | 智能客服、FAQ |
| 开发工具 | developer | 代码、文档、测试 |
| 办公效率 | productivity | 日程、邮件、协作 |
| 研究分析 | research | 调研、竞品、论文 |
| 营销推广 | marketing | 广告、SEO、增长 |
| 教育学习 | education | 学习、翻译、辅导 |
| 生活助手 | lifestyle | 健康、理财、旅行 |
| 其他 | other | 未分类 |

---

## 3. 模板市场

### 3.1 概述

模板市场提供预制的工作流模板，帮助用户快速开始。

### 3.2 功能需求

#### REQ-301: 模板浏览

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-301-1 | 模板列表 | P0 | 按分类展示模板 |
| REQ-301-2 | 模板预览 | P0 | 预览工作流结构 |
| REQ-301-3 | 一键使用 | P0 | 从模板创建工作流 |
| REQ-301-4 | 模板详情 | P0 | 说明、使用方法 |

### 3.3 预置模板列表

**MVP 必须提供的 20 个模板**:

| 分类 | 模板名称 | 描述 |
|------|----------|------|
| 内容创作 | 文章摘要生成器 | 输入 URL，生成文章摘要 |
| 内容创作 | 社交媒体内容生成 | 根据主题生成多平台内容 |
| 内容创作 | SEO 文章写作 | 根据关键词生成 SEO 文章 |
| 数据处理 | JSON 数据转换 | JSON 格式转换和处理 |
| 数据处理 | CSV 数据分析 | 分析 CSV 数据并生成报告 |
| 数据处理 | API 数据聚合 | 聚合多个 API 的数据 |
| 客服助手 | FAQ 问答机器人 | 基于知识库的问答 |
| 客服助手 | 工单自动分类 | 自动分类客服工单 |
| 开发工具 | 代码审查助手 | 审查代码并提供建议 |
| 开发工具 | API 文档生成 | 从代码生成 API 文档 |
| 开发工具 | 错误日志分析 | 分析错误日志并给出建议 |
| 办公效率 | 会议纪要生成 | 从会议录音生成纪要 |
| 办公效率 | 邮件自动回复 | 智能邮件回复 |
| 办公效率 | 日报周报生成 | 自动生成工作报告 |
| 研究分析 | 竞品分析报告 | 分析竞品并生成报告 |
| 研究分析 | 新闻摘要聚合 | 聚合多源新闻并摘要 |
| 营销推广 | 广告文案生成 | 生成多版本广告文案 |
| 营销推广 | 用户评论分析 | 分析用户评论情感 |
| 教育学习 | 语言翻译助手 | 多语言翻译 |
| 教育学习 | 学习笔记整理 | 整理和总结学习内容 |

### 3.4 模板数据结构

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  
  // 工作流定义
  definition: WorkflowDefinition;
  
  // 使用说明
  instructions: string;
  
  // 需要的配置
  requiredConfig: {
    apiKeys?: string[];  // 需要的 API Key
    inputs?: InputField[];  // 需要的输入
  };
  
  // 统计
  useCount: number;
  
  // 元数据
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. 自定义节点 SDK

### 4.1 概述

提供 SDK 让开发者可以创建自定义节点，扩展平台能力。

### 4.2 SDK 设计

#### 4.2.1 节点定义

```typescript
// @agentflow/sdk

import { defineNode, Input, Output } from '@agentflow/sdk';

export default defineNode({
  // 基本信息
  id: 'my-custom-node',
  name: '我的自定义节点',
  description: '节点描述',
  icon: '🔧',
  category: 'custom',
  version: '1.0.0',
  author: 'your-username',
  
  // 输入定义
  inputs: {
    text: Input.text({
      label: '输入文本',
      required: true,
      placeholder: '请输入...',
    }),
    
    number: Input.number({
      label: '数值',
      default: 10,
      min: 0,
      max: 100,
    }),
    
    select: Input.select({
      label: '选项',
      options: [
        { value: 'a', label: '选项 A' },
        { value: 'b', label: '选项 B' },
      ],
    }),
  },
  
  // 输出定义
  outputs: {
    result: Output.text({
      label: '结果',
    }),
  },
  
  // 执行逻辑
  async execute({ inputs, context }) {
    const { text, number, select } = inputs;
    
    // 你的逻辑
    const result = `处理结果: ${text}`;
    
    // 使用 context 提供的能力
    context.log.info('处理完成');
    
    return {
      result,
    };
  },
});
```

#### 4.2.2 Context API

```typescript
interface NodeContext {
  // 日志
  log: {
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    debug(message: string, data?: any): void;
  };
  
  // LLM 调用
  llm: {
    chat(options: LLMChatOptions): Promise<LLMResponse>;
  };
  
  // HTTP 请求
  http: {
    request(options: HTTPRequestOptions): Promise<HTTPResponse>;
    get(url: string, options?: HTTPOptions): Promise<HTTPResponse>;
    post(url: string, body: any, options?: HTTPOptions): Promise<HTTPResponse>;
  };
  
  // 缓存
  cache: {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
  };
  
  // 用户密钥
  secrets: {
    get(name: string): Promise<string | null>;
  };
  
  // 进度更新
  progress: {
    update(percent: number, message?: string): void;
  };
  
  // 配置
  config: {
    defaultModel: string;
    timeout: number;
  };
}
```

### 4.3 节点发布流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     节点发布流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 开发节点                                                     │
│     └── 使用 SDK 创建节点                                        │
│                                                                 │
│  2. 本地测试                                                     │
│     └── agentflow-cli test                                      │
│                                                                 │
│  3. 打包验证                                                     │
│     └── agentflow-cli validate                                  │
│                                                                 │
│  4. 发布                                                         │
│     └── agentflow-cli publish                                   │
│                                                                 │
│  5. 审核                                                         │
│     └── 平台审核（安全、功能）                                    │
│                                                                 │
│  6. 上架                                                         │
│     └── 用户可在节点市场安装                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 CLI 工具

```bash
# 安装
npm install -g @agentflow/cli

# 创建节点项目
agentflow-cli init my-node

# 开发模式
agentflow-cli dev

# 测试
agentflow-cli test

# 验证
agentflow-cli validate

# 发布
agentflow-cli publish
```

---

## 5. 创作者经济

### 5.1 概述

建立创作者变现体系，让优秀创作者能够通过平台获得收入。

### 5.2 分成模式

| 类型 | 创作者分成 | 平台分成 | 说明 |
|------|-----------|----------|------|
| 付费 Agent | 70% | 30% | 单次购买或订阅 |
| 付费节点 | 70% | 30% | 自定义节点销售 |
| 打赏 | 90% | 10% | 用户自愿打赏 |
| 推广收益 | 50% | 50% | 推广返佣 |

### 5.3 创作者激励

**阶梯分成**:

| 月收入 | 创作者分成 |
|--------|-----------|
| ¥0 - ¥1,000 | 70% |
| ¥1,000 - ¥10,000 | 75% |
| ¥10,000+ | 80% |

**新创作者扶持**:
- 首 3 个月 0% 平台分成
- 新手创作者专属流量
- 官方推荐位

### 5.4 结算系统

```sql
-- 收入记录表
CREATE TABLE earnings (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    agent_id        VARCHAR(36),
    node_id         VARCHAR(36),
    
    -- 收入类型
    type            VARCHAR(20) NOT NULL, -- sale, subscription, tip, referral
    
    -- 金额
    gross_amount    DECIMAL(10, 2) NOT NULL, -- 总金额
    platform_fee    DECIMAL(10, 2) NOT NULL, -- 平台费用
    net_amount      DECIMAL(10, 2) NOT NULL, -- 净收入
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 来源
    source_user_id  VARCHAR(36), -- 付款用户
    source_order_id VARCHAR(36), -- 订单 ID
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, paid
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at    TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 提现记录表
CREATE TABLE withdrawals (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    
    -- 金额
    amount          DECIMAL(10, 2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'CNY',
    
    -- 提现方式
    method          VARCHAR(20) NOT NULL, -- alipay, wechat, bank
    account_info    JSONB NOT NULL,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- 时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    processed_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5.5 创作者仪表盘

```
┌─────────────────────────────────────────────────────────────────┐
│  💰 创作者中心                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ 收入概览 ───────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  本月收入          待结算            已提现               │  │
│  │  ¥ 12,580         ¥ 3,200           ¥ 45,600            │  │
│  │  ↑ 23% vs 上月                                           │  │
│  │                                                           │  │
│  │  [📊 查看详情]  [💳 提现]                                 │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 收入趋势 ───────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │    ¥                                                      │  │
│  │  15k │          ┌─┐                                       │  │
│  │  10k │      ┌─┐ │ │ ┌─┐                                   │  │
│  │   5k │  ┌─┐ │ │ │ │ │ │ ┌─┐                               │  │
│  │    0 └──┴─┴─┴─┴─┴─┴─┴─┴─┴─┴──                             │  │
│  │       W1  W2  W3  W4  W5  W6                               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ 我的 Agent ─────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  📰 每日新闻摘要     ¥5,280    1.2k使用    ⭐4.9         │  │
│  │  📊 数据分析专家     ¥3,120    856使用     ⭐4.8         │  │
│  │  🎨 设计灵感助手     ¥2,680    2.1k使用    ⭐4.7         │  │
│  │                                                           │  │
│  │  [➕ 发布新 Agent]                                        │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 社交功能

### 6.1 功能需求

#### REQ-601: 用户关系

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-601-1 | 关注用户 | P1 | 关注创作者 |
| REQ-601-2 | 粉丝列表 | P1 | 查看粉丝 |
| REQ-601-3 | 关注动态 | P2 | 关注者的新作品 |

#### REQ-602: 互动功能

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-602-1 | 评论 | P1 | Agent 评论 |
| REQ-602-2 | 点赞 | P1 | 点赞评论 |
| REQ-602-3 | 分享 | P0 | 社交分享 |

#### REQ-603: 通知系统

| ID | 功能 | 优先级 | 说明 |
|----|------|--------|------|
| REQ-603-1 | 站内通知 | P0 | 系统消息 |
| REQ-603-2 | 互动通知 | P1 | 评论、关注、点赞 |
| REQ-603-3 | 收入通知 | P1 | 收入到账提醒 |

### 6.2 分享功能

**分享方式**:
- 链接分享
- 二维码分享
- 嵌入代码 (iframe)
- 社交平台分享 (微信/微博/Twitter)

**分享链接格式**:
```
https://agentflow.app/a/slug-name
```

**嵌入代码**:
```html
<iframe 
  src="https://agentflow.app/embed/slug-name" 
  width="100%" 
  height="400"
  frameborder="0">
</iframe>
```

---

## 7. 开发计划

### 7.1 Week 1-3: Agent 商店基础

| 任务 | 预估 | 状态 |
|------|------|------|
| 商店首页 UI | 3d | ⬜ |
| Agent 详情页 | 2d | ⬜ |
| Agent 发布流程 | 3d | ⬜ |
| 搜索和筛选 | 2d | ⬜ |
| Agent API | 3d | ⬜ |

### 7.2 Week 4-6: 模板和评价

| 任务 | 预估 | 状态 |
|------|------|------|
| 模板市场 | 3d | ⬜ |
| 20 个预置模板 | 5d | ⬜ |
| 评价系统 | 2d | ⬜ |
| 收藏功能 | 1d | ⬜ |
| Fork 功能 | 2d | ⬜ |

### 7.3 Week 7-9: 创作者功能

| 任务 | 预估 | 状态 |
|------|------|------|
| 创作者仪表盘 | 3d | ⬜ |
| 收入统计 | 2d | ⬜ |
| 结算系统 | 3d | ⬜ |
| 提现功能 | 2d | ⬜ |
| 分析报表 | 2d | ⬜ |

### 7.4 Week 10-12: 社交和节点 SDK

| 任务 | 预估 | 状态 |
|------|------|------|
| 关注系统 | 2d | ⬜ |
| 通知系统 | 2d | ⬜ |
| 分享功能 | 2d | ⬜ |
| 节点 SDK 完善 | 3d | ⬜ |
| CLI 工具 | 2d | ⬜ |
| 文档完善 | 2d | ⬜ |

---

## 附录

### A. 审核规范

**Agent 审核标准**:
- ✅ 功能描述准确
- ✅ 无恶意代码
- ✅ 无侵权内容
- ✅ 无敏感信息
- ✅ 正常运行

**审核时间**: 1-3 个工作日

### B. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-01-29 | 初始版本 | - |
