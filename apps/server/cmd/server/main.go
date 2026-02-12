package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/reverseai/server/internal/api"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/database"
	"github.com/reverseai/server/internal/pkg/logger"
	"github.com/reverseai/server/internal/pkg/migration"
	"github.com/reverseai/server/internal/pkg/redis"
)

// @title ReverseAI API
// @version 1.0
// @description ReverseAI - AI-Powered App Platform API
// @termsOfService https://reverseai.app/terms

// @contact.name API Support
// @contact.url https://reverseai.app/support
// @contact.email support@reverseai.app

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT Bearer token

func main() {
	// 加载 .env 环境变量文件（如果存在）
	_ = godotenv.Load()             // .env in current dir
	_ = godotenv.Load("../../.env") // from cmd/server -> project root

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 初始化日志
	log, err := logger.New(cfg.Server.Mode == "production")
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync()

	log.Info("Starting ReverseAI Server...")

	// 初始化数据库
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Database connected")

	// 自动迁移数据库表
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to migrate database", "error", err)
	}
	log.Info("Database migrated")

	// 迁移回填与一致性校验（可选）
	if cfg.Migration.WorkspaceBackfillEnabled || cfg.Migration.WorkspaceConsistencyCheck {
		ctx := context.Background()
		if cfg.Migration.WorkspaceBackfillEnabled {
			result, err := migration.RunWorkspaceBackfill(ctx, db)
			if err != nil {
				log.Fatal("Workspace backfill failed", "error", err)
			}
			log.Info("Workspace backfill completed",
				"created_workspaces", result.CreatedWorkspaces,
				"updated_api_keys", result.UpdatedAPIKeys,
			)
		}
		if cfg.Migration.WorkspaceConsistencyCheck {
			report, err := migration.CheckWorkspaceConsistency(ctx, db)
			if err != nil {
				log.Warn("Workspace consistency check failed", "error", err)
			} else {
				log.Info("Workspace consistency check",
					"users_missing_workspace", report.UsersMissingWorkspace,
					"api_keys_missing_workspace", report.APIKeysMissingWorkspace,
				)
			}
		}
	}

	// 初始化 Redis
	rdb, err := redis.New(&cfg.Redis)
	if err != nil {
		log.Fatal("Failed to connect to Redis", "error", err)
	}
	log.Info("Redis connected")

	// 创建 Echo 服务器
	server := api.NewServer(cfg, db, rdb, log)

	// 启动服务器
	go func() {
		addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
		log.Info("Server starting", "address", addr)

		if err := server.Start(addr); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", "error", err)
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", "error", err)
	}

	log.Info("Server exited")
}
