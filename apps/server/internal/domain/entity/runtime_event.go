package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RuntimeEventType 运行时事件类型
type RuntimeEventType string

// 运行时事件类型枚举
const (
	// ===== 工作流/执行相关事件 =====
	EventExecutionCreated   RuntimeEventType = "execution.created"
	EventExecutionStarted   RuntimeEventType = "execution.started"
	EventExecutionCompleted RuntimeEventType = "execution.completed"
	EventExecutionFailed    RuntimeEventType = "execution.failed"
	EventExecutionCancelled RuntimeEventType = "execution.cancelled"
	EventExecutionRetried   RuntimeEventType = "execution.retried"

	// ===== 节点执行事件 =====
	EventNodeStarted   RuntimeEventType = "node.started"
	EventNodeCompleted RuntimeEventType = "node.completed"
	EventNodeFailed    RuntimeEventType = "node.failed"
	EventNodeSkipped   RuntimeEventType = "node.skipped"

	// ===== Workspace 事件 =====
	EventWorkspaceCreated RuntimeEventType = "workspace.created"

	// ===== App 运行时事件 =====
	EventAppAccessed       RuntimeEventType = "app.accessed"
	EventAppExecuted       RuntimeEventType = "app.executed"
	EventAppRateLimited    RuntimeEventType = "app.rate_limited"
	EventAppSessionCreated RuntimeEventType = "app.session.created"
	EventAppSessionExpired RuntimeEventType = "app.session.expired"
	EventAppCreated        RuntimeEventType = "app.created"
	EventAppPublished      RuntimeEventType = "app.published"

	// ===== 数据库操作事件 =====
	EventDBProvisionStarted   RuntimeEventType = "db.provision.started"
	EventDBProvisionCompleted RuntimeEventType = "db.provision.completed"
	EventDBProvisionFailed    RuntimeEventType = "db.provision.failed"
	EventDBMigrationStarted   RuntimeEventType = "db.migration.started"
	EventDBMigrationCompleted RuntimeEventType = "db.migration.completed"
	EventDBMigrationFailed    RuntimeEventType = "db.migration.failed"
	EventDBBackupCreated      RuntimeEventType = "db.backup.created"
	EventDBRestored           RuntimeEventType = "db.restored"

	// ===== 域名/证书事件 =====
	EventDomainAdded         RuntimeEventType = "domain.added"
	EventDomainVerifyStarted RuntimeEventType = "domain.verify.started"
	EventDomainVerified      RuntimeEventType = "domain.verified"
	EventDomainVerifyFailed  RuntimeEventType = "domain.verify.failed"
	EventCertIssueStarted    RuntimeEventType = "cert.issue.started"
	EventCertIssued          RuntimeEventType = "cert.issued"
	EventCertIssueFailed     RuntimeEventType = "cert.issue.failed"
	EventCertRenewed         RuntimeEventType = "cert.renewed"
	EventCertExpiringSoon    RuntimeEventType = "cert.expiring_soon"
	EventDomainActivated     RuntimeEventType = "domain.activated"
	EventDomainDeactivated   RuntimeEventType = "domain.deactivated"

	// ===== 连接器凭证事件 =====
	EventConnectorCredentialExpiring RuntimeEventType = "connector.credential.expiring"
	EventConnectorCredentialExpired  RuntimeEventType = "connector.credential.expired"

	// ===== LLM 调用事件 =====
	EventLLMRequestStarted   RuntimeEventType = "llm.request.started"
	EventLLMRequestCompleted RuntimeEventType = "llm.request.completed"
	EventLLMRequestFailed    RuntimeEventType = "llm.request.failed"
	EventLLMRateLimited      RuntimeEventType = "llm.rate_limited"
	EventLLMFallback         RuntimeEventType = "llm.fallback"

	// ===== 计费事件 =====
	EventQuotaExceeded     RuntimeEventType = "quota.exceeded"
	EventQuotaWarning      RuntimeEventType = "quota.warning"
	EventUsageRecorded     RuntimeEventType = "usage.recorded"
	EventBillingCycleReset RuntimeEventType = "billing.cycle.reset"

	// ===== 安全事件 =====
	EventSecurityRateLimitHit  RuntimeEventType = "security.rate_limit_hit"
	EventSecurityIPBlocked     RuntimeEventType = "security.ip_blocked"
	EventSecurityAuthFailed    RuntimeEventType = "security.auth_failed"
	EventSecurityAbuseDetected RuntimeEventType = "security.abuse_detected"

	// ===== 数据分析事件 =====
	EventAnalyticsEvent RuntimeEventType = "analytics.event"

	// ===== 系统事件 =====
	EventSystemError       RuntimeEventType = "system.error"
	EventSystemWarning     RuntimeEventType = "system.warning"
	EventSystemMaintenance RuntimeEventType = "system.maintenance"
)

