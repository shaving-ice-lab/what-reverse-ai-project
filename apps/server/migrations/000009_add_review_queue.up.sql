-- 审核系统数据库结构 (MySQL 版本)
-- 版本: 000009
-- 创建时间: 2026-01-29
-- 功能: 审核队列、审核记录、审核意见管理

-- =====================
-- 审核员表 (what_reverse_reviewers)
-- =====================
CREATE TABLE what_reverse_reviewers (
    id              CHAR(36) PRIMARY KEY,
    user_id         CHAR(36) NOT NULL,
    
    -- 审核员信息
    role            VARCHAR(50) NOT NULL DEFAULT 'reviewer',
    display_name    VARCHAR(100),
    
    -- 权限范围 (使用 JSON 存储允许的类型)
    allowed_types   JSON DEFAULT NULL,
    
    -- 工作量设置
    max_daily_reviews   INT DEFAULT 50,
    current_workload    INT DEFAULT 0,
    
    -- 状态
    is_active       TINYINT(1) DEFAULT 1,
    
    -- 统计
    total_reviews   INT DEFAULT 0,
    approved_count  INT DEFAULT 0,
    rejected_count  INT DEFAULT 0,
    avg_review_time INT DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_reviewers_user_unique (user_id),
    KEY idx_reviewers_active (is_active),
    
    CONSTRAINT fk_reviewers_user FOREIGN KEY (user_id) 
        REFERENCES what_reverse_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 审核队列表 (what_reverse_review_queue)
-- =====================
CREATE TABLE what_reverse_review_queue (
    id              CHAR(36) PRIMARY KEY,
    
    -- 审核项目信息 (使用 ENUM 替代 PostgreSQL 的自定义类型)
    item_type       ENUM('agent', 'workflow', 'template', 'user', 'content') NOT NULL,
    item_id         CHAR(36) NOT NULL,
    
    -- 提交者信息
    submitter_id    CHAR(36) NOT NULL,
    
    -- 审核员分配
    reviewer_id     CHAR(36) DEFAULT NULL,
    assigned_at     TIMESTAMP NULL,
    
    -- 状态与优先级
    status          ENUM('pending', 'in_review', 'approved', 'rejected', 'revision', 'cancelled') DEFAULT 'pending',
    priority        ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- 审核信息
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    
    -- 快照数据
    snapshot        JSON NOT NULL,
    
    -- 提交说明
    submission_note TEXT,
    
    -- 审核结果
    result_note     TEXT,
    result_data     JSON,
    
    -- 修改请求
    revision_count  INT DEFAULT 0,
    revision_note   TEXT,
    
    -- 版本信息
    version         INT DEFAULT 1,
    
    -- 时间戳
    submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_review_queue_item (item_type, item_id),
    KEY idx_review_queue_submitter (submitter_id),
    KEY idx_review_queue_reviewer (reviewer_id),
    KEY idx_review_queue_status (status),
    KEY idx_review_queue_priority (priority),
    KEY idx_review_queue_pending (status, priority, created_at),
    KEY idx_review_queue_created (created_at DESC),
    
    CONSTRAINT fk_review_queue_submitter FOREIGN KEY (submitter_id) 
        REFERENCES what_reverse_users(id),
    CONSTRAINT fk_review_queue_reviewer FOREIGN KEY (reviewer_id) 
        REFERENCES what_reverse_reviewers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 审核记录表 (what_reverse_review_records)
-- =====================
CREATE TABLE what_reverse_review_records (
    id              CHAR(36) PRIMARY KEY,
    queue_id        CHAR(36) NOT NULL,
    reviewer_id     CHAR(36) NOT NULL,
    
    -- 审核操作
    action          VARCHAR(50) NOT NULL,
    
    -- 状态变更
    from_status     ENUM('pending', 'in_review', 'approved', 'rejected', 'revision', 'cancelled'),
    to_status       ENUM('pending', 'in_review', 'approved', 'rejected', 'revision', 'cancelled') NOT NULL,
    
    -- 审核意见
    comment         TEXT,
    
    -- 详细审核结果
    details         JSON,
    
    -- 耗时
    duration_ms     INT,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    KEY idx_review_records_queue (queue_id),
    KEY idx_review_records_reviewer (reviewer_id),
    KEY idx_review_records_action (action),
    KEY idx_review_records_created (created_at DESC),
    
    CONSTRAINT fk_review_records_queue FOREIGN KEY (queue_id) 
        REFERENCES what_reverse_review_queue(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_records_reviewer FOREIGN KEY (reviewer_id) 
        REFERENCES what_reverse_reviewers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 审核意见/评论表 (what_reverse_review_comments)
-- =====================
CREATE TABLE what_reverse_review_comments (
    id              CHAR(36) PRIMARY KEY,
    queue_id        CHAR(36) NOT NULL,
    user_id         CHAR(36) NOT NULL,
    
    -- 评论内容
    content         TEXT NOT NULL,
    
    -- 评论类型
    comment_type    VARCHAR(50) DEFAULT 'comment',
    
    -- 关联位置
    target_path     VARCHAR(500),
    
    -- 父评论
    parent_id       CHAR(36) DEFAULT NULL,
    
    -- 状态
    is_resolved     TINYINT(1) DEFAULT 0,
    resolved_at     TIMESTAMP NULL,
    resolved_by     CHAR(36) DEFAULT NULL,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,
    
    KEY idx_review_comments_queue (queue_id),
    KEY idx_review_comments_user (user_id),
    KEY idx_review_comments_parent (parent_id),
    KEY idx_review_comments_unresolved (queue_id, is_resolved),
    
    CONSTRAINT fk_review_comments_queue FOREIGN KEY (queue_id) 
        REFERENCES what_reverse_review_queue(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_comments_user FOREIGN KEY (user_id) 
        REFERENCES what_reverse_users(id),
    CONSTRAINT fk_review_comments_parent FOREIGN KEY (parent_id) 
        REFERENCES what_reverse_review_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_comments_resolved_by FOREIGN KEY (resolved_by) 
        REFERENCES what_reverse_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 审核检查项模板表 (what_reverse_review_checklists)
-- =====================
CREATE TABLE what_reverse_review_checklists (
    id              CHAR(36) PRIMARY KEY,
    
    -- 模板信息
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    item_type       ENUM('agent', 'workflow', 'template', 'user', 'content') NOT NULL,
    
    -- 检查项配置
    items           JSON NOT NULL,
    
    -- 状态
    is_active       TINYINT(1) DEFAULT 1,
    is_default      TINYINT(1) DEFAULT 0,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_review_checklists_type (item_type),
    KEY idx_review_checklists_active (is_active, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- 插入默认审核检查项模板
-- =====================
INSERT INTO what_reverse_review_checklists (id, name, description, item_type, items, is_default) VALUES
(
    UUID(),
    'Agent 审核检查项',
    'Agent 发布前的标准审核检查清单',
    'agent',
    '[
        {"id": "name_appropriate", "label": "名称合适且无违规词汇", "required": true, "category": "basic"},
        {"id": "description_clear", "label": "描述清晰准确", "required": true, "category": "basic"},
        {"id": "icon_appropriate", "label": "图标符合规范", "required": false, "category": "basic"},
        {"id": "workflow_functional", "label": "关联工作流可正常运行", "required": true, "category": "functionality"},
        {"id": "no_sensitive_data", "label": "不包含敏感数据", "required": true, "category": "security"},
        {"id": "no_malicious_code", "label": "不包含恶意代码", "required": true, "category": "security"},
        {"id": "pricing_reasonable", "label": "定价合理", "required": false, "category": "commerce"},
        {"id": "category_correct", "label": "分类正确", "required": true, "category": "basic"}
    ]',
    1
),
(
    UUID(),
    '工作流审核检查项',
    '公开工作流的标准审核检查清单',
    'workflow',
    '[
        {"id": "name_appropriate", "label": "名称合适且无违规词汇", "required": true, "category": "basic"},
        {"id": "description_clear", "label": "描述清晰准确", "required": true, "category": "basic"},
        {"id": "nodes_valid", "label": "所有节点配置正确", "required": true, "category": "functionality"},
        {"id": "can_execute", "label": "可正常执行", "required": true, "category": "functionality"},
        {"id": "no_sensitive_data", "label": "不包含硬编码敏感数据", "required": true, "category": "security"},
        {"id": "api_keys_safe", "label": "API Key 使用安全", "required": true, "category": "security"}
    ]',
    1
),
(
    UUID(),
    '模板审核检查项',
    '创意模板的标准审核检查清单',
    'template',
    '[
        {"id": "name_appropriate", "label": "名称合适且无违规词汇", "required": true, "category": "basic"},
        {"id": "description_clear", "label": "描述清晰准确", "required": true, "category": "basic"},
        {"id": "prompts_safe", "label": "提示词不包含违规内容", "required": true, "category": "content"},
        {"id": "sections_complete", "label": "章节配置完整", "required": true, "category": "functionality"},
        {"id": "can_generate", "label": "可正常生成内容", "required": true, "category": "functionality"},
        {"id": "output_quality", "label": "输出质量达标", "required": false, "category": "quality"}
    ]',
    1
);
