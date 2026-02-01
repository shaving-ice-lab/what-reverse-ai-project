package api

import (
	"context"

	"github.com/agentflow/server/internal/api/handler"
	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/pkg/logger"
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
	echo   *echo.Echo
	config *config.Config
	db     *gorm.DB
	redis  *redis.Client
	log    logger.Logger
	wsHub  *websocket.Hub
}

// NewServer 创建新的 API 服务器
func NewServer(cfg *config.Config, db *gorm.DB, rdb *redis.Client, log logger.Logger) *Server {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// 创建 WebSocket Hub
	wsHub := websocket.NewHub(log)
	go wsHub.Run()

	server := &Server{
		echo:   e,
		config: cfg,
		db:     db,
		redis:  rdb,
		log:    log,
		wsHub:  wsHub,
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

	// 日志
	s.echo.Use(middleware.Logger(s.log))

	// 速率限制 (可选)
	// s.echo.Use(middleware.RateLimit(s.redis))
}

// setupRoutes 配置路由
func (s *Server) setupRoutes() {
	// 初始化仓储层
	userRepo := repository.NewUserRepository(s.db)
	workflowRepo := repository.NewWorkflowRepository(s.db)
	executionRepo := repository.NewExecutionRepository(s.db)
	agentRepo := repository.NewAgentRepository(s.db)
	apiKeyRepo := repository.NewAPIKeyRepository(s.db)
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
	
	// 对话相关仓储
	conversationRepo := repository.NewConversationRepository(s.db)
	conversationFolderRepo := repository.NewConversationFolderRepository(s.db)
	conversationTagRepo := repository.NewConversationTagRepository(s.db)
	messageRepo := repository.NewMessageRepository(s.db)
	conversationTemplateRepo := repository.NewConversationTemplateRepository(s.db)

	// 初始化服务层
	authService := service.NewAuthService(userRepo, s.redis, &s.config.JWT)
	userService := service.NewUserService(userRepo)
	apiKeyService, err := service.NewAPIKeyService(apiKeyRepo, s.config.Encryption.Key)
	if err != nil {
		s.log.Error("Failed to initialize API key service", "error", err)
		// 使用默认密钥（仅开发环境）
		apiKeyService, _ = service.NewAPIKeyService(apiKeyRepo, "change-this-to-a-32-byte-secret!")
	}
	workflowService := service.NewWorkflowService(workflowRepo)
	folderService := service.NewFolderService(folderRepo, workflowRepo)
	versionService := service.NewWorkflowVersionService(versionRepo, workflowRepo)
	templateService := service.NewTemplateService(templateRepo, workflowRepo)
	executionService := service.NewExecutionService(executionRepo, workflowRepo, s.redis, s.log)
	// 设置 WebSocket Hub 用于实时推送执行状态
	if execSvc, ok := executionService.(interface{ SetWebSocketHub(*websocket.Hub) }); ok {
		execSvc.SetWebSocketHub(s.wsHub)
	}
	agentService := service.NewAgentService(agentRepo, workflowRepo)

	// 初始化统计服务
	statsService := service.NewStatsService(executionRepo, workflowRepo)
	
	// 初始化 Dashboard 服务
	dashboardService := service.NewDashboardService(workflowRepo, executionRepo, activityRepo, templateRepo)

	// 初始化评价服务
	reviewRepo := repository.NewReviewRepository(s.db)
	reviewService := service.NewReviewService(reviewRepo, agentRepo)

	// 初始化新增服务
	activityService := service.NewActivityService(activityRepo)
	sessionService := service.NewSessionService(sessionRepo)
	announcementService := service.NewAnnouncementService(announcementRepo)
	tagService := service.NewTagService(tagRepo, workflowRepo)
	systemService := service.NewSystemService(s.db, s.redis)
	creativeTemplateService := service.NewCreativeTemplateService(creativeTemplateRepo, s.log)
	creativeTaskService := service.NewCreativeTaskService(creativeTaskRepo, creativeTemplateRepo, nil, s.log)
	creativeDocumentService := service.NewCreativeDocumentService(creativeDocumentRepo, s.log)
	followService := service.NewFollowServiceWithNotification(followRepo, userRepo, activityRepo, notificationRepo)
	commentService := service.NewCommentServiceWithNotification(commentRepo, userRepo, notificationRepo)
	notificationService := service.NewNotificationService(notificationRepo, userRepo)
	shareService := service.NewShareService(shareRepo, userRepo)
	earningService := service.NewEarningService(earningRepo, creatorAccountRepo, commissionTierRepo, withdrawalRepo, settlementRepo)
	
	// 对话相关服务
	conversationService := service.NewConversationService(conversationRepo, conversationFolderRepo, conversationTagRepo, messageRepo)
	conversationFolderService := service.NewConversationFolderService(conversationFolderRepo, conversationRepo)
	conversationTemplateService := service.NewConversationTemplateService(conversationTemplateRepo)
	
	// AI 助手服务
	aiAssistantService := service.NewAIAssistantService()

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService, apiKeyService)
	workflowHandler := handler.NewWorkflowHandler(workflowService, executionService)
	folderHandler := handler.NewFolderHandler(folderService)
	versionHandler := handler.NewWorkflowVersionHandler(versionService)
	templateHandler := handler.NewTemplateHandler(templateService)
	executionHandler := handler.NewExecutionHandler(executionService)
	agentHandler := handler.NewAgentHandler(agentService)
	statsHandler := handler.NewStatsHandler(statsService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	reviewHandler := handler.NewReviewHandler(reviewService)

	// 初始化新增处理器
	activityHandler := handler.NewActivityHandler(activityService)
	sessionHandler := handler.NewSessionHandler(sessionService)
	announcementHandler := handler.NewAnnouncementHandler(announcementService)
	tagHandler := handler.NewTagHandler(tagService)
	systemHandler := handler.NewSystemHandler(systemService)
	creativeTemplateHandler := handler.NewCreativeTemplateHandler(creativeTemplateService)
	creativeTaskHandler := handler.NewCreativeTaskHandler(creativeTaskService, nil)
	creativeDocumentHandler := handler.NewCreativeDocumentHandler(creativeDocumentService)
	followHandler := handler.NewFollowHandler(followService)
	commentHandler := handler.NewCommentHandler(commentService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	shareHandler := handler.NewShareHandler(shareService, s.config.Server.BaseURL)
	earningHandler := handler.NewEarningHandler(earningService)
	
	// 对话相关处理器
	conversationHandler := handler.NewConversationHandler(conversationService)
	conversationFolderHandler := handler.NewConversationFolderHandler(conversationFolderService)
	conversationTemplateHandler := handler.NewConversationTemplateHandler(conversationTemplateService)
	
	// AI 助手处理器
	aiAssistantHandler := handler.NewAIAssistantHandler(aiAssistantService)
	
	// 对话聊天处理器（集成 AI 和对话管理）
	conversationChatHandler := handler.NewConversationChatHandler(conversationService, aiAssistantService)

	// 健康检查
	s.echo.GET("/health", systemHandler.HealthCheck)

	// WebSocket 处理器
	wsHandler := handler.NewWebSocketHandler(s.wsHub, &s.config.JWT)
	s.echo.GET("/ws", wsHandler.HandleConnection)

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

	// 公开系统路由 (无需认证)
	system := v1.Group("/system")
	{
		system.GET("/health", systemHandler.GetHealth)
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

	// 管理员路由 (需要认证 + 管理员权限)
	admin := v1.Group("/admin")
	admin.Use(middleware.Auth(&s.config.JWT))
	// TODO: 添加管理员权限中间件
	{
		// 收入管理
		adminEarnings := admin.Group("/earnings")
		{
			adminEarnings.GET("/withdrawals", earningHandler.AdminListWithdrawals)
			adminEarnings.POST("/withdrawals/:id/process", earningHandler.AdminProcessWithdrawal)
			adminEarnings.POST("/settlements/run", earningHandler.AdminRunSettlement)
			adminEarnings.POST("/:id/confirm", earningHandler.AdminConfirmEarning)
			adminEarnings.POST("/:id/refund", earningHandler.AdminRefundEarning)
		}
	}
}

// Start 启动服务器
func (s *Server) Start(addr string) error {
	return s.echo.Start(addr)
}

// Shutdown 关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	return s.echo.Shutdown(ctx)
}
