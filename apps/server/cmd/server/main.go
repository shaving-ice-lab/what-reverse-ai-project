package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agentflow/server/internal/api"
	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/database"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/migration"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
)

// @title AgentFlow API
// @version 1.0
// @description AgentFlow - AI 工作流平台 API 文档
// @termsOfService https://agentflow.app/terms

// @contact.name API Support
// @contact.url https://agentflow.app/support
// @contact.email support@agentflow.app

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT Bearer token

func main() {
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

	log.Info("Starting AgentFlow Server...")

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
				"updated_workflows", result.UpdatedWorkflows,
				"updated_executions", result.UpdatedExecutions,
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
					"workflows_missing_workspace", report.WorkflowsMissingWorkspace,
					"executions_missing_workspace", report.ExecutionsMissingWorkspace,
					"api_keys_missing_workspace", report.APIKeysMissingWorkspace,
				)
			}
		}
	}

	// 初始化数据保留清理服务
	runtimeEventRepo := repository.NewRuntimeEventRepository(db)
	executionRepo := repository.NewExecutionRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)
	exportRepo := repository.NewWorkspaceExportRepository(db)
	retentionService := service.NewRetentionService(cfg.Retention, cfg.Archive, runtimeEventRepo, executionRepo, workspaceRepo, exportRepo, auditLogRepo, cfg.Security.AuditLogRetentionDays, log)
	retentionCtx, retentionCancel := context.WithCancel(context.Background())
	go retentionService.Run(retentionCtx)

	// 初始化种子数据（预置模板）
	if cfg.Server.Mode != "production" || os.Getenv("SEED_TEMPLATES") == "true" {
		templateSeeder := database.NewWorkflowTemplateSeeder(db, log)
		if err := templateSeeder.SeedOfficialWorkflowTemplates(); err != nil {
			log.Warn("Failed to seed workflow templates", "error", err)
		} else {
			log.Info("Workflow templates seeded")
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
	exportService := server.GetWorkspaceExportService()
	exportCtx, exportCancel := context.WithCancel(context.Background())
	if exportService != nil {
		go exportService.RunWorker(exportCtx)
	}
	domainLifecycleService := server.GetDomainLifecycleService()
	domainLifecycleCtx, domainLifecycleCancel := context.WithCancel(context.Background())
	if domainLifecycleService != nil {
		go domainLifecycleService.Run(domainLifecycleCtx)
	}
	connectorHealthService := server.GetConnectorHealthService()
	connectorHealthCtx, connectorHealthCancel := context.WithCancel(context.Background())
	if connectorHealthService != nil {
		go connectorHealthService.Run(connectorHealthCtx)
	}

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

	exportCancel()
	domainLifecycleCancel()
	connectorHealthCancel()
	retentionCancel()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", "error", err)
	}

	log.Info("Server exited")
}
