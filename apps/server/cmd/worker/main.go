package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/database"
	"github.com/reverseai/server/internal/pkg/logger"
	"github.com/reverseai/server/internal/pkg/queue"
	"github.com/reverseai/server/internal/repository"
	"github.com/reverseai/server/internal/service"
)

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

	log.Info("Starting reverseai Worker...")

	// 初始化数据库
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Database connected")

	// 初始化仓储
	workspaceDatabaseRepo := repository.NewWorkspaceDatabaseRepository(db)
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	workspaceSlugAliasRepo := repository.NewWorkspaceSlugAliasRepository(db)
	workspaceRoleRepo := repository.NewWorkspaceRoleRepository(db)
	workspaceMemberRepo := repository.NewWorkspaceMemberRepository(db)
	runtimeEventRepo := repository.NewRuntimeEventRepository(db)
	reviewQueueRepo := repository.NewReviewQueueRepository(db)
	workspaceDBSchemaMigrationRepo := repository.NewWorkspaceDBSchemaMigrationRepository(db)
	idempotencyRepo := repository.NewIdempotencyKeyRepository(db)
	eventRecorder := service.NewEventRecorderService(runtimeEventRepo, log, nil, cfg.Security.PIISanitizationEnabled)
	workspaceService := service.NewWorkspaceService(
		db,
		workspaceRepo,
		workspaceSlugAliasRepo,
		userRepo,
		workspaceRoleRepo,
		workspaceMemberRepo,
		eventRecorder,
		cfg.Retention,
	)
	workspaceDatabaseService, err := service.NewWorkspaceDatabaseService(
		workspaceDatabaseRepo,
		workspaceService,
		nil, // billingService removed
		eventRecorder,
		reviewQueueRepo,
		workspaceDBSchemaMigrationRepo,
		idempotencyRepo,
		cfg.Database,
		cfg.Encryption.Key,
	)
	if err != nil {
		log.Error("Failed to initialize workspace database service", "error", err)
		workspaceDatabaseService, _ = service.NewWorkspaceDatabaseService(
			workspaceDatabaseRepo,
			workspaceService,
			nil, // billingService removed
			eventRecorder,
			reviewQueueRepo,
			workspaceDBSchemaMigrationRepo,
			idempotencyRepo,
			cfg.Database,
			"change-this-to-a-32-byte-secret!",
		)
	}

	workerCfg := &queue.WorkerConfig{
		RedisAddr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		RedisPassword: cfg.Redis.Password,
		RedisDB:       cfg.Redis.DB,
		Concurrency:   cfg.Queue.WorkerConcurrency,
		Queues:        cfg.Queue.Queues,
	}

	var dbProvisioner queue.DBProvisioner
	if workspaceDatabaseService != nil {
		dbProvisioner = dbProvisionerAdapter{svc: workspaceDatabaseService}
	}
	worker, err := queue.NewWorker(workerCfg, log, dbProvisioner, nil, nil)
	if err != nil {
		log.Fatal("Failed to create worker", "error", err)
	}

	errCh := make(chan error, 1)
	go func() {
		errCh <- worker.Start()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatal("Worker stopped unexpectedly", "error", err)
		}
	case <-quit:
		log.Info("Shutting down worker...")
	}

	worker.Shutdown()
	log.Info("Worker exited")
}

type dbProvisionerAdapter struct {
	svc service.WorkspaceDatabaseService
}

func (a dbProvisionerAdapter) Provision(ctx context.Context, workspaceID, ownerID uuid.UUID) error {
	if a.svc == nil {
		return queue.ErrTaskNoop
	}
	_, err := a.svc.Provision(ctx, workspaceID, ownerID)
	if errors.Is(err, service.ErrWorkspaceDatabaseExists) {
		return queue.ErrTaskNoop
	}
	return err
}
