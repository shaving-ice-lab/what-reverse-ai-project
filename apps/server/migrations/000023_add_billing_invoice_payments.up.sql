-- 添加账单支付状态表
-- 版本: 000023
-- 创建时间: 2026-02-02

CREATE TABLE what_reverse_billing_invoice_payments (
    id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id     CHAR(36) NOT NULL,
    invoice_id       CHAR(36) NOT NULL,
    status           VARCHAR(20) NOT NULL,
    payment_channel  VARCHAR(50),
    transaction_id   VARCHAR(100),
    paid_at          DATETIME NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_invoice_payment_invoice (invoice_id),
    INDEX idx_invoice_payment_workspace (workspace_id),
    INDEX idx_invoice_payment_status (status),
    FOREIGN KEY (workspace_id) REFERENCES what_reverse_workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES what_reverse_workspace_quotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
