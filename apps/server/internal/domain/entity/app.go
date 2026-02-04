package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// App 应用实体
type App struct {
	ID               uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID      uuid.UUID  `gorm:"type:char(36);not null;index;uniqueIndex:uniq_apps_workspace_slug" json:"workspace_id"`
	OwnerUserID      uuid.UUID  `gorm:"type:char(36);not null;index" json:"owner_user_id"`
	Name             string     `gorm:"size:200;not null" json:"name"`
	Slug             string     `gorm:"size:100;not null;uniqueIndex:uniq_apps_workspace_slug" json:"slug"`
	Icon             string     `gorm:"size:50;default:'📦'" json:"icon"`
	Description      *string    `gorm:"type:text" json:"description"`
	Status           string     `gorm:"size:20;default:'draft';index" json:"status"`
	StatusReason     *string    `gorm:"size:255" json:"status_reason,omitempty"`
	StatusUpdatedAt  *time.Time `json:"status_updated_at,omitempty"`
	CurrentVersionID *uuid.UUID `gorm:"type:char(36)" json:"current_version_id"`
	PricingType      string     `gorm:"size:20;default:'free'" json:"pricing_type"`
	Price            *float64   `gorm:"type:decimal(10,2)" json:"price"`

	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	PublishedAt *time.Time     `json:"published_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Workspace *Workspace  `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Owner     *User       `gorm:"foreignKey:OwnerUserID" json:"owner,omitempty"`
	Version   *AppVersion `gorm:"foreignKey:CurrentVersionID;-:migration" json:"current_version,omitempty"`
}

// TableName 表名
func (App) TableName() string {
	return "what_reverse_apps"
}

// BeforeCreate 创建前钩子
func (a *App) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// AppVersion 应用版本实体
type AppVersion struct {
	ID         uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	AppID      uuid.UUID  `gorm:"type:char(36);not null;index;uniqueIndex:uniq_app_version" json:"app_id"`
	Version    string     `gorm:"size:50;not null;uniqueIndex:uniq_app_version" json:"version"`
	Changelog  *string    `gorm:"type:text" json:"changelog"`
	WorkflowID *uuid.UUID `gorm:"type:char(36);index" json:"workflow_id"`
	UISchema   JSON       `gorm:"column:ui_schema;type:json" json:"ui_schema"`
	DBSchema   JSON       `gorm:"column:db_schema;type:json" json:"db_schema"`
	ConfigJSON JSON       `gorm:"column:config_json;type:json" json:"config_json"`
	CreatedBy  *uuid.UUID `gorm:"type:char(36);index" json:"created_by"`
	CreatedAt  time.Time  `json:"created_at"`

	App      *App      `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Workflow *Workflow `gorm:"foreignKey:WorkflowID" json:"workflow,omitempty"`
	Creator  *User     `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

// TableName 表名
func (AppVersion) TableName() string {
	return "what_reverse_app_versions"
}

// BeforeCreate 创建前钩子
func (v *AppVersion) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// AppAccessPolicy 应用访问策略
type AppAccessPolicy struct {
	ID                 uuid.UUID   `gorm:"type:char(36);primaryKey" json:"id"`
	AppID              uuid.UUID   `gorm:"type:char(36);not null;uniqueIndex" json:"app_id"`
	AccessMode         string      `gorm:"size:30;default:'private'" json:"access_mode"`
	DataClassification string      `gorm:"size:30;default:'public'" json:"data_classification"`
	RateLimitJSON      JSON        `gorm:"column:rate_limit_json;type:json" json:"rate_limit_json"`
	AllowedOrigins     StringArray `gorm:"type:json" json:"allowed_origins"`
	RequireCaptcha     bool        `gorm:"default:false" json:"require_captcha"`
	UpdatedBy          *uuid.UUID  `gorm:"type:char(36);index" json:"updated_by"`
	UpdatedAt          time.Time   `json:"updated_at"`
	CreatedAt          time.Time   `json:"created_at"`

	App     *App  `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Updater *User `gorm:"foreignKey:UpdatedBy" json:"updater,omitempty"`
}

// TableName 表名
func (AppAccessPolicy) TableName() string {
	return "what_reverse_app_access_policies"
}

// BeforeCreate 创建前钩子
func (p *AppAccessPolicy) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// AppDomain 应用域名
type AppDomain struct {
	ID                     uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	AppID                  uuid.UUID  `gorm:"type:char(36);not null;index" json:"app_id"`
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

	App *App `gorm:"foreignKey:AppID" json:"app,omitempty"`
}

// TableName 表名
func (AppDomain) TableName() string {
	return "what_reverse_app_domains"
}

// BeforeCreate 创建前钩子
func (d *AppDomain) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
