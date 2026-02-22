package database

import (
	"fmt"
	"time"

	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/domain/entity"
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
		&entity.UserSession{},
		&entity.AgentSession{},
		&entity.AppUser{},
		&entity.Workspace{},
		&entity.WorkspaceVersion{},
		&entity.WorkspaceDomain{},
		&entity.WorkspaceSession{},
		&entity.WorkspaceEvent{},
		&entity.WorkspaceRating{},
		&entity.WorkspaceSlugAlias{},
		&entity.WorkspaceRole{},
		&entity.WorkspaceMember{},
		// 审计相关
		&entity.AuditLog{},

		// 运行时事件
		&entity.RuntimeEvent{},

		// 通知相关
		&entity.Notification{},

		// 活动
		&entity.UserActivity{},

		// 文件存储
		&entity.StorageObject{},

		// RLS 策略
		&entity.RLSPolicy{},
	)
}