// RuntimeEventSeverity 事件严重级别
type RuntimeEventSeverity string

const (
	SeverityDebug    RuntimeEventSeverity = "debug"
	SeverityInfo     RuntimeEventSeverity = "info"
	SeverityWarning  RuntimeEventSeverity = "warning"
	SeverityError    RuntimeEventSeverity = "error"
	SeverityCritical RuntimeEventSeverity = "critical"
)

// RuntimeEvent 运行时事件实体
type RuntimeEvent struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// 事件基本信息
	Type     RuntimeEventType     `gorm:"type:varchar(64);not null;index" json:"type"`
	Severity RuntimeEventSeverity `gorm:"type:varchar(16);not null;default:'info'" json:"severity"`
	Message  string               `gorm:"type:text" json:"message"`

	// 追踪上下文
	TraceID      string `gorm:"type:varchar(64);index" json:"trace_id,omitempty"`
	SpanID       string `gorm:"type:varchar(32)" json:"span_id,omitempty"`
	ParentSpanID string `gorm:"type:varchar(32)" json:"parent_span_id,omitempty"`

	// 业务上下文
	WorkspaceID *uuid.UUID `gorm:"type:char(36);index" json:"workspace_id,omitempty"`
	AppID       *uuid.UUID `gorm:"type:char(36);index" json:"app_id,omitempty"`
	ExecutionID *uuid.UUID `gorm:"type:char(36);index" json:"execution_id,omitempty"`
	UserID      *uuid.UUID `gorm:"type:char(36);index" json:"user_id,omitempty"`
	SessionID   *uuid.UUID `gorm:"type:char(36);index" json:"session_id,omitempty"`

	// 事件详情
	NodeID   string `gorm:"type:varchar(64)" json:"node_id,omitempty"`
	NodeType string `gorm:"type:varchar(64)" json:"node_type,omitempty"`

	// 性能指标
	DurationMs *int64     `gorm:"type:bigint" json:"duration_ms,omitempty"`
	StartedAt  *time.Time `json:"started_at,omitempty"`
	EndedAt    *time.Time `json:"ended_at,omitempty"`

	// 请求信息
	RequestID  string `gorm:"type:varchar(64)" json:"request_id,omitempty"`
	RemoteIP   string `gorm:"type:varchar(64)" json:"remote_ip,omitempty"`
	UserAgent  string `gorm:"type:varchar(512)" json:"user_agent,omitempty"`
	HTTPMethod string `gorm:"type:varchar(16)" json:"http_method,omitempty"`
	HTTPPath   string `gorm:"type:varchar(512)" json:"http_path,omitempty"`
	HTTPStatus *int   `gorm:"type:int" json:"http_status,omitempty"`

	// 错误信息
	ErrorCode    string `gorm:"type:varchar(64)" json:"error_code,omitempty"`
	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`
	StackTrace   string `gorm:"type:text" json:"stack_trace,omitempty"`

	// 额外数据 (JSON)
	Metadata JSON `gorm:"type:json" json:"metadata,omitempty"`

	// 回放支持
	SequenceNum int64 `gorm:"type:bigint;index" json:"sequence_num"`
}

// TableName 指定表名
func (RuntimeEvent) TableName() string {
	return "runtime_events"
}

// BeforeCreate 创建前钩子
func (e *RuntimeEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// RuntimeEventBuilder 事件构建器
type RuntimeEventBuilder struct {
	event *RuntimeEvent
}

// NewRuntimeEvent 创建新的事件构建器
func NewRuntimeEvent(eventType RuntimeEventType) *RuntimeEventBuilder {
	return &RuntimeEventBuilder{
		event: &RuntimeEvent{
			Type:     eventType,
			Severity: SeverityInfo,
			Metadata: make(JSON),
		},
	}
}

// WithSeverity 设置严重级别
func (b *RuntimeEventBuilder) WithSeverity(severity RuntimeEventSeverity) *RuntimeEventBuilder {
	b.event.Severity = severity
	return b
}

// WithMessage 设置消息
func (b *RuntimeEventBuilder) WithMessage(msg string) *RuntimeEventBuilder {
	b.event.Message = msg
	return b
}

// WithTrace 设置追踪上下文
func (b *RuntimeEventBuilder) WithTrace(traceID, spanID, parentSpanID string) *RuntimeEventBuilder {
	b.event.TraceID = traceID
	b.event.SpanID = spanID
	b.event.ParentSpanID = parentSpanID
	return b
}

// WithWorkspace 设置工作空间
func (b *RuntimeEventBuilder) WithWorkspace(workspaceID uuid.UUID) *RuntimeEventBuilder {
	b.event.WorkspaceID = &workspaceID
	return b
}

// WithApp 设置应用
func (b *RuntimeEventBuilder) WithApp(appID uuid.UUID) *RuntimeEventBuilder {
	b.event.AppID = &appID
	return b
}

// WithExecution 设置执行
func (b *RuntimeEventBuilder) WithExecution(executionID uuid.UUID) *RuntimeEventBuilder {
	b.event.ExecutionID = &executionID
	return b
}

// WithUser 设置用户
func (b *RuntimeEventBuilder) WithUser(userID uuid.UUID) *RuntimeEventBuilder {
	b.event.UserID = &userID
	return b
}

// WithSession 设置会话
func (b *RuntimeEventBuilder) WithSession(sessionID uuid.UUID) *RuntimeEventBuilder {
	b.event.SessionID = &sessionID
	return b
}

// WithNode 设置节点信息
func (b *RuntimeEventBuilder) WithNode(nodeID, nodeType string) *RuntimeEventBuilder {
	b.event.NodeID = nodeID
	b.event.NodeType = nodeType
	return b
}

// WithDuration 设置持续时间
func (b *RuntimeEventBuilder) WithDuration(durationMs int64) *RuntimeEventBuilder {
	b.event.DurationMs = &durationMs
	return b
}

// WithTimeRange 设置时间范围
func (b *RuntimeEventBuilder) WithTimeRange(startedAt, endedAt time.Time) *RuntimeEventBuilder {
	b.event.StartedAt = &startedAt
	b.event.EndedAt = &endedAt
	if !startedAt.IsZero() && !endedAt.IsZero() {
		duration := endedAt.Sub(startedAt).Milliseconds()
		b.event.DurationMs = &duration
	}
	return b
}

// WithHTTPRequest 设置 HTTP 请求信息
func (b *RuntimeEventBuilder) WithHTTPRequest(method, path string, status int) *RuntimeEventBuilder {
	b.event.HTTPMethod = method
	b.event.HTTPPath = path
	b.event.HTTPStatus = &status
	return b
}

// WithRequestInfo 设置请求信息
func (b *RuntimeEventBuilder) WithRequestInfo(requestID, remoteIP, userAgent string) *RuntimeEventBuilder {
	b.event.RequestID = requestID
	b.event.RemoteIP = remoteIP
	b.event.UserAgent = userAgent
	return b
}

// WithError 设置错误信息
func (b *RuntimeEventBuilder) WithError(code, message, stackTrace string) *RuntimeEventBuilder {
	b.event.ErrorCode = code
	b.event.ErrorMessage = message
	b.event.StackTrace = stackTrace
	if b.event.Severity == SeverityInfo {
		b.event.Severity = SeverityError
	}
	return b
}

// WithMetadata 设置元数据
func (b *RuntimeEventBuilder) WithMetadata(key string, value interface{}) *RuntimeEventBuilder {
	if b.event.Metadata == nil {
		b.event.Metadata = make(JSON)
	}
	b.event.Metadata[key] = value
	return b
}

// Build 构建事件
func (b *RuntimeEventBuilder) Build() *RuntimeEvent {
	return b.event
}

// RuntimeEventFilter 事件查询过滤器
type RuntimeEventFilter struct {
	// 时间范围
	StartTime *time.Time
	EndTime   *time.Time

	// 类型过滤
	Types      []RuntimeEventType
	Severities []RuntimeEventSeverity

	// 上下文过滤
	WorkspaceID *uuid.UUID
	AppID       *uuid.UUID
	ExecutionID *uuid.UUID
	UserID      *uuid.UUID
	SessionID   *uuid.UUID
	TraceID     string

	// 回放支持
	AfterSequenceNum int64

	// 分页
	Page     int
	PageSize int

	// 排序
	OrderBy   string // "created_at" | "sequence_num"
	OrderDesc bool
}

// RuntimeEventStats 事件统计
type RuntimeEventStats struct {
	TotalCount   int64 `json:"total_count"`
	ErrorCount   int64 `json:"error_count"`
	WarningCount int64 `json:"warning_count"`

	// 按类型统计
	CountByType map[RuntimeEventType]int64 `json:"count_by_type"`

	// 按时间统计
	CountByHour []HourlyCount `json:"count_by_hour,omitempty"`
}

// HourlyCount 按小时统计
type HourlyCount struct {
	Hour  time.Time `json:"hour"`
	Count int64     `json:"count"`
}

// EventTypeMeta 事件类型元数据（用于文档）
type EventTypeMeta struct {
	Type        RuntimeEventType `json:"type"`
	Category    string           `json:"category"`
	Description string           `json:"description"`
}

// GetEventTypeMetadata 获取所有事件类型元数据
func GetEventTypeMetadata() []EventTypeMeta {
	return []EventTypeMeta{
		// 执行事件
		{EventExecutionCreated, "execution", "工作流执行创建"},
		{EventExecutionStarted, "execution", "工作流执行开始"},
		{EventExecutionCompleted, "execution", "工作流执行完成"},
		{EventExecutionFailed, "execution", "工作流执行失败"},
		{EventExecutionCancelled, "execution", "工作流执行取消"},
		{EventExecutionRetried, "execution", "工作流执行重试"},

		// 节点事件
		{EventNodeStarted, "node", "节点开始执行"},
		{EventNodeCompleted, "node", "节点执行完成"},
		{EventNodeFailed, "node", "节点执行失败"},
		{EventNodeSkipped, "node", "节点跳过"},

		// Workspace 事件
		{EventWorkspaceCreated, "workspace", "Workspace 创建"},

		// App 事件
		{EventAppAccessed, "app", "App 被访问"},
		{EventAppExecuted, "app", "App 执行"},
		{EventAppRateLimited, "app", "App 触发速率限制"},
		{EventAppSessionCreated, "app", "App 会话创建"},
		{EventAppSessionExpired, "app", "App 会话过期"},
		{EventAppCreated, "app", "App 创建"},
		{EventAppPublished, "app", "App 发布"},

		// 数据库事件
		{EventDBProvisionStarted, "database", "数据库创建开始"},
		{EventDBProvisionCompleted, "database", "数据库创建完成"},
		{EventDBProvisionFailed, "database", "数据库创建失败"},
		{EventDBMigrationStarted, "database", "数据库迁移开始"},
		{EventDBMigrationCompleted, "database", "数据库迁移完成"},
		{EventDBMigrationFailed, "database", "数据库迁移失败"},
		{EventDBBackupCreated, "database", "数据库备份创建"},
		{EventDBRestored, "database", "数据库恢复"},

		// 域名事件
		{EventDomainAdded, "domain", "域名添加"},
		{EventDomainVerifyStarted, "domain", "域名验证开始"},
		{EventDomainVerified, "domain", "域名验证成功"},
		{EventDomainVerifyFailed, "domain", "域名验证失败"},
		{EventCertIssueStarted, "domain", "证书签发开始"},
		{EventCertIssued, "domain", "证书签发成功"},
		{EventCertIssueFailed, "domain", "证书签发失败"},
		{EventCertRenewed, "domain", "证书续期"},
		{EventCertExpiringSoon, "domain", "证书即将过期"},
		{EventDomainActivated, "domain", "域名激活"},
		{EventDomainDeactivated, "domain", "域名停用"},

		// LLM 事件
		{EventLLMRequestStarted, "llm", "LLM 请求开始"},
		{EventLLMRequestCompleted, "llm", "LLM 请求完成"},
		{EventLLMRequestFailed, "llm", "LLM 请求失败"},
		{EventLLMRateLimited, "llm", "LLM 触发速率限制"},
		{EventLLMFallback, "llm", "LLM 降级到备用模型"},

		// 计费事件
		{EventQuotaExceeded, "billing", "配额超限"},
		{EventQuotaWarning, "billing", "配额预警"},
		{EventUsageRecorded, "billing", "用量记录"},
		{EventBillingCycleReset, "billing", "计费周期重置"},

		// 安全事件
		{EventSecurityRateLimitHit, "security", "触发速率限制"},
		{EventSecurityIPBlocked, "security", "IP 被封禁"},
		{EventSecurityAuthFailed, "security", "认证失败"},
		{EventSecurityAbuseDetected, "security", "检测到滥用行为"},

		// 数据分析事件
		{EventAnalyticsEvent, "analytics", "数据分析事件入湖"},

		// 系统事件
		{EventSystemError, "system", "系统错误"},
		{EventSystemWarning, "system", "系统警告"},
		{EventSystemMaintenance, "system", "系统维护"},
	}
}
