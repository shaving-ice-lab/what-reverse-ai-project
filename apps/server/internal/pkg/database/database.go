package database

import (
	"fmt"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// New 创建数据库连接
func New(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	// MySQL DSN 格式: user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name, cfg.Charset,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "what_reverse_", // 表名前缀
			SingularTable: true,            // 使用单数表名
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// 获取底层 sql.DB 以配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// 配置连接池
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

// Migrate 自动迁移数据库表
func Migrate(db *gorm.DB) error {
	// 在迁移前，使用 GORM Migrator 安全地删除可能冲突的旧索引
	migrator := db.Migrator()

	// 定义需要清理的表和索引
	indexCleanup := map[string][]string{
		"what_reverse_users": {
			"idx_what_reverse_users_email",
			"idx_what_reverse_users_username",
		},
		"what_reverse_agents": {
			"idx_what_reverse_agents_slug",
		},
	}

	// 清理冲突的索引
	for tableName, indexes := range indexCleanup {
		if migrator.HasTable(tableName) {
			for _, idx := range indexes {
				if migrator.HasIndex(tableName, idx) {
					migrator.DropIndex(tableName, idx)
				}
			}
		}
	}

	return db.AutoMigrate(
		// 用户相关
		&entity.User{},
		&entity.APIKey{},
		&entity.Secret{},
		&entity.UserFollow{},
		&entity.UserSession{},
		&entity.Workspace{},
		&entity.WorkspaceRole{},
		&entity.WorkspaceMember{},
		&entity.WorkspaceDatabase{},
		&entity.WorkspaceDBRole{},
		&entity.WorkspaceDBSchemaMigration{},
		&entity.IdempotencyKey{},

		// App 相关
		&entity.App{},
		&entity.AppVersion{},
		&entity.AppAccessPolicy{},
		&entity.AppDomain{},
		&entity.AppSession{},
		&entity.AppEvent{},

		// Webhook 相关
		&entity.WebhookEndpoint{},
		&entity.WebhookDelivery{},

		// 配置中心
		&entity.ConfigItem{},

		// 审计相关
		&entity.AuditLog{},
		&entity.SupportTicket{},
		&entity.SupportChannel{},
		&entity.SupportAssignmentRule{},
		&entity.SupportTicketComment{},
		&entity.SupportTeam{},
		&entity.SupportTeamMember{},
		&entity.SupportQueue{},
		&entity.SupportQueueMember{},
		&entity.SupportNotificationTemplate{},
		&entity.WorkspaceExportJob{},

		// 工作流相关
		&entity.Workflow{},
		&entity.WorkflowVersion{},
		&entity.Folder{},
		&entity.Tag{},
		&entity.WorkflowTag{},
		&entity.Template{},

		// 执行相关
		&entity.RuntimeEvent{},
		&entity.Execution{},
		&entity.NodeLog{},
		&entity.ModelUsageEvent{},
		&entity.AnalyticsMetricDefinition{},
		&entity.AnalyticsMetric{},
		&entity.AnalyticsExportJob{},
		&entity.AnalyticsSubscription{},

		// 创意模板相关
		&entity.CreativeTemplate{},
		&entity.CreativeTask{},
		&entity.CreativeDocument{},

		// 自定义节点
		&entity.CustomNode{},

		// 社区相关
		&entity.Share{},
		&entity.Comment{},
		&entity.CommentLike{},
		&entity.Notification{},

		// 活动和公告
		&entity.UserActivity{},
		&entity.Announcement{},
		&entity.AnnouncementRead{},

		// 收益相关
		&entity.Earning{},

		// 审核相关
		&entity.Reviewer{},
		&entity.ReviewQueue{},
		&entity.ReviewRecord{},
		&entity.ReviewComment{},
		&entity.ReviewChecklist{},

		// 同步相关
		&entity.SyncRecord{},

		// Agent 相关
		&entity.Agent{},
		&entity.Review{},
		&entity.AgentUsage{},
		&entity.AgentUsageStat{},
		&entity.AgentReport{},
	)
}
