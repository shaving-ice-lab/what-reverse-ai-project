package api

import (
	"context"
	"fmt"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/reverseai/server/internal/api/handler"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/config"
	"github.com/reverseai/server/internal/pkg/logger"
	"github.com/reverseai/server/internal/pkg/queue"
	"github.com/reverseai/server/internal/pkg/redis"
	"github.com/reverseai/server/internal/pkg/websocket"
	"github.com/reverseai/server/internal/repository"
	"github.com/reverseai/server/internal/service"
	"github.com/reverseai/server/internal/service/agent_tools"
	"github.com/reverseai/server/internal/service/skills"
	"github.com/reverseai/server/internal/vmruntime"
	"gorm.io/gorm"
)

// Server API 服务器
type Server struct {
	echo      *echo.Echo
	config    *config.Config
	db        *gorm.DB
	redis     *redis.Client
	log       logger.Logger
	wsHub     *websocket.Hub
	taskQueue *queue.Queue
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
		echo:      e,
		config:    cfg,
		db:        db,
		redis:     rdb,
		log:       log,
		wsHub:     wsHub,
		taskQueue: taskQueue,
	}

	server.setupMiddleware()
	server.setupRoutes()

	return server
}

// GetWebSocketHub 获取 WebSocket Hub
func (s *Server) GetWebSocketHub() *websocket.Hub {
	return s.wsHub
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
	// s.echo.Use(middleware.Tracing("reverseai-server"))

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
	runtimeEventRepo := repository.NewRuntimeEventRepository(s.db)
	auditLogRepo := repository.NewAuditLogRepository(s.db)
	apiKeyRepo := repository.NewAPIKeyRepository(s.db)
	activityRepo := repository.NewActivityRepository(s.db)
	sessionRepo := repository.NewSessionRepository(s.db)
	notificationRepo := repository.NewNotificationRepository(s.db)

	// 初始化服务层
	eventRecorder := service.NewEventRecorderService(runtimeEventRepo, s.log, nil, s.config.Security.PIISanitizationEnabled)
	workspaceService := service.NewWorkspaceService(
		s.db,
		workspaceRepo,
		workspaceSlugAliasRepo,
		userRepo,
		workspaceRoleRepo,
		workspaceMemberRepo,
		eventRecorder,
		s.config.Retention,
	)
	auditLogService := service.NewAuditLogService(auditLogRepo, workspaceService, s.config.Security.PIISanitizationEnabled)
	authService := service.NewAuthService(userRepo, workspaceService, s.redis, &s.config.JWT, s.config.Security.AdminEmails)
	userService := service.NewUserService(userRepo)
	apiKeyService, err := service.NewAPIKeyService(apiKeyRepo, workspaceService, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize API key service", "error", err)
		apiKeyService, _ = service.NewAPIKeyService(apiKeyRepo, workspaceService, "change-this-to-a-32-byte-secret!")
	}
	// VM Runtime 初始化（SQLite store for workspace databases）
	vmStore := vmruntime.NewVMStore(s.config.VMRuntime.BaseDir)
	vmCodeLoader := vmruntime.NewGORMCodeLoader(s.db)
	vmPool := vmruntime.NewVMPool(vmStore, vmCodeLoader, s.config.VMRuntime.MaxVMs)

	// 初始化 Dashboard 服务
	dashboardService := service.NewDashboardService(activityRepo)

	// 初始化基础服务
	activityService := service.NewActivityService(activityRepo)
	sessionService := service.NewSessionService(sessionRepo)
	systemService := service.NewSystemService(s.db, s.redis)
	featureFlagsService := service.NewFeatureFlagsService(s.config.Features)
	notificationService := service.NewNotificationService(notificationRepo, userRepo)

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

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService, apiKeyService)
	workspaceHandler := handler.NewWorkspaceHandler(workspaceService, auditLogService)
	vmDatabaseHandler := handler.NewVMDatabaseHandler(vmStore, auditLogService, workspaceService)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService, workspaceService)
	runtimeHandler := handler.NewRuntimeHandler(
		runtimeService,
		auditLogService,
		&s.config.JWT,
		captchaVerifier,
		s.config.Server.BaseURL,
		s.config.Deployment.RegionBaseURLs,
		s.config.Cache.Runtime.SchemaTTL,
		s.config.Cache.Runtime.SchemaStaleTTL,
	)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	activityHandler := handler.NewActivityHandler(activityService)
	sessionHandler := handler.NewSessionHandler(sessionService)
	systemHandler := handler.NewSystemHandler(systemService, featureFlagsService, &s.config.Deployment)
	notificationHandler := handler.NewNotificationHandler(notificationService)

	// Skills 系统初始化
	skillRegistry := service.NewSkillRegistry()
	_ = skillRegistry.Register(skills.NewDataModelingSkill(vmStore))
	_ = skillRegistry.Register(skills.NewUIGenerationSkill())
	_ = skillRegistry.Register(skills.NewBusinessLogicSkill(vmStore))
	_ = skillRegistry.Register(skills.NewVMRuntimeSkill(workspaceService, vmPool, vmStore))

	// Persona 系统初始化
	personaRegistry := service.NewPersonaRegistry()
	service.RegisterBuiltinPersonas(personaRegistry)

	// Agent 推理引擎初始化
	agentToolRegistry := service.NewAgentToolRegistry()
	// 通过 Skills 加载工具（替代逐个注册）
	skillRegistry.LoadToolsIntoRegistry(agentToolRegistry)
	// 额外注册不属于 Skill 的独立工具（跳过已存在的）
	_ = agentToolRegistry.Register(agent_tools.NewGetUISchemaTool(workspaceService))
	_ = agentToolRegistry.Register(agent_tools.NewGenerateUISchemaTool(workspaceService))
	_ = agentToolRegistry.Register(agent_tools.NewModifyUISchemaTool(workspaceService))
	_ = agentToolRegistry.Register(agent_tools.NewPublishAppTool(workspaceService))
	_ = agentToolRegistry.Register(agent_tools.NewCreatePersonaTool(personaRegistry))
	_ = agentToolRegistry.Register(agent_tools.NewGetBlockSpecTool())
	_ = agentToolRegistry.Register(agent_tools.NewAttemptCompletionTool(workspaceService, vmStore))
	_ = agentToolRegistry.Register(agent_tools.NewListComponentsTool(workspaceService))
	_ = agentToolRegistry.Register(agent_tools.NewBatchTool(agentToolRegistry))
	agentSessionManager := service.NewAgentSessionManager()
	agentSessionRepo := repository.NewAgentSessionRepository(s.db)
	agentSessionManager.SetPersister(service.NewAgentSessionPersisterAdapter(agentSessionRepo))
	_ = agentToolRegistry.Register(agent_tools.NewCreatePlanTool(agentSessionManager))
	_ = agentToolRegistry.Register(agent_tools.NewUpdatePlanTool(agentSessionManager))
	agentEngineCfg := service.DefaultAgentEngineConfig()
	agentEngineCfg.LLMAPIKey = s.config.AI.OpenAIAPIKey
	agentEngineCfg.LLMBaseURL = s.config.AI.OpenAIBaseURL
	agentEngineCfg.LLMModel = s.config.AI.DefaultModel
	agentEngineInstance := service.NewAgentEngineWithSkills(agentToolRegistry, agentSessionManager, agentEngineCfg, skillRegistry.BuildSystemPrompt(), personaRegistry, skillRegistry)
	// Task tool registered after engine creation (needs engine reference for sub-agent sessions)
	_ = agentToolRegistry.Register(agent_tools.NewTaskTool(agentEngineInstance, agentSessionManager, personaRegistry))
	agentChatHandler := handler.NewAgentChatHandler(agentEngineInstance, agentSessionManager, workspaceService, personaRegistry, skillRegistry)

	// 健康检查
	s.echo.GET("/health", systemHandler.HealthCheck)

	// Prometheus 指标端点
	s.echo.GET("/metrics", middleware.MetricsHandler())

	// WebSocket 处理器
	wsHandler := handler.NewWebSocketHandler(s.wsHub, &s.config.JWT)
	s.echo.GET("/ws", wsHandler.HandleConnection)

	// 文件存储服务
	storageObjectRepo := repository.NewStorageObjectRepository(s.db)
	workspaceStorageService := service.NewWorkspaceStorageService(storageObjectRepo, "data/storage", "/storage/files")
	workspaceStorageHandler := handler.NewWorkspaceStorageHandler(workspaceStorageService, workspaceService)
	runtimeStorageHandler := handler.NewRuntimeStorageHandler(workspaceStorageService, runtimeService)
	// 公开静态文件访问（无需鉴权）
	s.echo.GET("/storage/files/:objectId", workspaceStorageHandler.ServeFile)

	// RLS 策略服务
	rlsPolicyRepo := repository.NewRLSPolicyRepository(s.db)
	workspaceRLSService := service.NewWorkspaceRLSService(rlsPolicyRepo)
	workspaceRLSHandler := handler.NewWorkspaceRLSHandler(workspaceRLSService, workspaceService)

	// 应用运行时认证服务
	appUserRepo := repository.NewAppUserRepository(s.db)
	runtimeAuthService := service.NewRuntimeAuthServiceWithDB(appUserRepo, workspaceRepo, sessionRepo, s.db)
	runtimeAuthHandler := handler.NewRuntimeAuthHandler(runtimeAuthService, runtimeService)
	runtimeAuthHandler.SetWorkspaceService(workspaceService)
	runtimeDataHandler := handler.NewRuntimeDataHandler(runtimeService, vmStore, workspaceRLSService)
	runtimeDataHandler.SetRuntimeAuthService(runtimeAuthService)
	runtimeDataHandler.SetVMPool(vmPool)
	runtimeVMHandler := handler.NewRuntimeVMHandler(runtimeService, vmPool, runtimeAuthService)

	// Runtime 公开访问入口（现在直接用 workspaceSlug）
	runtime := s.echo.Group("/runtime", middleware.RequireFeature(featureFlagsService.IsWorkspaceRuntimeEnabled, "WORKSPACE_RUNTIME_DISABLED", "Workspace Runtime 暂未开放"))
	{
		runtime.POST("/:workspaceSlug", runtimeHandler.Execute)
		runtime.GET("/:workspaceSlug", runtimeHandler.GetEntry)
		runtime.GET("/:workspaceSlug/schema", runtimeHandler.GetSchema)
		runtime.POST("/:workspaceSlug/auth/register", runtimeAuthHandler.Register)
		runtime.POST("/:workspaceSlug/auth/login", runtimeAuthHandler.Login)
		runtime.POST("/:workspaceSlug/auth/logout", runtimeAuthHandler.Logout)
		runtime.GET("/:workspaceSlug/auth/me", runtimeAuthHandler.Me)
		// Runtime Data API — 公开访问已发布 App 的数据库
		runtime.GET("/:workspaceSlug/data/:table", runtimeDataHandler.QueryRows)
		runtime.POST("/:workspaceSlug/data/:table", runtimeDataHandler.InsertRow)
		runtime.PATCH("/:workspaceSlug/data/:table", runtimeDataHandler.UpdateRow)
		runtime.DELETE("/:workspaceSlug/data/:table", runtimeDataHandler.DeleteRows)
		// Runtime Storage — 文件上传和访问
		runtime.POST("/:workspaceSlug/storage/upload", runtimeStorageHandler.Upload)
		runtime.GET("/:workspaceSlug/storage/files/:objectId", runtimeStorageHandler.ServeFilePublic)
		// VM API — JS VM 路由
		runtime.Any("/:workspaceSlug/api/*", runtimeVMHandler.HandleAPI)
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
		}

		// 工作空间
		workspaces := protected.Group("/workspaces", middleware.RequireFeature(featureFlagsService.IsWorkspaceEnabled, "WORKSPACE_DISABLED", "工作空间功能未开放"))
		{
			workspaces.GET("", workspaceHandler.List)
			workspaces.POST("", workspaceHandler.Create)
			workspaces.GET("/:id", workspaceHandler.Get)
			workspaces.PATCH("/:id", workspaceHandler.Update)
			workspaces.DELETE("/:id", workspaceHandler.Delete)
			workspaces.POST("/:id/restore", workspaceHandler.Restore)
			// Database（SQLite via VMStore）
			workspaces.GET("/:id/database/tables", vmDatabaseHandler.ListTables)
			workspaces.GET("/:id/database/tables/:table/schema", vmDatabaseHandler.GetTableSchema)
			workspaces.POST("/:id/database/tables", vmDatabaseHandler.CreateTable)
			workspaces.PATCH("/:id/database/tables/:table", vmDatabaseHandler.AlterTable)
			workspaces.DELETE("/:id/database/tables/:table", vmDatabaseHandler.DropTable)
			workspaces.GET("/:id/database/tables/:table/rows", vmDatabaseHandler.QueryRows)
			workspaces.POST("/:id/database/tables/:table/rows", vmDatabaseHandler.InsertRow)
			workspaces.PATCH("/:id/database/tables/:table/rows", vmDatabaseHandler.UpdateRow)
			workspaces.DELETE("/:id/database/tables/:table/rows", vmDatabaseHandler.DeleteRows)
			workspaces.POST("/:id/database/query", vmDatabaseHandler.ExecuteSQL)
			workspaces.GET("/:id/database/query/history", vmDatabaseHandler.GetQueryHistory)
			workspaces.GET("/:id/database/stats", vmDatabaseHandler.GetStats)
			workspaces.GET("/:id/database/schema-graph", vmDatabaseHandler.GetSchemaGraph)
			workspaces.POST("/:id/agent/chat", agentChatHandler.Chat)
			workspaces.GET("/:id/agent/status", agentChatHandler.Status)
			workspaces.GET("/:id/agent/skills", agentChatHandler.ListSkills)
			workspaces.POST("/:id/agent/skills", agentChatHandler.CreateSkill)
			workspaces.PATCH("/:id/agent/skills/:skillId", agentChatHandler.ToggleSkill)
			workspaces.PUT("/:id/agent/skills/:skillId", agentChatHandler.UpdateSkill)
			workspaces.DELETE("/:id/agent/skills/:skillId", agentChatHandler.DeleteSkill)
			workspaces.POST("/:id/agent/confirm", agentChatHandler.Confirm)
			workspaces.POST("/:id/agent/cancel", agentChatHandler.Cancel)
			workspaces.GET("/:id/agent/sessions", agentChatHandler.ListSessions)
			workspaces.GET("/:id/agent/sessions/:sessionId", agentChatHandler.GetSession)
			workspaces.DELETE("/:id/agent/sessions/:sessionId", agentChatHandler.DeleteSession)
			workspaces.POST("/:id/agent/sessions/:sessionId/confirm-plan", agentChatHandler.ConfirmPlan)
			workspaces.GET("/:id/agent/personas", agentChatHandler.ListPersonas)
			workspaces.GET("/:id/agent/personas/:personaId", agentChatHandler.GetPersona)
			workspaces.POST("/:id/agent/personas", agentChatHandler.CreatePersona)
			workspaces.PUT("/:id/agent/personas/:personaId", agentChatHandler.UpdatePersona)
			workspaces.DELETE("/:id/agent/personas/:personaId", agentChatHandler.DeletePersona)
			workspaces.GET("/:id/audit-logs", auditLogHandler.List)
			workspaces.POST("/:id/audit-logs/client", auditLogHandler.RecordClient)
			workspaces.GET("/:id/app-users", runtimeAuthHandler.ListUsers)
			workspaces.POST("/:id/app-users/:userId/block", runtimeAuthHandler.BlockUser)
			workspaces.GET("/:id/members", workspaceHandler.ListMembers)
			workspaces.POST("/:id/members", workspaceHandler.AddMember)
			workspaces.PATCH("/:id/members/:memberId", workspaceHandler.UpdateMemberRole)
			workspaces.DELETE("/:id/members/:memberId", workspaceHandler.RemoveMember)
			workspaces.GET("/:id/roles", workspaceHandler.ListRoles)

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
			workspaces.GET("/:id/llm-config", workspaceHandler.ListLLMEndpoints)
			workspaces.POST("/:id/llm-config", workspaceHandler.AddLLMEndpoint)
			workspaces.PATCH("/:id/llm-config/:endpointId", workspaceHandler.UpdateLLMEndpoint)
			workspaces.DELETE("/:id/llm-config/:endpointId", workspaceHandler.DeleteLLMEndpoint)
			workspaces.POST("/:id/llm-config/:endpointId/default", workspaceHandler.SetDefaultLLMEndpoint)
			// Components — 自定义组件
			workspaces.GET("/:id/components", workspaceHandler.ListComponents)
			workspaces.GET("/:id/components/:componentId", workspaceHandler.GetComponent)
			// Storage — 文件存储
			workspaces.POST("/:id/storage/upload", workspaceStorageHandler.Upload)
			workspaces.GET("/:id/storage", workspaceStorageHandler.List)
			workspaces.GET("/:id/storage/:objectId", workspaceStorageHandler.GetObject)
			workspaces.DELETE("/:id/storage/:objectId", workspaceStorageHandler.DeleteObject)
			// RLS — 行级安全策略
			workspaces.POST("/:id/database/rls-policies", workspaceRLSHandler.CreatePolicy)
			workspaces.GET("/:id/database/rls-policies", workspaceRLSHandler.ListPolicies)
			workspaces.PATCH("/:id/database/rls-policies/:policyId", workspaceRLSHandler.UpdatePolicy)
			workspaces.DELETE("/:id/database/rls-policies/:policyId", workspaceRLSHandler.DeletePolicy)
		}

		// Dashboard — only core endpoints
		dashboard := protected.Group("/dashboard")
		{
			dashboard.GET("", dashboardHandler.GetDashboardData)
			dashboard.GET("/stats", dashboardHandler.GetQuickStats)
			dashboard.GET("/activities", dashboardHandler.GetRecentActivities)
		}

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
