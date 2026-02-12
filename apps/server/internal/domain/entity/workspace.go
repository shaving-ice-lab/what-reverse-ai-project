package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Workspace 工作空间实体（合并了原 App 功能）
// 一个 Workspace = 一个 SaaS 应用
type Workspace struct {
	ID              uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	OwnerUserID     uuid.UUID  `gorm:"type:char(36);not null;index" json:"owner_user_id"`
	Name            string     `gorm:"size:100;not null" json:"name"`
	Slug            string     `gorm:"size:100;not null;uniqueIndex" json:"slug"`
	Icon            string     `gorm:"size:50;default:'🏢'" json:"icon"`
	Description     *string    `gorm:"type:text" json:"description"`
	Status          string     `gorm:"size:20;default:'active';index" json:"status"`
	StatusReason    *string    `gorm:"size:255" json:"status_reason,omitempty"`
	StatusUpdatedAt *time.Time `json:"status_updated_at,omitempty"`
	Plan            string     `gorm:"size:20;default:'free'" json:"plan"`
	Region          *string    `gorm:"size:50" json:"region"`
	Settings        JSON       `gorm:"column:settings_json;type:json" json:"settings"`

	// App 相关字段（原 App 实体字段）
	AppStatus        string     `gorm:"size:20;default:'draft';index" json:"app_status"`
	CurrentVersionID *uuid.UUID `gorm:"type:char(36)" json:"current_version_id"`
	PricingType      string     `gorm:"size:20;default:'free'" json:"pricing_type"`
	Price            *float64   `gorm:"type:decimal(10,2)" json:"price"`
	PublishedAt      *time.Time `json:"published_at"`

	// 访问策略字段（原 AppAccessPolicy 字段）
	AccessMode         string      `gorm:"size:30;default:'private';index" json:"access_mode"`
	DataClassification string      `gorm:"size:30;default:'public'" json:"data_classification"`
	RateLimitJSON      JSON        `gorm:"column:rate_limit_json;type:json" json:"rate_limit_json"`
	AllowedOrigins     StringArray `gorm:"type:json" json:"allowed_origins"`
	RequireCaptcha     bool        `gorm:"default:false" json:"require_captcha"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Owner          *User             `gorm:"foreignKey:OwnerUserID" json:"owner,omitempty"`
	CurrentVersion *WorkspaceVersion `gorm:"foreignKey:CurrentVersionID;-:migration" json:"current_version,omitempty"`
}

// TableName 表名
func (Workspace) TableName() string {
	return "what_reverse_workspaces"
}

// BeforeCreate 创建前钩子
func (w *Workspace) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	if w.Icon == "" {
		w.Icon = "🏢"
	}
	return nil
}

// WorkspaceRole 工作空间角色
type WorkspaceRole struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Name        string    `gorm:"size:50;not null" json:"name"`
	Permissions JSON      `gorm:"column:permissions_json;type:json" json:"permissions"`
	IsSystem    bool      `gorm:"default:false" json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceRole) TableName() string {
	return "what_reverse_workspace_roles"
}

// BeforeCreate 创建前钩子
func (r *WorkspaceRole) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// WorkspaceMember 工作空间成员
type WorkspaceMember struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	UserID      uuid.UUID  `gorm:"type:char(36);not null;index" json:"user_id"`
	RoleID      *uuid.UUID `gorm:"type:char(36);index" json:"role_id"`
	Status      string     `gorm:"size:20;default:'active'" json:"status"`
	InvitedBy   *uuid.UUID `gorm:"type:char(36)" json:"invited_by"`
	JoinedAt    *time.Time `json:"joined_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Workspace *Workspace     `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role      *WorkspaceRole `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

// TableName 表名
func (WorkspaceMember) TableName() string {
	return "what_reverse_workspace_members"
}

// BeforeCreate 创建前钩子
func (m *WorkspaceMember) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// WorkspaceVersion 工作空间版本实体（原 AppVersion）
type WorkspaceVersion struct {
	ID          uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID  `gorm:"type:char(36);not null;index;uniqueIndex:uniq_workspace_version" json:"workspace_id"`
	Version     string     `gorm:"size:50;not null;uniqueIndex:uniq_workspace_version" json:"version"`
	Changelog   *string    `gorm:"type:text" json:"changelog"`
	UISchema    JSON       `gorm:"column:ui_schema;type:json" json:"ui_schema"`
	DBSchema    JSON       `gorm:"column:db_schema;type:json" json:"db_schema"`
	ConfigJSON  JSON       `gorm:"column:config_json;type:json" json:"config_json"`
	CreatedBy   *uuid.UUID `gorm:"type:char(36);index" json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Creator   *User      `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

// TableName 表名
func (WorkspaceVersion) TableName() string {
	return "what_reverse_workspace_versions"
}

// BeforeCreate 创建前钩子
func (v *WorkspaceVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// WorkspaceDomain 工作空间域名（原 AppDomain）
type WorkspaceDomain struct {
	ID                     uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID            uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Domain                 string     `gorm:"size:255;not null;uniqueIndex" json:"domain"`
	Status                 string     `gorm:"size:20;default:'pending';index" json:"status"`
	BlockedAt              *time.Time `json:"blocked_at"`
	BlockedReason          *string    `gorm:"size:255" json:"blocked_reason"`
	DomainExpiresAt        *time.Time `json:"domain_expires_at"`
	DomainExpiryNotifiedAt *time.Time `json:"domain_expiry_notified_at"`
	VerificationToken      *string    `gorm:"size:100" json:"verification_token"`
	VerificationAttempts   int        `gorm:"default:0" json:"verification_attempts"`
	LastVerificationError  *string    `gorm:"size:255" json:"last_verification_error"`
	NextRetryAt            *time.Time `json:"next_retry_at"`
	SupportURL             *string    `gorm:"size:255" json:"support_url"`
	VerifiedAt             *time.Time `json:"verified_at"`
	SSLStatus              string     `gorm:"size:20;default:'pending'" json:"ssl_status"`
	SSLIssueAttempts       int        `gorm:"default:0" json:"ssl_issue_attempts"`
	LastSSLError           *string    `gorm:"size:255" json:"last_ssl_error"`
	SSLNextRetryAt         *time.Time `json:"ssl_next_retry_at"`
	SSLIssuedAt            *time.Time `json:"ssl_issued_at"`
	SSLExpiresAt           *time.Time `json:"ssl_expires_at"`
	SSLExpiryNotifiedAt    *time.Time `json:"ssl_expiry_notified_at"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceDomain) TableName() string {
	return "what_reverse_workspace_domains"
}

