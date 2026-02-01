-- 添加自定义节点审核检查项模板 (MySQL 版本)
-- 版本: 000011
-- 创建时间: 2026-01-29
-- 功能: 为自定义节点添加审核检查项模板

-- 插入自定义节点审核检查项模板
INSERT INTO what_reverse_review_checklists (id, name, description, item_type, items, is_default, is_active, created_at, updated_at) VALUES
(
    UUID(),
    '自定义节点审核检查项',
    '自定义节点发布前的标准审核检查清单',
    'custom_node',
    '[
        {"id": "name_valid", "label": "节点名称有效且无违规词汇", "required": true, "category": "basic"},
        {"id": "description_clear", "label": "描述清晰准确", "required": true, "category": "basic"},
        {"id": "icon_appropriate", "label": "图标符合规范", "required": false, "category": "basic"},
        {"id": "category_correct", "label": "分类正确", "required": true, "category": "basic"},
        {"id": "inputs_defined", "label": "输入参数定义完整", "required": true, "category": "functionality"},
        {"id": "outputs_defined", "label": "输出参数定义完整", "required": true, "category": "functionality"},
        {"id": "code_functional", "label": "代码可正常运行", "required": true, "category": "functionality"},
        {"id": "no_malicious_code", "label": "不包含恶意代码", "required": true, "category": "security"},
        {"id": "no_sensitive_data", "label": "不包含硬编码敏感数据", "required": true, "category": "security"},
        {"id": "api_calls_safe", "label": "API 调用安全合规", "required": true, "category": "security"},
        {"id": "error_handling", "label": "错误处理完善", "required": false, "category": "quality"},
        {"id": "performance_acceptable", "label": "性能表现可接受", "required": false, "category": "quality"},
        {"id": "documentation_complete", "label": "文档完整", "required": false, "category": "documentation"},
        {"id": "pricing_reasonable", "label": "定价合理", "required": false, "category": "commerce"}
    ]',
    TRUE,
    TRUE,
    NOW(),
    NOW()
);
