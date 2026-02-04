package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ===== 指标定义 =====

// AnalyticsMetricDefinition 指标口径定义
type AnalyticsMetricDefinition struct {
	ID          uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index;uniqueIndex:idx_metric_def_workspace_name" json:"workspace_id"`
	Name        string    `gorm:"size:120;not null;index;uniqueIndex:idx_metric_def_workspace_name" json:"name"`

	DisplayName *string `gorm:"size:160" json:"display_name,omitempty"`
	Description *string `gorm:"type:text" json:"description,omitempty"`
	Unit        *string `gorm:"size:40" json:"unit,omitempty"`
	Formula     *string `gorm:"type:text" json:"formula,omitempty"`

	Dimensions StringArray `gorm:"column:dimensions_json;type:json" json:"dimensions,omitempty"`
	Tags       StringArray `gorm:"column:tags_json;type:json" json:"tags,omitempty"`

	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// TableName 表名
func (AnalyticsMetricDefinition) TableName() string {
	return "what_reverse_analytics_metric_definitions"
}

// BeforeCreate 创建前钩子
func (d *AnalyticsMetricDefinition) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// ===== 指标记录 =====

// AnalyticsMetric 指标入湖记录
type AnalyticsMetric struct {
	ID           uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID  uuid.UUID  `gorm:"type:char(36);not null;index" json:"workspace_id"`
	AppID        *uuid.UUID `gorm:"type:char(36);index" json:"app_id,omitempty"`
	DefinitionID *uuid.UUID `gorm:"type:char(36);index" json:"definition_id,omitempty"`

	Name  string  `gorm:"size:120;not null;index" json:"name"`
	Unit  string  `gorm:"size:40" json:"unit"`
	Value float64 `gorm:"type:double;not null" json:"value"`

	RecordedAt time.Time `gorm:"index" json:"recorded_at"`

	Labels   JSON `gorm:"column:labels_json;type:json" json:"labels,omitempty"`
	Metadata JSON `gorm:"column:metadata_json;type:json" json:"metadata,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	Workspace  *Workspace                 `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	App        *App                       `gorm:"foreignKey:AppID" json:"app,omitempty"`
	Definition *AnalyticsMetricDefinition `gorm:"foreignKey:DefinitionID" json:"definition,omitempty"`
}

// TableName 表名
func (AnalyticsMetric) TableName() string {
	return "what_reverse_analytics_metrics"
}

// BeforeCreate 创建前钩子
func (m *AnalyticsMetric) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// ===== 导出任务 =====

// AnalyticsExportJobStatus 导出任务状态
type AnalyticsExportJobStatus string

const (
	AnalyticsExportStatusPending    AnalyticsExportJobStatus = "pending"
	AnalyticsExportStatusProcessing AnalyticsExportJobStatus = "processing"
	AnalyticsExportStatusCompleted  AnalyticsExportJobStatus = "completed"
	AnalyticsExportStatusFailed     AnalyticsExportJobStatus = "failed"
)

// AnalyticsExportJobType 导出类型
type AnalyticsExportJobType string

const (
	AnalyticsExportTypeEvents  AnalyticsExportJobType = "events"
	AnalyticsExportTypeMetrics AnalyticsExportJobType = "metrics"
)

// AnalyticsExportJob 数据分析导出任务
type AnalyticsExportJob struct {
	ID          uuid.UUID                `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID                `gorm:"type:char(36);not null;index" json:"workspace_id"`
	RequestedBy *uuid.UUID               `gorm:"type:char(36);index" json:"requested_by,omitempty"`
	ExportType  AnalyticsExportJobType   `gorm:"size:30;not null;index" json:"export_type"`
	Format      string                   `gorm:"size:20;not null" json:"format"`
	Status      AnalyticsExportJobStatus `gorm:"size:20;default:'pending';index" json:"status"`

	Filter JSON `gorm:"column:filter_json;type:json" json:"filter,omitempty"`

	FileName     *string `gorm:"size:255" json:"file_name,omitempty"`
	FilePath     *string `gorm:"size:512" json:"file_path,omitempty"`
	FileSize     *int64  `gorm:"type:bigint" json:"file_size,omitempty"`
	Checksum     *string `gorm:"size:128" json:"checksum,omitempty"`
	ErrorMessage *string `gorm:"type:text" json:"error_message,omitempty"`

	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Requester *User      `gorm:"foreignKey:RequestedBy" json:"requester,omitempty"`
}

// TableName 表名
func (AnalyticsExportJob) TableName() string {
	return "what_reverse_analytics_exports"
}

// BeforeCreate 创建前钩子
func (j *AnalyticsExportJob) BeforeCreate(tx *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}

// ===== 订阅机制 =====

// AnalyticsSubscriptionStatus 订阅状态
type AnalyticsSubscriptionStatus string

const (
	AnalyticsSubscriptionActive AnalyticsSubscriptionStatus = "active"
	AnalyticsSubscriptionPaused AnalyticsSubscriptionStatus = "paused"
)

// AnalyticsSubscriptionDeliveryType 订阅投递类型
type AnalyticsSubscriptionDeliveryType string

const (
	AnalyticsDeliveryManual  AnalyticsSubscriptionDeliveryType = "manual"
	AnalyticsDeliveryWebhook AnalyticsSubscriptionDeliveryType = "webhook"
	AnalyticsDeliveryEmail   AnalyticsSubscriptionDeliveryType = "email"
)

// AnalyticsSubscription 数据订阅配置
type AnalyticsSubscription struct {
	ID           uuid.UUID                         `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID  uuid.UUID                         `gorm:"type:char(36);not null;index" json:"workspace_id"`
	CreatedBy    *uuid.UUID                        `gorm:"type:char(36);index" json:"created_by,omitempty"`
	Name         string                            `gorm:"size:120;not null" json:"name"`
	ExportType   AnalyticsExportJobType            `gorm:"size:30;not null;index" json:"export_type"`
	Format       string                            `gorm:"size:20;not null" json:"format"`
	DeliveryType AnalyticsSubscriptionDeliveryType `gorm:"size:30;not null" json:"delivery_type"`
	Destination  *string                           `gorm:"size:512" json:"destination,omitempty"`
	Schedule     *string                           `gorm:"size:50" json:"schedule,omitempty"`
	Status       AnalyticsSubscriptionStatus       `gorm:"size:20;default:'active';index" json:"status"`
	Filter       JSON                              `gorm:"column:filter_json;type:json" json:"filter,omitempty"`

	LastRunAt    *time.Time `json:"last_run_at,omitempty"`
	LastExportID *uuid.UUID `gorm:"type:char(36)" json:"last_export_id,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Workspace *Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
	Creator   *User      `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

// TableName 表名
func (AnalyticsSubscription) TableName() string {
	return "what_reverse_analytics_subscriptions"
}

// BeforeCreate 创建前钩子
func (s *AnalyticsSubscription) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