// BeforeCreate 创建前钩子
func (d *WorkspaceDomain) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// WorkspaceSession 工作空间会话（原 AppSession）
type WorkspaceSession struct {
	ID            uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID   uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	SessionType   string     `gorm:"size:20;default:'anon';index" json:"session_type"`
	UserID        *uuid.UUID `gorm:"type:char(36);index" json:"user_id"`
	AppUserID     *uuid.UUID `gorm:"type:char(36);index:idx_ws_sessions_app_user" json:"app_user_id"`
	TokenHash     *string    `gorm:"size:255;index:idx_ws_sessions_token" json:"token_hash,omitempty"`
	AuthMethod    *string    `gorm:"size:20;default:'password'" json:"auth_method,omitempty"`
	IPHash        *string    `gorm:"size:100" json:"ip_hash"`
	UserAgentHash *string    `gorm:"size:200" json:"user_agent_hash"`
	CreatedAt     time.Time  `json:"created_at"`
	ExpiredAt     *time.Time `json:"expired_at"`
	BlockedAt     *time.Time `json:"blocked_at"`
	BlockedReason *string    `gorm:"size:255" json:"blocked_reason"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AppUser   *AppUser   `gorm:"foreignKey:AppUserID" json:"app_user,omitempty"`
}

// TableName 表名
func (WorkspaceSession) TableName() string {
	return "what_reverse_workspace_sessions"
}

// BeforeCreate 创建前钩子
func (s *WorkspaceSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// WorkspaceEvent 工作空间事件记录（原 AppEvent）
type WorkspaceEvent struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	SessionID   uuid.UUID `gorm:"type:char(36);not null;index" json:"session_id"`
	EventType   string    `gorm:"size:50;not null;index" json:"event_type"`
	Payload     JSON      `gorm:"column:payload_json;type:json" json:"payload"`
	CreatedAt   time.Time `json:"created_at"`

	Workspace *Workspace        `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Session   *WorkspaceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
}

// TableName 表名
func (WorkspaceEvent) TableName() string {
	return "what_reverse_workspace_events"
}

// BeforeCreate 创建前钩子
func (e *WorkspaceEvent) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// WorkspaceRating 工作空间评分（原 AppRating）
type WorkspaceRating struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	UserID      uuid.UUID `gorm:"type:char(36);not null;index" json:"user_id"`
	Rating      int       `gorm:"not null" json:"rating"`
	Review      *string   `gorm:"type:text" json:"review"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName 表名
func (WorkspaceRating) TableName() string {
	return "what_reverse_workspace_ratings"
}

// BeforeCreate 创建前钩子
func (r *WorkspaceRating) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// WorkspaceUsageStats 工作空间使用统计（原 AppUsageStats）
type WorkspaceUsageStats struct {
	ID              uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID     uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`
	Date            time.Time `gorm:"type:date;not null;index" json:"date"`
	TotalExecutions int       `gorm:"default:0" json:"total_executions"`
	SuccessCount    int       `gorm:"default:0" json:"success_count"`
	FailureCount    int       `gorm:"default:0" json:"failure_count"`
	TotalTokens     int64     `gorm:"default:0" json:"total_tokens"`
	TotalDurationMs int64     `gorm:"default:0" json:"total_duration_ms"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (WorkspaceUsageStats) TableName() string {
	return "what_reverse_workspace_usage_stats"
}

// BeforeCreate 创建前钩子
func (s *WorkspaceUsageStats) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
