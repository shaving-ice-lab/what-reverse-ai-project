-- 创作者经济 - 收入系统 (MySQL 版本)
-- 版本: 000009
-- 创建时间: 2026-01-29

-- =====================
-- 分成规则表 (what_reverse_commission_tiers)
-- 定义阶梯分成规则
-- =====================
CREATE TABLE what_reverse_commission_tiers (
    id                  CHAR(36) PRIMARY KEY,
    
    -- 阶梯配置
    tier_name           VARCHAR(50) NOT NULL,
    min_revenue         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    max_revenue         DECIMAL(12, 2),
    commission_rate     DECIMAL(5, 4) NOT NULL,
    
    -- 收入类型 (sale, subscription, tip, referral, NULL=all)
    earning_type        ENUM('sale', 'subscription', 'tip', 'referral'),
    
    -- 描述
    description         TEXT,
    
    -- 状态
    is_active           BOOLEAN DEFAULT TRUE,
    
    -- 优先级
    priority            INT DEFAULT 0,
    
    -- 时间戳
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认阶梯分成规则
INSERT INTO what_reverse_commission_tiers (id, tier_name, min_revenue, max_revenue, commission_rate, priority, description) VALUES
    (UUID(), '新手创作者', 0, 1000, 0.7000, 1, '月收入 0-1000 元，创作者获得 70%'),
    (UUID(), '成长创作者', 1000, 5000, 0.7500, 2, '月收入 1000-5000 元，创作者获得 75%'),
    (UUID(), '优秀创作者', 5000, 20000, 0.8000, 3, '月收入 5000-20000 元，创作者获得 80%'),
    (UUID(), '明星创作者', 20000, 100000, 0.8500, 4, '月收入 20000-100000 元，创作者获得 85%'),
    (UUID(), '顶级创作者', 100000, NULL, 0.9000, 5, '月收入超过 100000 元，创作者获得 90%');

-- =====================
-- 创作者收入表 (what_reverse_earnings)
-- =====================
CREATE TABLE what_reverse_earnings (
    id                  CHAR(36) PRIMARY KEY,
    
    -- 关联
    user_id             CHAR(36) NOT NULL,
    agent_id            CHAR(36),
    buyer_id            CHAR(36),
    
    -- 收入类型
    earning_type        ENUM('sale', 'subscription', 'tip', 'referral') NOT NULL,
    
    -- 金额
    gross_amount        DECIMAL(12, 2) NOT NULL,
    platform_fee        DECIMAL(12, 2) NOT NULL,
    net_amount          DECIMAL(12, 2) NOT NULL,
    commission_rate     DECIMAL(5, 4) NOT NULL,
    
    -- 币种
    currency            VARCHAR(10) DEFAULT 'CNY',
    
    -- 状态
    status              ENUM('pending', 'confirmed', 'settled', 'refunded', 'cancelled') DEFAULT 'pending',
    
    -- 关联订单/交易
    order_id            VARCHAR(100),
    transaction_id      VARCHAR(100),
    
    -- 详情
    description         TEXT,
    metadata            JSON,
    
    -- 推荐人
    referrer_id         CHAR(36),
    referral_bonus      DECIMAL(12, 2),
    
    -- 结算信息
    settlement_id       CHAR(36),
    settled_at          TIMESTAMP NULL,
    
    -- 退款信息
    refund_reason       TEXT,
    refunded_at         TIMESTAMP NULL,
    
    -- 时间戳
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES what_reverse_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (buyer_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL,
    FOREIGN KEY (referrer_id) REFERENCES what_reverse_users(id) ON DELETE SET NULL
);

-- =====================
-- 创作者账户表 (what_reverse_creator_accounts)
-- =====================
CREATE TABLE what_reverse_creator_accounts (
    id                  CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL UNIQUE,
    
    -- 账户余额
    balance             DECIMAL(12, 2) DEFAULT 0,
    pending_balance     DECIMAL(12, 2) DEFAULT 0,
    total_earned        DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn     DECIMAL(12, 2) DEFAULT 0,
    
    -- 本月收入
    monthly_revenue     DECIMAL(12, 2) DEFAULT 0,
    monthly_reset_at    DATE DEFAULT (CURRENT_DATE),
    
    -- 当前分成等级
    current_tier_id     CHAR(36),
    
    -- 统计
    sale_count          INT DEFAULT 0,
    subscription_count  INT DEFAULT 0,
    tip_count           INT DEFAULT 0,
    referral_count      INT DEFAULT 0,
    
    -- 收款信息
    payment_method      VARCHAR(50),
    payment_account     TEXT,
    payment_name        VARCHAR(100),
    is_verified         BOOLEAN DEFAULT FALSE,
    
    -- 状态
    status              VARCHAR(20) DEFAULT 'active',
    
    -- 时间戳
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_tier_id) REFERENCES what_reverse_commission_tiers(id)
);

-- =====================
-- 提现申请表 (what_reverse_withdrawals)
-- =====================
CREATE TABLE what_reverse_withdrawals (
    id                  CHAR(36) PRIMARY KEY,
    user_id             CHAR(36) NOT NULL,
    account_id          CHAR(36) NOT NULL,
    
    -- 金额
    amount              DECIMAL(12, 2) NOT NULL,
    fee                 DECIMAL(12, 2) DEFAULT 0,
    actual_amount       DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'CNY',
    
    -- 收款信息快照
    payment_method      VARCHAR(50) NOT NULL,
    payment_account     TEXT NOT NULL,
    payment_name        VARCHAR(100) NOT NULL,
    
    -- 状态
    status              ENUM('pending', 'processing', 'completed', 'rejected', 'failed') DEFAULT 'pending',
    
    -- 处理信息
    processed_by        CHAR(36),
    processed_at        TIMESTAMP NULL,
    rejection_reason    TEXT,
    
    -- 第三方交易信息
    external_order_id   VARCHAR(100),
    external_status     VARCHAR(50),
    
    -- 备注
    note                TEXT,
    admin_note          TEXT,
    
    -- 时间戳
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP NULL,
    
    -- 外键
    FOREIGN KEY (user_id) REFERENCES what_reverse_users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES what_reverse_creator_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES what_reverse_users(id)
);

-- =====================
-- 收入结算批次表 (what_reverse_settlements)
-- =====================
CREATE TABLE what_reverse_settlements (
    id                  CHAR(36) PRIMARY KEY,
    
    -- 结算周期
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    
    -- 统计
    total_earnings      INT DEFAULT 0,
    total_amount        DECIMAL(12, 2) DEFAULT 0,
    total_platform_fee  DECIMAL(12, 2) DEFAULT 0,
    total_creator_share DECIMAL(12, 2) DEFAULT 0,
    
    -- 状态
    status              VARCHAR(20) DEFAULT 'pending',
    
    -- 处理信息
    processed_by        CHAR(36),
    processed_at        TIMESTAMP NULL,
    
    -- 备注
    note                TEXT,
    
    -- 时间戳
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键
    FOREIGN KEY (processed_by) REFERENCES what_reverse_users(id)
);

-- =====================
-- 索引
-- =====================
CREATE INDEX idx_earnings_user ON what_reverse_earnings(user_id);
CREATE INDEX idx_earnings_agent ON what_reverse_earnings(agent_id);
CREATE INDEX idx_earnings_buyer ON what_reverse_earnings(buyer_id);
CREATE INDEX idx_earnings_type ON what_reverse_earnings(earning_type);
CREATE INDEX idx_earnings_status ON what_reverse_earnings(status);
CREATE INDEX idx_earnings_created ON what_reverse_earnings(created_at DESC);
CREATE INDEX idx_earnings_settlement ON what_reverse_earnings(settlement_id);
CREATE INDEX idx_earnings_order ON what_reverse_earnings(order_id);

CREATE INDEX idx_creator_accounts_user ON what_reverse_creator_accounts(user_id);
CREATE INDEX idx_creator_accounts_status ON what_reverse_creator_accounts(status);

CREATE INDEX idx_withdrawals_user ON what_reverse_withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON what_reverse_withdrawals(status);
CREATE INDEX idx_withdrawals_created ON what_reverse_withdrawals(created_at DESC);

CREATE INDEX idx_commission_tiers_active ON what_reverse_commission_tiers(is_active, priority);

CREATE INDEX idx_settlements_period ON what_reverse_settlements(period_start, period_end);
CREATE INDEX idx_settlements_status ON what_reverse_settlements(status);
