package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/database"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/queue"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
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

	log.Info("Starting AgentFlow Worker...")

	// 初始化数据库
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	log.Info("Database connected")

	cacheRedis, err := redis.New(&cfg.Redis)
	if err != nil {
		log.Warn("Failed to initialize cache redis", "error", err)
		cacheRedis = nil
	}

	// 初始化仓储
	executionRepo := repository.NewExecutionRepository(db)
	workflowRepo := repository.NewWorkflowRepository(db)
	appRepo := repository.NewAppRepository(db)
	workspaceDatabaseRepo := repository.NewWorkspaceDatabaseRepository(db)
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	workspaceSlugAliasRepo := repository.NewWorkspaceSlugAliasRepository(db)
	workspaceRoleRepo := repository.NewWorkspaceRoleRepository(db)
	workspaceMemberRepo := repository.NewWorkspaceMemberRepository(db)
	modelUsageRepo := repository.NewModelUsageRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)
	appVersionRepo := repository.NewAppVersionRepository(db)
	runtimeEventRepo := repository.NewRuntimeEventRepository(db)
	workspaceQuotaRepo := repository.NewWorkspaceQuotaRepository(db)
	billingPlanRepo := repository.NewBillingPlanRepository(db)
	billingUsageRepo := repository.NewBillingUsageEventRepository(db)
	appUsageRepo := repository.NewAppUsageStatRepository(db)
	invoicePaymentRepo := repository.NewBillingInvoicePaymentRepository(db)
	appDomainRepo := repository.NewAppDomainRepository(db)
	reviewQueueRepo := repository.NewReviewQueueRepository(db)
	workspaceDBSchemaMigrationRepo := repository.NewWorkspaceDBSchemaMigrationRepository(db)
	idempotencyRepo := repository.NewIdempotencyKeyRepository(db)
	eventRecorder := service.NewEventRecorderService(runtimeEventRepo, log, nil, cfg.Security.PIISanitizationEnabled)
	workspaceService := service.NewWorkspaceService(
		workspaceRepo,
		workspaceSlugAliasRepo,
		userRepo,
		workspaceRoleRepo,
		workspaceMemberRepo,
		eventRecorder,
		appRepo,
		workflowRepo,
		cfg.Retention,
	)
	modelUsageService := service.NewModelUsageService(modelUsageRepo, workspaceService)
	auditLogService := service.NewAuditLogService(auditLogRepo, workspaceService, cfg.Security.PIISanitizationEnabled)
	auditRecorder := service.NewExecutionAuditRecorder(auditLogService)

	billingService := service.NewBillingService(
		billingPlanRepo,
		workspaceQuotaRepo,
		billingUsageRepo,
		appUsageRepo,
		invoicePaymentRepo,
		workspaceRepo,
		workspaceService,
		appRepo,
	)
	workspaceDatabaseService, err := service.NewWorkspaceDatabaseService(
		workspaceDatabaseRepo,
		workspaceService,
		billingService,
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
			billingService,
			eventRecorder,
			reviewQueueRepo,
			workspaceDBSchemaMigrationRepo,
			idempotencyRepo,
			cfg.Database,
			"change-this-to-a-32-byte-secret!",
		)
	}
	domainRoutingExecutor := service.NewDomainRoutingExecutor(&cfg.DomainRouting, log)
	certificateIssuer := service.NewCertificateIssuerExecutor(&cfg.CertificateIssuer, log)
	appDomainService := service.NewAppDomainService(
		appRepo,
		appDomainRepo,
		eventRecorder,
		cfg.Server.BaseURL,
		cfg.Deployment.RegionBaseURLs,
		domainRoutingExecutor,
		certificateIssuer,
	)
	metricsService := service.NewMetricsService(appRepo, appVersionRepo, executionRepo, runtimeEventRepo, workspaceService, workspaceQuotaRepo, cacheRedis)

	// Workspace DB runtime (db provider + authorizer)
	workspaceDBRuntime, runtimeErr := service.NewWorkspaceDBRuntime(workspaceDatabaseRepo, workspaceService, cfg.Database, cfg.Encryption.Key)
	if runtimeErr != nil {
		log.Error("Failed to initialize workspace DB runtime", "error", runtimeErr)
		workspaceDBRuntime, runtimeErr = service.NewWorkspaceDBRuntime(workspaceDatabaseRepo, workspaceService, cfg.Database, "change-this-to-a-32-byte-secret!")
		if runtimeErr != nil {
			log.Error("Failed to initialize fallback workspace DB runtime", "error", runtimeErr)
		}
	}

	workerCfg := &queue.WorkerConfig{
		RedisAddr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		RedisPassword: cfg.Redis.Password,
		RedisDB:       cfg.Redis.DB,
		Concurrency:   cfg.Queue.WorkerConcurrency,
		Queues:        cfg.Queue.Queues,
		EngineConfig: &executor.EngineConfig{
			MaxConcurrent: cfg.Execution.MaxConcurrent,
			Timeout:       cfg.Execution.Timeout,
		},
	}

	var dbProvider executor.DBProvider
	var dbAuthorizer executor.DBAuthorizer
	if workspaceDBRuntime != nil {
		dbProvider = workspaceDBRuntime
		dbAuthorizer = workspaceDBRuntime
	}

	var dbProvisioner queue.DBProvisioner
	if workspaceDatabaseService != nil {
		dbProvisioner = dbProvisionerAdapter{svc: workspaceDatabaseService}
	}
	var domainVerifier queue.DomainVerifier
	if appDomainService != nil {
		domainVerifier = domainVerifierAdapter{svc: appDomainService}
	}
	var metricsAggregator queue.MetricsAggregator
	if metricsService != nil {
		metricsAggregator = metricsAggregatorAdapter{svc: metricsService}
	}

	worker, err := queue.NewWorker(workerCfg, executionRepo, workflowRepo, nil, log, dbProvider, dbAuthorizer, modelUsageService, auditRecorder, dbProvisioner, domainVerifier, metricsAggregator)
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

type domainVerifierAdapter struct {
	svc service.AppDomainService
}

func (a domainVerifierAdapter) VerifyByID(ctx context.Context, ownerID, domainID uuid.UUID) error {
	if a.svc == nil {
		return queue.ErrTaskNoop
	}
	_, err := a.svc.VerifyByID(ctx, ownerID, domainID)
	if err == nil {
		return nil
	}
	var verifyErr *service.DomainVerifyError
	if errors.As(err, &verifyErr) && verifyErr.NextRetryAt != nil {
		return &queue.RetryLaterError{NextRun: *verifyErr.NextRetryAt, Cause: err}
	}
	return err
}

type metricsAggregatorAdapter struct {
	svc service.MetricsService
}

func (a metricsAggregatorAdapter) AggregateWorkspaceUsage(ctx context.Context, ownerID, workspaceID uuid.UUID) error {
	if a.svc == nil {
		return queue.ErrTaskNoop
	}
	_, err := a.svc.GetWorkspaceUsage(ctx, ownerID, workspaceID)
	return err
}

func (a metricsAggregatorAdapter) AggregateAppMetrics(ctx context.Context, ownerID, appID uuid.UUID) error {
	if a.svc == nil {
		return queue.ErrTaskNoop
	}
	_, err := a.svc.GetAppMetrics(ctx, ownerID, appID)
	return err
}
