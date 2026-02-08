package api

import (
	"context"
	"fmt"

	"github.com/agentflow/server/internal/api/handler"
	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/queue"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/pkg/websocket"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

// Server API 服务器
type Server struct {
	echo                   *echo.Echo
	config                 *config.Config
	db                     *gorm.DB
	redis                  *redis.Client
	log                    logger.Logger
	wsHub                  *websocket.Hub
	workspaceExportService service.WorkspaceExportService
	domainLifecycleService service.DomainLifecycleService
	connectorHealthService service.ConnectorHealthService
	taskQueue              *queue.Queue
}

// NewServer 创建新的 API 服务器
func NewServer(cfg *config.Config, db *gorm.DB, rdb *redis.Client, log logger.Logger) *Server {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// 创建 WebSocket Hub
	wsHub := websocket.NewHub(log)
	go wsHub.Run()

	taskQueue, err := queue.NewQueue(&queue.QueueConfig{
		RedisAddr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		RedisPassword: cfg.Redis.Password,
		RedisDB:       cfg.Redis.DB,
	}, log)
	if err != nil {
		log.Error("Failed to initialize task queue", "error", err)
	}

	server := &Server{
		echo:                   e,
		config:                 cfg,
		db:                     db,
		redis:                  rdb,
		log:                    log,
		wsHub:                  wsHub,
		workspaceExportService: nil,
		domainLifecycleService: nil,
		connectorHealthService: nil,
		taskQueue:              taskQueue,
	}

	server.setupMiddleware()
	server.setupRoutes()

	return server
}

// GetWebSocketHub 获取 WebSocket Hub
func (s *Server) GetWebSocketHub() *websocket.Hub {
	return s.wsHub
}

// GetWorkspaceExportService 获取导出任务服务
func (s *Server) GetWorkspaceExportService() service.WorkspaceExportService {
	return s.workspaceExportService
}

// GetDomainLifecycleService 获取域名生命周期服务
func (s *Server) GetDomainLifecycleService() service.DomainLifecycleService {
	return s.domainLifecycleService
}

// GetConnectorHealthService 获取连接器健康检查服务
func (s *Server) GetConnectorHealthService() service.ConnectorHealthService {
	return s.connectorHealthService
}

// setupMiddleware 配置中间件
func (s *Server) setupMiddleware() {
	// 恢复中间件
	s.echo.Use(echoMiddleware.Recover())

	// 请求 ID
	s.echo.Use(echoMiddleware.RequestID())

	// CORS
	s.echo.Use(middleware.CORS())

	// Prometheus 指标收集
	s.echo.Use(middleware.Metrics())

	// 日志（增强版：包含追踪上下文）
	s.echo.Use(middleware.Logger(s.log, s.config.Security.PIISanitizationEnabled))

	// 分布式追踪（如启用）
	// s.echo.Use(middleware.Tracing("agentflow-server"))

	// 速率限制 (可选)
	// s.echo.Use(middleware.RateLimit(s.redis))
}

// setupRoutes 配置路由
func (s *Server) setupRoutes() {
	// 初始化仓储层
	userRepo := repository.NewUserRepository(s.db)
	workspaceRepo := repository.NewWorkspaceRepository(s.db)
	workspaceSlugAliasRepo := repository.NewWorkspaceSlugAliasRepository(s.db)
	workspaceRoleRepo := repository.NewWorkspaceRoleRepository(s.db)
	workspaceMemberRepo := repository.NewWorkspaceMemberRepository(s.db)
	workspaceDatabaseRepo := repository.NewWorkspaceDatabaseRepository(s.db)
	workspaceDBSchemaMigrationRepo := repository.NewWorkspaceDBSchemaMigrationRepository(s.db)
	idempotencyRepo := repository.NewIdempotencyKeyRepository(s.db)
	workspaceDBRoleRepo := repository.NewWorkspaceDBRoleRepository(s.db)
	workflowRepo := repository.NewWorkflowRepository(s.db)
	executionRepo := repository.NewExecutionRepository(s.db)
	agentRepo := repository.NewAgentRepository(s.db)
	workspaceExportRepo := repository.NewWorkspaceExportRepository(s.db)
	runtimeEventRepo := repository.NewRuntimeEventRepository(s.db)
	auditLogRepo := repository.NewAuditLogRepository(s.db)
	supportTicketRepo := repository.NewSupportTicketRepository(s.db)
	supportChannelRepo := repository.NewSupportChannelRepository(s.db)
	supportAssignmentRuleRepo := repository.NewSupportAssignmentRuleRepository(s.db)
	supportTicketCommentRepo := repository.NewSupportTicketCommentRepository(s.db)
	supportTeamRepo := repository.NewSupportTeamRepository(s.db)
	supportTeamMemberRepo := repository.NewSupportTeamMemberRepository(s.db)
	supportQueueRepo := repository.NewSupportQueueRepository(s.db)
	supportQueueMemberRepo := repository.NewSupportQueueMemberRepository(s.db)
	supportNotificationTemplateRepo := repository.NewSupportNotificationTemplateRepository(s.db)
	reviewQueueRepo := repository.NewReviewQueueRepository(s.db)
	apiKeyRepo := repository.NewAPIKeyRepository(s.db)
	webhookEndpointRepo := repository.NewWebhookEndpointRepository(s.db)
	webhookDeliveryRepo := repository.NewWebhookDeliveryRepository(s.db)
	folderRepo := repository.NewFolderRepository(s.db)
	versionRepo := repository.NewWorkflowVersionRepository(s.db)
	templateRepo := repository.NewTemplateRepository(s.db)
	activityRepo := repository.NewActivityRepository(s.db)
	sessionRepo := repository.NewSessionRepository(s.db)
	announcementRepo := repository.NewAnnouncementRepository(s.db)
	tagRepo := repository.NewTagRepository(s.db)
	creativeTemplateRepo := repository.NewCreativeTemplateRepository(s.db)
	creativeTaskRepo := repository.NewCreativeTaskRepository(s.db)
	creativeDocumentRepo := repository.NewCreativeDocumentRepository(s.db)
	followRepo := repository.NewFollowRepository(s.db)
	commentRepo := repository.NewCommentRepository(s.db)
	notificationRepo := repository.NewNotificationRepository(s.db)
	shareRepo := repository.NewShareRepository(s.db)
	earningRepo := repository.NewEarningRepository(s.db)
	creatorAccountRepo := repository.NewCreatorAccountRepository(s.db)
	commissionTierRepo := repository.NewCommissionTierRepository(s.db)
	withdrawalRepo := repository.NewWithdrawalRepository(s.db)
	settlementRepo := repository.NewSettlementRepository(s.db)
	billingPlanRepo := repository.NewBillingPlanRepository(s.db)
	workspaceQuotaRepo := repository.NewWorkspaceQuotaRepository(s.db)
	billingUsageRepo := repository.NewBillingUsageEventRepository(s.db)
	invoicePaymentRepo := repository.NewBillingInvoicePaymentRepository(s.db)
	modelUsageRepo := repository.NewModelUsageRepository(s.db)
	analyticsMetricDefRepo := repository.NewAnalyticsMetricDefinitionRepository(s.db)
	analyticsMetricRepo := repository.NewAnalyticsMetricRepository(s.db)
	analyticsExportRepo := repository.NewAnalyticsExportRepository(s.db)
	analyticsSubscriptionRepo := repository.NewAnalyticsSubscriptionRepository(s.db)
	planModuleRepo := repository.NewPlanModuleRepository(s.db)
	planTaskRepo := repository.NewPlanTaskRepository(s.db)
	planVersionRepo := repository.NewPlanVersionRepository(s.db)
	secretRepo := repository.NewSecretRepository(s.db)
	configItemRepo := repository.NewConfigItemRepository(s.db)
	supplyChainRepo := repository.NewSupplyChainRepository(s.db)

	// 对话相关仓储
	conversationRepo := repository.NewConversationRepository(s.db)
	conversationFolderRepo := repository.NewConversationFolderRepository(s.db)
	conversationTagRepo := repository.NewConversationTagRepository(s.db)
	messageRepo := repository.NewMessageRepository(s.db)
	conversationTemplateRepo := repository.NewConversationTemplateRepository(s.db)

	// 初始化服务层
	eventRecorder := service.NewEventRecorderService(runtimeEventRepo, s.log, nil, s.config.Security.PIISanitizationEnabled)
	workspaceService := service.NewWorkspaceService(
		workspaceRepo,
		workspaceSlugAliasRepo,
		userRepo,
		workspaceRoleRepo,
		workspaceMemberRepo,
		eventRecorder,
		workflowRepo,
		s.config.Retention,
	)
	workspaceExportService := service.NewWorkspaceExportService(
		workspaceExportRepo,
		workspaceRepo,
		workspaceMemberRepo,
		workflowRepo,
		executionRepo,
		auditLogRepo,
		workspaceService,
		s.config.Archive,
		s.log,
	)
	s.workspaceExportService = workspaceExportService
	logArchiveService := service.NewLogArchiveService(workspaceExportRepo, workspaceService, s.config.Archive)
	auditLogService := service.NewAuditLogService(auditLogRepo, workspaceService, s.config.Security.PIISanitizationEnabled)
	securityComplianceService := service.NewSecurityComplianceService(s.config, workspaceService, auditLogService)
	supplyChainService := service.NewSupplyChainService(s.config, supplyChainRepo)
	authService := service.NewAuthService(userRepo, workspaceService, s.redis, &s.config.JWT, s.config.Security.AdminEmails)
	userService := service.NewUserService(userRepo)
	billingService := service.NewBillingService(
		billingPlanRepo,
		workspaceQuotaRepo,
		billingUsageRepo,
		invoicePaymentRepo,
		workspaceRepo,
		workspaceService,
	)
	apiKeyService, err := service.NewAPIKeyService(apiKeyRepo, workspaceService, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize API key service", "error", err)
		// 使用默认密钥（仅开发环境）
		apiKeyService, _ = service.NewAPIKeyService(apiKeyRepo, workspaceService, "change-this-to-a-32-byte-secret!")
	}
	secretService, err := service.NewSecretService(secretRepo, workspaceService, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize secret service", "error", err)
		secretService, _ = service.NewSecretService(secretRepo, workspaceService, "change-this-to-a-32-byte-secret!")
	}
	configCenterService, err := service.NewConfigCenterService(configItemRepo, workspaceService, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize config center service", "error", err)
		configCenterService, _ = service.NewConfigCenterService(configItemRepo, workspaceService, "change-this-to-a-32-byte-secret!")
	}
	webhookService, err := service.NewWebhookService(webhookEndpointRepo, webhookDeliveryRepo, workspaceService, s.config.Encryption.Key, s.log)
	if err != nil {
		s.log.Error("Failed to initialize webhook service", "error", err)
		webhookService, _ = service.NewWebhookService(webhookEndpointRepo, webhookDeliveryRepo, workspaceService, "change-this-to-a-32-byte-secret!", s.log)
	}
	eventRecorder.SetWebhookDispatcher(webhookService)
	connectorService := service.NewConnectorService()
	workspaceDatabaseService, err := service.NewWorkspaceDatabaseService(
		workspaceDatabaseRepo,
		workspaceService,
		billingService,
		eventRecorder,
		reviewQueueRepo,
		workspaceDBSchemaMigrationRepo,
		idempotencyRepo,
		s.config.Database,
		s.config.Encryption.Key,
	)
	if err != nil {
		s.log.Error("Failed to initialize workspace database service", "error", err)
		workspaceDatabaseService, _ = service.NewWorkspaceDatabaseService(
			workspaceDatabaseRepo,
			workspaceService,
			billingService,
			eventRecorder,
			reviewQueueRepo,
			workspaceDBSchemaMigrationRepo,
			idempotencyRepo,
			s.config.Database,
			"change-this-to-a-32-byte-secret!",
		)
	}
	workspaceDBRoleService, err := service.NewWorkspaceDBRoleService(
		workspaceDBRoleRepo,
		workspaceDatabaseRepo,
		workspaceService,
		auditLogService,
		s.config.Database,
		s.config.Encryption.Key,
	)
	if err != nil {
		s.log.Error("Failed to initialize workspace DB role service", "error", err)
		workspaceDBRoleService, _ = service.NewWorkspaceDBRoleService(
			workspaceDBRoleRepo,
			workspaceDatabaseRepo,
			workspaceService,
			auditLogService,
			s.config.Database,
			"change-this-to-a-32-byte-secret!",
		)
	}
	workspaceDBRuntime, err := service.NewWorkspaceDBRuntime(workspaceDatabaseRepo, workspaceService, s.config.Database, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize workspace DB runtime", "error", err)
		workspaceDBRuntime, _ = service.NewWorkspaceDBRuntime(workspaceDatabaseRepo, workspaceService, s.config.Database, "change-this-to-a-32-byte-secret!")
	}
	workflowService := service.NewWorkflowService(workflowRepo, workspaceService)
	folderService := service.NewFolderService(folderRepo, workflowRepo)
	versionService := service.NewWorkflowVersionService(versionRepo, workflowRepo)
	templateService := service.NewTemplateService(templateRepo, workflowRepo, workspaceService)
	modelUsageService := service.NewModelUsageService(modelUsageRepo, workspaceService)
	engineCfg := &executor.EngineConfig{
		MaxConcurrent: s.config.Execution.MaxConcurrent,
		Timeout:       s.config.Execution.Timeout,
	}
	executionService := service.NewExecutionService(
		executionRepo,
		workflowRepo,
		workspaceService,
		billingService,
		modelUsageService,
		s.redis,
		s.log,
		eventRecorder,
		auditLogService,
		s.config.Security.PIISanitizationEnabled,
		engineCfg,
		workspaceDBRuntime,
		s.taskQueue,
		s.config.Execution.MaxInFlight,
		service.ExecutionCacheSettings{
			ResultTTL: s.config.Cache.Execution.ResultTTL,
		},
	)
	// 设置 WebSocket Hub 用于实时推送执行状态
	if execSvc, ok := executionService.(interface{ SetWebSocketHub(*websocket.Hub) }); ok {
		execSvc.SetWebSocketHub(s.wsHub)
	}
	agentService := service.NewAgentService(agentRepo, workflowRepo)

	// 初始化统计服务
	statsService := service.NewStatsService(executionRepo, workflowRepo)
	metricsService := service.NewMetricsService(workspaceRepo, executionRepo, runtimeEventRepo, workspaceService, workspaceQuotaRepo, s.redis)
	analyticsService := service.NewAnalyticsService(analyticsMetricRepo, analyticsMetricDefRepo, analyticsExportRepo, analyticsSubscriptionRepo, workspaceService, eventRecorder, s.config.Archive, s.config.Security)

	// 初始化 Dashboard 服务
	dashboardService := service.NewDashboardService(workflowRepo, executionRepo, activityRepo, templateRepo)

	// 初始化评价服务
	reviewRepo := repository.NewReviewRepository(s.db)
	reviewService := service.NewReviewService(reviewRepo, agentRepo)

	// 初始化新增服务
	activityService := service.NewActivityService(activityRepo)
	sessionService := service.NewSessionService(sessionRepo)
	announcementService := service.NewAnnouncementService(announcementRepo, userRepo)
	tagService := service.NewTagService(tagRepo, workflowRepo)
	systemService := service.NewSystemService(s.db, s.redis)
	featureFlagsService := service.NewFeatureFlagsService(s.config.Features)
	opsService := service.NewOpsService(runtimeEventRepo)
	creativeTemplateService := service.NewCreativeTemplateService(creativeTemplateRepo, s.log)
	creativeTaskService := service.NewCreativeTaskService(creativeTaskRepo, creativeTemplateRepo, nil, s.log)
	creativeDocumentService := service.NewCreativeDocumentService(creativeDocumentRepo, s.log)
	followService := service.NewFollowServiceWithNotification(followRepo, userRepo, activityRepo, notificationRepo)
	commentService := service.NewCommentServiceWithNotification(commentRepo, userRepo, notificationRepo)
	notificationService := service.NewNotificationService(notificationRepo, userRepo)
	criticalNotificationService := service.NewCriticalEventNotificationService(workspaceRepo, userRepo, notificationService, s.log)
	eventRecorder.SetNotificationDispatcher(criticalNotificationService)
	shareService := service.NewShareService(shareRepo, userRepo)
	earningService := service.NewEarningService(earningRepo, creatorAccountRepo, commissionTierRepo, withdrawalRepo, settlementRepo)

	// 对话相关服务
	conversationService := service.NewConversationService(conversationRepo, conversationFolderRepo, conversationTagRepo, messageRepo)
	conversationFolderService := service.NewConversationFolderService(conversationFolderRepo, conversationRepo)
	conversationTemplateService := service.NewConversationTemplateService(conversationTemplateRepo)

	// AI 助手服务
	aiAssistantService := service.NewAIAssistantService()
	runtimeService := service.NewRuntimeService(
		workspaceRepo,
		workspaceSlugAliasRepo,
		workspaceMemberRepo,
		eventRecorder,
		s.config.Security.PIISanitizationEnabled,
		service.RuntimeCacheSettings{
			EntryTTL:    s.config.Cache.Runtime.EntryTTL,
			NegativeTTL: s.config.Cache.Runtime.NegativeTTL,
		},
	)
	captchaVerifier := service.NewCaptchaVerifier(&s.config.Captcha)
	domainRoutingExecutor := service.NewDomainRoutingExecutor(&s.config.DomainRouting, s.log)
	certificateIssuer := service.NewCertificateIssuerExecutor(&s.config.CertificateIssuer, s.log)
	workspaceDomainService := service.NewWorkspaceDomainService(
		workspaceRepo,
		eventRecorder,
		s.config.Server.BaseURL,
		s.config.Deployment.RegionBaseURLs,
		domainRoutingExecutor,
		certificateIssuer,
	)
	domainLifecycleService := service.NewDomainLifecycleService(
		s.config.DomainLifecycle,
		workspaceRepo,
		notificationService,
		workspaceDomainService,
		eventRecorder,
		s.log,
		s.config.Server.BaseURL,
	)
	s.domainLifecycleService = domainLifecycleService
	connectorHealthService := service.NewConnectorHealthService(
		s.config.ConnectorHealth,
		secretRepo,
		eventRecorder,
		s.log,
	)
	s.connectorHealthService = connectorHealthService
	opsSupportService := service.NewOpsSupportService()
	supportRoutingService := service.NewSupportRoutingService(supportTeamRepo, supportTeamMemberRepo, supportQueueRepo, supportQueueMemberRepo)
	supportNotificationTemplateService := service.NewSupportNotificationTemplateService(supportNotificationTemplateRepo)
	supportSettingsService := service.NewSupportSettingsService(supportChannelRepo, supportAssignmentRuleRepo)
	supportTicketCommentService := service.NewSupportTicketCommentService(
		supportTicketCommentRepo,
		supportTicketRepo,
		notificationService,
		supportRoutingService,
		supportNotificationTemplateService,
	)
	supportTicketService := service.NewSupportTicketService(
		supportTicketRepo,
		supportAssignmentRuleRepo,
		supportChannelRepo,
		supportRoutingService,
		notificationService,
		supportNotificationTemplateService,
	)
	planWBSService := service.NewPlanWBSService()
	planModuleService := service.NewPlanModuleService(planModuleRepo, planTaskRepo, workspaceService, planWBSService)
	planVersionService := service.NewPlanVersionService(planVersionRepo, planModuleRepo, workspaceService)
	planMigrationChecklistService := service.NewPlanMigrationChecklistService()
	planLegacyMigrationService := service.NewPlanLegacyMigrationService()
	planResponsiveExperienceService := service.NewPlanResponsiveExperienceService()
	planAccessibilityService := service.NewPlanAccessibilityService()
	planDisasterRecoveryService := service.NewPlanDisasterRecoveryService()
	planSLOService := service.NewPlanSLOService()
	planModuleWBSService := service.NewPlanModuleWBSService(planWBSService)
	planDependencyMilestoneService := service.NewPlanDependencyMilestoneService(planWBSService)
	planRACIService := service.NewPlanRACIService()
	planAPIFieldRulesService := service.NewPlanAPIFieldRulesService()
	planAPIFieldSpecService := service.NewPlanAPIFieldSpecService()
	planUISchemaTemplateService := service.NewPlanUISchemaTemplateService()
	planAITemplateService := service.NewPlanAITemplateService()
	planRuntimeSecurityService := service.NewPlanRuntimeSecurityService()
	planSQLSchemaService := service.NewPlanSQLSchemaService()
	planLogSchemaService := service.NewPlanLogSchemaService()
	planRetentionPolicyService := service.NewPlanRetentionPolicyService(s.config.Retention, s.config.Security)
	planDataGovernancePolicyService := service.NewPlanDataGovernancePolicyService(s.config.Retention, s.config.Security, s.config.Archive)
	planComplianceAssessmentService := service.NewPlanComplianceAssessmentService()
	planDataResidencyPolicyService := service.NewPlanDataResidencyPolicyService(s.config.Deployment)
	planAuditCompliancePolicyService := service.NewPlanAuditCompliancePolicyService(s.config.Security, s.config.Retention)
	planRuntimeStatusService := service.NewPlanRuntimeStatusService()
	planRuntimeErrorMappingService := service.NewPlanRuntimeErrorMappingService()
	planRuntimeRetryPolicyService := service.NewPlanRuntimeRetryPolicyService()
	planAPIExamplesService := service.NewPlanAPIExamplesService()
	planOpenAPISDKService := service.NewPlanOpenAPISDKService()
	planIncidentResponseService := service.NewPlanIncidentResponseService()
	planChaosEngineeringService := service.NewPlanChaosEngineeringService()
	planObservabilityService := service.NewPlanObservabilityService()
	planGrowthExperimentService := service.NewPlanGrowthExperimentService()
	planSecurityReviewService := service.NewPlanSecurityReviewService()
	planSecurityTestingService := service.NewPlanSecurityTestingService()
	planFeatureFlagsService := service.NewPlanFeatureFlagsService()
	planQueueSystemService := service.NewPlanQueueSystemService()
	planCapacityCostService := service.NewPlanCapacityCostService(s.config.Execution, s.config.Queue, s.config.Database)
	planMarketplaceBillingService := service.NewPlanMarketplaceBillingService()
	planI18nService := service.NewPlanI18nService()
	planIdentityAccountService := service.NewPlanIdentityAccountService()
	planSREService := service.NewPlanSREService()
	planRunbookService := service.NewPlanRunbookService()

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService, apiKeyService)
	workspaceHandler := handler.NewWorkspaceHandler(workspaceService, workspaceDomainService, auditLogService, workspaceExportService)
	logArchiveHandler := handler.NewLogArchiveHandler(logArchiveService)
	workspaceDatabaseHandler := handler.NewWorkspaceDatabaseHandler(workspaceDatabaseService, workspaceDBRoleService, auditLogService, s.taskQueue)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService, workspaceService)
	securityComplianceHandler := handler.NewSecurityComplianceHandler(securityComplianceService, workspaceService)
	supplyChainHandler := handler.NewSupplyChainHandler(supplyChainService, workspaceService)
	secretHandler := handler.NewSecretHandler(secretService)
	configCenterHandler := handler.NewConfigCenterHandler(configCenterService)
	billingHandler := handler.NewBillingHandler(billingService)
	workflowHandler := handler.NewWorkflowHandler(workflowService, executionService, auditLogService, workspaceService)
	folderHandler := handler.NewFolderHandler(folderService)
	versionHandler := handler.NewWorkflowVersionHandler(versionService)
	templateHandler := handler.NewTemplateHandler(templateService)
	executionHandler := handler.NewExecutionHandler(executionService)
	agentHandler := handler.NewAgentHandler(agentService)
	opsSupportHandler := handler.NewOpsSupportHandler(opsSupportService)
	supportTicketHandler := handler.NewSupportTicketHandler(supportTicketService, supportSettingsService, captchaVerifier)
	planWBSHandler := handler.NewPlanWBSHandler(planWBSService)
	planModuleHandler := handler.NewPlanModuleHandler(planModuleService)
	planVersionHandler := handler.NewPlanVersionHandler(planVersionService)
	planMigrationChecklistHandler := handler.NewPlanMigrationChecklistHandler(planMigrationChecklistService)
	planLegacyMigrationHandler := handler.NewPlanLegacyMigrationHandler(planLegacyMigrationService)
	planResponsiveExperienceHandler := handler.NewPlanResponsiveExperienceHandler(planResponsiveExperienceService)
	planAccessibilityHandler := handler.NewPlanAccessibilityHandler(planAccessibilityService)
	planDisasterRecoveryHandler := handler.NewPlanDisasterRecoveryHandler(planDisasterRecoveryService)
	planSLOHandler := handler.NewPlanSLOHandler(planSLOService)
	planModuleWBSHandler := handler.NewPlanModuleWBSHandler(planModuleWBSService)
	planDependencyMilestoneHandler := handler.NewPlanDependencyMilestoneHandler(planDependencyMilestoneService)
	planRACIHandler := handler.NewPlanRACIHandler(planRACIService)
	planAPIFieldRulesHandler := handler.NewPlanAPIFieldRulesHandler(planAPIFieldRulesService)
	planAPIFieldSpecsHandler := handler.NewPlanAPIFieldSpecsHandler(planAPIFieldSpecService)
	planUISchemaTemplatesHandler := handler.NewPlanUISchemaTemplatesHandler(planUISchemaTemplateService)
	planAITemplateHandler := handler.NewPlanAITemplateHandler(planAITemplateService)
	planRuntimeSecurityHandler := handler.NewPlanRuntimeSecurityPolicyHandler(planRuntimeSecurityService)
	planSQLSchemaHandler := handler.NewPlanSQLSchemaHandler(planSQLSchemaService)
	planLogSchemaHandler := handler.NewPlanLogSchemaHandler(planLogSchemaService)
	planRetentionPolicyHandler := handler.NewPlanRetentionPolicyHandler(planRetentionPolicyService)
	planDataGovernancePolicyHandler := handler.NewPlanDataGovernancePolicyHandler(planDataGovernancePolicyService)
	planComplianceAssessmentHandler := handler.NewPlanComplianceAssessmentHandler(planComplianceAssessmentService, securityComplianceService, workspaceService)
	planDataResidencyPolicyHandler := handler.NewPlanDataResidencyPolicyHandler(planDataResidencyPolicyService)
	planAuditCompliancePolicyHandler := handler.NewPlanAuditCompliancePolicyHandler(planAuditCompliancePolicyService)
	planRuntimeStatusHandler := handler.NewPlanRuntimeStatusHandler(planRuntimeStatusService)
	planRuntimeErrorMappingHandler := handler.NewPlanRuntimeErrorMappingHandler(planRuntimeErrorMappingService)
	planRuntimeRetryPolicyHandler := handler.NewPlanRuntimeRetryPolicyHandler(planRuntimeRetryPolicyService)
	planAPIExamplesHandler := handler.NewPlanAPIExamplesHandler(planAPIExamplesService)
	planOpenAPISDKHandler := handler.NewPlanOpenAPISDKHandler(planOpenAPISDKService)
	planIncidentResponseHandler := handler.NewPlanIncidentResponseHandler(planIncidentResponseService)
	planChaosEngineeringHandler := handler.NewPlanChaosEngineeringHandler(planChaosEngineeringService)
	planObservabilityHandler := handler.NewPlanObservabilityHandler(planObservabilityService)
	planGrowthExperimentHandler := handler.NewPlanGrowthExperimentHandler(planGrowthExperimentService)
	planSecurityReviewHandler := handler.NewPlanSecurityReviewHandler(planSecurityReviewService)
	planSecurityTestingHandler := handler.NewPlanSecurityTestingHandler(planSecurityTestingService)
	planFeatureFlagsHandler := handler.NewPlanFeatureFlagsHandler(planFeatureFlagsService)
	planQueueSystemHandler := handler.NewPlanQueueSystemHandler(planQueueSystemService)
	planCapacityCostHandler := handler.NewPlanCapacityCostHandler(planCapacityCostService)
	planMarketplaceBillingHandler := handler.NewPlanMarketplaceBillingHandler(planMarketplaceBillingService)
	planI18nHandler := handler.NewPlanI18nHandler(planI18nService)
	planIdentityAccountHandler := handler.NewPlanIdentityAccountHandler(planIdentityAccountService)
	planSREHandler := handler.NewPlanSREHandler(planSREService)
	planRunbookHandler := handler.NewPlanRunbookHandler(planRunbookService)
	runtimeHandler := handler.NewRuntimeHandler(
		runtimeService,
		executionService,
		billingService,
		auditLogService,
		&s.config.JWT,
		captchaVerifier,
		s.config.Server.BaseURL,
		s.config.Deployment.RegionBaseURLs,
		s.config.Cache.Runtime.SchemaTTL,
		s.config.Cache.Runtime.SchemaStaleTTL,
	)
	statsHandler := handler.NewStatsHandler(statsService)
	metricsHandler := handler.NewMetricsHandler(metricsService)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsService)
	modelUsageHandler := handler.NewModelUsageHandler(modelUsageService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	reviewHandler := handler.NewReviewHandler(reviewService)

	// 初始化新增处理器
	activityHandler := handler.NewActivityHandler(activityService)
	sessionHandler := handler.NewSessionHandler(sessionService)
	announcementHandler := handler.NewAnnouncementHandler(announcementService)
	tagHandler := handler.NewTagHandler(tagService)
	webhookHandler := handler.NewWebhookHandler(webhookService)
	connectorHandler := handler.NewConnectorHandler(connectorService, secretService)
	systemHandler := handler.NewSystemHandler(systemService, featureFlagsService, &s.config.Deployment)
	opsHandler := handler.NewOpsHandler(opsService, s.taskQueue)
	creativeTemplateHandler := handler.NewCreativeTemplateHandler(creativeTemplateService)
	creativeTaskHandler := handler.NewCreativeTaskHandler(creativeTaskService, nil)
	creativeDocumentHandler := handler.NewCreativeDocumentHandler(creativeDocumentService)
	followHandler := handler.NewFollowHandler(followService)
	commentHandler := handler.NewCommentHandler(commentService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	shareHandler := handler.NewShareHandler(shareService, s.config.Server.BaseURL)
	earningHandler := handler.NewEarningHandler(earningService)

	// 对话相关处理器
	conversationHandler := handler.NewConversationHandler(conversationService, workspaceService)
	conversationFolderHandler := handler.NewConversationFolderHandler(conversationFolderService)
	conversationTemplateHandler := handler.NewConversationTemplateHandler(conversationTemplateService)

	// AI 助手处理器
	aiAssistantHandler := handler.NewAIAssistantHandler(aiAssistantService)

	// 对话聊天处理器（集成 AI 和对话管理）
	conversationChatHandler := handler.NewConversationChatHandler(conversationService, aiAssistantService)

	// 健康检查
	s.echo.GET("/health", systemHandler.HealthCheck)

	// Prometheus 指标端点
	s.echo.GET("/metrics", middleware.MetricsHandler())

	// WebSocket 处理器
	wsHandler := handler.NewWebSocketHandler(s.wsHub, &s.config.JWT)
	s.echo.GET("/ws", wsHandler.HandleConnection)

	// Runtime 公开访问入口（现在直接用 workspaceSlug）
	runtime := s.echo.Group("/runtime", middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))
	{
		runtime.POST("/:workspaceSlug", runtimeHandler.Execute)
		runtime.GET("/:workspaceSlug", runtimeHandler.GetEntry)
		runtime.GET("/:workspaceSlug/schema", runtimeHandler.GetSchema)
	}
	s.echo.GET("/", runtimeHandler.GetDomainEntry, middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))
	s.echo.GET("/schema", runtimeHandler.GetDomainSchema, middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))
	s.echo.POST("/", runtimeHandler.ExecuteDomain, middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))
	s.echo.GET("/:workspaceSlug", runtimeHandler.GetEntry, middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))

	// API v1
	v1 := s.echo.Group("/api/v1")

	// 认证路由 (无需认证)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout, middleware.Auth(&s.config.JWT))
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPassword)
		auth.POST("/verify-email", authHandler.VerifyEmail)
		auth.POST("/resend-verification", authHandler.ResendVerification, middleware.Auth(&s.config.JWT))
	}

	// 公开模板路由 (无需认证)
	publicTemplates := v1.Group("/templates")
	{
		publicTemplates.GET("", templateHandler.List)
		publicTemplates.GET("/featured", templateHandler.Featured)
		publicTemplates.GET("/categories", templateHandler.Categories)
		publicTemplates.GET("/:id", templateHandler.Get)
	}

	// 应用市场路由 (无需认证) - Workspace 现在就是 App
	marketplace := v1.Group("/marketplace")
	{
		marketplace.GET("/workspaces", workspaceHandler.ListPublicWorkspaces)
		marketplace.GET("/workspaces/:id", workspaceHandler.GetPublicWorkspace)
		marketplace.GET("/workspaces/:id/ratings", workspaceHandler.ListPublicRatings)
	}

	// 公开系统路由 (无需认证)
	system := v1.Group("/system")
	{
		system.GET("/health", systemHandler.GetHealth)
		system.GET("/features", systemHandler.GetFeatures)
		system.GET("/deployment", systemHandler.GetDeployment)
		system.GET("/error-codes", systemHandler.GetErrorCodes)
	}

	// 客户支持路由 (无需认证)
	support := v1.Group("/support")
	{
		support.GET("/channels", supportTicketHandler.ListChannels)
		support.GET("/sla", supportTicketHandler.GetSLA)
		support.POST("/tickets", supportTicketHandler.CreateTicket)
		support.GET("/tickets/:id", supportTicketHandler.GetTicket)
	}

	// 运维与发布辅助路由 (需要认证)
	ops := v1.Group("/ops")
	ops.Use(middleware.Auth(&s.config.JWT))
	ops.Use(middleware.RequireActiveUser(userRepo))
	{
		ops.POST("/alerts/test", opsHandler.TriggerAlertTest)
		ops.GET("/queues/dead", opsHandler.ListDeadTasks)
		ops.POST("/queues/dead/:taskId/retry", opsHandler.RetryDeadTask)
		ops.DELETE("/queues/dead/:taskId", opsHandler.DeleteDeadTask)
	}

	// 公开分享访问路由 (无需认证)
	v1.POST("/s/:code", shareHandler.GetByCode)

	// 公开对话分享访问路由 (无需认证)
	v1.GET("/shared/conversations/:token", conversationHandler.GetShared)
	v1.GET("/s/:code", shareHandler.GetByCode)

	// AI 创意助手模板路由 (公开，无需认证)
	creative := v1.Group("/creative")
	{
		creativeTemplates := creative.Group("/templates")
		{
			creativeTemplates.GET("", creativeTemplateHandler.List)
			creativeTemplates.GET("/featured", creativeTemplateHandler.Featured)
			creativeTemplates.GET("/categories", creativeTemplateHandler.Categories)
			creativeTemplates.GET("/:id", creativeTemplateHandler.Get)
			creativeTemplates.GET("/:id/example", creativeTemplateHandler.GetExample)
		}
	}

	// AI 创意助手公开分享路由 (无需认证)
	creative.GET("/share/:shareId", creativeDocumentHandler.GetByShare)

	// AI 创意助手任务路由 (需要认证)
	protectedCreative := v1.Group("/creative")
	protectedCreative.Use(middleware.Auth(&s.config.JWT))
	protectedCreative.Use(middleware.RequireActiveUser(userRepo))
	{
		// 生成任务管理
		protectedCreative.POST("/generate", creativeTaskHandler.Create)
		protectedCreative.GET("/generate", creativeTaskHandler.List)
		protectedCreative.GET("/generate/:taskId", creativeTaskHandler.GetStatus)
		protectedCreative.GET("/generate/:taskId/stream", creativeTaskHandler.Stream)
		protectedCreative.POST("/generate/:taskId/cancel", creativeTaskHandler.Cancel)

		// 文档管理
		protectedCreative.GET("/documents", creativeDocumentHandler.List)
		protectedCreative.GET("/documents/:id", creativeDocumentHandler.Get)
		protectedCreative.PATCH("/documents/:id", creativeDocumentHandler.Update)
		protectedCreative.DELETE("/documents/:id", creativeDocumentHandler.Delete)
		protectedCreative.POST("/documents/:id/archive", creativeDocumentHandler.Archive)
		protectedCreative.POST("/documents/:id/unarchive", creativeDocumentHandler.Unarchive)
		protectedCreative.GET("/documents/:id/export", creativeDocumentHandler.Export)
		protectedCreative.POST("/documents/:id/share", creativeDocumentHandler.CreateShare)
		protectedCreative.DELETE("/documents/:id/share", creativeDocumentHandler.DeleteShare)
		// 章节操作
		protectedCreative.POST("/documents/:id/regenerate", creativeDocumentHandler.RegenerateSection)
		protectedCreative.GET("/documents/:id/sections/:sectionId/versions", creativeDocumentHandler.GetSectionVersions)
	}

	// 公开公告路由 (无需认证查看，已读状态需认证)
	announcements := v1.Group("/announcements")
	{
		announcements.GET("", announcementHandler.List)
	}

	// 需要认证的路由
	protected := v1.Group("")
	protected.Use(middleware.Auth(&s.config.JWT))
	{
		// 用户
		users := protected.Group("/users")
		{
			users.GET("/me", userHandler.GetMe)
			users.PUT("/me", userHandler.UpdateMe)
			users.PUT("/me/password", userHandler.ChangePassword)
			users.GET("/me/api-keys", userHandler.ListAPIKeys)
			users.POST("/me/api-keys", userHandler.CreateAPIKey)
			users.DELETE("/me/api-keys/:id", userHandler.DeleteAPIKey)
			users.POST("/me/api-keys/:id/rotate", userHandler.RotateAPIKey)
			users.POST("/me/api-keys/:id/revoke", userHandler.RevokeAPIKey)
			users.POST("/me/api-keys/:id/test", userHandler.TestSavedAPIKey)
			users.POST("/me/api-keys/test", userHandler.TestAPIKey)
			// 活动历史
			users.GET("/me/activities", activityHandler.List)
			// 登录设备管理
			users.GET("/me/devices", sessionHandler.ListDevices)
			users.DELETE("/me/devices/others", sessionHandler.LogoutOtherDevices)
			users.DELETE("/me/devices/:id", sessionHandler.LogoutDevice)
			// 社交功能 - 当前用户
			users.GET("/me/followers", followHandler.GetMyFollowers)
			users.GET("/me/following", followHandler.GetMyFollowing)
			users.GET("/me/mutual", followHandler.GetMutualFollowers)
			users.GET("/me/feed", followHandler.GetFollowingActivity)
			// 社交功能 - 其他用户
			users.POST("/:id/follow", followHandler.Follow)
			users.DELETE("/:id/follow", followHandler.Unfollow)
			users.GET("/:id/followers", followHandler.GetFollowers)
			users.GET("/:id/following", followHandler.GetFollowing)
			users.GET("/:id/follow-stats", followHandler.GetFollowStats)
			users.GET("/:id/follow-status", followHandler.CheckFollowStatus)
		}

		// 工作空间
		workspaces := protected.Group("/workspaces", middleware.RequireFeature(featureFlagsService.IsWorkspaceEnabled, "WORKSPACE_DISABLED", "工作空间功能未开放"))
		{
			workspaces.GET("", workspaceHandler.List)
			workspaces.POST("", workspaceHandler.Create)
			workspaces.GET("/:id/export", workspaceHandler.ExportData)
			workspaces.POST("/:id/exports", workspaceHandler.RequestExport)
			workspaces.GET("/:id/exports/:exportId", workspaceHandler.GetExport)
			workspaces.GET("/:id/exports/:exportId/download", workspaceHandler.DownloadExport)
			workspaces.POST("/:id/log-archives", logArchiveHandler.Request)
			workspaces.GET("/:id/log-archives", logArchiveHandler.List)
			workspaces.GET("/:id/log-archives/:archiveId/download", logArchiveHandler.Download)
			workspaces.GET("/:id/log-archives/:archiveId/replay", logArchiveHandler.Replay)
			workspaces.GET("/:id/log-archives/:archiveId", logArchiveHandler.Get)
			workspaces.DELETE("/:id/log-archives/:archiveId", logArchiveHandler.Delete)
			workspaces.GET("/:id", workspaceHandler.Get)
			workspaces.GET("/:id/usage", metricsHandler.GetWorkspaceUsage)
			workspaces.GET("/:id/model-usage", modelUsageHandler.GetWorkspaceModelUsage)
			analytics := workspaces.Group("/:id/analytics")
			{
				analytics.GET("/spec", analyticsHandler.GetIngestionSpec)
				analytics.POST("/events", analyticsHandler.IngestEvents)
				analytics.GET("/events", analyticsHandler.ListEvents)
				analytics.POST("/metrics", analyticsHandler.IngestMetrics)
				analytics.GET("/metrics", analyticsHandler.ListMetrics)
				analytics.GET("/metrics/definitions", analyticsHandler.ListMetricDefinitions)
				analytics.POST("/metrics/definitions", analyticsHandler.UpsertMetricDefinition)
				analytics.POST("/exports", analyticsHandler.RequestExport)
				analytics.GET("/exports/:exportId", analyticsHandler.GetExport)
				analytics.GET("/exports/:exportId/download", analyticsHandler.DownloadExport)
				analytics.GET("/subscriptions", analyticsHandler.ListSubscriptions)
				analytics.POST("/subscriptions", analyticsHandler.CreateSubscription)
				analytics.PATCH("/subscriptions/:subscriptionId", analyticsHandler.UpdateSubscription)
				analytics.DELETE("/subscriptions/:subscriptionId", analyticsHandler.DeleteSubscription)
				analytics.POST("/subscriptions/:subscriptionId/trigger", analyticsHandler.TriggerSubscription)
			}
			workspaces.PATCH("/:id", workspaceHandler.Update)
			workspaces.DELETE("/:id", workspaceHandler.Delete)
			workspaces.POST("/:id/restore", workspaceHandler.Restore)
			workspaces.POST("/:id/database", workspaceDatabaseHandler.Provision)
			workspaces.GET("/:id/database", workspaceDatabaseHandler.Get)
			workspaces.POST("/:id/database/rotate-secret", workspaceDatabaseHandler.RotateSecret)
			workspaces.POST("/:id/database/migrate", workspaceDatabaseHandler.Migrate)
			workspaces.GET("/:id/database/migrations/plan", workspaceDatabaseHandler.PreviewMigrationPlan)
			workspaces.POST("/:id/database/migrations", workspaceDatabaseHandler.SubmitMigration)
			workspaces.GET("/:id/database/migrations/:migrationId", workspaceDatabaseHandler.GetMigration)
			workspaces.POST("/:id/database/migrations/:migrationId/approve", workspaceDatabaseHandler.ApproveMigration)
			workspaces.POST("/:id/database/migrations/:migrationId/reject", workspaceDatabaseHandler.RejectMigration)
			workspaces.POST("/:id/database/migrations/:migrationId/execute", workspaceDatabaseHandler.ExecuteMigration)
			workspaces.POST("/:id/database/backup", workspaceDatabaseHandler.Backup)
			workspaces.POST("/:id/database/restore", workspaceDatabaseHandler.Restore)
			workspaces.POST("/:id/database/roles", workspaceDatabaseHandler.CreateRole)
			workspaces.GET("/:id/database/roles", workspaceDatabaseHandler.ListRoles)
			workspaces.POST("/:id/database/roles/:roleId/rotate", workspaceDatabaseHandler.RotateRole)
			workspaces.POST("/:id/database/roles/:roleId/revoke", workspaceDatabaseHandler.RevokeRole)
			workspaces.GET("/:id/audit-logs", auditLogHandler.List)
			workspaces.POST("/:id/audit-logs/client", auditLogHandler.RecordClient)
			workspaces.GET("/:id/members", workspaceHandler.ListMembers)
			workspaces.POST("/:id/members", workspaceHandler.AddMember)
			workspaces.PATCH("/:id/members/:memberId", workspaceHandler.UpdateMemberRole)

			// App 功能路由（Workspace = App）
			workspaces.POST("/:id/publish", workspaceHandler.PublishWorkspace)
			workspaces.POST("/:id/rollback", workspaceHandler.RollbackWorkspace)
			workspaces.POST("/:id/deprecate", workspaceHandler.DeprecateWorkspace)
			workspaces.POST("/:id/archive", workspaceHandler.ArchiveWorkspace)
			workspaces.GET("/:id/versions", workspaceHandler.GetWorkspaceVersions)
			workspaces.POST("/:id/versions", workspaceHandler.CreateWorkspaceVersion)
			workspaces.GET("/:id/versions/compare", workspaceHandler.CompareWorkspaceVersions)
			workspaces.GET("/:id/access-policy", workspaceHandler.GetWorkspaceAccessPolicy)
			workspaces.PATCH("/:id/access-policy", workspaceHandler.UpdateWorkspaceAccessPolicy)
		}

		// 安全与合规
		securityComplianceHandler.RegisterRoutes(protected)
		supplyChainHandler.RegisterRoutes(protected)

		// 机密管理
		secrets := protected.Group("/secrets")
		{
			secrets.GET("", secretHandler.ListSecrets)
			secrets.POST("", secretHandler.CreateSecret)
			secrets.GET("/:id", secretHandler.GetSecret)
			secrets.POST("/:id/rotate", secretHandler.RotateSecret)
			secrets.POST("/:id/revoke", secretHandler.RevokeSecret)
		}

		// 配置中心
		configCenter := protected.Group("/config")
		{
			configCenter.GET("/items", configCenterHandler.ListConfigItems)
			configCenter.POST("/items", configCenterHandler.UpsertConfigItem)
			configCenter.GET("/items/:id", configCenterHandler.GetConfigItem)
			configCenter.DELETE("/items/:id", configCenterHandler.DisableConfigItem)
		}

		// Webhook 与第三方集成
		webhooks := protected.Group("/webhooks")
		{
			webhooks.GET("/events", webhookHandler.ListEvents)
			webhooks.GET("", webhookHandler.List)
			webhooks.POST("", webhookHandler.Create)
			webhooks.PATCH("/:id", webhookHandler.Update)
			webhooks.DELETE("/:id", webhookHandler.Delete)
			webhooks.POST("/:id/rotate", webhookHandler.RotateSecret)
			webhooks.POST("/:id/test", webhookHandler.Test)
			webhooks.GET("/:id/deliveries", webhookHandler.ListDeliveries)
			webhooks.POST("/:id/deliveries/:deliveryId/retry", webhookHandler.RetryDelivery)
		}
		integrations := protected.Group("/integrations")
		{
			integrations.GET("/catalog", webhookHandler.ListIntegrations)
		}
		connectors := protected.Group("/connectors")
		{
			connectors.GET("/catalog", connectorHandler.ListDataSourceCatalog)
			connectors.GET("/credentials", connectorHandler.ListConnectorCredentials)
			connectors.POST("/credentials", connectorHandler.CreateConnectorCredential)
			connectors.POST("/credentials/:id/rotate", connectorHandler.RotateConnectorCredential)
			connectors.POST("/credentials/:id/revoke", connectorHandler.RevokeConnectorCredential)
		}

		// 规划与 WBS
		plans := protected.Group("/plans")
		{
			plans.GET("/wbs/:module", planWBSHandler.GetModuleWBS)
			plans.GET("/modules", planModuleHandler.ListModules)
			plans.POST("/modules", planModuleHandler.CreateModule)
			plans.POST("/modules/seed", planModuleHandler.SeedModules)
			plans.PATCH("/modules/:id", planModuleHandler.UpdateModule)
			plans.DELETE("/modules/:id", planModuleHandler.DeleteModule)
			plans.POST("/modules/:id/tasks", planModuleHandler.CreateTask)
			plans.POST("/modules/:id/tasks/reorder", planModuleHandler.ReorderTasks)
			plans.PATCH("/tasks/:id", planModuleHandler.UpdateTask)
			plans.DELETE("/tasks/:id", planModuleHandler.DeleteTask)
			plans.GET("/versions", planVersionHandler.ListVersions)
			plans.POST("/versions", planVersionHandler.CreateVersion)
			plans.GET("/versions/:id", planVersionHandler.GetVersion)
			plans.POST("/versions/:id/restore", planVersionHandler.RestoreVersion)
			plans.GET("/migrations/checklist", planMigrationChecklistHandler.GetChecklist)
			plans.GET("/migrations/legacy", planLegacyMigrationHandler.GetPlan)
			plans.GET("/responsive", planResponsiveExperienceHandler.GetPlan)
			plans.GET("/a11y", planAccessibilityHandler.GetPlan)
			plans.GET("/i18n", planI18nHandler.GetPlan)
			plans.GET("/identity-accounts", planIdentityAccountHandler.GetPlan)
			plans.GET("/feature-flags", planFeatureFlagsHandler.GetPolicy)
			plans.GET("/queue-system", planQueueSystemHandler.GetPlan)
			plans.GET("/capacity-cost", planCapacityCostHandler.GetPlan)
			plans.GET("/marketplace-billing", planMarketplaceBillingHandler.GetPlan)
			plans.GET("/dr", planDisasterRecoveryHandler.GetPlan)
			plans.GET("/logs/schema", planLogSchemaHandler.GetSchema)
			plans.GET("/retention", planRetentionPolicyHandler.GetPolicy)
			plans.GET("/data-governance", planDataGovernancePolicyHandler.GetPolicy)
			plans.GET("/compliance", planComplianceAssessmentHandler.GetPlan)
			plans.GET("/data-residency", planDataResidencyPolicyHandler.GetPolicy)
			plans.GET("/audit-compliance", planAuditCompliancePolicyHandler.GetPolicy)
			plans.GET("/slo", planSLOHandler.GetSLOTable)
			plans.GET("/sre/error-budgets", planSREHandler.GetErrorBudgetPolicy)
			plans.GET("/sre/synthetic-monitoring", planSREHandler.GetSyntheticMonitoringPlan)
			plans.GET("/sre/oncall-slo", planSREHandler.GetOnCallSLOTable)
			plans.GET("/sre/stability-plan", planSREHandler.GetStabilityPlan)
			plans.GET("/runbook", planRunbookHandler.GetPlan)
			plans.GET("/runtime-statuses", planRuntimeStatusHandler.GetStatusTable)
			plans.GET("/runtime-error-mapping", planRuntimeErrorMappingHandler.GetErrorMappingTable)
			plans.GET("/runtime-retry-policy", planRuntimeRetryPolicyHandler.GetRetryPolicy)
			plans.GET("/api-examples", planAPIExamplesHandler.GetExamples)
			plans.GET("/openapi-sdk", planOpenAPISDKHandler.GetPlan)
			plans.GET("/incident-drills", planIncidentResponseHandler.GetIncidentDrillPlans)
			plans.GET("/incident-owners", planIncidentResponseHandler.GetIncidentOwnerTable)
			plans.GET("/postmortem-template", planIncidentResponseHandler.GetPostmortemTemplate)
			plans.GET("/postmortem-process", planIncidentResponseHandler.GetPostmortemProcess)
			plans.GET("/root-cause-taxonomy", planIncidentResponseHandler.GetRootCauseTaxonomy)
			plans.GET("/knowledge-base-guide", planIncidentResponseHandler.GetKnowledgeBaseGuide)
			plans.GET("/chaos-scenarios", planChaosEngineeringHandler.GetChaosScenarioCatalog)
			plans.GET("/chaos-automation", planChaosEngineeringHandler.GetChaosAutomationPlan)
			plans.GET("/chaos-evaluation-template", planChaosEngineeringHandler.GetChaosEvaluationTemplate)
			plans.GET("/metrics-dictionary", planObservabilityHandler.GetMetricsDictionary)
			plans.GET("/tracking-events/frontend", planObservabilityHandler.GetFrontendTrackingPlan)
			plans.GET("/tracking-events/backend", planObservabilityHandler.GetBackendTrackingPlan)
			plans.GET("/growth-experiments", planGrowthExperimentHandler.GetPlan)
			plans.GET("/security-threat-model", planSecurityReviewHandler.GetThreatModel)
			plans.GET("/security-risk-matrix", planSecurityReviewHandler.GetRiskMatrix)
			plans.GET("/security-review", planSecurityReviewHandler.GetReviewProcess)
			plans.GET("/security-testing/pentest", planSecurityTestingHandler.GetPenTestPlan)
			plans.GET("/security-testing/scanning", planSecurityTestingHandler.GetVulnerabilityScanProcess)
			plans.GET("/security-testing/reporting", planSecurityTestingHandler.GetBugBountyProgram)
			plans.GET("/security-testing/response", planSecurityTestingHandler.GetVulnerabilityResponseProcess)
			plans.GET("/wbs/modules", planModuleWBSHandler.GetBreakdown)
			plans.GET("/dependencies", planDependencyMilestoneHandler.GetPlan)
			plans.GET("/raci", planRACIHandler.GetPlan)
			plans.GET("/api-field-specs", planAPIFieldSpecsHandler.GetTable)
			plans.GET("/api-field-rules", planAPIFieldRulesHandler.GetRules)
			plans.GET("/ui-schema-templates", planUISchemaTemplatesHandler.GetLibrary)
			plans.GET("/ai-templates", planAITemplateHandler.GetLibrary)
			plans.GET("/runtime-security", planRuntimeSecurityHandler.GetPolicy)
			plans.GET("/sql-schema", planSQLSchemaHandler.GetSQLDraft)
		}

		// 计费与配额
		billing := protected.Group("/billing")
		{
			billing.GET("/dimensions", billingHandler.ListDimensions)
			billing.GET("/plans", billingHandler.ListPlans)
			billing.GET("/workspaces/:id/quota", billingHandler.GetWorkspaceQuota)
			billing.GET("/workspaces/:id/budget", billingHandler.GetBudgetSettings)
			billing.PATCH("/workspaces/:id/budget", billingHandler.UpdateBudgetSettings)
			billing.GET("/workspaces/:id/invoice-settings", billingHandler.GetInvoiceSettings)
			billing.PATCH("/workspaces/:id/invoice-settings", billingHandler.UpdateInvoiceSettings)
			billing.GET("/workspaces/:id/invoices", billingHandler.ListInvoices)
			billing.GET("/workspaces/:id/invoices/:invoiceId", billingHandler.GetInvoiceDetail)
			billing.GET("/workspaces/:id/invoices/:invoiceId/download", billingHandler.DownloadInvoice)
			billing.POST("/workspaces/:id/invoices/:invoiceId/payment", billingHandler.SyncInvoicePayment)
			billing.POST("/workspaces/:id/consume", billingHandler.ConsumeUsage)
			billing.GET("/workspaces/:id/usage", billingHandler.GetWorkspaceUsageStats)
		}

		// 工作流
		workflows := protected.Group("/workflows")
		{
			workflows.GET("", workflowHandler.List)
			workflows.POST("", workflowHandler.Create)
			workflows.GET("/:id", workflowHandler.Get)
			workflows.PUT("/:id", workflowHandler.Update)
			workflows.DELETE("/:id", workflowHandler.Delete)
			workflows.POST("/:id/execute", workflowHandler.Execute)
			workflows.POST("/:id/duplicate", workflowHandler.Duplicate)
			// 导出导入
			workflows.GET("/:id/export", workflowHandler.Export)
			workflows.POST("/import", workflowHandler.Import)
			// 移动工作流到文件夹
			workflows.PUT("/:id/folder", folderHandler.MoveWorkflow)
			// 批量操作
			workflows.POST("/batch/delete", workflowHandler.BatchDelete)
			workflows.POST("/batch/move", folderHandler.BatchMoveWorkflows)
			workflows.POST("/batch/archive", workflowHandler.BatchArchive)
			workflows.POST("/batch/export", workflowHandler.BatchExport)
			// 版本历史
			workflows.GET("/:id/versions", versionHandler.List)
			workflows.GET("/:id/versions/:version", versionHandler.Get)
			workflows.POST("/:id/versions/:version/restore", versionHandler.Restore)
			workflows.GET("/:id/versions/compare", versionHandler.Compare)
			workflows.POST("/:id/versions", versionHandler.CreateSnapshot)
		}

		// 文件夹
		folders := protected.Group("/folders")
		{
			folders.GET("", folderHandler.List)
			folders.POST("", folderHandler.Create)
			folders.GET("/:id", folderHandler.Get)
			folders.PUT("/:id", folderHandler.Update)
			folders.DELETE("/:id", folderHandler.Delete)
		}

		// 模板（使用模板需要认证）
		templates := protected.Group("/templates")
		{
			templates.POST("/:id/use", templateHandler.Use)
			// 管理员接口
			templates.POST("", templateHandler.Create)
			templates.PUT("/:id", templateHandler.Update)
			templates.DELETE("/:id", templateHandler.Delete)
		}

		// 执行记录
		executions := protected.Group("/executions")
		{
			executions.GET("", executionHandler.List)
			executions.GET("/:id", executionHandler.Get)
			executions.POST("/:id/cancel", executionHandler.Cancel)
			executions.POST("/:id/retry", executionHandler.Retry)
		}

		// Agent 商店
		agents := protected.Group("/agents")
		{
			agents.GET("", agentHandler.List)
			agents.GET("/featured", agentHandler.Featured)
			agents.GET("/trending", agentHandler.Trending)
			agents.GET("/categories", agentHandler.Categories)
			agents.GET("/by-tags", agentHandler.ListByTags)
			agents.GET("/:slug", agentHandler.Get)
			agents.POST("", agentHandler.Publish)
			agents.PUT("/:id", agentHandler.Update)
			agents.POST("/:id/use", agentHandler.Use)
			agents.POST("/:id/fork", agentHandler.Fork)
			agents.POST("/:id/star", agentHandler.Star)
			agents.DELETE("/:id/star", agentHandler.Unstar)
			agents.POST("/:id/report", agentHandler.Report)
			agents.GET("/:id/analytics", agentHandler.Analytics)
			agents.POST("/:id/submit", agentHandler.SubmitForReview)
		}

		// 域名路由（现在直接挂在 workspace 下，通过 workspaceDomainHandler 处理）
		domainRoutes := protected.Group("/domains", middleware.RequireFeature(featureFlagsService.IsDomainEnabled, "DOMAIN_DISABLED", "域名功能未开放"))
		{
			domainRoutes.POST("/:domainId/verify", workspaceHandler.VerifyDomainByID)
		}

		// 统计
		stats := protected.Group("/stats")
		{
			stats.GET("/overview", statsHandler.Overview)
			stats.GET("/executions", statsHandler.ExecutionTrends)
			stats.GET("/workflows/:id", statsHandler.WorkflowStats)
			stats.GET("/workflow-analytics", statsHandler.WorkflowAnalytics)
		}

		// Dashboard
		dashboard := protected.Group("/dashboard")
		{
			dashboard.GET("", dashboardHandler.GetDashboardData)
			dashboard.GET("/stats", dashboardHandler.GetQuickStats)
			dashboard.GET("/workflows", dashboardHandler.GetRecentWorkflows)
			dashboard.GET("/activities", dashboardHandler.GetRecentActivities)
			dashboard.GET("/executions", dashboardHandler.GetRecentExecutions)
			dashboard.GET("/level", dashboardHandler.GetUserLevel)
			dashboard.GET("/tokens", dashboardHandler.GetTokenUsage)
			dashboard.GET("/templates", dashboardHandler.GetFeaturedTemplates)
			dashboard.GET("/learning", dashboardHandler.GetLearningResources)
			dashboard.GET("/announcements", dashboardHandler.GetAnnouncements)
			dashboard.GET("/daily-tasks", dashboardHandler.GetDailyTasks)
			dashboard.POST("/check-in", dashboardHandler.CheckIn)
			dashboard.GET("/favorites", dashboardHandler.GetFavorites)
			dashboard.GET("/quick-runs", dashboardHandler.GetQuickRuns)
			dashboard.GET("/performance", dashboardHandler.GetPerformanceInsights)
			dashboard.GET("/errors", dashboardHandler.GetErrorMonitor)
			dashboard.GET("/api-usage", dashboardHandler.GetAPIUsageStats)
			dashboard.GET("/notes", dashboardHandler.GetQuickNotes)
			dashboard.POST("/notes", dashboardHandler.CreateQuickNote)
			dashboard.DELETE("/notes/:id", dashboardHandler.DeleteQuickNote)
			dashboard.GET("/integrations", dashboardHandler.GetIntegrationStatus)
			dashboard.GET("/scheduled-tasks", dashboardHandler.GetScheduledTasks)
			dashboard.GET("/notifications", dashboardHandler.GetNotifications)
			dashboard.POST("/notifications/:id/read", dashboardHandler.MarkNotificationRead)
			dashboard.GET("/ai-suggestions", dashboardHandler.GetAISuggestions)
			dashboard.GET("/leaderboard", dashboardHandler.GetLeaderboard)
			dashboard.GET("/goals", dashboardHandler.GetGoals)
			dashboard.POST("/goals", dashboardHandler.CreateGoal)
			dashboard.GET("/system-health", dashboardHandler.GetSystemHealth)
			dashboard.GET("/running-queue", dashboardHandler.GetRunningQueue)
		}

		// 标签
		tags := protected.Group("/tags")
		{
			tags.GET("", tagHandler.List)
			tags.POST("", tagHandler.Create)
			tags.PUT("/:id", tagHandler.Update)
			tags.DELETE("/:id", tagHandler.Delete)
		}

		// 工作流标签（在工作流路由组之外）
		protected.POST("/workflows/:workflow_id/tags/:tag_id", tagHandler.AddToWorkflow)
		protected.DELETE("/workflows/:workflow_id/tags/:tag_id", tagHandler.RemoveFromWorkflow)

		// 公告（需认证的操作）
		protectedAnnouncements := protected.Group("/announcements")
		{
			protectedAnnouncements.POST("", announcementHandler.Create)
			protectedAnnouncements.POST("/:id/read", announcementHandler.MarkAsRead)
		}

		// 评价
		reviews := protected.Group("/reviews")
		{
			reviews.POST("", reviewHandler.Create)
			reviews.GET("/:id", reviewHandler.Get)
			reviews.PUT("/:id", reviewHandler.Update)
			reviews.DELETE("/:id", reviewHandler.Delete)
			reviews.POST("/:id/helpful", reviewHandler.MarkHelpful)
		}

		// 应用市场评分（现在直接对 workspace 评分）
		protectedMarketplace := protected.Group("/marketplace")
		{
			protectedMarketplace.POST("/workspaces/:id/ratings", workspaceHandler.SubmitRating)
		}

		// Agent 评价列表（无需认证也可访问）
		agents.GET("/:agent_id/reviews", reviewHandler.List)
		agents.GET("/:agent_id/reviews/me", reviewHandler.GetMyReview)

		// 评论系统
		comments := protected.Group("/comments")
		{
			comments.POST("", commentHandler.Create)
			comments.GET("", commentHandler.ListByTarget)
			comments.GET("/:id", commentHandler.Get)
			comments.PUT("/:id", commentHandler.Update)
			comments.DELETE("/:id", commentHandler.Delete)
			comments.GET("/:id/replies", commentHandler.ListReplies)
			comments.POST("/:id/like", commentHandler.Like)
			comments.DELETE("/:id/like", commentHandler.Unlike)
			comments.POST("/:id/pin", commentHandler.Pin)
			comments.DELETE("/:id/pin", commentHandler.Unpin)
		}

		// 用户评论
		users.GET("/me/comments", commentHandler.GetMyComments)

		// 通知系统
		notifications := protected.Group("/notifications")
		{
			notifications.GET("", notificationHandler.List)
			notifications.GET("/:id", notificationHandler.GetByID)
			notifications.POST("/:id/read", notificationHandler.MarkAsRead)
			notifications.POST("/read-all", notificationHandler.MarkAllAsRead)
			notifications.POST("/read-multiple", notificationHandler.MarkMultipleAsRead)
			notifications.DELETE("/:id", notificationHandler.Delete)
			notifications.DELETE("/clear", notificationHandler.ClearAll)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
		}

		// 分享功能
		shares := protected.Group("/shares")
		{
			shares.POST("", shareHandler.Create)
			shares.GET("", shareHandler.List)
			shares.GET("/:id", shareHandler.Get)
			shares.PUT("/:id", shareHandler.Update)
			shares.DELETE("/:id", shareHandler.Delete)
			shares.GET("/:id/link", shareHandler.GenerateLink)
			shares.GET("/:id/qrcode", shareHandler.GenerateQRCode)
			shares.POST("/:id/embed", shareHandler.GenerateEmbed)
			shares.GET("/:id/social", shareHandler.GenerateSocial)
			shares.GET("/:id/stats", shareHandler.GetStats)
		}

		// 收入/创作者经济
		earnings := protected.Group("/earnings")
		{
			earnings.GET("", earningHandler.ListEarnings)
			earnings.GET("/commission-tiers", earningHandler.GetCommissionTiers)
			earnings.POST("/calculate-commission", earningHandler.CalculateCommission)
			earnings.GET("/account", earningHandler.GetCreatorAccount)
			earnings.PUT("/account/payment", earningHandler.UpdatePaymentInfo)
			earnings.GET("/dashboard", earningHandler.GetCreatorDashboard)
			earnings.GET("/withdrawals", earningHandler.ListWithdrawals)
			earnings.POST("/withdrawals", earningHandler.RequestWithdrawal)
			earnings.GET("/:id", earningHandler.GetEarning)
		}

		// 对话管理
		conversations := protected.Group("/conversations")
		{
			conversations.GET("", conversationHandler.List)
			conversations.GET("/statistics", conversationHandler.GetStatistics) // 统计路由需要在 :id 之前
			conversations.POST("/import", conversationHandler.Import)           // 导入路由需要在 :id 之前
			conversations.POST("", conversationHandler.Create)
			conversations.GET("/:id", conversationHandler.Get)
			conversations.PUT("/:id", conversationHandler.Update)
			conversations.DELETE("/:id", conversationHandler.Delete)
			conversations.POST("/:id/duplicate", conversationHandler.Duplicate)
			// 状态操作
			conversations.PUT("/:id/starred", conversationHandler.SetStarred)
			conversations.PUT("/:id/pinned", conversationHandler.SetPinned)
			conversations.PUT("/:id/archived", conversationHandler.SetArchived)
			conversations.PUT("/:id/tags", conversationHandler.SetTags)
			// 批量操作
			conversations.POST("/batch/star", conversationHandler.BatchStar)
			conversations.POST("/batch/archive", conversationHandler.BatchArchive)
			conversations.POST("/batch/delete", conversationHandler.BatchDelete)
			conversations.POST("/batch/move", conversationHandler.BatchMove)
			// 消息
			conversations.GET("/:id/messages", conversationHandler.ListMessages)
			conversations.POST("/:id/messages", conversationHandler.AddMessage)
			conversations.PUT("/:id/messages/:messageId", conversationHandler.UpdateMessage)
			conversations.PUT("/:id/messages/:messageId/feedback", conversationHandler.UpdateMessageFeedback)
			conversations.DELETE("/:id/messages/:messageId", conversationHandler.DeleteMessage)
			// AI 聊天（集成消息保存）
			conversations.POST("/:id/chat", conversationChatHandler.Chat)
			conversations.POST("/:id/chat/stream", conversationChatHandler.StreamChat)
			// 导出和分享
			conversations.GET("/:id/export", conversationHandler.Export)
			conversations.POST("/:id/share", conversationHandler.Share)
		}

		// 对话文件夹
		conversationFolders := protected.Group("/conversation-folders")
		{
			conversationFolders.GET("", conversationFolderHandler.List)
			conversationFolders.POST("", conversationFolderHandler.Create)
			conversationFolders.GET("/:id", conversationFolderHandler.Get)
			conversationFolders.PUT("/:id", conversationFolderHandler.Update)
			conversationFolders.DELETE("/:id", conversationFolderHandler.Delete)
		}

		// 对话模板
		conversationTemplates := protected.Group("/conversation-templates")
		{
			conversationTemplates.GET("", conversationTemplateHandler.List)
			conversationTemplates.POST("", conversationTemplateHandler.Create)
			conversationTemplates.GET("/:id", conversationTemplateHandler.Get)
			conversationTemplates.PUT("/:id", conversationTemplateHandler.Update)
			conversationTemplates.DELETE("/:id", conversationTemplateHandler.Delete)
			conversationTemplates.POST("/:id/use", conversationTemplateHandler.Use)
		}

		// AI 助手
		ai := protected.Group("/ai")
		{
			ai.POST("/chat", aiAssistantHandler.Chat)
			ai.POST("/generate-workflow", aiAssistantHandler.GenerateWorkflow)
			ai.POST("/parse-intent", aiAssistantHandler.ParseIntent)
			ai.POST("/suggest-next-node", aiAssistantHandler.SuggestNextNode)
			ai.POST("/suggest-config", aiAssistantHandler.SuggestConfig)
			ai.POST("/suggest-fix", aiAssistantHandler.SuggestFix)
		}
	}

}

// Start 启动服务器
func (s *Server) Start(addr string) error {
	return s.echo.Start(addr)
}

// Shutdown 关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	if s.taskQueue != nil {
		_ = s.taskQueue.Close()
	}
	return s.echo.Shutdown(ctx)
}
